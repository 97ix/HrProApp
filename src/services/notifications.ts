import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// ── إعداد Handler: كيفية عرض الإشعار عندما يكون التطبيق مفتوحاً (Foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ── طلب صلاحيات الإشعارات من نظام iOS
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    // إعداد قناة الأندرويد
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('hr-pro', {
            name: 'HR Pro Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
            sound: 'default',
            enableVibrate: true,
        });
    }

    // يجب أن يكون جهازاً حقيقياً
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return undefined;
    }

    // طلب الصلاحية
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowDisplayInCarPlay: false,
                allowCriticalAlerts: false,
                provideAppNotificationSettings: false,
                allowProvisional: false,
            },
        });
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // المستخدم رفض - نُعلمه بكيفية التفعيل
        Alert.alert(
            'الإشعارات معطلة',
            'لتلقي إشعارات التطبيق خارجياً، افتح إعدادات iPhone ثم اذهب إلى الإشعارات وفعّلها لتطبيق HR Pro.',
            [{ text: 'حسناً' }]
        );
        return undefined;
    }

    // محاولة الحصول على Expo Push Token
    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;

        if (projectId && projectId !== '11111111-2222-3333-4444-555555555555') {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
            console.log('Expo Push Token:', tokenData.data);
            return tokenData.data;
        }
    } catch (e: any) {
        console.log('Expo Push Token not available:', e?.message);
    }

    return undefined;
}

// ── حفظ التوكن في السيرفر
export const updatePushTokenOnServer = async (token: string, userId: string | number) => {
    try {
        if (!token) return;
        await api.put(`/api/users/${userId}/push-token`, { pushToken: token });
        console.log('Push token saved to server');
    } catch (error) {
        console.error('Failed to save push token:', error);
    }
};

// ── إرسال إشعار محلي فوري (يظهر في قفل الشاشة ولوحة الإشعارات حتى لو التطبيق مغلق)
// هذا هو الحل الأساسي: عند وصول بيانات من Socket/API نُطلق إشعاراً محلياً
export const showLocalNotification = async (title: string, body: string, data?: any) => {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: data || {},
                sound: 'default',
                badge: 1,
                // iOS specific
                ...(Platform.OS === 'ios' && {
                    interruptionLevel: 'active',
                }),
            },
            trigger: null, // null = أرسل فوراً
        });
    } catch (e) {
        console.error('showLocalNotification error:', e);
    }
};

// ── مسح عدد الإشعارات (Badge) عند فتح التطبيق
export const clearBadge = async () => {
    try {
        await Notifications.setBadgeCountAsync(0);
    } catch (e) {
        // ignore
    }
};
