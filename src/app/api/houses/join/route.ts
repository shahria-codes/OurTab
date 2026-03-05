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

        await userRef.update({ houseId: houseId });

        // Notify existing members
        try {
            const newMemberName = userData.name || email.split('@')[0];
            const senderPhotoUrl = userData.photoUrl || '';

            const existingMembers = houseData.members || [];
            const notifications = existingMembers.map((m: string) =>
                createNotification({
                    userId: m,
                    type: 'house',
                    message: `has joined ${houseData.name || 'the house'} via invitation link.`,
                    senderName: newMemberName,
                    senderPhotoUrl
                })
            );
            await Promise.all(notifications);

        } catch (notifErr) { console.error('Error sending join notifications:', notifErr); }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error joining house:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
