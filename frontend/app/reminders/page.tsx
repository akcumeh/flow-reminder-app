"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Clock, CheckCircle2, XCircle, List } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReminderList } from "@/components/reminder-list";
import { CreateReminderDialog } from "@/components/create-reminder-dialog";
import type { ReminderStatus } from "@/lib/types";

export default function Dashboard() {
    const [statusFilter, setStatusFilter] = useState<ReminderStatus | "all">("all");
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: reminders = [], isLoading } = useQuery({
        queryKey: ["reminders"],
        queryFn: () => api.getReminders(),
    });

    const filteredReminders = useMemo(() => {
        if (statusFilter === "all") return reminders;
        return reminders.filter(r => r.status === statusFilter);
    }, [reminders, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: reminders.length,
            pending: reminders.filter(r => r.status === "pending").length,
            completed: reminders.filter(r => r.status === "completed").length,
            failed: reminders.filter(r => r.status === "failed").length,
        };
    }, [reminders]);

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <Image
                            src="/air.svg"
                            alt="Flow Logo"
                            width={32}
                            height={32}
                        />
                        <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
                    </div>
                    <p className="text-zinc-600 mt-1">Schedule phone call reminders</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card
                        className="cursor-pointer transition-all duration-250 hover:shadow-md"
                        onClick={() => setStatusFilter("all")}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-zinc-600">Total</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <List className="h-8 w-8 text-zinc-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer transition-all duration-250 hover:shadow-md"
                        onClick={() => setStatusFilter("pending")}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Scheduled</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer transition-all duration-250 hover:shadow-md"
                        onClick={() => setStatusFilter("completed")}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer transition-all duration-250 hover:shadow-md"
                        onClick={() => setStatusFilter("failed")}
                    >
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-600">Failed</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end mb-6">
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Reminder</span>
                    </Button>
                </div>

                <ReminderList reminders={filteredReminders} isLoading={isLoading} />

                <CreateReminderDialog
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            </div>
        </div>
    );
}
