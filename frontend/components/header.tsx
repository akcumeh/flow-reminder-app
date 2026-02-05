"use client";

import Link from "next/link";
import { Phone } from "lucide-react";

export function Header() {
    return (
        <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                            <Phone className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-zinc-900">Flow</span>
                    </Link>

                    <nav className="hidden sm:flex items-center gap-6">
                        <Link
                            href="/reminders"
                            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                            Reminders
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}
