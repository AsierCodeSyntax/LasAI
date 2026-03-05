"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { Sparkles, Trash2, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Topic } from "@/lib/types"

interface TopicCardProps {
    topic: Topic
    onEditRubric: (topic: Topic) => void
    onDelete: (id: string) => void
    onUpdateKeywords?: (id: string, newKeywords: string[]) => void
}

export function TopicCard({
    topic,
    onEditRubric,
    onDelete,
    onUpdateKeywords,
}: TopicCardProps) {
    const isCustom = topic.rubricMode === "custom"

    const [isAddingKw, setIsAddingKw] = useState(false)
    const [newKw, setNewKw] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isAddingKw) {
            inputRef.current?.focus()
        }
    }, [isAddingKw])

    function handleRemoveKeyword(kwToRemove: string) {
        if (!onUpdateKeywords) return
        const updated = topic.keywords.filter((k) => k !== kwToRemove)
        onUpdateKeywords(topic.id, updated)
    }

    function handleAddKeyword() {
        const kw = newKw.trim()
        if (kw && !topic.keywords.includes(kw) && onUpdateKeywords) {
            onUpdateKeywords(topic.id, [...topic.keywords, kw])
        }
        setNewKw("")
        setIsAddingKw(false)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAddKeyword()
        } else if (e.key === "Escape") {
            setNewKw("")
            setIsAddingKw(false)
        }
    }

    return (
        <div
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            style={{
                // Fondo base: Color del topic al 5% de opacidad (aprox hex '0D') + borde sutil del mismo color
                background: `${topic.color}0D`,
                border: `1px solid ${topic.color}20`,
                boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.05)`,
            }}
            onMouseEnter={(e) => {
                // Al hacer hover: Subimos el fondo al 10% ('1A') y el borde al 40%
                e.currentTarget.style.background = `${topic.color}1A`
                e.currentTarget.style.borderColor = `${topic.color}40`
                e.currentTarget.style.boxShadow = `0 10px 40px -10px ${topic.color}25, inset 0 1px 0 0 rgba(255,255,255,0.05)`
            }}
            onMouseLeave={(e) => {
                // Restauramos el estado base
                e.currentTarget.style.background = `${topic.color}0D`
                e.currentTarget.style.borderColor = `${topic.color}20`
                e.currentTarget.style.boxShadow = `inset 0 1px 0 0 rgba(255,255,255,0.05)`
            }}
        >
            {/* Glow de fondo agresivo en la esquina */}
            <div
                className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-[70px] transition-opacity duration-500 group-hover:opacity-40"
                style={{
                    background: topic.color,
                    opacity: 0.20,
                }}
            />

            <div className="relative z-10 flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div
                        className="size-3 shrink-0 rounded-full shadow-sm"
                        style={{
                            background: topic.color,
                            boxShadow: `0 0 12px ${topic.color}`,
                        }}
                    />
                    <h3
                        className="truncate text-lg font-bold tracking-tight"
                        style={{ color: "#FAFAFA" }}
                        title={topic.name}
                    >
                        {topic.name}
                    </h3>
                </div>

                {/* Keywords (Edición Inline) */}
                <div className="flex flex-col gap-2.5">
                    <span
                        className="text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: "rgba(255,255,255,0.4)" }} // Ligero aumento de contraste
                    >
                        Keywords
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                        {/* Píldoras existentes con X animada */}
                        {topic.keywords.map((kw) => (
                            <span
                                key={kw}
                                className="group/pill flex cursor-default items-center rounded-full px-2.5 py-1 text-xs transition-all duration-200 hover:pr-1.5"
                                style={{
                                    // Las píldoras las hacemos un poco más opacas para que resalten sobre el nuevo fondo
                                    background: `${topic.color}25`,
                                    border: `1px solid ${topic.color}50`,
                                    color: "#FAFAFA", // Texto en blanco para máxima legibilidad
                                }}
                            >
                                <span className="font-medium opacity-90">{kw}</span>
                                <button
                                    onClick={() => handleRemoveKeyword(kw)}
                                    className="ml-1 flex h-3.5 w-0 items-center justify-center overflow-hidden rounded-full opacity-0 transition-all duration-200 group-hover/pill:w-3.5 group-hover/pill:opacity-100 hover:bg-white/20"
                                    aria-label={`Remove ${kw}`}
                                >
                                    <X className="size-2.5" />
                                </button>
                            </span>
                        ))}

                        {/* Botón (+) o Mini-Input para añadir */}
                        {isAddingKw ? (
                            <div
                                className="flex items-center rounded-full px-2 py-0.5 shadow-inner"
                                style={{
                                    background: "rgba(0,0,0,0.3)", // Fondo oscuro para el input
                                    border: `1px solid ${topic.color}60`,
                                }}
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newKw}
                                    onChange={(e) => setNewKw(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    onBlur={handleAddKeyword} // Si pincha fuera, se guarda automáticamente
                                    className="w-20 bg-transparent text-xs outline-none"
                                    style={{ color: "#FAFAFA" }}
                                    placeholder="Type..."
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingKw(true)}
                                className="flex size-6 items-center justify-center rounded-full transition-colors hover:scale-110"
                                style={{
                                    background: `${topic.color}15`,
                                    border: `1px dashed ${topic.color}50`,
                                    color: topic.color,
                                }}
                                title="Add keyword"
                            >
                                <Plus className="size-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Acciones */}
            <div className="relative z-10 mt-6 flex items-center gap-3">
                <Button
                    onClick={() => onEditRubric(topic)}
                    variant="outline"
                    className="h-10 flex-1 gap-2 rounded-xl border-0 font-medium transition-all"
                    style={{
                        // Botón primario de la tarjeta un poco más sólido
                        background: isCustom ? `${topic.color}30` : "rgba(255,255,255,0.06)",
                        color: isCustom ? "#FAFAFA" : "rgba(255,255,255,0.8)",
                        border: `1px solid ${isCustom ? `${topic.color}50` : "rgba(255,255,255,0.1)"}`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = isCustom ? `${topic.color}40` : "rgba(255,255,255,0.12)"
                        e.currentTarget.style.color = "#FAFAFA"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = isCustom ? `${topic.color}30` : "rgba(255,255,255,0.06)"
                        e.currentTarget.style.color = isCustom ? "#FAFAFA" : "rgba(255,255,255,0.8)"
                    }}
                >
                    <Sparkles className="size-4" style={{ color: isCustom ? topic.color : "currentColor" }} />
                    Edit AI Rubric
                </Button>

                <Button
                    onClick={() => onDelete(topic.id)}
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl transition-colors hover:bg-red-500/20 hover:text-red-400"
                    style={{
                        background: "rgba(0,0,0,0.2)", // Botón de papelera oscuro
                        color: "rgba(255,255,255,0.5)"
                    }}
                    title="Delete topic"
                >
                    <Trash2 className="size-4" />
                </Button>
            </div>
        </div>
    )
}