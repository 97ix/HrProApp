import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── Handler: عرض الإشعار عندما يكون التطبيق مفتوحاً (Foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ── طلب صلاحيات iOS وإعداد القناة للأندرويد
export async function registerForPushNotificationsAsync(): Promise<boolean> {
    // إعداد قناة الأندرويد
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('hr-pro', {
            name: 'HR Pro Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
            sound: 'default',
        });
    }

    // التحقق إذا كان جهازاً حقيقياً
    if (!Device.isDevice) {
        return false;
    }

    try {
        // فحص الصلاحية الحالية
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
            // مفعّلة مسبقاً ✅
            return true;
        }

        // طلب الصلاحية من المستخدم
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
            },
        });

        // نعيد true بغض النظر (حتى لو رفض، سنحاول المحلي)
        return status === 'granted';
    } catch (e) {
        console.log('Permission request error:', e);
        return false;
    }
}

// ── إرسال إشعار محلي فوري
// يظهر في شاشة القفل ومركز الإشعارات حتى لو التطبيق في الخلفية
export const showLocalNotification = async (title: string, body: string, data?: any) => {
    try {
        // لا نشترط الصلاحية هنا - نحاول مباشرة
        await Notifications.scheduleNotificationAsync({
            content: {
                title: title || 'HR Pro',
                body: body || '',
                data: data || {},
                sound: 'default',
                badge: 1,
            },
            trigger: null, // أرسل فوراً
        });
    } catch (e) {
        console.log('Local notification error:', e);
    }
};

// ── مسح عداد الأيقونة (Badge)
export const clearBadge = async () => {
    try {
        await Notifications.setBadgeCountAsync(0);
    } catch (e) {
        // ignore
    }
};

// ── إلغاء الصلاحية الوهمي - لم نعد نستخدمه
export const updatePushTokenOnServer = async (_token: string, _userId: string | number) => {
    // Push tokens require EAS build - local notifications work without it
};
