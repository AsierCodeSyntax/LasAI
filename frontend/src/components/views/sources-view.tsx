"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CheckCircle,
    XCircle,
    RefreshCw,
    Trash2,
    Plus,
    Loader2,
    Rss,
    Clock,
    ExternalLink,
    ChevronDown,
    Bot,
    Star,
    FileText,
} from "lucide-react"

type View = "home" | "module" | "add-news" | "review" | "archive" | "sources" | "coming-soon"

interface SourcesViewProps {
    onNavigate: (view: string) => void
}

interface RssFeed {
    id: string
    name: string
    url: string
    topic: string
    status: "valid" | "error" | "pending"
    lastChecked: string
    type: "manual" | "ai"
    score?: number
    avg_score?: number
}

interface FeedArticle {
    id: number
    title: string
    llm_score: number
    url: string
}

// 🔥 Nueva interfaz para los topics dinámicos
interface TopicConfig {
    slug: string
    name: string
    color: string
}

const BRAND = "#BED600"

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
    valid: { label: "Valid", icon: CheckCircle, color: "#4ADE80", bg: "rgba(34,197,94,0.15)" },
    error: { label: "Error", icon: XCircle, color: "#F87171", bg: "rgba(239,68,68,0.15)" },
    pending: { label: "Pending", icon: Clock, color: "#A3A3A3", bg: "rgba(255,255,255,0.08)" },
}

export function SourcesView({ onNavigate }: SourcesViewProps) {
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [feeds, setFeeds] = useState<RssFeed[]>([])

    // 🔥 Estado para guardar los topics que vienen de la API
    const [systemTopics, setSystemTopics] = useState<TopicConfig[]>([])

    const [feedName, setFeedName] = useState("")
    const [feedUrl, setFeedUrl] = useState("")
    const [feedTopic, setFeedTopic] = useState("")

    const [isAdding, setIsAdding] = useState(false)
    const [isLoadingInitial, setIsLoadingInitial] = useState(true)
    const [validatingIds, setValidatingIds] = useState<Set<string>>(new Set())
    const [validatingAll, setValidatingAll] = useState(false)

    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [rowArticles, setRowArticles] = useState<Record<string, FeedArticle[]>>({})
    const [isLoadingArticles, setIsLoadingArticles] = useState<string | null>(null)

    const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

    useEffect(() => {
        async function fetchInitialData() {
            setIsLoadingInitial(true)
            try {
                // 1. Cargar Topics (para el selector y los colores)
                const topicsRes = await fetch(`${MOD1_API_URL}/api/topics`)
                if (topicsRes.ok) {
                    const data = await topicsRes.json()
                    const realTopicsData = data.topics ? data.topics : data
                    const fetchedTopics = Object.entries(realTopicsData).map(([slug, info]: [string, any]) => ({
                        slug: slug,
                        name: info.name || slug,
                        color: info.color || BRAND
                    }))
                    setSystemTopics(fetchedTopics)
                }

                // 2. Cargar Fuentes (RSS)
                const sourcesRes = await fetch(`${MOD1_API_URL}/api/sources`)
                if (sourcesRes.ok) {
                    const data = await sourcesRes.json()
                    setFeeds(data.sources || [])
                }
            } catch (error) {
                console.error("Error fetching initial data:", error)
            } finally {
                setIsLoadingInitial(false)
            }
        }

        fetchInitialData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchSources = async () => {
        try {
            const response = await fetch(`${MOD1_API_URL}/api/sources`)
            if (response.ok) {
                const data = await response.json()
                setFeeds(data.sources || [])
            }
        } catch (error) {
            console.error("Error fetching sources:", error)
        }
    }

    async function handleAddFeed(e: React.FormEvent) {
        e.preventDefault()
        if (!feedUrl || !feedTopic) return
        setIsAdding(true)
        try {
            const response = await fetch(`${MOD1_API_URL}/api/sources`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: feedName, url: feedUrl, topic: feedTopic.toLowerCase() })
            })
            if (!response.ok) throw new Error("Error validando el RSS")
            setFeedName("")
            setFeedUrl("")
            setFeedTopic("")
            await fetchSources()
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`)
        } finally {
            setIsAdding(false)
        }
    }

    async function handleDelete(feed: RssFeed) {
        if (!confirm(`¿Seguro que quieres borrar este RSS?`)) return
        try {
            const response = await fetch(
                `${MOD1_API_URL}/api/sources?topic=${encodeURIComponent(feed.topic)}&url=${encodeURIComponent(feed.url)}&type=${feed.type}`,
                { method: "DELETE" }
            )
            if (response.ok) await fetchSources()
        } catch (error) {
            console.error("Error deleting:", error)
        }
    }

    async function handleValidate(feed: RssFeed) {
        setValidatingIds((prev) => new Set(prev).add(feed.id))
        try {
            const response = await fetch(`${MOD1_API_URL}/api/sources/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: feed.name, url: feed.url, topic: feed.topic })
            })
            const status = response.ok ? "valid" : "error"
            setFeeds((prev) => prev.map((f) => f.id === feed.id ? { ...f, status: status, lastChecked: "Just now" } : f))
        } catch (error) {
            setFeeds((prev) => prev.map((f) => f.id === feed.id ? { ...f, status: "error", lastChecked: "Just now" } : f))
        } finally {
            setValidatingIds((prev) => {
                const next = new Set(prev)
                next.delete(feed.id)
                return next
            })
        }
    }

    async function handleValidateAll() {
        setValidatingAll(true)
        const tabFeeds = feeds.filter(f => f.type === activeTab)
        const allIds = new Set(tabFeeds.map((f) => f.id))

        setValidatingIds(prev => new Set([...prev, ...allIds]))

        await Promise.allSettled(tabFeeds.map(feed => handleValidate(feed)))
        setValidatingAll(false)
    }

    async function handleToggleExpand(feed: RssFeed) {
        if (expandedRow === feed.id) {
            setExpandedRow(null)
            return
        }
        setExpandedRow(feed.id)

        if (!rowArticles[feed.id]) {
            setIsLoadingArticles(feed.id)
            try {
                const response = await fetch(`${MOD1_API_URL}/api/sources/articles?url=${encodeURIComponent(feed.url)}`)
                if (response.ok) {
                    const data = await response.json()
                    setRowArticles(prev => ({ ...prev, [feed.id]: data.articles }))
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingArticles(null)
            }
        }
    }

    async function handleSaveScore(feed: RssFeed, newScore: number) {
        setFeeds(prev => prev.map(f => f.id === feed.id ? { ...f, score: newScore } : f))
        try {
            await fetch(`${MOD1_API_URL}/api/sources/ia/score`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: feed.url, score: newScore })
            })
        } catch (e) {
            console.error("Error guardando el score", e)
        }
    }

    const filteredFeeds = feeds.filter(f => f.type === activeTab)
    const validCount = filteredFeeds.filter(f => f.status === "valid").length
    const errorCount = filteredFeeds.filter(f => f.status === "error").length

    return (
        <div className="flex flex-1 flex-col overflow-y-auto" style={{ background: "#0A0A0A" }}>
            <nav className="flex h-14 shrink-0 items-center gap-3 px-8 lg:px-16" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-sm font-bold tracking-wide" style={{ color: "#E0E0E0" }}>RSS Sources & Intelligence</span>
            </nav>

            <main className="flex-1 px-8 py-10 lg:px-16">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#FAFAFA] flex items-center gap-3">
                            <Rss className="size-6" style={{ color: BRAND }} /> Feed Management
                        </h1>
                        <p className="text-sm text-[#A3A3A3] mt-1 font-medium">Manage manual feeds and review AI-discovered sources.</p>
                    </div>

                    <div className="flex p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <button
                            onClick={() => setActiveTab("manual")}
                            className="relative px-6 py-2 text-sm font-bold rounded-lg transition-colors"
                            style={{ color: activeTab === "manual" ? "#0A0A0A" : "#D1D5DB" }}
                        >
                            {activeTab === "manual" && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg" style={{ background: BRAND }} transition={{ duration: 0.2 }} />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Plus className="size-4" /> Manual Feeds
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("ai")}
                            className="relative px-6 py-2 text-sm font-bold rounded-lg transition-colors"
                            style={{ color: activeTab === "ai" ? "#0A0A0A" : "#D1D5DB" }}
                        >
                            {activeTab === "ai" && (
                                <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-lg" style={{ background: BRAND }} transition={{ duration: 0.2 }} />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <Bot className="size-4" /> AI Discovered
                            </span>
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "manual" && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 rounded-2xl p-6 overflow-hidden shadow-lg"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#E0E0E0]">Add New Manual Feed</h2>
                            <form onSubmit={handleAddFeed} className="flex flex-col gap-4 lg:flex-row lg:items-end">
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <input placeholder="e.g. Plone Blog" value={feedName} onChange={(e) => setFeedName(e.target.value)} required
                                        className="h-11 w-full rounded-xl px-4 text-sm font-medium outline-none transition-all bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.12)] text-[#FAFAFA] placeholder:text-[#6B7280] focus:border-[#BED600]" />
                                </div>
                                <div className="flex flex-[2] flex-col gap-1.5">
                                    <input type="url" placeholder="https://example.com/rss" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} required
                                        className="h-11 w-full rounded-xl px-4 text-sm font-medium outline-none transition-all bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.12)] text-[#FAFAFA] placeholder:text-[#6B7280] focus:border-[#BED600]" />
                                </div>
                                <div className="flex w-full flex-col gap-1.5 lg:w-40">
                                    <select value={feedTopic} onChange={(e) => setFeedTopic(e.target.value)} required
                                        className="h-11 w-full appearance-none rounded-xl px-4 pr-8 text-sm font-bold outline-none transition-all bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.12)] text-[#FAFAFA] focus:border-[#BED600]">
                                        <option value="" disabled>Select Topic</option>
                                        {/* 🔥 Selector dinámico basado en YAML */}
                                        {systemTopics.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                                    </select>
                                </div>
                                <button type="submit" disabled={!feedName || !feedUrl || !feedTopic || isAdding}
                                    className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-extrabold transition-all disabled:opacity-40 hover:scale-[1.02]"
                                    style={{ background: BRAND, color: "#0A0A0A", boxShadow: `0 0 15px rgba(190, 214, 0, 0.2)` }}>
                                    {isAdding ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Add Feed</>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="rounded-2xl shadow-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {/* ... (Header y contadores, sin cambios) ... */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-[#FAFAFA]">
                                {activeTab === "manual" ? "Manual Sources" : "AI Discovered Sources"}
                            </span>
                            <span className="rounded-md px-2 py-0.5 text-xs font-bold bg-[rgba(255,255,255,0.1)] text-[#FAFAFA]">
                                {filteredFeeds.length} feeds
                            </span>
                            {validCount > 0 && (
                                <span className="rounded-md px-2 py-0.5 text-xs font-bold bg-[rgba(34,197,94,0.15)] text-[#4ADE80]">
                                    {validCount} valid
                                </span>
                            )}
                            {errorCount > 0 && (
                                <span className="rounded-md px-2 py-0.5 text-xs font-bold bg-[rgba(239,68,68,0.15)] text-[#F87171]">
                                    {errorCount} error
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleValidateAll}
                            disabled={validatingAll || filteredFeeds.length === 0}
                            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-40 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-[#E0E0E0] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#FAFAFA]"
                        >
                            {validatingAll ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                            Validate All
                        </button>
                    </div>

                    <div className={`grid items-center gap-4 px-6 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)] ${activeTab === 'ai' ? 'grid-cols-[1fr_80px_100px_90px_100px]' : 'grid-cols-[1fr_90px_100px_100px]'}`}>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3]">Feed Details</span>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3]">Topic</span>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3] text-center">Avg. Score</span>
                        {activeTab === 'ai' && <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3] text-center">Reputation</span>}
                        <span className="text-right text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3]">Actions</span>
                    </div>

                    <div className="flex flex-col">
                        {isLoadingInitial ? (
                            <div className="flex h-40 items-center justify-center"><Loader2 className="size-8 animate-spin text-[#A3A3A3]" /></div>
                        ) : filteredFeeds.length === 0 ? (
                            <div className="flex flex-col items-center py-20 text-[#A3A3A3]">
                                {activeTab === 'ai' ? <Bot className="size-12 mb-3 opacity-60" /> : <Rss className="size-12 mb-3 opacity-60" />}
                                <p className="font-medium text-lg">No {activeTab} sources found.</p>
                            </div>
                        ) : (
                            filteredFeeds.map((feed) => {
                                const isValidating = validatingIds.has(feed.id)
                                const isExpanded = expandedRow === feed.id

                                // 🔥 Buscamos el color real del topic. Si no existe, usamos gris por defecto.
                                const topicInfo = systemTopics.find(t => t.slug === feed.topic)
                                const topicColor = topicInfo ? topicInfo.color : "#9CA3AF"

                                return (
                                    <div key={feed.id} className="border-b border-[rgba(255,255,255,0.06)] last:border-0 transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                                        <div className={`grid items-center gap-4 px-6 py-4 ${activeTab === 'ai' ? 'grid-cols-[1fr_80px_100px_90px_100px]' : 'grid-cols-[1fr_90px_100px_100px]'}`}>
                                            <div className="flex min-w-0 flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {activeTab === 'ai' ? <Bot className="size-4 text-[#A3A3A3]" /> : <Rss className="size-4 text-[#A3A3A3]" />}
                                                    <span className="truncate text-[15px] font-bold text-[#FAFAFA] tracking-tight">{feed.name}</span>
                                                    <span className="ml-2 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider" style={{ background: statusConfig[feed.status].bg, color: statusConfig[feed.status].color }}>
                                                        {statusConfig[feed.status].label}
                                                    </span>
                                                </div>
                                                <a href={feed.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[13px] text-[#A3A3A3] hover:text-[#BED600] font-medium transition-colors w-fit">
                                                    <span className="truncate">{feed.url}</span>
                                                    <ExternalLink className="size-3 shrink-0" />
                                                </a>
                                            </div>

                                            <div>
                                                {/* 🔥 Aplicamos el color dinámico al badge */}
                                                <span
                                                    className="inline-flex rounded-md px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider truncate max-w-[80px]"
                                                    style={{ background: `${topicColor}20`, color: topicColor, border: `1px solid ${topicColor}40` }}
                                                    title={topicInfo ? topicInfo.name : feed.topic}
                                                >
                                                    {feed.topic}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-center gap-1.5">
                                                <Star className="size-4" style={{ color: feed.avg_score && feed.avg_score >= 7 ? BRAND : "#6B7280" }} />
                                                <span className="text-sm font-extrabold text-[#FAFAFA]">{feed.avg_score ? feed.avg_score.toFixed(1) : "-"}</span>
                                            </div>

                                            {activeTab === 'ai' && (
                                                <div className="flex items-center justify-center">
                                                    <div className="relative group">
                                                        <select
                                                            value={Math.round(feed.score ?? 5)}
                                                            onChange={(e) => handleSaveScore(feed, Number(e.target.value))}
                                                            className="appearance-none bg-[rgba(168,85,247,0.1)] text-[#D8B4FE] border border-[rgba(168,85,247,0.2)] hover:border-[#D8B4FE] group-hover:bg-[rgba(168,85,247,0.2)] text-sm font-extrabold rounded-md pl-3 pr-7 py-1 outline-none cursor-pointer transition-colors"
                                                        >
                                                            {[...Array(11)].map((_, i) => (
                                                                <option key={i} value={i} className="bg-[#1A1A1A] text-[#FAFAFA]">{i}.0</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-[#D8B4FE] pointer-events-none" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleValidate(feed)} disabled={isValidating} className="flex size-8 items-center justify-center rounded-lg text-[#A3A3A3] hover:text-[#BED600] hover:bg-[rgba(190,214,0,0.15)] transition-all">
                                                    <RefreshCw className={`size-4 ${isValidating ? "animate-spin" : ""}`} />
                                                </button>
                                                <button onClick={() => handleDelete(feed)} className="flex size-8 items-center justify-center rounded-lg text-[#A3A3A3] hover:text-[#F87171] hover:bg-[rgba(239,68,68,0.15)] transition-all">
                                                    <Trash2 className="size-4" />
                                                </button>
                                                <button onClick={() => handleToggleExpand(feed)} className="flex size-8 items-center justify-center rounded-lg text-[#FAFAFA] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.15)] transition-all">
                                                    <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-[rgba(0,0,0,0.3)] border-t border-[rgba(255,255,255,0.06)] shadow-inner">
                                                    <div className="p-6 pl-14">
                                                        <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#A3A3A3] mb-4 flex items-center gap-2">
                                                            <FileText className="size-4" /> Ebaluatutako eta itzulitako azken 3 albisteak
                                                        </h4>
                                                        {isLoadingArticles === feed.id ? (
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-[#A3A3A3]">
                                                                <Loader2 className="size-4 animate-spin" /> Itzulpen bila..
                                                            </div>
                                                        ) : !rowArticles[feed.id] || rowArticles[feed.id].length === 0 ? (
                                                            <p className="text-sm font-semibold text-[#A3A3A3]">Ez dago itzulitako albisterik jasotako iturri honetik oraindik.</p>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                {rowArticles[feed.id].map(art => (
                                                                    <a key={art.id} href={art.url} target="_blank" rel="noreferrer" className="flex items-start justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] transition-colors border border-[rgba(255,255,255,0.05)] group">
                                                                        <span className="text-[14px] font-semibold text-[#E0E0E0] group-hover:text-[#FAFAFA] line-clamp-1 flex-1 pr-4">{art.title}</span>
                                                                        <div className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.08)] px-2.5 py-1 rounded-md text-xs font-extrabold text-[#E0E0E0] group-hover:bg-[#BED600] group-hover:text-black transition-colors">
                                                                            <Star className="size-3.5" /> {art.llm_score.toFixed(1)}
                                                                        </div>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}