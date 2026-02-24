import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async setItem(key: string, value: any) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await AsyncStorage.setItem(key, stringValue);
        } catch (error) {
            console.error('Storage Error (Save):', error);
        }
    },

    async getItem<T>(key: string): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(key);
            if (value === null) return null;
            try {
                return JSON.parse(value) as T;
            } catch {
                return value as unknown as T;
            }
        } catch (error) {
            console.error('Storage Error (Load):', error);
            return null;
        }
    },

    async removeItem(key: string) {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Storage Error (Remove):', error);
        }
    },

    async clear() {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Storage Error (Clear):', error);
        }
    },
};
