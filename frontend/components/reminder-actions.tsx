"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EditReminderDialog } from "@/components/edit-reminder-dialog";
import type { Reminder } from "@/lib/types";

interface ReminderActionsProps {
    reminder: Reminder;
}

export function ReminderActions({ reminder }: ReminderActionsProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: () => api.deleteReminder(reminder.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
            toast.success("Reminder deleted");
            setDeleteDialogOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete reminder");
        },
    });

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
                <Pencil className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <EditReminderDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                reminder={reminder}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Reminder</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{reminder.title}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
