export enum UserRole {
    HR = 'HR',
    DEPARTMENT_MANAGER = 'DEPT_MGR',
    SUPERVISOR = 'SUPERVISOR',
    MANAGER = 'MANAGER',
    CASHIER = 'CASHIER',
    DATA_ENTRY = 'DATA_ENTRY',
    EMPLOYEE = 'EMPLOYEE'
}

export interface Role {
    id: string;
    nameAr: string;
    nameEn: string;
    color: string;
    permissions: Permission[];
    isSystem: boolean;
    accessibleDepartments?: string[];
}

export interface Employee {
    id: string;
    name: string;
    departmentId: string;
    salary: number;
    workingHours: number;
    hireDate: string;
    contractExpiry: string;
    avatar?: string;
    documents: { name: string; url: string }[];
    leaveBalance: number;
    phoneNumber: string;
    username: string;
    password: string;
    isFrozen?: boolean;
    telegramChatId?: string;
    allowedDeviceIds?: string[];
    trustedDevices?: TrustedDevice[];
    role?: UserRole;
    managedDepartmentId?: string;
    customPermissions?: Permission[];
}

export interface TrustedDevice {
    deviceId: string;
    deviceType: string;
    ipAddress: string;
    firstLogin: string;
    lastLogin: string;
}

export interface Department {
    id: string;
    name: string;
    managerId?: string;
    floorNumber?: string;
    phoneNumber?: string;
}

export interface Attendance {
    id: string;
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut?: string;
    totalHours?: number;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    type: 'ANNUAL' | 'SICK' | 'UNPAID';
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reason: string;
    actionId?: string;
}

export interface PerformanceReview {
    id: string;
    employeeId: string;
    date: string;
    score: number;
    notes: string;
    reviewerId: string;
}

export interface PayrollRecord {
    id: string;
    employeeId: string;
    month: string;
    basicSalary: number;
    bonus: number;
    deductions: number;
    netSalary: number;
    actualPaidAmount?: number;
    status: 'PAID' | 'PENDING';
    actionId?: string;
}

export interface FinancialAdjustment {
    id: string;
    employeeId: string;
    type: 'BONUS' | 'DEDUCTION';
    amount: number;
    reason: string;
    date: string;
    actionId?: string;
}

export interface Activity {
    id: string;
    title: string;
    message: string;
    time: string;
    type: 'SUCCESS' | 'INFO' | 'WARNING' | 'PROMPT';
    targetUserId?: string;
    targetActionId?: string;
    read?: boolean;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actorId: string;
    actorName: string;
    action: string;
    targetId?: string;
    targetName?: string;
    details: string;
    changes?: { field: string; oldValue: any; newValue: any }[];
}

export type PaymentMethod = 'CASH' | 'BANK' | 'CARD';

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color: string;
}

export interface FinancialRecord {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    description: string;
    date: string;
    departmentId?: string;
    relatedId?: string;
    status: 'PAID' | 'PENDING' | 'CANCELLED';
    paymentMethod?: PaymentMethod;
    isRecurring?: boolean;
    recurrencePeriod?: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
}

export interface LoanInstallment {
    month: string;
    amount: number;
    status: 'PENDING' | 'PAID';
    paidDate?: string;
}

export interface Loan {
    id: string;
    employeeId: string;
    totalAmount: number;
    installmentsCount: number;
    installmentAmount: number;
    startDate: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
    installments: LoanInstallment[];
    reason: string;
    createdAt: string;
    actionId?: string;
}

export enum Permission {
    VIEW_ALL_EMPLOYEES = 'VIEW_ALL_EMPLOYEES',
    VIEW_OWN_PROFILE = 'VIEW_OWN_PROFILE',
    ADD_EMPLOYEES = 'ADD_EMPLOYEES',
    EDIT_EMPLOYEES = 'EDIT_EMPLOYEES',
    DELETE_EMPLOYEES = 'DELETE_EMPLOYEES',
    VIEW_ALL_ATTENDANCE = 'VIEW_ALL_ATTENDANCE',
    MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
    VIEW_ALL_LEAVES = 'VIEW_ALL_LEAVES',
    VIEW_OWN_LEAVES = 'VIEW_OWN_LEAVES',
    APPROVE_LEAVES = 'APPROVE_LEAVES',
    VIEW_ALL_PAYROLL = 'VIEW_ALL_PAYROLL',
    VIEW_DEPT_PAYROLL = 'VIEW_DEPT_PAYROLL',
    MANAGE_PAYROLL = 'MANAGE_PAYROLL',
    VIEW_FINANCE = 'VIEW_FINANCE',
    MANAGE_FINANCE = 'MANAGE_FINANCE',
    VIEW_DEPARTMENTS = 'VIEW_DEPARTMENTS',
    MANAGE_DEPARTMENTS = 'MANAGE_DEPARTMENTS',
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',
    MANAGE_USERS = 'MANAGE_USERS',
    VIEW_REPORTS = 'VIEW_REPORTS',
    VIEW_ACTIVITY_LOG = 'VIEW_ACTIVITY_LOG'
}
