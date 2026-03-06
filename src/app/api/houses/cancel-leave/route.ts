import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { houseId, userEmail } = body;

        if (!houseId || !userEmail) {
            return NextResponse.json({ error: 'HouseId and UserEmail required' }, { status: 400 });
        }

        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();

        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }

        const houseData = houseSnap.data()!;
        const leaveRequests = houseData.leaveRequests || {};

        if (!leaveRequests[userEmail]) {
            return NextResponse.json({ error: 'No leave request found' }, { status: 400 });
        }

        delete leaveRequests[userEmail];
        await houseRef.update({ leaveRequests });

        // Clean up pending 'approve_leave' notifications sent to other members
        try {
            const notifsSnap = await adminDb.collection('notifications')
                .where('metadata.houseId', '==', houseId)
                .where('actionType', '==', 'approve_leave')
                .where('metadata.senderEmail', '==', userEmail)
                .get();
            const deletePromises = notifsSnap.docs.map(doc => doc.ref.delete());
            await Promise.all(deletePromises);
        } catch (err) {
            console.error('Error cleaning up leave notifications:', err);
        }

        return NextResponse.json({ success: true, cancelled: true });
    } catch (error) {
        console.error('Cancel leave error', error);
        return NextResponse.json({ error: 'Failed to cancel leave' }, { status: 500 });
    }
}
