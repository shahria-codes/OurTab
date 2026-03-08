
/**
 * Centralized utility to determine if a member is taking a specific meal on a given date.
 * It respects mealHistory (persistent off-windows), explicit meal records, and current memberDetails.
 *
 * mealHistory structure (stored in house doc):
 *   mealHistory: { [email]: Array<{ offFrom: string; onFrom?: string }> }
 * Each entry records a window when the member was OFF. onFrom being absent means still off.
 */
export function isTakingMeal(
    memberEmail: string,
    dateStr: string,
    mealType: 'breakfast' | 'lunch' | 'dinner',
    house: any, // House object containing memberDetails and members
    meals: any[] // Array of meal records for the house
): boolean {
    if (!house) return false;

    // 0. Check if the member had even joined the house by this date.
    //    joinedAt is stored in memberDetails[email].joinedAt as an ISO string.
    const memberDetail0 = house.memberDetails?.[memberEmail];

    // 0a. Check if the member had already left the house by this date.
    //     leftDate is stored as a YYYY-MM-DD string and is inclusive (the day they left
    //     IS counted). Any date after leftDate should return false.
    if (memberDetail0?.leftDate && dateStr > memberDetail0.leftDate) {
        return false;
    }

    if (memberDetail0?.joinedAt) {
        const joinedISO: string = memberDetail0.joinedAt;
        const joinedDateStr = joinedISO.substring(0, 10); // "YYYY-MM-DD"

        if (dateStr < joinedDateStr) {
            // Clearly before the join date — not a member yet.
            return false;
        }

        if (dateStr === joinedDateStr) {
            // Joined on this day — but if they joined AFTER the meal update
            // window end time (default 05:00), the day's meals are already locked
            // and they shouldn't be counted.
            const windowEnd: string = house.mealUpdateWindowEnd || '05:00';
            const [endHour, endMin] = windowEnd.split(':').map(Number);

            const joinedTime = new Date(joinedISO);
            const joinedHour = joinedTime.getUTCHours();
            const joinedMinute = joinedTime.getUTCMinutes();

            // Convert window end to minutes-since-midnight for easy comparison
            const windowEndMins = endHour * 60 + endMin;
            const joinedMins = joinedHour * 60 + joinedMinute;

            if (joinedMins > windowEndMins) {
                // Joined after the window closed — check if manager approved specific meals.
                const joinRequest = house.joinDayMealRequests?.[memberEmail];
                if (joinRequest?.status === 'approved' && Array.isArray(joinRequest.approvedMeals)) {
                    return joinRequest.approvedMeals.includes(mealType);
                }
                // No approved request — not counted for this day.
                return false;
            }
        }
    }

    // 1. Check mealHistory — persistent record of all past off-windows.
    //    This is the most reliable source since it survives even after
    //    memberDetails.offFromDate is cleared when meals are turned back on.
    const history: Array<{ offFrom: string; onFrom?: string }> =
        house.mealHistory?.[memberEmail] || [];
    for (const window of history) {
        const afterOff = dateStr >= window.offFrom;
        const beforeOn = !window.onFrom || dateStr < window.onFrom;
        if (afterOff && beforeOn) {
            return false; // date falls within an off-window
        }
    }

    // 2. Check current memberDetails (for the active / most recent off state)
    const memberDetail = house.memberDetails?.[memberEmail];
    if (memberDetail) {
        if (memberDetail.mealsEnabled === false) {
            // If offFromDate is set, only mark as off from that date onward.
            // If offFromDate is absent, treat as off for all dates (safety fallback).
            if (!memberDetail.offFromDate || dateStr >= memberDetail.offFromDate) {
                return false;
            }
        }
    }

    // 3. Check if there is an explicit record for this day and member
    const dayRecord = (meals || []).find(m => m.date === dateStr);
    if (dayRecord && dayRecord.meals && dayRecord.meals[memberEmail]) {
        const mMeals = dayRecord.meals[memberEmail];
        if (mMeals[mealType] !== undefined) {
            return mMeals[mealType];
        }
    }

    // 4. Default to true if no record exists and they haven't turned off meals
    return true;
}

/**
 * Helper to count total meals for a member on a specific date string.
 */
export function countMemberMeals(
    memberEmail: string,
    dateStr: string,
    house: any,
    meals: any[]
): number {
    const mealsPerDay = house?.mealsPerDay || 3;
    let count = 0;

    if (mealsPerDay === 3 && isTakingMeal(memberEmail, dateStr, 'breakfast', house, meals)) count++;
    if (isTakingMeal(memberEmail, dateStr, 'lunch', house, meals)) count++;
    if (isTakingMeal(memberEmail, dateStr, 'dinner', house, meals)) count++;

    return count;
}
