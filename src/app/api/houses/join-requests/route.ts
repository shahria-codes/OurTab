import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from '@/lib/notifications';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get('houseId');

    if (!houseId) {
        return NextResponse.json({ error: 'HouseId is required' }, { status: 400 });
    }

    try {
        const requestsSnap = await adminDb.collection('houses').doc(houseId).collection('joinRequests').get();
        const requests = requestsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching join requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { houseId, email, action } = body;

        if (!houseId || !email || !action) {
            return NextResponse.json({ error: 'HouseId, Email and Action are required' }, { status: 400 });
        }

        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found.' }, { status: 404 });
        }
        const houseData = houseSnap.data()!;

        const requestRef = houseRef.collection('joinRequests').doc(email);
        const requestSnap = await requestRef.get();

        if (action === 'approve') {
            if (!requestSnap.exists) {
                return NextResponse.json({ error: 'Join request not found.' }, { status: 404 });
            }

            const userRef = adminDb.collection('users').doc(email);
            const userSnap = await userRef.get();
            if (!userSnap.exists) {
                return NextResponse.json({ error: 'User not found.' }, { status: 404 });
            }
            const userData = userSnap.data()!;

            // 1. Add to house
            await houseRef.set({
                members: FieldValue.arrayUnion(email),
                memberDetails: {
                    [email]: {
                        role: 'member',
                        rentAmount: 0,
                        mealsEnabled: true
                    }
                }
            }, { merge: true });

            // 2. Update user doc
            await userRef.update({
                houseId: houseId,
                pendingHouseId: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete(),
                pendingHouseName: FieldValue.delete()
            });

            // 3. Delete request
            await requestRef.delete();

            // 4. Notify new member and existing members
            try {
                const newMemberName = userData.name || email.split('@')[0];
                const senderPhotoUrl = userData.photoUrl || '';

                // Notify new member
                await createNotification({
                    userId: email,
                    type: 'house',
                    message: `your request to join ${houseData.name} has been approved.`,
                    senderName: 'System',
                    senderPhotoUrl: ''
                });

                // Notify existing members
                const existingMembers = houseData.members || [];
                const notifications = existingMembers.map((m: string) =>
                    createNotification({
                        userId: m,
                        type: 'house',
                        message: `has joined ${houseData.name} (Request Approved).`,
                        senderName: newMemberName,
                        senderPhotoUrl
                    })
                );
                await Promise.all(notifications);
            } catch (notifErr) { console.error('Error sending approval notifications:', notifErr); }

            return NextResponse.json({ success: true, message: 'Request approved.' });
        } else if (action === 'reject') {
            await requestRef.delete();

            // Clear pendingHouseId from user doc
            await adminDb.collection('users').doc(email).update({
                pendingHouseId: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete(),
                pendingHouseName: FieldValue.delete()
            });

            // Notify the user
            try {
                await createNotification({
                    userId: email,
                    type: 'house',
                    message: `your request to join ${houseData.name} was rejected.`,
                    senderName: 'System',
                    senderPhotoUrl: ''
                });
            } catch (notifErr) { console.error('Error sending rejection notification:', notifErr); }

            return NextResponse.json({ success: true, message: 'Request rejected.' });
        } else if (action === 'cancel') {
            await requestRef.delete();

            // Clear pending fields from user doc
            await adminDb.collection('users').doc(email).update({
                pendingHouseId: FieldValue.delete(),
                pendingHouseName: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete()
            });

            // Cleanup notifications for house members
            try {
                const notifsSnap = await adminDb.collection('notifications')
                    .where('actionType', '==', 'approve_join')
                    .where('metadata.houseId', '==', houseId)
                    .where('metadata.senderEmail', '==', email)
                    .get();

                const deletePromises = notifsSnap.docs.map(doc => doc.ref.delete());
                await Promise.all(deletePromises);
            } catch (notifErr) {
                console.error('Error cleaning up notifications on cancel:', notifErr);
            }

            return NextResponse.json({ success: true, message: 'Request cancelled.' });
        } else if (action === 'accept_invite') {
            const houseRef = adminDb.collection('houses').doc(houseId);
            const houseSnap = await houseRef.get();
            if (!houseSnap.exists) {
                return NextResponse.json({ error: 'House not found.' }, { status: 404 });
            }

            // 1. Add user to house members
            await houseRef.update({
                members: FieldValue.arrayUnion(email),
                [`memberDetails.${email.replace(/\./g, '_')}`]: {
                    role: 'member',
                    rentAmount: 0
                }
            });

            // 2. Update user doc: set houseId, clear pendingHouseId, pendingHouseStatus, pendingHouseName
            await adminDb.collection('users').doc(email).update({
                houseId: houseId,
                pendingHouseId: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete(),
                pendingHouseName: FieldValue.delete()
            });

            return NextResponse.json({ success: true, message: 'Invitation accepted!' });
        } else if (action === 'decline_invite') {
            // Simply clear the pending status
            await adminDb.collection('users').doc(email).update({
                pendingHouseId: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete(),
                pendingHouseName: FieldValue.delete()
            });

            return NextResponse.json({ success: true, message: 'Invitation declined.' });
        } else {
            return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error processing join request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
