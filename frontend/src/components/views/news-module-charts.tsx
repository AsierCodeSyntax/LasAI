"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Rss,
    DownloadCloud,
    Sparkles,
    UserPlus,
    Star,
    Loader2,
    BarChart3
} from "lucide-react"
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts"

interface HomeViewProps {
    onNavigate: (view: string) => void
}

const BRAND = "#BED600"
const BRAND_RGB = "190, 214, 0" // For rgba values

// Color palette for charts matching the dark theme
const CHART_COLORS = [
    BRAND,
    "#60A5FA", // Blue
    "#C084FC", // Purple
    "#4ADE80", // Green
    "#FB923C"  // Orange
]

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

const staggerContainer = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
}

// Custom Tooltips matching the dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 shadow-xl shadow-black/50">
            <p className="mb-1 text-xs font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">{label}</p>
            <p className="text-sm font-semibold text-[#FAFAFA]">
                <span style={{ color: BRAND }}>{payload[0].value}</span> articles
            </p>
        </div>
    )
}

const QualityTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 shadow-xl shadow-black/50">
            <p className="mb-1 text-xs font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">{payload[0].payload.topic}</p>
            <p className="text-sm font-semibold text-[#FAFAFA]">
                <span style={{ color: BRAND }}>{Number(payload[0].value).toFixed(1)}</span> / 10
            </p>
        </div>
    )
}

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#121212] px-4 py-3 shadow-xl shadow-black/50 flex items-center gap-3">
            <div className="size-3 rounded-full" style={{ background: payload[0].payload.color }} />
            <div>
                <p className="text-xs font-medium text-[rgba(255,255,255,0.5)]">{payload[0].name}</p>
                <p className="text-sm font-semibold text-[#FAFAFA]">{payload[0].value} articles</p>
            </div>
        </div>
    )
}

export function M2ChartsView({ onNavigate }: HomeViewProps) {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch(`${MOD1_API_URL}/api/dashboard/stats`)
                if (response.ok) {
                    const data = await response.json()
                    setStats(data)
                }
            } catch (error) {
                console.error("Error cargando estadísticas:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [MOD1_API_URL])

    if (isLoading) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center" style={{ background: "#0A0A0A" }}>
                <Loader2 className="size-8 animate-spin" style={{ color: BRAND }} />
                <p className="mt-4 text-sm font-medium text-[rgba(255,255,255,0.4)]">Loading Analytics...</p>
            </div>
        )
    }

    if (!stats) return (
        <div className="flex h-full flex-1 flex-col items-center justify-center" style={{ background: "#0A0A0A" }}>
            <BarChart3 className="size-10 mb-4" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm font-medium text-[rgba(255,255,255,0.4)]">Failed to load analytics data.</p>
        </div>
    )

    // Prepare Pie Chart data with fixed colors
    const sourceDistribution = stats.source_distribution.map((item: any, index: number) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length]
    }))

    // Topic color mapping for badges
    const getTopicColor = (topic: string) => {
        const t = topic.toLowerCase()
        if (t.includes('ai')) return { bg: "rgba(168,85,247,0.15)", text: "#C084FC" }
        if (t.includes('plone')) return { bg: "rgba(59,130,246,0.15)", text: "#60A5FA" }
        if (t.includes('django')) return { bg: "rgba(34,197,94,0.15)", text: "#4ADE80" }
        return { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.7)" }
    }

    return (
        <div className="flex flex-1 flex-col overflow-y-auto" style={{ background: "#0A0A0A" }}>
            {/* Breadcrumb */}
            <nav
                className="flex h-14 shrink-0 items-center gap-3 px-8 lg:px-16"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <button
                    onClick={() => onNavigate("home")}
                    className="text-sm transition-colors text-[rgba(255,255,255,0.4)] hover:text-[#FAFAFA]"
                >
                    CodeSyntax
                </button>
                <span className="text-sm text-[rgba(255,255,255,0.15)]">/</span>
                <button
                    onClick={() => onNavigate("module")}
                    className="text-sm transition-colors text-[rgba(255,255,255,0.4)] hover:text-[#FAFAFA]"
                >
                    News Bulletin
                </button>
                <span className="text-sm text-[rgba(255,255,255,0.15)]">/</span>
                <span className="text-sm font-medium text-[#FAFAFA]">
                    Analytics
                </span>
            </nav>

            <main className="flex-1 px-8 py-10 lg:px-16">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${BRAND}15` }}>
                            <BarChart3 className="size-5" style={{ color: BRAND }} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
                            Platform Analytics
                        </h1>
                    </div>
                    <p className="text-base text-[rgba(255,255,255,0.45)] mt-1">
                        Here's what your AI agents have been doing in the last 7 days.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                >
                    {/* Zone 1: KPI Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: "Active Sources", value: stats.kpis.active_sources, sub: "in YAML config", icon: Rss, color: "#60A5FA" },
                            { title: "Ingested Articles", value: stats.kpis.ingested, sub: "Last 7 days", icon: DownloadCloud, color: BRAND },
                            { title: "High Quality (≥ 8)", value: stats.kpis.high_quality, sub: "Last 7 days", icon: Sparkles, color: "#FACC15" },
                            { title: "Manual Submissions", value: stats.kpis.manual, sub: "Last 7 days", icon: UserPlus, color: "#C084FC" },
                        ].map((kpi, idx) => {
                            const Icon = kpi.icon
                            return (
                                <motion.div
                                    key={kpi.title}
                                    variants={fadeSlideUp}
                                    custom={idx}
                                    className="flex flex-col rounded-2xl p-5"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                    }}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                                            style={{ background: `rgba(255,255,255,0.05)` }}
                                        >
                                            <Icon className="size-5" style={{ color: kpi.color }} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.4)]">
                                                {kpi.title}
                                            </span>
                                            <span className="mt-1 text-3xl font-bold tracking-tight text-[#FAFAFA]">
                                                {kpi.value}
                                            </span>
                                            <span className="mt-1 text-[11px] font-medium text-[rgba(255,255,255,0.3)]">
                                                {kpi.sub}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Zone 2: Main Charts */}
                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
                        {/* Ingestion Volume - 60% */}
                        <motion.div variants={fadeSlideUp} custom={4} className="lg:col-span-3 flex flex-col rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">7-Day Ingestion Volume</h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.ingestion_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={BRAND} stopOpacity={0.4} />
                                                <stop offset="100%" stopColor={BRAND} stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                                        <Area type="monotone" dataKey="articles" stroke={BRAND} strokeWidth={3} fill="url(#areaGradient)" activeDot={{ r: 6, fill: "#0A0A0A", stroke: BRAND, strokeWidth: 2 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Quality by Topic - 40% */}
                        <motion.div variants={fadeSlideUp} custom={5} className="lg:col-span-2 flex flex-col rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Avg. Quality by Topic</h3>
                            <div className="h-[280px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.quality_by_topic} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                        <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="topic" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)", fontWeight: 500 }} axisLine={false} tickLine={false} width={75} />
                                        <Tooltip content={<QualityTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                                        <Bar dataKey="score" fill={BRAND} radius={[0, 6, 6, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>

                    {/* Zone 3: Details */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 pb-10">
                        {/* Source Distribution - 40% */}
                        <motion.div variants={fadeSlideUp} custom={6} className="lg:col-span-2 flex flex-col rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Source Distribution</h3>
                            <div className="flex h-[240px] items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip content={<PieTooltip />} />
                                        <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                            {sourceDistribution.map((entry: any) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 mt-4">
                                {sourceDistribution.map((entry: any) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="size-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                        <span className="text-[11px] font-medium text-[rgba(255,255,255,0.6)]">{entry.name} <span className="text-[rgba(255,255,255,0.3)]">({entry.value})</span></span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Top Articles - 60% */}
                        <motion.div variants={fadeSlideUp} custom={7} className="lg:col-span-3 flex flex-col rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="p-6 pb-4 border-b border-[rgba(255,255,255,0.06)]">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-[rgba(255,255,255,0.5)]">Top Articles Waiting for Bulletin</h3>
                            </div>

                            <div className="flex-1 p-0">
                                {stats.top_articles.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center py-12">
                                        <Sparkles className="size-8 mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                                        <span className="text-sm font-medium text-[rgba(255,255,255,0.4)]">No articles found. Run the Scout!</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {stats.top_articles.map((article: any, index: number) => {
                                            const tColor = getTopicColor(article.topic)
                                            return (
                                                <div key={article.id} className={`flex items-center gap-4 p-5 transition-colors hover:bg-[rgba(255,255,255,0.02)] ${index < stats.top_articles.length - 1 ? "border-b border-[rgba(255,255,255,0.04)]" : ""}`}>
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                                        <span className="truncate text-sm font-medium text-[#FAFAFA] pr-4">{article.title}</span>
                                                        <span className="w-fit rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: tColor.bg, color: tColor.text }}>
                                                            {article.topic}
                                                        </span>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1.5 bg-[rgba(255,255,255,0.04)] px-3 py-1.5 rounded-lg">
                                                        <Star className="size-3.5 fill-[#FACC15] text-[#FACC15]" />
                                                        <span className="text-sm font-bold text-[#FAFAFA]">{article.score.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}