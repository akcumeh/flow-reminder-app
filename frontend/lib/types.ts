export type ReminderStatus = "pending" | "completed" | "failed";

export interface Reminder {
    id: number;
    title: string;
    message: string;
    phone_number: string;
    scheduled_time: string;
    timezone: string;
    status: ReminderStatus;
    created_at: string;
    updated_at: string;
}

export interface ReminderCreate {
    title: string;
    message: string;
    phone_number: string;
    scheduled_time: string;
    timezone: string;
}

export interface ReminderUpdate {
    title?: string;
    message?: string;
    phone_number?: string;
    scheduled_time?: string;
    timezone?: string;
}
