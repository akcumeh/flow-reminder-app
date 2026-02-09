"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface IntroScreenProps {
    onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer1 = setTimeout(() => setStep(1), 100);
        const timer2 = setTimeout(() => setStep(2), 600);
        const timer3 = setTimeout(() => setStep(3), 1100);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center z-50">
            <div className="relative flex flex-col items-center">
                <AnimatePresence>
                    {step >= 1 && (
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="mb-8"
                        >
                            <Image
                                src="/air.svg"
                                alt="Flow Logo"
                                width={120}
                                height={120}
                                className="drop-shadow-2xl"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 2 && (
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-6xl font-bold text-white mb-4"
                        >
                            Flow
                        </motion.h1>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 3 && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-xl text-zinc-300 text-center max-w-md mb-8"
                        >
                            Never miss what matters most
                        </motion.p>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {step >= 3 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Link
                                href="/reminders"
                                className="inline-flex items-center gap-2 bg-white text-zinc-900 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors duration-250"
                            >
                                Go to Reminders
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
