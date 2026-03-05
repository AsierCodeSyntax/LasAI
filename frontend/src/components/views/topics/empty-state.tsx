"use client"

import { motion } from "framer-motion"
import { Layers } from "lucide-react"

const BRAND = "#BED600"

const fadeSlideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
    },
}

export function EmptyState() {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeSlideUp}
            className="flex flex-col items-center justify-center py-24"
        >
            <div
                className="mb-6 flex size-16 items-center justify-center rounded-2xl"
                style={{
                    background: `${BRAND}10`,
                    border: `1px solid ${BRAND}20`,
                }}
            >
                <Layers className="size-7" style={{ color: BRAND }} />
            </div>
            <h3
                className="mb-2 text-lg font-semibold tracking-tight"
                style={{ color: "#FAFAFA" }}
            >
                No topics found
            </h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Create your first topic to get started.
            </p>
        </motion.div>
    )
}
