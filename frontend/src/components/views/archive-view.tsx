"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    FileText,
    Download,
    Eye,
    Calendar,
    Archive,
    Loader2,
} from "lucide-react"

type View = "home" | "module" | "add-news" | "review" | "archive" | "sources"

interface ArchivedBulletin {
    id: string
    fileName: string
    date: string
    fileSize: string
    url: string
}

const BRAND = "#BED600"

const fadeSlideUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.55,
            delay: i * 0.1,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
}

const listItem = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            delay: i * 0.05,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
}

interface ArchiveViewProps {
    onNavigate: (view: View) => void
}

function formatDisplayDate(dateStr: string) {
    try {
        const date = new Date(dateStr + "T00:00:00")
        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
    } catch (e) {
        return dateStr
    }
}

export function ArchiveView({ onNavigate }: ArchiveViewProps) {
    const [bulletins, setBulletins] = useState<ArchivedBulletin[]>([])
    const [selectedBulletin, setSelectedBulletin] = useState<ArchivedBulletin | null>(null)
    const [dateFilter, setDateFilter] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

    useEffect(() => {
        async function fetchArchive() {
            try {
                const response = await fetch(`${MOD1_API_URL}/api/archive`)
                if (!response.ok) throw new Error("Fallo al cargar el histórico")

                const data = await response.json()

                const formattedBulletins = data.pdfs.map((pdf: any) => ({
                    id: pdf.id,
                    fileName: pdf.filename,
                    date: pdf.date,
                    fileSize: `${pdf.size_mb} MB`,
                    url: `${MOD1_API_URL}${pdf.url}`
                }))

                setBulletins(formattedBulletins)
            } catch (error) {
                console.error("Error fetching archive:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchArchive()
    }, [MOD1_API_URL])

    const filteredBulletins = dateFilter
        ? bulletins.filter((b) => b.date <= dateFilter)
        : bulletins

    return (
        <div
            className="flex flex-1 flex-col overflow-hidden"
            style={{ background: "#0A0A0A" }}
        >
            {/* Breadcrumb */}
            <nav
                className="flex h-14 shrink-0 items-center gap-3 px-8 lg:px-16"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <button
                    onClick={() => onNavigate("home")}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                    CodeSyntax
                </button>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
                <button
                    onClick={() => onNavigate("module")}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                >
                    News Bulletin
                </button>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
                <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
                    Archive
                </span>
            </nav>

            {/* Header */}
            <motion.section
                initial="hidden"
                animate="visible"
                className="shrink-0 px-8 pt-8 pb-6 lg:px-16"
            >
                <motion.div custom={0} variants={fadeSlideUp} className="mb-3 flex items-center gap-3">
                    <div
                        className="flex size-10 items-center justify-center rounded-xl"
                        style={{ background: `${BRAND}15` }}
                    >
                        <Archive className="size-5" style={{ color: BRAND }} />
                    </div>
                    <div
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                        style={{
                            background: `${BRAND}12`,
                            border: `1px solid ${BRAND}25`,
                        }}
                    >
                        <div className="size-1.5 rounded-full" style={{ background: BRAND }} />
                        <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: BRAND }}
                        >
                            {filteredBulletins.length} Bulletins
                        </span>
                    </div>
                </motion.div>
                <motion.h1
                    custom={1}
                    variants={fadeSlideUp}
                    className="text-2xl font-bold tracking-tight sm:text-3xl"
                    style={{ color: "#FAFAFA" }}
                >
                    Bulletin Archive
                </motion.h1>
                <motion.p
                    custom={2}
                    variants={fadeSlideUp}
                    className="mt-1.5 text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                >
                    Browse, preview, and download previously published bulletins.
                </motion.p>
            </motion.section>

            {/* Split Panel */}
            <div className="flex flex-1 gap-5 overflow-hidden px-8 pb-8 lg:px-16">
                {/* Left Panel - Bulletin List (40%) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex w-[40%] shrink-0 flex-col rounded-2xl"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {/* Panel Header with Date Filter */}
                    <div
                        className="flex shrink-0 flex-col gap-3 px-5 py-4"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <div className="flex items-center justify-between">
                            <span
                                className="text-xs font-semibold uppercase tracking-widest"
                                style={{ color: "rgba(255,255,255,0.5)" }}
                            >
                                Published Bulletins
                            </span>
                            <span
                                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                                style={{ background: `${BRAND}15`, color: BRAND }}
                            >
                                {filteredBulletins.length}
                            </span>
                        </div>

                        {/* Date Filter */}
                        <div className="relative">
                            <Calendar
                                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                                style={{ color: BRAND }}
                            />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-9 w-full rounded-lg pl-9 pr-3 text-xs outline-none transition-shadow"
                                style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    color: dateFilter ? "#FAFAFA" : "rgba(255,255,255,0.25)",
                                }}
                                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}40`)}
                                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                            />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="size-8 animate-spin" style={{ color: BRAND }} />
                            </div>
                        ) : (
                            <motion.div initial="hidden" animate="visible">
                                {filteredBulletins.map((bulletin, idx) => {
                                    const isSelected = selectedBulletin?.id === bulletin.id

                                    return (
                                        <motion.div
                                            key={bulletin.id}
                                            custom={idx}
                                            variants={listItem}
                                            className="group/row relative flex items-center gap-3 px-5 py-3.5 transition-colors"
                                            style={{
                                                background: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
                                                borderBottom: "1px solid rgba(255,255,255,0.04)",
                                                cursor: "pointer",
                                            }}
                                            onClick={() => setSelectedBulletin(bulletin)}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = "transparent"
                                            }}
                                        >
                                            {/* Selected indicator */}
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="archiveSelectedBar"
                                                    className="absolute top-0 left-0 h-full w-0.5 rounded-r"
                                                    style={{ background: BRAND }}
                                                />
                                            )}

                                            {/* File icon */}
                                            <div
                                                className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                                                style={{ background: "rgba(255,255,255,0.04)" }}
                                            >
                                                <FileText
                                                    className="size-4"
                                                    style={{ color: isSelected ? BRAND : "rgba(255,255,255,0.3)" }}
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex flex-1 flex-col gap-0.5">
                                                <p className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
                                                    {formatDisplayDate(bulletin.date)}
                                                </p>
                                                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                    {bulletin.fileName} &middot; {bulletin.fileSize}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedBulletin(bulletin)
                                                    }}
                                                    className="flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition-colors"
                                                    style={{ background: `${BRAND}15`, color: BRAND }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = `${BRAND}25` }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = `${BRAND}15` }}
                                                >
                                                    <Eye className="size-3" />
                                                    View
                                                </button>

                                                {/* Botón de descarga real apuntando al backend */}
                                                <a href={bulletin.url} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className="flex size-7 items-center justify-center rounded-lg transition-colors"
                                                        style={{
                                                            background: "rgba(255,255,255,0.04)",
                                                            color: "rgba(255,255,255,0.4)",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "rgba(255,255,255,0.08)"
                                                            e.currentTarget.style.color = "#FAFAFA"
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "rgba(255,255,255,0.04)"
                                                            e.currentTarget.style.color = "rgba(255,255,255,0.4)"
                                                        }}
                                                        aria-label={`Download ${bulletin.fileName}`}
                                                    >
                                                        <Download className="size-3.5" />
                                                    </button>
                                                </a>
                                            </div>
                                        </motion.div>
                                    )
                                })}

                                {filteredBulletins.length === 0 && (
                                    <div className="flex flex-col items-center justify-center gap-3 py-20">
                                        <FileText className="size-10" style={{ color: "rgba(255,255,255,0.15)" }} />
                                        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>No bulletins found</p>
                                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Try adjusting the date filter</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Right Panel - PDF Preview (60%) */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-1 flex-col rounded-2xl"
                    style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                    }}
                >
                    {/* Preview Header */}
                    <div
                        className="flex shrink-0 items-center justify-between px-5 py-4"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                        <span
                            className="text-xs font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            PDF Preview
                        </span>
                        {selectedBulletin && (
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {selectedBulletin.fileName}
                            </span>
                        )}
                    </div>

                    {/* Preview Body */}
                    <div className="flex flex-1 items-center justify-center p-6">
                        {selectedBulletin ? (
                            <div
                                className="flex h-full w-full flex-col items-center justify-center rounded-xl overflow-hidden"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px solid rgba(255,255,255,0.06)",
                                }}
                            >
                                {/* iframe real apuntando a FastAPI */}
                                <iframe
                                    src={`${selectedBulletin.url}#toolbar=0`}
                                    title={`Preview of ${selectedBulletin.fileName}`}
                                    className="h-full w-full border-0"
                                />
                            </div>
                        ) : (
                            <div
                                className="flex h-full w-full flex-col items-center justify-center rounded-xl"
                                style={{
                                    background: "rgba(255,255,255,0.02)",
                                    border: "1px dashed rgba(255,255,255,0.08)",
                                    minHeight: 400,
                                }}
                            >
                                <div
                                    className="mb-4 flex size-16 items-center justify-center rounded-2xl"
                                    style={{ background: "rgba(255,255,255,0.04)" }}
                                >
                                    <FileText className="size-8" style={{ color: "rgba(255,255,255,0.15)" }} />
                                </div>
                                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                                    Select a bulletin to preview
                                </p>
                                <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
                                    Choose a file from the list on the left
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}