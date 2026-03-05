"use client"

import { motion } from "framer-motion"
import { Cog, ArrowLeft } from "lucide-react"

interface ComingSoonViewProps {
    onNavigate: (view: string) => void
}

const BRAND = "#BED600"

export function ComingSoonView({ onNavigate }: ComingSoonViewProps) {
    return (
        <div
            className="flex flex-1 flex-col items-center justify-center overflow-hidden"
            style={{ background: "#0A0A0A" }}
        >
            {/* Background glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(ellipse 600px 400px at 50% 45%, ${BRAND}06, transparent 70%)`,
                }}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                className="relative flex flex-col items-center text-center"
            >
                {/* Spinning cog */}
                <motion.div
                    className="mb-10 flex size-24 items-center justify-center rounded-3xl"
                    style={{
                        background: `${BRAND}08`,
                        border: `1px solid ${BRAND}18`,
                    }}
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        <Cog className="size-12" style={{ color: `${BRAND}90` }} />
                    </motion.div>
                </motion.div>

                {/* Pulsing ring behind */}
                <motion.div
                    className="absolute top-0 left-1/2 size-24 -translate-x-1/2 rounded-3xl"
                    style={{
                        border: `1px solid ${BRAND}20`,
                    }}
                    animate={{
                        scale: [1, 1.3, 1.3],
                        opacity: [0.5, 0, 0],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />

                {/* Text */}
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                    className="mb-3 text-4xl font-bold tracking-tight sm:text-5xl"
                    style={{ color: "#FAFAFA" }}
                >
                    Module in Development
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                    className="mb-2 max-w-md text-base leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                >
                    Our engineers are actively building this feature.
                </motion.p>

                <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
                    className="mb-10 max-w-sm text-sm"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                >
                    This module will be available in a future release. Stay tuned for updates.
                </motion.p>

                {/* Return Button */}
                <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
                    onClick={() => onNavigate("home")}
                    className="flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all"
                    style={{
                        background: BRAND,
                        color: "#0A0A0A",
                        boxShadow: `0 0 20px ${BRAND}30`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 30px ${BRAND}50, 0 0 60px ${BRAND}20`
                        e.currentTarget.style.background = "#D4EC00"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = `0 0 20px ${BRAND}30`
                        e.currentTarget.style.background = BRAND
                    }}
                >
                    <ArrowLeft className="size-4" />
                    Return to Dashboard
                </motion.button>
            </motion.div>
        </div>
    )
}
