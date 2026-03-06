import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { createNotification } from '@/lib/notifications';

/**
 * Given an offFromDate (YYYY-MM-DD) and the meal config, backfill explicit
 * `false` records into mealStatuses for every day from offFromDate to yesterday
 * (inclusive). This ensures those days are never defaulted to "taking meal"
 * after the member turns back on.
 */
async function backfillOffDays(
    houseId: string,
    email: string,
    offFromDate: string,
    mealsPerDay: number,
    clientToday: string   // YYYY-MM-DD in the user's local timezone
) {
    // Compute yesterday relative to the client's local date, not the server's UTC clock.
    // e.g. client is UTC+2 at 01:24AM on March 6 → clientToday="2026-03-06" → yesterdayStr="2026-03-05"
    const [cy, cm, cd] = clientToday.split('-').map(Number);
    const yesterdayDate = new Date(cy, cm - 1, cd - 1); // local Date arithmetic is safe here
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    if (offFromDate > yesterdayStr) {
        // Off period is only today/future — nothing to backfill in the past
        return;
    }

    // Collect all date strings in the off window [offFromDate .. yesterday]
    const datesToBackfill: string[] = [];
    const cursor = new Date(offFromDate + 'T00:00:00Z');
    const end = new Date(yesterdayStr + 'T00:00:00Z');
    while (cursor <= end) {
        datesToBackfill.push(cursor.toISOString().split('T')[0]);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (datesToBackfill.length === 0) return;

    // Build the false-meal record for this member
    const falseMeals =
        mealsPerDay === 3
            ? { breakfast: false, lunch: false, dinner: false }
            : { lunch: false, dinner: false };

    // Use multiple batches if needed (Firestore limit: 500 ops per batch)
    const BATCH_SIZE = 400;
    for (let i = 0; i < datesToBackfill.length; i += BATCH_SIZE) {
        const chunk = datesToBackfill.slice(i, i + BATCH_SIZE);
        const batch = adminDb.batch();

        for (const dateStr of chunk) {
            const docId = `${houseId}_${dateStr}`;
            const mealRef = adminDb.collection('mealStatuses').doc(docId);
            // merge:true so we don't overwrite other members' meals on the same day
            batch.set(
                mealRef,
                {
                    houseId,
                    date: dateStr,
                    meals: { [email]: falseMeals },
                    updatedAt: new Date().toISOString(),
                },
                { merge: true }
            );
        }

        await batch.commit();
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let { houseId, email, clientToday } = body;
        if (!houseId || !email) {
            return NextResponse.json({ error: 'HouseId and Email are required' }, { status: 400 });
        }
        email = email.toLowerCase();
        // Fallback: if client didn't send their local date, use server UTC date (less accurate for edge timezones)
        if (!clientToday) {
            const now = new Date();
            clientToday = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        }

        const houseRef = adminDb.collection('houses').doc(houseId);
        const houseSnap = await houseRef.get();
        const houseData = houseSnap.data()!;

        // Robust member lookup helper
        const getMemberDetail = (email: string) => {
            let detail = houseData.memberDetails?.[email];
            if (!detail && email.includes('.')) {
                const parts = email.split('.');
                let current = houseData.memberDetails;
                for (const part of parts) { current = current?.[part]; }
                if (current && typeof current === 'object' && ('role' in current || 'rentAmount' in current)) {
                    detail = current;
                }
            }
            return detail;
        };

        const myDetails = getMemberDetail(email);
        const { FieldPath } = require('firebase-admin/firestore');
        const isNested = (obj: any, email: string) => email.includes('.') && !!obj?.[email.split('.')[0]];

        // Backfill explicit `false` records for every day the member was off
        // before we erase the offFromDate from memberDetails.
        if (myDetails?.offFromDate) {
            const mealsPerDay = houseData.mealsPerDay || 3;
            await backfillOffDays(houseId, email, myDetails.offFromDate, mealsPerDay, clientToday);
        }

        const batch = adminDb.batch();

        // 1. Delete nested versions if they exist
        if (isNested(houseData.memberDetails, email)) {
            batch.update(houseRef, { [new FieldPath('memberDetails', ...email.split('.'))]: FieldValue.delete() });
        }
        if (isNested(houseData.mealOffRequests, email)) {
            batch.update(houseRef, { [new FieldPath('mealOffRequests', ...email.split('.'))]: FieldValue.delete() });
        }

        // 2. Set flat literal versions + close the open mealHistory window
        const existingHistory: any[] = houseData.mealHistory?.[email] || [];
        // Close the most recent open window (onFrom = today, when they turned back on)
        const updatedHistory = existingHistory.map((w: any, idx: number) => {
            if (idx === existingHistory.length - 1 && !w.onFrom) {
                return { ...w, onFrom: clientToday };
            }
            return w;
        });

        batch.set(houseRef, {
            memberDetails: {
                [email]: {
                    ...myDetails,
                    mealsEnabled: true,
                    offFromDate: FieldValue.delete()
                }
            },
            mealHistory: {
                [email]: updatedHistory.length > 0 ? updatedHistory : FieldValue.delete()
            },
            // Also clear literal request key
            mealOffRequests: {
                [email]: FieldValue.delete()
            }
        }, { merge: true });

        await batch.commit();

        // Notify managers that user is back on
        try {
            const houseSnap = await houseRef.get();
            const houseData = houseSnap.data()!;
            const userSnap = await adminDb.collection('users').doc(email).get();
            const userName = userSnap.exists ? (userSnap.data()?.name || email.split('@')[0]) : email.split('@')[0];
            const userPhotoUrl = userSnap.exists ? userSnap.data()?.photoUrl : undefined;

            const members = houseData.members || [];
            const memberDetails = houseData.memberDetails || {};

            const managers = members.filter((m: string) => {
                const normalizedM = m.toLowerCase();
                return normalizedM !== email &&
                    (memberDetails[m]?.role === 'manager' || houseData.createdBy?.toLowerCase() === normalizedM);
            });

            const notifications = managers.map((m: string) =>
                createNotification({
                    userId: m,
                    type: 'house',
                    message: `has turned his meals back ON.`,
                    senderName: userName,
                    senderPhotoUrl: userPhotoUrl
                })
            );
            await Promise.all(notifications);
        } catch (err) {
            console.error('Error notifying managers of meal on:', err);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error turning meal on:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
