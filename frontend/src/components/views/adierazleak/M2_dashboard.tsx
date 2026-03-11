"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Play,
    Pause,
    Sparkles,
    TrendingUp,
    Clock,
    CheckCircle,
    Euro,
    TrendingDown,
    AlertTriangle,
    X,
} from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell,
} from "recharts"

// Theme colors
const colors = {
    background: "#0A0A0A",
    primary: "#BED600",
    textPrimary: "#FAFAFA",
    textSecondary: "rgba(255,255,255,0.5)",
    cardBorder: "rgba(255,255,255,0.1)",
    gridLine: "rgba(255,255,255,0.05)",
    axisText: "rgba(255,255,255,0.4)",
    orange: "#F59E0B",
    blue: "#60A5FA",
    purple: "#C084FC",
    red: "#F87171",
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
}

// Smart AI Insight Function
function getAIInsight(day: number, productivity: number, totalHours: number, delays: number): { emoji: string; text: string } {
    if (day <= 10) {
        return {
            emoji: "🚀",
            text: `Month starting. Initial billing uploaded. Project hours are slowly ramping up (${totalHours.toLocaleString()}h logged). ${delays} delays so far.`,
        }
    } else if (day <= 20) {
        return {
            emoji: "⚠️",
            text: `Mid-month alert: Internal projects (Tagzania, Mendiak) are spiking to 25% of total bandwidth. Productivity at ${productivity}%. Monitor closely.`,
        }
    } else {
        return {
            emoji: "📊",
            text: `Final Review: Productivity settled at ${productivity}% (below 70% target). Kanban performance is strong but watch out for ${delays} accumulated delays.`,
        }
    }
}

// Base data for projects with expected hours
const baseTopProjectsData = [
    { name: "Tokikom", hours: 245, expected: 280 },
    { name: "Tagzania", hours: 198, expected: 180 },
    { name: "ONCE", hours: 176, expected: 200 },
    { name: "Mendiak", hours: 142, expected: 160 },
]

// CS Orduak Table Data (constant)
const csOrduakData = [
    { category: "Aurrekontu itxiak", hours: 558, percentage: 32.63 },
    { category: "Kolaborazio Proiektuak", hours: 446, percentage: 26.08 },
    { category: "Mantentzeak", hours: 310, percentage: 18.13 },
    { category: "Barne proiektuak", hours: 395, percentage: 23.10 },
    { category: "I & G", hours: 1, percentage: 0.06 },
]

// Billing evolution data (monthly)
const billingEvolutionData = [
    { month: "Jan", y2025: 42.5, y2026: 38.2 },
    { month: "Feb", y2025: 47.3, y2026: 41.7 },
]

// Delay breakdown data
const delayBreakdownData = [
    { type: "Client Blocked", count: 2 },
    { type: "Scope Change", count: 2 },
    { type: "Tech Issue", count: 1 },
    { type: "QA Failed", count: 1 },
]

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color?: string; dataKey?: string }>
    label?: string
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 backdrop-blur-md">
                <p className="text-[#FAFAFA] mb-1 font-medium">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color || colors.textSecondary }} className="text-sm">
                        {entry.name || entry.dataKey}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

// Delay Modal Component
function DelayModal({ isOpen, onClose, delays }: { isOpen: boolean; onClose: () => void; delays: number }) {
    const scaledDelayData = delayBreakdownData.map((item) => ({
        ...item,
        count: Math.max(0, Math.round((item.count / 6) * delays)),
    }))

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-8 rounded-2xl"
                        style={{
                            background: "rgba(20, 20, 20, 0.95)",
                            border: "1px solid rgba(248, 113, 113, 0.3)",
                            boxShadow: "0 0 60px rgba(248, 113, 113, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                        }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-[#FAFAFA]">
                                Delay Breakdown <span className="text-white/50">(Atzerapenak)</span>
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-lg transition-all hover:bg-white/10">
                                <X size={20} className="text-white/50" />
                            </button>
                        </div>

                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                            style={{ background: "rgba(248, 113, 113, 0.15)", color: colors.red }}
                        >
                            <AlertTriangle size={16} />
                            <span className="font-semibold">{delays} Total Delays</span>
                        </div>

                        <div className="mb-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={scaledDelayData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                    <XAxis type="number" tick={{ fill: colors.axisText, fontSize: 12 }} axisLine={{ stroke: colors.gridLine }} tickLine={false} domain={[0, Math.max(...scaledDelayData.map(d => d.count)) + 1]} />
                                    <YAxis type="category" dataKey="type" tick={{ fill: colors.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                                    <Bar dataKey="count" fill={colors.red} radius={[0, 6, 6, 0]} barSize={24} name="Delays" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {scaledDelayData.map((item) => (
                                <div key={item.type} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.05)" }}>
                                    <div className="w-2 h-2 rounded-full" style={{ background: colors.red }} />
                                    <span className="text-white/70">{item.type}:</span>
                                    <span className="text-[#FAFAFA] font-medium">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

function KanbanBattery({ closed, delays, target, onDelayClick }: { closed: number; delays: number; target: number; onDelayClick: () => void; }) {
    const closedPercent = Math.min((closed / target) * 100, 100)
    const size = 240
    const strokeWidth = 20
    const radius = (size - strokeWidth) / 2
    const circumference = Math.PI * radius
    const closedDash = (closedPercent / 100) * circumference
    const closedGap = circumference - closedDash
    const delaysPercent = Math.min((delays / target) * 100, 10)
    const delaysDash = (delaysPercent / 100) * circumference

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
                <path d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} strokeLinecap="round" />
                <path d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`} fill="none" stroke={colors.blue} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${closedDash} ${closedGap}`} style={{ filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))", transition: "stroke-dasharray 0.5s ease-out" }} />
                {delays > 0 && (
                    <path d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`} fill="none" stroke={colors.red} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${delaysDash} ${circumference - delaysDash}`} strokeDashoffset={-closedDash + delaysDash} style={{ filter: "drop-shadow(0 0 12px rgba(248, 113, 113, 0.8))", transition: "stroke-dasharray 0.5s ease-out, stroke-dashoffset 0.5s ease-out" }} />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: "20px" }}>
                <div className="text-5xl font-bold" style={{ color: colors.blue }}>{closed}</div>
                <div className="text-white/50 text-sm mt-1">/ {target} Target</div>
                {delays > 0 && (
                    <button onClick={onDelayClick} className="mt-3 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(248, 113, 113, 0.2)", color: colors.red, boxShadow: "0 0 20px rgba(248, 113, 113, 0.4)" }}>
                        {delays} Atzerapenak
                    </button>
                )}
            </div>
            <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: colors.blue }} />
                    <span className="text-white/50 text-sm">Closed</span>
                </div>
                <button onClick={onDelayClick} className="flex items-center gap-2 cursor-pointer transition-all hover:scale-105">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: colors.red, boxShadow: "0 0 8px rgba(248, 113, 113, 0.6)" }} />
                    <span className="text-white/50 text-sm hover:text-white/70 transition-colors">Delays</span>
                </button>
            </div>
        </div>
    )
}

function BillingStockChart({ multiplier }: { multiplier: number }) {
    const chartData = billingEvolutionData.map((item) => ({
        ...item,
        y2026: item.month === "Feb" ? parseFloat((item.y2026 * multiplier).toFixed(1)) : item.y2026,
    }))

    const current2026 = chartData[chartData.length - 1].y2026
    const current2025 = chartData[chartData.length - 1].y2025
    const deltaPercent = (((current2026 - current2025) / current2025) * 100).toFixed(0)
    const isNegative = parseFloat(deltaPercent) < 0

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#FAFAFA]">Billing Evolution</h3>
                <div className="px-4 py-2 rounded-full flex items-center gap-2 font-semibold" style={{ background: isNegative ? "rgba(248, 113, 113, 0.15)" : "rgba(190, 214, 0, 0.15)", color: isNegative ? colors.red : colors.primary, boxShadow: isNegative ? "0 0 20px rgba(248, 113, 113, 0.3)" : "0 0 20px rgba(190, 214, 0, 0.3)" }}>
                    {isNegative ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                    <span>{deltaPercent}% vs Last Year</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorY2026" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: colors.axisText, fontSize: 12 }} axisLine={{ stroke: colors.gridLine }} tickLine={false} />
                    <YAxis tick={{ fill: colors.axisText, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}K`} domain={[0, 60]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="y2025" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="8 4" fill="none" name="2025" />
                    <Area type="monotone" dataKey="y2026" stroke={colors.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorY2026)" name="2026" style={{ filter: "drop-shadow(0 0 8px rgba(190, 214, 0, 0.5))" }} />
                </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5" style={{ background: "rgba(255,255,255,0.3)", borderStyle: "dashed" }} />
                    <span className="text-white/50 text-sm">2025 Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 rounded" style={{ background: colors.primary, boxShadow: "0 0 6px rgba(190, 214, 0, 0.5)" }} />
                    <span className="text-white/50 text-sm">2026 Current</span>
                </div>
            </div>
        </div>
    )
}

function ProjectsBurnRateChart({ data }: { data: Array<{ name: string; hours: number; expected: number }> }) {
    const chartData = data.map((item) => ({ ...item, expectedBg: item.expected }))

    return (
        <div>
            <h3 className="text-lg font-semibold mb-6 text-[#FAFAFA]">Top Projects Burn Rate</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 40 }}>
                    <XAxis type="number" tick={{ fill: colors.axisText, fontSize: 12 }} axisLine={{ stroke: colors.gridLine }} tickLine={false} domain={[0, 300]} />
                    <YAxis type="category" dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 14 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    <Bar dataKey="expectedBg" fill="rgba(255,255,255,0.1)" radius={[0, 8, 8, 0]} barSize={32} name="Expected Budget" />
                    <Bar dataKey="hours" radius={[0, 8, 8, 0]} barSize={32} name="Actual Hours">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.hours > entry.expected ? colors.orange : colors.primary} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: colors.primary }} />
                    <span className="text-white/50 text-sm">Under Budget</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: colors.orange }} />
                    <span className="text-white/50 text-sm">Over Budget</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <span className="text-white/50 text-sm">Expected Budget</span>
                </div>
            </div>
        </div>
    )
}

function CSOrduakTable({ multiplier }: { multiplier: number }) {
    const categoryColors: Record<string, string> = {
        "Aurrekontu itxiak": colors.primary,
        "Kolaborazio Proiektuak": colors.blue,
        "Mantentzeak": colors.purple,
        "Barne proiektuak": colors.orange,
        "I & G": colors.red,
    }

    const baseHours = [558, 446, 310, 395, 1]

    const scaledData = csOrduakData.map((item, index) => {
        const scaledHours = Math.floor(baseHours[index] * multiplier) || 1
        return { ...item, hours: scaledHours }
    })

    const totalHours = scaledData.reduce((acc, item) => acc + item.hours, 0)
    const dataWithDynamicPercent = scaledData.map((item) => ({
        ...item,
        percentage: totalHours > 0 ? (item.hours / totalHours) * 100 : 0,
    }))

    return (
        <div>
            <h3 className="text-lg font-semibold mb-6 text-[#FAFAFA]">Time Allocation Breakdown (CS Orduak)</h3>
            <div className="flex flex-col gap-2">
                {dataWithDynamicPercent.map((item, index) => {
                    const catColor = categoryColors[item.category] || colors.textSecondary
                    return (
                        <div key={index} className="relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all hover:bg-white/5 cursor-default overflow-hidden group">
                            <div className="absolute inset-0 left-0 top-0 h-full transition-all duration-500 pointer-events-none" style={{ width: `${item.percentage}%`, background: `${catColor}15` }} />
                            <div className="relative z-10 flex items-center gap-4 w-full">
                                <div className="w-3 h-3 rounded-full shrink-0 transition-transform group-hover:scale-110" style={{ background: catColor, boxShadow: `0 0 8px ${catColor}40` }} />
                                <span className="text-[#FAFAFA] font-medium flex-1 min-w-0 truncate">{item.category}</span>
                                <span className="text-white/70 font-medium tabular-nums w-20 text-right">{item.hours.toLocaleString()}h</span>
                                <div className="flex items-center gap-2 w-24">
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.percentage}%`, background: catColor }} />
                                    </div>
                                    <span className="font-semibold tabular-nums text-sm w-12 text-right" style={{ color: catColor }}>{item.percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div className="relative flex items-center gap-4 px-5 py-4 rounded-xl mt-2" style={{ background: "rgba(190, 214, 0, 0.1)", border: "1px solid rgba(190, 214, 0, 0.2)" }}>
                    <div className="relative z-10 flex items-center gap-4 w-full">
                        <div className="w-3 h-3 shrink-0" />
                        <span className="font-bold flex-1" style={{ color: colors.primary }}>TOTAL</span>
                        <span className="font-bold tabular-nums w-20 text-right" style={{ color: colors.primary }}>{totalHours.toLocaleString()}h</span>
                        <div className="flex items-center gap-2 w-24">
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: colors.primary }} />
                            <span className="font-bold tabular-nums text-sm w-12 text-right" style={{ color: colors.primary }}>100%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function HoursProgressBar({ projectHours, internalHours }: { projectHours: number; internalHours: number }) {
    const totalHours = projectHours + internalHours
    const projectPercent = totalHours > 0 ? (projectHours / totalHours) * 100 : 0
    const internalPercent = totalHours > 0 ? (internalHours / totalHours) * 100 : 0

    const getProjectColor = (percent: number) => {
        if (percent >= 70) return colors.primary
        if (percent >= 60) return colors.orange
        return "#EF4444"
    }

    const projectColor = getProjectColor(projectPercent)
    const internalColor = colors.blue

    return (
        <div className="mt-4">
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="absolute left-0 top-0 h-full rounded-l-full transition-all duration-500" style={{ width: `${projectPercent}%`, background: projectColor }} />
                <div className="absolute top-0 h-full rounded-r-full transition-all duration-500" style={{ left: `${projectPercent}%`, width: `${internalPercent}%`, background: internalColor }} />
                <div className="absolute top-0 h-full w-0.5 z-10" style={{ left: "70%", background: colors.textPrimary }} />
                <div className="absolute -top-5 text-[10px] font-medium transform -translate-x-1/2" style={{ left: "70%", color: colors.textSecondary }}>70% Target</div>
            </div>
            <div className="flex justify-between mt-3 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: projectColor }} />
                    <span className="text-white/50">Projects:</span>
                    <span className="font-semibold" style={{ color: projectColor }}>{Math.round(projectPercent)}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded" style={{ background: internalColor }} />
                    <span className="text-white/50">Internal:</span>
                    <span className="font-semibold" style={{ color: internalColor }}>{Math.round(internalPercent)}%</span>
                </div>
            </div>
        </div>
    )
}

export function M2_Dashboard() {
    // Inicializamos en el día 28 como en la imagen
    const [currentDay, setCurrentDay] = useState(28)
    const [isPlaying, setIsPlaying] = useState(false)
    const [showDelayModal, setShowDelayModal] = useState(false)

    useEffect(() => {
        if (!isPlaying) return
        if (currentDay >= 28) {
            setIsPlaying(false)
            return
        }

        const interval = setInterval(() => {
            setCurrentDay((d) => {
                if (d >= 28) {
                    setIsPlaying(false)
                    return 28
                }
                return d + 1
            })
        }, 800)

        return () => clearInterval(interval)
    }, [isPlaying, currentDay])

    const multiplier = currentDay / 28
    const productivity = Math.floor(40 + multiplier * 18)
    const totalHours = Math.floor(multiplier * 2961)
    const kanbanClosed = Math.floor(multiplier * 90)
    const billing = parseFloat((multiplier * 41.7).toFixed(1))
    const delays = Math.max(0, Math.floor(6 * multiplier))
    const projectHours = Math.floor(multiplier * 1710)
    const internalHours = Math.floor(multiplier * 1251)

    const topProjectsData = baseTopProjectsData.map((item) => ({
        ...item,
        hours: Math.floor(item.hours * multiplier) || 1,
        expected: item.expected,
    }))

    const aiInsight = getAIInsight(currentDay, productivity, totalHours, delays)
    const productivityTarget = 70
    const productivityDelta = productivity - productivityTarget
    const isProductivityBad = productivity < productivityTarget
    const kanbanTarget = 100
    const kanbanDeltaPercent = Math.round(((kanbanClosed - kanbanTarget) / kanbanTarget) * 100)

    return (
        <div
            style={{ backgroundColor: colors.background }}
            className="flex-1 h-screen overflow-y-auto text-white w-full"
        >
            <main className="min-h-full pb-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-6xl mx-auto px-8 py-8"
                >
                    <motion.div variants={itemVariants} className="sticky top-0 z-40 pb-6 bg-[#0A0A0A]">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                            <h1 className="text-2xl font-semibold text-[#FAFAFA]">
                                February 2026 - <span style={{ color: colors.primary }}>Live Pulse</span>
                            </h1>
                            <div className="px-4 py-2 rounded-full flex items-center gap-2" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", boxShadow: "0 0 20px rgba(245, 158, 11, 0.2)" }}>
                                <Clock size={16} style={{ color: colors.orange }} />
                                <span style={{ color: colors.orange, fontWeight: 500 }}>
                                    Time to close: {Math.max(0, 28 - currentDay).toString().padStart(2, "0")}d 16h
                                </span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="flex items-center gap-6">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 rounded-xl transition-all hover:scale-105 shrink-0" style={{ background: colors.primary }}>
                                    {isPlaying ? <Pause size={20} color="#0A0A0A" /> : <Play size={20} color="#0A0A0A" />}
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="1" max="28" value={currentDay} onChange={(e) => setCurrentDay(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${colors.primary} ${((currentDay - 1) / 27) * 100}%, rgba(255,255,255,0.1) ${((currentDay - 1) / 27) * 100}%)` }} />
                                        <div className="px-3 py-1.5 rounded-lg shrink-0 font-medium" style={{ background: "rgba(190, 214, 0, 0.15)", color: colors.primary }}>
                                            Day {currentDay}
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs" style={{ color: colors.textSecondary }}>
                                        <span>1</span><span>7</span><span>14</span><span>21</span><span>28</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-6 rounded-2xl backdrop-blur-md mb-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: "rgba(190, 214, 0, 0.15)" }}>
                                <Sparkles size={22} style={{ color: colors.primary }} />
                            </div>
                            <h2 className="text-lg font-semibold text-[#FAFAFA]">
                                AI Insight <span className="text-white/50 font-normal">(Day {currentDay})</span>
                            </h2>
                        </div>
                        <p className="text-white/70 leading-relaxed text-lg">
                            <span className="text-2xl mr-2">{aiInsight.emoji}</span>
                            {aiInsight.text}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="relative p-6 rounded-2xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: isProductivityBad ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    {isProductivityBad ? <AlertTriangle size={22} style={{ color: colors.orange }} /> : <TrendingUp size={22} style={{ color: colors.primary }} />}
                                    {isProductivityBad && (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: "rgba(248, 113, 113, 0.2)", color: colors.red }}>
                                            <TrendingDown size={12} />
                                            {productivityDelta}% vs Target
                                        </span>
                                    )}
                                </div>
                                <div className="text-4xl font-bold mb-1" style={{ color: isProductivityBad ? colors.orange : colors.primary }}>
                                    {productivity}%
                                </div>
                                <div className="text-white/50 text-sm">Productivity (Target: 70%)</div>
                            </div>
                        </div>

                        <div className="relative p-6 rounded-2xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <Clock size={22} style={{ color: colors.blue }} />
                                </div>
                                <div className="text-4xl font-bold mb-1" style={{ color: colors.blue }}>
                                    {totalHours.toLocaleString()}h
                                </div>
                                <div className="text-white/50 text-sm">Total Hours</div>
                                <HoursProgressBar projectHours={projectHours} internalHours={internalHours} />
                            </div>
                        </div>

                        <div className="relative p-6 rounded-2xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <CheckCircle size={22} style={{ color: colors.purple }} />
                                    {kanbanDeltaPercent < 0 && (
                                        <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: "rgba(248, 113, 113, 0.2)", color: colors.red }}>
                                            <TrendingDown size={12} />
                                            {kanbanDeltaPercent}% Below Target
                                        </span>
                                    )}
                                </div>
                                <div className="text-4xl font-bold mb-1" style={{ color: colors.purple }}>{kanbanClosed}</div>
                                <div className="text-white/50 text-sm">Kanban Closed (Target: 100)</div>
                                {delays > 0 && (
                                    <div className="mt-3">
                                        <button onClick={() => setShowDelayModal(true)} className="text-xs px-2 py-1 rounded-full cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(248, 113, 113, 0.2)", color: colors.red, boxShadow: "0 0 12px rgba(248, 113, 113, 0.3)" }}>
                                            {delays} delays
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative p-6 rounded-2xl overflow-hidden backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <Euro size={22} style={{ color: colors.textPrimary }} />
                                </div>
                                <div className="text-4xl font-bold mb-1 text-[#FAFAFA]">{billing.toFixed(1)}K €</div>
                                <div className="text-white/50 text-sm">Monthly Billing</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <h3 className="text-lg font-semibold mb-4 text-[#FAFAFA]">The Kanban Battery</h3>
                            <KanbanBattery closed={kanbanClosed} delays={delays} target={100} onDelayClick={() => setShowDelayModal(true)} />
                        </div>

                        <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <BillingStockChart multiplier={multiplier} />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-8 rounded-2xl backdrop-blur-md mb-8" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <ProjectsBurnRateChart data={topProjectsData} />
                    </motion.div>

                    <motion.div variants={itemVariants} className="p-8 rounded-2xl backdrop-blur-md" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <CSOrduakTable multiplier={multiplier} />
                    </motion.div>
                </motion.div>
            </main>

            <DelayModal isOpen={showDelayModal} onClose={() => setShowDelayModal(false)} delays={delays} />
        </div>
    )
}