"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ReminderList } from "@/components/reminder-list";
import { CreateReminderDialog } from "@/components/create-reminder-dialog";
import type { ReminderStatus } from "@/lib/types";

export default function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders", statusFilter],
    queryFn: () => api.getReminders(statusFilter === "all" ? undefined : statusFilter),
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
          <p className="text-zinc-600 mt-1">Schedule phone call reminders</p>
        </header>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(["all", "pending", "completed", "failed"] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                size="sm"
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Reminder
          </Button>
        </div>

        <ReminderList reminders={reminders} isLoading={isLoading} />

        <CreateReminderDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      </div>
    </div>
  );
}
