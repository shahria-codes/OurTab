import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, photoUrl, profession, whatsapp, messenger, birthday, iban, fcmToken, pendingHouseId, utcOffset } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const userRef = adminDb.collection('users').doc(email);

        interface UserRecord {
            email: string;
            name?: string;
            photoUrl?: string;
            profession?: string;
            whatsapp?: string;
            messenger?: string;
            birthday?: string;
            iban?: string;
            fcmToken?: string;
            pendingHouseId?: string;
            utcOffset?: number;
        }

        const userData: UserRecord = { email };

        if (name !== undefined) userData.name = name;
        if (photoUrl !== undefined) userData.photoUrl = photoUrl;
        if (profession !== undefined) userData.profession = profession;
        if (whatsapp !== undefined) userData.whatsapp = whatsapp;
        if (messenger !== undefined) userData.messenger = messenger;
        if (iban !== undefined) userData.iban = iban;
        if (fcmToken !== undefined) userData.fcmToken = fcmToken;
        // Removed bkash, nagad, upay
        if (birthday !== undefined) userData.birthday = birthday; // Added birthday
        if (pendingHouseId !== undefined) userData.pendingHouseId = pendingHouseId;
        if (utcOffset !== undefined) userData.utcOffset = utcOffset;

        await userRef.set(userData, { merge: true });

        return NextResponse.json({ success: true, user: userData });
    } catch (error) {
        console.error('Error in users POST:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const emailsParam = searchParams.get('emails');

    // ── Batch lookup: ?emails=a@b.com,c@d.com ────────────────────────────────
    if (emailsParam) {
        const emails = emailsParam.split(',').map(e => e.trim()).filter(Boolean);
        if (emails.length === 0) {
            return NextResponse.json({});
        }
        try {
            const results: Record<string, any> = {};
            await Promise.all(
                emails.map(async (em) => {
                    const snap = await adminDb.collection('users').doc(em).get();
                    results[em] = snap.exists ? snap.data() : {};
                })
            );
            return NextResponse.json(results);
        } catch (error) {
            console.error('Error in users batch GET:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }

    // ── Single lookup: ?email=a@b.com ────────────────────────────────────────
    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        const userDoc = await adminDb.collection('users').doc(email).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(userDoc.data());
    } catch (error) {
        console.error('Error in users GET:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
