"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

const BRAND = "#BED600"

function CurrentDateTime() {
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        setNow(new Date())
        const interval = setInterval(() => setNow(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    if (!now) return <div className="h-5 w-40" />

    return (
        <span
            className="font-mono text-xs tracking-wide"
            style={{ color: "rgba(255,255,255,0.4)" }}
        >
            {now.toLocaleDateString("eu-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })}
            {" / "}
            {now.toLocaleTimeString("eu-ES", {
                hour: "2-digit",
                minute: "2-digit",
            })}
        </span>
    )
}

export function Navbar() {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="flex h-16 shrink-0 items-center justify-between px-8 lg:px-16"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
            <div
                className="text-xl font-bold tracking-tighter"
                style={{ color: "#FAFAFA" }}
            >
                {"Code"}
                <span style={{ color: BRAND }}>{"Syntax"}</span>
            </div>
            <CurrentDateTime />
        </motion.nav>
    )
}
