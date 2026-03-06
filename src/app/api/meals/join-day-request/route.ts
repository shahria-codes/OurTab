import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { createNotification } from '@/lib/notifications';

// Returns which meals are eligible based on minutes-since-midnight of the join time (UTC)
function getEligibleMeals(joinHour: number, joinMin: number, mealsPerDay: number): string[] {
    const mins = joinHour * 60 + joinMin;
    const h5 = 5 * 60;   // 05:00
    const h10 = 10 * 60; // 10:00
    const h15 = 15 * 60; // 15:00
    const h19 = 19 * 60; // 19:00

    if (mins < h5 || mins >= h19) return []; // before window opens or too late

    if (mins < h10) {
        // Between 05:00–09:59 — all meals
        return mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner'] : ['lunch', 'dinner'];
    }
    if (mins < h15) {
        // Between 10:00–14:59 — lunch and dinner
        return ['lunch', 'dinner'];
    }
    // Between 15:00–18:59 — dinner only
    return ['dinner'];
}

function formatMealNames(meals: string[]): string {
    const labels: Record<string, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' };
    const names = meals.map(m => labels[m] || m);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { houseId, email, requestedMeals } = body;

        if (!houseId || !email || !Array.isArray(requestedMeals) || requestedMeals.length === 0) {
            return NextResponse.json({ error: 'houseId, email, and requestedMeals are required' }, { status: 400 });
        }

        const memberEmail = email.toLowerCase();
        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }

        const houseData = houseSnap.data()!;
        const memberDetail = houseData.memberDetails?.[memberEmail];

        if (!memberDetail?.joinedAt) {
            return NextResponse.json({ error: 'Member join record not found' }, { status: 400 });
        }

        const joinedAt = new Date(memberDetail.joinedAt);
        const joinedDateStr = joinedAt.toISOString().substring(0, 10);

        // Check if already requested
        const existing = houseData.joinDayMealRequests?.[memberEmail];
        if (existing) {
            return NextResponse.json({ error: 'Meal request already submitted' }, { status: 409 });
        }

        const mealsPerDay = houseData.mealsPerDay || 3;
        const windowEnd: string = houseData.mealUpdateWindowEnd || '05:00';
        const [endHour, endMin] = windowEnd.split(':').map(Number);
        const windowEndMins = endHour * 60 + endMin;
        const joinedMins = joinedAt.getUTCHours() * 60 + joinedAt.getUTCMinutes();

        // Must have joined after the window to use this feature
        if (joinedMins <= windowEndMins) {
            return NextResponse.json({ error: 'Member joined within the normal meal window' }, { status: 400 });
        }

        const eligibleMeals = getEligibleMeals(joinedAt.getUTCHours(), joinedAt.getUTCMinutes(), mealsPerDay);
        if (eligibleMeals.length === 0) {
            return NextResponse.json({ error: 'No meals are eligible at this join time' }, { status: 400 });
        }

        // Validate requested meals are a subset of eligible
        const validRequested = requestedMeals.filter((m: string) => eligibleMeals.includes(m));
        if (validRequested.length === 0) {
            return NextResponse.json({ error: 'No valid meals in request' }, { status: 400 });
        }

        // Store the request
        await houseRef.set({
            joinDayMealRequests: {
                [memberEmail]: {
                    joinDate: joinedDateStr,
                    eligibleMeals,
                    requestedMeals: validRequested,
                    status: 'pending',
                }
            }
        }, { merge: true });

        // Notify all managers
        try {
            const userSnap = await adminDb.collection('users').doc(memberEmail).get();
            const userName = userSnap.exists ? (userSnap.data()?.name || memberEmail.split('@')[0]) : memberEmail.split('@')[0];
            const userPhotoUrl = userSnap.exists ? (userSnap.data()?.photoUrl || '') : '';

            const allMembers: string[] = houseData.members || [];
            const memberDetails = houseData.memberDetails || {};
            const managers = allMembers.filter((m: string) =>
                m.toLowerCase() !== memberEmail &&
                (memberDetails[m]?.role === 'manager' || houseData.createdBy?.toLowerCase() === m.toLowerCase())
            );

            const mealLabel = formatMealNames(validRequested);
            const notifications = managers.map((m: string) =>
                createNotification({
                    userId: m,
                    type: 'house',
                    message: `would like to take ${mealLabel} on their first day. Please approve the meals that will be prepared.`,
                    senderName: userName,
                    senderPhotoUrl: userPhotoUrl,
                    actionType: 'approve_join_meal',
                    metadata: {
                        houseId,
                        senderEmail: memberEmail,
                        requestedMeals: validRequested.join(','),
                        joinDate: joinedDateStr,
                    }
                })
            );
            await Promise.all(notifications);
        } catch (notifErr) {
            console.error('Error notifying managers of join day meal request:', notifErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in join-day-request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
