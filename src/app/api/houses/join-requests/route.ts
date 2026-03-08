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
        const { houseId, email, action, approverName, approverPhotoUrl } = body;

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

        // Helper to clean up notifications for house members
        const cleanupNotifications = async () => {
            try {
                const notifsSnap = await adminDb.collection('notifications')
                    .where('actionType', '==', 'approve_join')
                    .where('metadata.houseId', '==', houseId)
                    .where('metadata.senderEmail', '==', email)
                    .get();

                const deletePromises = notifsSnap.docs.map(doc => doc.ref.delete());
                await Promise.all(deletePromises);
            } catch (notifErr) {
                console.error('Error cleaning up notifications:', notifErr);
            }
        };

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
                        mealsEnabled: true,
                        joinedAt: new Date().toISOString()
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
                    message: `approved your request to join ${houseData.name}.`,
                    senderName: approverName || 'System',
                    senderPhotoUrl: approverPhotoUrl || ''
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

            await cleanupNotifications();

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
                    message: `declined your request to join ${houseData.name}.`,
                    senderName: approverName || 'System',
                    senderPhotoUrl: approverPhotoUrl || ''
                });
            } catch (notifErr) { console.error('Error sending rejection notification:', notifErr); }

            await cleanupNotifications();

            return NextResponse.json({ success: true, message: 'Request rejected.' });
        } else if (action === 'cancel') {
            await requestRef.delete();

            // Clear pending fields from user doc
            await adminDb.collection('users').doc(email).update({
                pendingHouseId: FieldValue.delete(),
                pendingHouseName: FieldValue.delete(),
                pendingHouseStatus: FieldValue.delete()
            });

            // Helper to clean up notifications for house members
            const cleanupNotifications = async () => {
                try {
                    const notifsSnap = await adminDb.collection('notifications')
                        .where('actionType', '==', 'approve_join')
                        .where('metadata.houseId', '==', houseId)
                        .where('metadata.senderEmail', '==', email)
                        .get();

                    const deletePromises = notifsSnap.docs.map(doc => doc.ref.delete());
                    await Promise.all(deletePromises);
                } catch (notifErr) {
                    console.error('Error cleaning up notifications:', notifErr);
                }
            };

            await cleanupNotifications();

            return NextResponse.json({ success: true, message: 'Request cancelled.' });
        } else if (action === 'accept_invite') {
            const houseRef = adminDb.collection('houses').doc(houseId);
            const houseSnap = await houseRef.get();
            if (!houseSnap.exists) {
                return NextResponse.json({ error: 'House not found.' }, { status: 404 });
            }

            // 1. Add user to house members
            await houseRef.set({
                members: FieldValue.arrayUnion(email),
                memberDetails: {
                    [email]: {
                        role: 'member',
                        rentAmount: 0,
                        joinedAt: new Date().toISOString()
                    }
                }
            }, { merge: true });

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
