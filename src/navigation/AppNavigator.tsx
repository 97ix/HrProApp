import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../screens/DashboardScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import LeaveRequestsScreen from '../screens/LeaveRequestsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import PayrollScreen from '../screens/PayrollScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator();

const AppNavigator = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: COLORS.background,
                },
                headerTintColor: COLORS.text,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerTitleAlign: 'center',
                cardStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
                {(props) => <DashboardScreen {...props} user={user} onLogout={onLogout} />}
            </Stack.Screen>
            <Stack.Screen
                name="Employees"
                component={EmployeeListScreen}
                options={{ title: 'إدارة الموظفين', headerShown: true }}
            />
            <Stack.Screen
                name="Leaves"
                component={LeaveRequestsScreen}
                options={{ title: 'طلبات الإجازة', headerShown: true }}
            />
            <Stack.Screen name="Attendance" options={{ title: 'سجل الحضور', headerShown: true }}>
                {(props) => <AttendanceScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen
                name="Payroll"
                component={PayrollScreen}
                options={{ title: 'إدارة الرواتب', headerShown: true }}
            />
            <Stack.Screen name="Settings" options={{ title: 'الإعدادات', headerShown: true }}>
                {(props) => <SettingsScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Profile" options={{ title: 'الملف الشخصي', headerShown: true }}>
                {(props) => <ProfileScreen {...props} user={user} />}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default AppNavigator;
