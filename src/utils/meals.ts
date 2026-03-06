
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
