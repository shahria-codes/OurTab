import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { houseId, date, email, mealType, isTaking } = body;

        if (!houseId || !date || !email || !mealType || isTaking === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch house data to check update window
        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }
        const houseData = houseSnap.data()!;

        // 2. Server-side time validation
        const now = new Date();
        const serverTodayStr = now.toISOString().split('T')[0];
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Prevent updates for past days or far future days
        if (date < serverTodayStr) {
            return NextResponse.json({ error: 'Cannot update meals for past dates' }, { status: 403 });
        }
        if (date > tomorrowStr) {
            return NextResponse.json({ error: 'Cannot update meals for dates beyond tomorrow' }, { status: 403 });
        }

        // If updating for today, check the window
        if (date === serverTodayStr) {
            const windowEnd = houseData.mealUpdateWindowEnd || '05:00';
            const [endHour, endMin] = windowEnd.split(':').map(Number);
            const todayEnd = new Date(now);
            todayEnd.setHours(endHour, endMin, 0, 0);

            if (now > todayEnd) {
                return NextResponse.json({
                    error: `Today's meal update window closed at ${windowEnd}.`
                }, { status: 403 });
            }
        }

        // The document ID is a combination of houseId and date, e.g., "house123_2023-10-27"
        const docId = `${houseId}_${date}`;
        const mealRef = adminDb.collection('mealStatuses').doc(docId);

        // Update the specific meal type for the specific user
        await mealRef.set({
            houseId,
            date,
            meals: {
                [email]: {
                    [mealType]: isTaking
                }
            },
            updatedAt: new Date().toISOString()
        }, { merge: true }); // Merge true is crucial to avoid overwriting other users' meals

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating meal status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get('houseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!houseId) {
        return NextResponse.json({ error: 'House ID is required' }, { status: 400 });
    }

    try {
        let query = adminDb.collection('mealStatuses').where('houseId', '==', houseId);

        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }

        const snap = await query.get();

        const statuses = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(statuses);
    } catch (error) {
        console.error('Error fetching meal statuses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
