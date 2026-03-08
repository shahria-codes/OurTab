import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const birthdayReminderCron = onSchedule('every 30 minutes', async (event) => {
    try {
        const nowUtc = new Date();

        // 1. Calculate which utcOffsets are currently in our "Target Windows"
        // We look for:
        // - Users whose local time is 23:30 - 23:59 (Remind them about housemates tomorrow)
        // - Users whose local time is 00:00 - 00:29 (Wish them Happy Birthday today)

        const targetOffsets: number[] = [];

        // Check all standard 30-minute offsets (-12h to +14h)
        // JS offsets are "minutes behind UTC", so UTC+2 is -120. Range: -840 to 720.
        for (let offset = -840; offset <= 720; offset += 30) {
            const localTime = new Date(nowUtc.getTime() - (offset * 60000));
            const h = localTime.getUTCHours();
            const m = localTime.getUTCMinutes();

            // Is it 23:30-23:59 OR 00:00-00:29?
            if ((h === 23 && m >= 30) || (h === 0 && m < 30)) {
                targetOffsets.push(offset);
            }
        }

        if (targetOffsets.length === 0) {
            console.log("No timezones currently in the 23:30 or 00:00 windows.");
            return;
        }

        // 2. Query Firestore ONLY for users in these timezones
        // This drastically reduces Firestore Reads from N (all users) to just the active timezones.
        const usersSnapshot = await db.collection('users')
            .where('utcOffset', 'in', targetOffsets)
            .get();

        if (usersSnapshot.empty) {
            console.log(`No users found in timezones: ${targetOffsets.join(', ')}`);
            return;
        }

        const notificationsToSend: { token: string, title: string, body: string, icon?: string }[] = [];

        // Pre-fetch all houses to check memberships
        const housesSnapshot = await db.collection('houses').get();
        const allHouses = housesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const { email, utcOffset, fcmToken } = userData;

            if (!fcmToken || typeof utcOffset !== 'number') continue;

            const userLocalTime = new Date(nowUtc.getTime() - (utcOffset * 60000));
            const localHours = userLocalTime.getUTCHours();
            const localMinutes = userLocalTime.getUTCMinutes();

            // A. Birthday Reminder Logic (for housemates tomorrow)
            if (localHours === 23 && localMinutes >= 30) {
                const tomorrowLocal = new Date(userLocalTime);
                tomorrowLocal.setUTCDate(tomorrowLocal.getUTCDate() + 1);
                const day = tomorrowLocal.getUTCDate().toString().padStart(2, '0');
                const month = (tomorrowLocal.getUTCMonth() + 1).toString().padStart(2, '0');
                const tomorrowBirthdayStr = `${day}-${month}`;

                const userHouses = allHouses.filter(h => h.members && h.members.includes(email));

                for (const house of userHouses) {
                    const members = house.members || [];
                    const memberDetails = house.memberDetails || {};

                    for (const memberEmail of members) {
                        if (memberEmail === email) continue;

                        const memberData = memberDetails[memberEmail];
                        if (memberData?.birthday === tomorrowBirthdayStr) {
                            const dateKey = userLocalTime.toISOString().split('T')[0];
                            const notifId = `cloud_bd_${memberEmail}_${dateKey}_for_${email}`;
                            const notifRef = db.collection('notifications').doc(notifId);
                            const notifSnap = await notifRef.get();

                            if (!notifSnap.exists) {
                                let memberPhotoUrl = '';
                                try {
                                    const memberUserSnap = await db.collection('users').doc(memberEmail).get();
                                    if (memberUserSnap.exists) {
                                        memberPhotoUrl = memberUserSnap.data()?.photoUrl || '';
                                    }
                                } catch (e) { }

                                const title = 'Birthday Celebration! 🎂';
                                const message = `Tomorrow is ${memberData.name || memberEmail}'s birthday! Get ready to celebrate! 🎉`;

                                await notifRef.set({
                                    userId: email,
                                    title,
                                    message,
                                    type: 'birthday',
                                    read: false,
                                    senderPhotoUrl: memberPhotoUrl,
                                    createdAt: nowUtc.toISOString()
                                });

                                notificationsToSend.push({
                                    token: fcmToken,
                                    title,
                                    body: message,
                                    icon: memberPhotoUrl || undefined
                                });
                            }
                        }
                    }
                }
            }

            // B. Direct Birthday Wish Logic (at 12:00 AM)
            if (localHours === 0 && localMinutes < 30) {
                const day = userLocalTime.getUTCDate().toString().padStart(2, '0');
                const month = (userLocalTime.getUTCMonth() + 1).toString().padStart(2, '0');
                const todayBirthdayStr = `${day}-${month}`;

                if (userData.birthday === todayBirthdayStr) {
                    const dateKey = userLocalTime.toISOString().split('T')[0];
                    const notifId = `cloud_bd_wish_${email}_${dateKey}`;
                    const notifRef = db.collection('notifications').doc(notifId);
                    const notifSnap = await notifRef.get();

                    if (!notifSnap.exists) {
                        const title = 'Happy Birthday! 🎉🎂';
                        const message = `Wishing you a fantastic birthday from OurTab! Have a wonderful day! 🎊`;

                        await notifRef.set({
                            userId: email,
                            title,
                            message,
                            type: 'birthday',
                            read: false,
                            createdAt: nowUtc.toISOString()
                        });

                        notificationsToSend.push({
                            token: fcmToken,
                            title,
                            body: message,
                        });
                    }
                }
            }
        }

        // 3. Batch Send Notifications
        if (notificationsToSend.length > 0) {
            for (const n of notificationsToSend) {
                try {
                    await admin.messaging().send({
                        token: n.token,
                        notification: { title: n.title, body: n.body, ...(n.icon ? { image: n.icon } : {}) },
                        webpush: { notification: { icon: '/icon512_maskable.png' } }
                    });
                } catch (e) {
                    console.error("Error sending push:", e);
                }
            }
            console.log(`Sent ${notificationsToSend.length} birthday push notifications.`);
        }
        return;
    } catch (error) {
        console.error('Error in birthdayReminderCron:', error);
        return;
    }
});
