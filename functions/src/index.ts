import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const birthdayReminderCron = onSchedule('every 30 minutes', async (event) => {
    try {
        const nowUtc = new Date();
        console.log(`Starting birthdayReminderCron at ${nowUtc.toISOString()}`);

        const targetOffsets: number[] = [];

        // Check all standard 30-minute offsets (-12h to +14h)
        for (let offset = -840; offset <= 720; offset += 30) {
            const localTime = new Date(nowUtc.getTime() - (offset * 60000));
            const h = localTime.getUTCHours();

            // When running hourly (e.g. at :15 past), we check if the user's LOCAL time 
            // is within roughly 30 minutes of our targets (23:00 or 00:00).
            // A more robust check for hourly runs:
            // Is it 23:00-23:59 (Remind) or 00:00-00:59 (Wish)?
            if (h === 23 || h === 0) {
                targetOffsets.push(offset);
            }
        }

        if (targetOffsets.length === 0) {
            console.log("No timezones currently in the 23:00 or 00:00 windows.");
            return;
        }

        console.log(`Checking users in offsets: ${targetOffsets.join(', ')}`);

        const usersSnapshot = await db.collection('users')
            .where('utcOffset', 'in', targetOffsets)
            .get();

        if (usersSnapshot.empty) {
            console.log(`No users found in these timezones.`);
            return;
        }

        console.log(`Processing ${usersSnapshot.size} users.`);
        const notificationsToSend: { token: string, title: string, body: string, icon?: string, badgeCount?: number }[] = [];

        // Pre-fetch all houses to check memberships
        const housesSnapshot = await db.collection('houses').get();
        const allHouses = housesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const { email, utcOffset, fcmToken } = userData;

            if (!fcmToken || typeof utcOffset !== 'number') continue;

            const userLocalTime = new Date(nowUtc.getTime() - (utcOffset * 60000));
            const localHours = userLocalTime.getUTCHours();

            // A. Birthday Reminder Logic (for housemates tomorrow)
            if (localHours === 23) {
                const tomorrowLocal = new Date(userLocalTime);
                tomorrowLocal.setUTCDate(tomorrowLocal.getUTCDate() + 1);
                const day = tomorrowLocal.getUTCDate().toString().padStart(2, '0');
                const month = (tomorrowLocal.getUTCMonth() + 1).toString().padStart(2, '0');
                const tomorrowBirthdayStr = `${month}-${day}`;

                const userHouses = allHouses.filter(h => h.members && h.members.includes(email));

                for (const house of userHouses) {
                    const members = house.members || [];
                    const memberDetails = house.memberDetails || {};

                    for (const memberEmail of members) {
                        if (memberEmail === email) continue;

                        const memberData = memberDetails[memberEmail];
                        if (memberData?.birthday === tomorrowBirthdayStr) {
                            const dateKey = userLocalTime.getUTCFullYear() + '-' + (userLocalTime.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + userLocalTime.getUTCDate().toString().padStart(2, '0');
                            const notifId = `cloud_bd_${memberEmail}_${dateKey}_for_${email}`;
                            const notifRef = db.collection('notifications').doc(notifId);
                            const notifSnap = await notifRef.get();

                            if (!notifSnap.exists) {
                                console.log(`Sending reminder to ${email} about ${memberEmail}'s birthday tomorrow.`);
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

                                // Calculate unread count for badge
                                const unreadSnap = await db.collection('notifications')
                                    .where('userId', '==', email)
                                    .where('read', '==', false)
                                    .get();

                                notificationsToSend.push({
                                    token: fcmToken,
                                    title,
                                    body: message,
                                    icon: memberPhotoUrl || undefined,
                                    badgeCount: unreadSnap.size
                                });
                            }
                        }
                    }
                }
            }

            // B. Direct Birthday Wish Logic (at 12:00 AM)
            if (localHours === 0) {
                const day = userLocalTime.getUTCDate().toString().padStart(2, '0');
                const month = (userLocalTime.getUTCMonth() + 1).toString().padStart(2, '0');
                const todayBirthdayStr = `${month}-${day}`;

                if (userData.birthday === todayBirthdayStr) {
                    const dateKey = userLocalTime.getUTCFullYear() + '-' + (userLocalTime.getUTCMonth() + 1).toString().padStart(2, '0') + '-' + userLocalTime.getUTCDate().toString().padStart(2, '0');
                    const notifId = `cloud_bd_wish_${email}_${dateKey}`;
                    const notifRef = db.collection('notifications').doc(notifId);
                    const notifSnap = await notifRef.get();

                    if (!notifSnap.exists) {
                        console.log(`Sending birthday wish to ${email}.`);
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

                        // Calculate unread count for badge
                        const unreadSnap = await db.collection('notifications')
                            .where('userId', '==', email)
                            .where('read', '==', false)
                            .get();

                        notificationsToSend.push({
                            token: fcmToken,
                            title,
                            body: message,
                            badgeCount: unreadSnap.size
                        });
                    }
                }
            }
        }

        // 3. Batch Send Notifications
        if (notificationsToSend.length > 0) {
            console.log(`Sending ${notificationsToSend.length} push notifications.`);
            for (const n of notificationsToSend as any[]) {
                try {
                    await admin.messaging().send({
                        token: n.token,
                        data: {
                            title: n.title,
                            body: n.body,
                            icon: n.icon || '/icon-192.png',
                            badge: String(n.badgeCount || 0)
                        },
                        apns: {
                            payload: {
                                aps: {
                                    badge: n.badgeCount || 0,
                                    sound: 'default'
                                }
                            }
                        },
                        webpush: {
                            notification: {
                                icon: '/icon512_maskable.png'
                            }
                        }
                    });
                } catch (e) {
                    console.error("Error sending push:", e);
                }
            }
            console.log(`Finished sending birthday push notifications.`);
        } else {
            console.log("No notifications needed this round.");
        }
        return;
    } catch (error) {
        console.error('Error in birthdayReminderCron:', error);
        return;
    }
});
