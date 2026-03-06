import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { createNotification } from '@/lib/notifications';

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
        const { houseId, email, managerEmail, action, approvedMeals } = body;

        if (!houseId || !email || !managerEmail || !action) {
            return NextResponse.json({ error: 'houseId, email, managerEmail, and action are required' }, { status: 400 });
        }
        if (action !== 'approve' && action !== 'reject') {
            return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
        }

        const memberEmail = (email as string).toLowerCase();
        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        if (!houseSnap.exists) {
            return NextResponse.json({ error: 'House not found' }, { status: 404 });
        }

        const houseData = houseSnap.data()!;
        const requestRecord = houseData.joinDayMealRequests?.[memberEmail];
        if (!requestRecord) {
            return NextResponse.json({ error: 'No pending meal request found for this member' }, { status: 404 });
        }
        if (requestRecord.status !== 'pending') {
            return NextResponse.json({ error: 'Request has already been processed' }, { status: 409 });
        }

        const joinDate: string = requestRecord.joinDate;
        const requestedMeals: string[] = requestRecord.requestedMeals || [];

        const managerSnap = await adminDb.collection('users').doc(managerEmail).get();
        const managerName = managerSnap.exists
            ? (managerSnap.data()?.name || managerEmail.split('@')[0])
            : managerEmail.split('@')[0];

        if (action === 'approve') {
            // approvedMeals must be provided and non-empty
            const mealsToApprove: string[] = Array.isArray(approvedMeals) && approvedMeals.length > 0
                ? approvedMeals.filter((m: string) => requestedMeals.includes(m))
                : [];

            if (mealsToApprove.length === 0) {
                // Manager approved but removed all meals — treat as reject
                await houseRef.set({
                    joinDayMealRequests: {
                        [memberEmail]: { ...requestRecord, status: 'rejected' }
                    }
                }, { merge: true });
                try {
                    await createNotification({
                        userId: memberEmail,
                        type: 'house',
                        message: `your meal request for today has been declined.`,
                        senderName: managerName,
                        senderPhotoUrl: managerSnap.data()?.photoUrl || ''
                    });
                } catch (e) { console.error(e); }
                return NextResponse.json({ success: true, status: 'rejected' });
            }

            // 1. Update the request record
            await houseRef.set({
                joinDayMealRequests: {
                    [memberEmail]: { ...requestRecord, status: 'approved', approvedMeals: mealsToApprove }
                }
            }, { merge: true });

            // 2. Write/merge the meal record for the join date
            //    meals collection: doc id = joinDate, field: meals[email][mealType] = bool
            const mealsRef = adminDb.collection('meals').doc(`${houseId}_${joinDate}`);
            const mealMap: Record<string, boolean> = {
                breakfast: mealsToApprove.includes('breakfast'),
                lunch: mealsToApprove.includes('lunch'),
                dinner: mealsToApprove.includes('dinner'),
            };
            // Remove undefined keys based on mealsPerDay
            const mealsPerDay = houseData.mealsPerDay || 3;
            if (mealsPerDay === 2) delete mealMap.breakfast;

            await mealsRef.set({
                houseId,
                date: joinDate,
                meals: {
                    [memberEmail]: mealMap
                }
            }, { merge: true });

            // 3. Notify the new member
            try {
                const mealLabel = formatMealNames(mealsToApprove);
                await createNotification({
                    userId: memberEmail,
                    type: 'house',
                    message: `your meal request has been approved! You will be counted for ${mealLabel} today.`,
                    senderName: managerName,
                    senderPhotoUrl: managerSnap.data()?.photoUrl || ''
                });
            } catch (notifErr) { console.error('Error notifying new member:', notifErr); }

            return NextResponse.json({ success: true, status: 'approved', approvedMeals: mealsToApprove });

        } else {
            // reject
            await houseRef.set({
                joinDayMealRequests: {
                    [memberEmail]: { ...requestRecord, status: 'rejected' }
                }
            }, { merge: true });

            try {
                await createNotification({
                    userId: memberEmail,
                    type: 'house',
                    message: `your meal request for today has been declined.`,
                    senderName: managerName,
                    senderPhotoUrl: managerSnap.data()?.photoUrl || ''
                });
            } catch (notifErr) { console.error('Error notifying new member of rejection:', notifErr); }

            return NextResponse.json({ success: true, status: 'rejected' });
        }
    } catch (error) {
        console.error('Error in approve-join-meal:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
