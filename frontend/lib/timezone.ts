import { add, format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function getUserTimezone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatInUserTimezone(date: Date | string, userTimezone: string): string {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        const zonedDate = toZonedTime(dateObj, userTimezone);
        return format(zonedDate, "MMM d, yyyy 'at' h:mm a");
}

export interface RelativeTimeOption {
        label: string;
        value: { minutes?: number; hours?: number; days?: number };
}

export const relativeTimePresets: RelativeTimeOption[] = [
        { label: "5 minutes", value: { minutes: 5 } },
        { label: "15 minutes", value: { minutes: 15 } },
        { label: "30 minutes", value: { minutes: 30 } },
        { label: "1 hour", value: { hours: 1 } },
//   { label: "2 hours", value: { hours: 2 } },
        { label: "1 day", value: { days: 1 } },
//   { label: "2 days", value: { days: 2 } },
        { label: "1 week", value: { days: 7 } },
];

export function calculateRelativeTime(
        relativeValue: RelativeTimeOption["value"],
        userTimezone: string
): string {
        const now = new Date();
        const futureDate = add(now, relativeValue);
        const zonedDate = toZonedTime(futureDate, userTimezone);
        return format(zonedDate, "yyyy-MM-dd'T'HH:mm");
}

export function convertToUTC(localDateString: string, userTimezone: string): string {
        const localDate = new Date(localDateString);
        const utcDate = fromZonedTime(localDate, userTimezone);
        return utcDate.toISOString();
}
