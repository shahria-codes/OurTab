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
        const houseSnap = await adminDb.collection('houses').doc(houseId).get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }

        const data = houseSnap.data()!;
        return NextResponse.json({
            id: houseSnap.id,
            name: data.name
        });
    } catch (error) {
        console.error('Error fetching house info:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, houseId } = body;

        if (!email || !houseId) {
            return NextResponse.json({ error: 'Email and HouseId are required' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(email);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            return NextResponse.json({ error: 'User not found. Please sign in first.' }, { status: 404 });
        }

        const userData = userSnap.data()!;
        if (userData.houseId || userData.groupId) {
            return NextResponse.json({ error: 'You are already in a house. Leave it first to join a new one.' }, { status: 400 });
        }

        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found.' }, { status: 404 });
        }
        const houseData = houseSnap.data()!;

        // Create a Join Request instead of adding directly
        const requestRef = houseRef.collection('joinRequests').doc(email);
        await requestRef.set({
            email,
            name: userData.name || email.split('@')[0],
            photoUrl: userData.photoUrl || '',
            requestedAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });

        // Store pendingHouseId and status in user document for easier status check on profile
        await adminDb.collection('users').doc(email).update({
            pendingHouseId: houseId,
            pendingHouseName: houseData.name || 'Anonymous House',
            pendingHouseStatus: 'requested'
        });

        // Notify existing members about the request
        try {
            const requesterName = userData.name || email.split('@')[0];
            const senderPhotoUrl = userData.photoUrl || '';

            const existingMembers = houseData.members || [];
            const notifications = existingMembers.map((m: string) =>
                createNotification({
                    userId: m,
                    type: 'house',
                    message: `has requested to join ${houseData.name || 'the house'}.`,
                    senderName: requesterName,
                    senderPhotoUrl,
                    actionType: 'approve_join',
                    metadata: {
                        houseId: houseId,
                        senderEmail: email // The requester's email
                    }
                })
            );
            await Promise.all(notifications);

        } catch (notifErr) { console.error('Error sending join request notifications:', notifErr); }

        return NextResponse.json({ success: true, message: 'Join request sent. Waiting for approval.' });
    } catch (error) {
        console.error('Error joining house:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
