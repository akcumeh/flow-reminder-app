import type { Reminder, ReminderCreate, ReminderUpdate } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export const api = {
    getReminders: async (status?: string): Promise<Reminder[]> => {
        const url = status
            ? `${API_BASE}/api/reminders?status=${status}`
            : `${API_BASE}/api/reminders`;
        const response = await fetch(url);
        return handleResponse<Reminder[]>(response);
    },

    getReminder: async (id: number): Promise<Reminder> => {
        const response = await fetch(`${API_BASE}/api/reminders/${id}`);
        return handleResponse<Reminder>(response);
    },

    createReminder: async (data: ReminderCreate): Promise<Reminder> => {
        const response = await fetch(`${API_BASE}/api/reminders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse<Reminder>(response);
    },

    updateReminder: async (id: number, data: ReminderUpdate): Promise<Reminder> => {
        const response = await fetch(`${API_BASE}/api/reminders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return handleResponse<Reminder>(response);
    },

    deleteReminder: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/api/reminders/${id}`, {
            method: "DELETE",
        });
        return handleResponse<void>(response);
    },
};
