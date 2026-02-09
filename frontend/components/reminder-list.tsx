import { formatDistanceToNow } from "date-fns";
import { Clock, Phone, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReminderActions } from "@/components/reminder-actions";
import type { Reminder } from "@/lib/types";

interface ReminderListProps {
    reminders: Reminder[];
    isLoading: boolean;
}

const statusColors = {
    pending: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-green-100 text-green-700 border-green-200",
    failed: "bg-red-100 text-red-700 border-red-200",
};

function maskPhone(phone: string): string {
    if (phone.length > 7) {
        return `${phone.slice(0, -7)}•••${phone.slice(-4)}`;
    }
    return phone;
}

export function ReminderList({ reminders, isLoading }: ReminderListProps) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                        <div className="h-6 bg-zinc-200 rounded w-1/3 mb-3" />
                        <div className="h-4 bg-zinc-200 rounded w-2/3 mb-4" />
                        <div className="h-4 bg-zinc-200 rounded w-1/4" />
                    </Card>
                ))}
            </div>
        );
    }

    if (reminders.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reminders yet</h3>
                <p className="text-zinc-600">Create your first reminder to get started</p>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {reminders.map((reminder) => (
                <Card key={reminder.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">{reminder.title}</h3>
                                <Badge className={statusColors[reminder.status]} variant="outline">
                                    {reminder.status}
                                </Badge>
                            </div>

                            <p className="text-zinc-600 mb-4">{reminder.message}</p>

                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-zinc-500">
                                    <Phone className="h-4 w-4" />
                                    {maskPhone(reminder.phone_number)}
                                </div>
                                <div className={`flex items-center gap-1.5 ${reminder.status === "pending" ? "text-blue-600 font-medium" : "text-zinc-500"}`} suppressHydrationWarning>
                                    <Clock className="h-4 w-4" />
                                    {formatDistanceToNow(
                                        new Date(reminder.scheduled_time.endsWith('Z') ? reminder.scheduled_time : reminder.scheduled_time + 'Z'),
                                        { addSuffix: true }
                                    )}
                                </div>
                            </div>
                        </div>

                        <ReminderActions reminder={reminder} />
                    </div>
                </Card>
            ))}
        </div>
    );
}
