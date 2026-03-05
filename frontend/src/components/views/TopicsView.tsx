"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TopicCard } from "@/components/views/topics/topic-card"
import { CreateTopicDialog } from "@/components/views/topics/create-topic-dialog"
import { EditRubricSheet } from "@/components/views/topics/edit-rubric-sheet"
import { EmptyState } from "@/components/views/topics/empty-state"

export interface Topic {
    id: string
    name: string
    color: string
    keywords: string[]
    rubricMode: "dynamic" | "custom"
    customRubric?: {
        tier1: string
        tier2: string
        tier3: string
        tier4: string
        penalties: string
    }
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

interface TopicsViewProps {
    onNavigate?: (view: any) => void
}

export function TopicsView({ onNavigate }: TopicsViewProps) {
    const [topics, setTopics] = useState<Topic[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [createOpen, setCreateOpen] = useState(false)
    const [rubricTopic, setRubricTopic] = useState<Topic | null>(null)
    const [rubricOpen, setRubricOpen] = useState(false)

    const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

    // 1. CARGAR LOS TOPICS AL INICIAR
    useEffect(() => {
        fetchTopics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 1. CARGAR LOS TOPICS
    async function fetchTopics() {
        try {
            setIsLoading(true)
            const response = await fetch(`${MOD1_API_URL}/api/topics`)
            if (response.ok) {
                const data = await response.json()

                // 🔥 LA MAGIA ESTÁ AQUÍ 🔥
                // Si el JSON trae la clave "topics", sacamos lo de dentro. Si no, usamos data tal cual.
                const realTopicsData = data.topics ? data.topics : data;

                const topicsArray = Object.entries(realTopicsData).map(([slug, info]: [string, any]) => ({
                    id: slug,
                    name: info.name || slug,
                    color: info.color || "#BED600",
                    keywords: info.keywords || [],
                    rubricMode: info.rubricMode || "dynamic",
                    customRubric: info.customRubric || undefined,
                }))
                setTopics(topicsArray)
            }
        } catch (error) {
            console.error("Error fetching topics:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // 2. CREAR UN TOPIC NUEVO EN EL YAML
    async function handleCreateTopic(data: Omit<Topic, "id" | "rubricMode">) {
        // Generamos un slug seguro (ej. "Machine Learning" -> "machine_learning")
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '')

        try {
            const response = await fetch(`${MOD1_API_URL}/api/topics/${slug}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Enviamos los datos planos tal cual espera Pydantic (TopicInput)
                body: JSON.stringify({
                    name: data.name,
                    color: data.color,
                    keywords: data.keywords
                }),
            })

            if (response.ok) {
                const newTopic: Topic = { ...data, id: slug, rubricMode: "dynamic" }
                setTopics([...topics, newTopic])
                setCreateOpen(false)
            } else {
                alert("Error al guardar el topic en el servidor.")
            }
        } catch (error) {
            console.error("Error creating topic:", error)
        }
    }

    // 3. BORRAR UN TOPIC
    async function handleDeleteTopic(id: string) {
        if (!confirm("¿Seguro que quieres borrar este topic y dejar de buscar noticias sobre él?")) return

        try {
            const response = await fetch(`${MOD1_API_URL}/api/topics/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                setTopics(topics.filter((t) => t.id !== id))
            }
        } catch (error) {
            console.error("Error deleting topic:", error)
        }
    }

    // 4. ACTUALIZAR KEYWORDS INLINE (Desde la Tarjeta)
    async function handleUpdateKeywords(id: string, newKeywords: string[]) {
        const topicToUpdate = topics.find(t => t.id === id)
        if (!topicToUpdate) return

        // Actualización optimista en React
        setTopics(topics.map((t) => t.id === id ? { ...t, keywords: newKeywords } : t))

        try {
            await fetch(`${MOD1_API_URL}/api/topics/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: topicToUpdate.name,
                    color: topicToUpdate.color,
                    keywords: newKeywords
                }),
            })
        } catch (error) {
            console.error("Error updating keywords:", error)
        }
    }

    // 5. ABRIR EL EDITOR DE RÚBRICAS
    function handleEditRubric(topic: Topic) {
        setRubricTopic(topic)
        setRubricOpen(true)
    }

    // 6. GUARDAR ESTADO DE LA RÚBRICA (Solo actualiza UI, el backend lo maneja el Sheet)
    function handleSaveRubric(topicId: string, rubricMode: Topic["rubricMode"], customRubric?: Topic["customRubric"]) {
        setTopics(
            topics.map((t) =>
                t.id === topicId ? { ...t, rubricMode, customRubric } : t
            )
        )
    }

    return (
        <div
            className="flex flex-1 flex-col overflow-y-auto"
            style={{ background: "#0A0A0A" }}
        >
            {/* Breadcrumb */}
            <nav
                className="flex h-14 shrink-0 items-center gap-3 px-8 lg:px-16"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
                <button
                    onClick={() => onNavigate && onNavigate("home")}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
                    }
                >
                    Home
                </button>
                <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                >
                    /
                </span>
                <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
                    Topics Management
                </span>
            </nav>

            {/* Main Content Area */}
            <main className="flex flex-1 flex-col px-6 pt-10 pb-20 lg:pt-14 lg:px-16">

                {/* Header */}
                <motion.div custom={0} variants={fadeSlideUp} initial="hidden" animate="visible" className="mb-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <div className="mb-4 flex items-center gap-3">
                            <div
                                className="flex size-10 items-center justify-center rounded-xl"
                                style={{ background: `${BRAND}15` }}
                            >
                                <Settings2 className="size-5" style={{ color: BRAND }} />
                            </div>
                            <div
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                                style={{
                                    background: `${BRAND}12`,
                                    border: `1px solid ${BRAND}25`,
                                }}
                            >
                                <div
                                    className="size-1.5 rounded-full"
                                    style={{ background: BRAND }}
                                />
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-widest"
                                    style={{ color: BRAND }}
                                >
                                    System Config
                                </span>
                            </div>
                        </div>

                        <h1
                            className="text-3xl font-bold tracking-tight sm:text-4xl"
                            style={{ color: "#FAFAFA" }}
                        >
                            Topics <span style={{ color: BRAND }}>Management</span>
                        </h1>
                        <p
                            className="mt-2 text-base leading-relaxed max-w-xl"
                            style={{ color: "rgba(255,255,255,0.45)" }}
                        >
                            Manage your AI-curated topics, keywords, and evaluation rubrics.
                        </p>
                    </div>

                    {/* Action Button */}
                    <Button
                        onClick={() => setCreateOpen(true)}
                        className="gap-2 rounded-xl border-0 px-6 py-3 font-semibold h-11 shrink-0 shadow-lg"
                        style={{
                            background: BRAND,
                            color: "#0A0A0A",
                            boxShadow: `0 0 20px ${BRAND}25`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#D4EC00"
                            e.currentTarget.style.boxShadow = `0 0 30px ${BRAND}40`
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = BRAND
                            e.currentTarget.style.boxShadow = `0 0 20px ${BRAND}25`
                        }}
                    >
                        <Plus className="size-4" />
                        Create Topic
                    </Button>
                </motion.div>

                {/* Topics Grid */}
                <section className="w-full max-w-6xl mx-auto">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <div className="size-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${BRAND}40`, borderTopColor: BRAND }} />
                        </div>
                    ) : topics.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence>
                                {topics.map((topic) => (
                                    <motion.div
                                        key={topic.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    >
                                        <TopicCard
                                            topic={topic}
                                            onEditRubric={handleEditRubric}
                                            onDelete={handleDeleteTopic}
                                            onUpdateKeywords={handleUpdateKeywords}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </section>
            </main>

            {/* Dialogs */}
            <CreateTopicDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSave={handleCreateTopic}
                existingTopics={topics}
            />

            <EditRubricSheet
                open={rubricOpen}
                onOpenChange={setRubricOpen}
                topic={rubricTopic}
                onSave={handleSaveRubric}
            />
        </div>
    )
}