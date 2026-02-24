import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// تهيئة كيفية عرض الإشعار عند وصوله والتطبيق مفتوح (Foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * دالة طلب الصلاحيات واستخراج الـ Token من جهاز المستخدم
 */
export async function registerForPushNotificationsAsync() {
    let token;

    // إعدادات إضافية لنظام الأندرويد فقط
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // التأكد من أن الجهاز حقيقي (وليس محاكي) لأن بعض المحاكيات لا تدعم الإشعارات
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // إذا لم تكن الصلاحية ممنوحة مسبقاً، اطلبها من المستخدم
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('فشل', 'لم يتم منح صلاحية الإشعارات!');
            return undefined;
        }

        try {
            // محاولة الحصول على Expo Push Token للتعامل مع سيرفرات إكسبو
            // We use the EAS projectId from app.json, fallback to a valid generated UUID if absent
            const fallbackId = "11111111-2222-3333-4444-555555555555";
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? fallbackId;

            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;

            console.log('Push Token Generated:', token);
        } catch (e: any) {
            console.log('Error Getting Token:', e?.message);
            // fallback in case expo project is not fully configured
        }
    } else {
        console.log('يجب استخدام جهاز حقيقي لتجربة إشعارات الـ Push');
    }

    return token;
}

/**
 * دالة حفظ توكن الإشعارات الخاص بالمستخدم في قاعدة البيانات (السيرفر)
 */
export const updatePushTokenOnServer = async (token: string, userId: string | number) => {
    try {
        if (!token) return;
        // إرسال الـ Token الحقيقي إلى السيرفر الخاص بنا
        await api.put(`/api/users/${userId}/push-token`, { pushToken: token });
        console.log(`تم الرفع بنجاح للسيرفر، Token: ${token}, User: ${userId}`);
    } catch (error) {
        console.error('Failed to save push token on server', error);
    }
};
