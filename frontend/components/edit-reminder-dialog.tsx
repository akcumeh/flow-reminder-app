"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { getUserTimezone } from "@/lib/timezone";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Reminder } from "@/lib/types";

const reminderSchema = z.object({
    title: z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
    message: z.string().min(1, "Message is required").max(500, "Message must be 500 characters or less"),
    phone_number: z
        .string()
        .regex(/^\+[1-9]\d{10,14}$/, "Phone must be in E.164 format (e.g., +1234567890)"),
    timezone: z.string(),
    use_relative_time: z.boolean(),
    days: z.number().min(0).optional(),
    hours: z.number().min(0).max(23).optional(),
    minutes: z.number().min(0).max(59).optional(),
    specific_date: z.string().optional(),
    specific_time: z.string().optional(),
}).refine((data) => {
    if (data.use_relative_time) {
        const days = data.days || 0;
        const hours = data.hours || 0;
        const minutes = data.minutes || 0;
        return days > 0 || hours > 0 || minutes > 0;
    } else {
        return !!data.specific_date && !!data.specific_time;
    }
}, {
    message: "Please select a time for your reminder",
    path: ["use_relative_time"],
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface EditReminderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reminder: Reminder;
}

export function EditReminderDialog({ open, onOpenChange, reminder }: EditReminderDialogProps) {
    const queryClient = useQueryClient();
    const userTimezone = getUserTimezone();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<ReminderFormData>({
        resolver: zodResolver(reminderSchema),
        defaultValues: {
            title: reminder.title,
            message: reminder.message,
            phone_number: reminder.phone_number,
            timezone: reminder.timezone || userTimezone,
            use_relative_time: true,
            days: 0,
            hours: 0,
            minutes: 5,
        },
    });

    useEffect(() => {
        if (open && reminder) {
            reset({
                title: reminder.title,
                message: reminder.message,
                phone_number: reminder.phone_number,
                timezone: reminder.timezone || userTimezone,
                use_relative_time: false,
                specific_date: format(new Date(reminder.scheduled_time), "yyyy-MM-dd"),
                specific_time: format(new Date(reminder.scheduled_time), "HH:mm"),
            });
        }
    }, [open, reminder, reset, userTimezone]);

    const title = watch("title") || "";
    const message = watch("message") || "";
    const useRelativeTime = watch("use_relative_time");

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.updateReminder(reminder.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
            toast.success("Reminder updated successfully");
            onOpenChange(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update reminder");
        },
    });

    const onSubmit = (data: ReminderFormData) => {
        if (data.use_relative_time) {
            updateMutation.mutate({
                title: data.title,
                message: data.message,
                phone_number: data.phone_number,
                timezone: data.timezone,
                use_relative_time: true,
                days: data.days || 0,
                hours: data.hours || 0,
                minutes: data.minutes || 0,
            });
        } else {
            updateMutation.mutate({
                title: data.title,
                message: data.message,
                phone_number: data.phone_number,
                timezone: data.timezone,
                use_relative_time: false,
                scheduled_time: `${data.specific_date}T${data.specific_time}`,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Reminder</DialogTitle>
                    <DialogDescription>
                        Update your reminder details and reschedule if needed.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="edit-title">Title</Label>
                            <span className="text-xs text-zinc-500">{title.length}/50</span>
                        </div>
                        <Input
                            id="edit-title"
                            placeholder="Meeting with client"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label htmlFor="edit-message">Message</Label>
                            <span className="text-xs text-zinc-500">{message.length}/500</span>
                        </div>
                        <Textarea
                            id="edit-message"
                            placeholder="Don't forget to prepare the presentation slides"
                            rows={3}
                            {...register("message")}
                        />
                        {errors.message && (
                            <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="edit-phone_number">Phone Number</Label>
                        <Input
                            id="edit-phone_number"
                            type="tel"
                            placeholder="+1234567890"
                            {...register("phone_number")}
                        />
                        {errors.phone_number && (
                            <p className="text-sm text-red-600 mt-1">{errors.phone_number.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="edit-timezone">Timezone</Label>
                        <Input
                            id="edit-timezone"
                            value={userTimezone}
                            disabled
                            className="bg-zinc-50"
                        />
                    </div>

                    <div>
                        <Label>When</Label>
                        <div className="flex gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => setValue("use_relative_time", true)}
                                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-center gap-2 ${
                                    useRelativeTime
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-zinc-300 hover:bg-zinc-50"
                                }`}
                            >
                                <Clock className="h-4 w-4" />
                                In...
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue("use_relative_time", false)}
                                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors flex items-center justify-center gap-2 ${
                                    !useRelativeTime
                                        ? "border-blue-600 bg-blue-50 text-blue-700"
                                        : "border-zinc-300 hover:bg-zinc-50"
                                }`}
                            >
                                <Calendar className="h-4 w-4" />
                                Specific date
                            </button>
                        </div>

                        {useRelativeTime ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 0);
                                            setValue("hours", 0);
                                            setValue("minutes", 5);
                                        }}
                                    >
                                        5 min
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 0);
                                            setValue("hours", 0);
                                            setValue("minutes", 30);
                                        }}
                                    >
                                        30 min
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 0);
                                            setValue("hours", 1);
                                            setValue("minutes", 0);
                                        }}
                                    >
                                        1 hour
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 0);
                                            setValue("hours", 6);
                                            setValue("minutes", 0);
                                        }}
                                    >
                                        6 hours
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 1);
                                            setValue("hours", 0);
                                            setValue("minutes", 0);
                                        }}
                                    >
                                        1 day
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setValue("days", 3);
                                            setValue("hours", 0);
                                            setValue("minutes", 0);
                                        }}
                                    >
                                        3 days
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor="edit-days">Days</Label>
                                        <Input
                                            id="edit-days"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            {...register("days", {
                                                setValueAs: (v) => v === "" ? 0 : parseInt(v)
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-hours">Hours</Label>
                                        <Input
                                            id="edit-hours"
                                            type="number"
                                            min="0"
                                            max="23"
                                            placeholder="0"
                                            {...register("hours", {
                                                setValueAs: (v) => v === "" ? 0 : parseInt(v)
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-minutes">Minutes</Label>
                                        <Input
                                            id="edit-minutes"
                                            type="number"
                                            min="0"
                                            max="59"
                                            placeholder="5"
                                            {...register("minutes", {
                                                setValueAs: (v) => v === "" ? 0 : parseInt(v)
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="edit-specific_date">Date</Label>
                                    <Input
                                        id="edit-specific_date"
                                        type="date"
                                        {...register("specific_date")}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-specific_time">Time</Label>
                                    <Input
                                        id="edit-specific_time"
                                        type="time"
                                        {...register("specific_time")}
                                    />
                                </div>
                            </div>
                        )}
                        {errors.use_relative_time && (
                            <p className="text-sm text-red-600 mt-1">{errors.use_relative_time.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Updating..." : "Update Reminder"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
