"use client"

import { useState, useEffect, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Topic } from "@/lib/types"

const BRAND = "#BED600"

// Nuestra paleta maestra de 16 colores premium (Dark mode friendly)
const MASTER_COLORS = [
    "#EF4444", "#F97316", "#F59E0B", "#EAB308",
    "#84CC16", "#22C55E", "#10B981", "#14B8A6",
    "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1",
    "#8B5CF6", "#D946EF", "#EC4899", "#F43F5E"
]

interface CreateTopicDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (topic: Omit<Topic, "id" | "rubricMode">) => void
    existingTopics: Topic[] // <-- Requisito para saber qué colores están libres
}

export function CreateTopicDialog({
    open,
    onOpenChange,
    onSave,
    existingTopics = [], // Default por seguridad
}: CreateTopicDialogProps) {
    const [name, setName] = useState("")
    const [color, setColor] = useState("#BED600")
    const [keywords, setKeywords] = useState<string[]>([])
    const [keywordInput, setKeywordInput] = useState("")

    // === LÓGICA DE COLORES INTELIGENTE ===
    // 1. Extraer los colores que ya están en uso
    const usedColors = existingTopics.map(t => t.color.toUpperCase())

    // 2. Filtrar la paleta para sacar los usados
    const availableColors = MASTER_COLORS.filter(c => !usedColors.includes(c.toUpperCase()))

    // 3. Coger solo los 8 primeros libres
    const displayColors = availableColors.slice(0, 8)

    // 4. Validar si el color actual introducido a mano existe
    const isColorTaken = usedColors.includes(color.toUpperCase())

    // Resetea el formulario al abrir el modal y auto-selecciona un color libre
    useEffect(() => {
        if (open) {
            setName("")
            setKeywords([])
            setKeywordInput("")
            // Si hay colores libres, coge el primero. Si no, usa el BRAND por defecto.
            setColor(availableColors.length > 0 ? availableColors[0] : BRAND)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    function handleAddKeyword(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" && keywordInput.trim()) {
            e.preventDefault()
            if (!keywords.includes(keywordInput.trim())) {
                setKeywords([...keywords, keywordInput.trim()])
            }
            setKeywordInput("")
        }
    }

    function handleRemoveKeyword(kw: string) {
        setKeywords(keywords.filter((k) => k !== kw))
    }

    function handleSave() {
        // Bloqueo doble: ni nombre vacío ni color repetido
        if (!name.trim() || isColorTaken) return
        onSave({ name: name.trim(), color, keywords })
        onOpenChange(false)
    }

    function handleCancel() {
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="border-0 sm:max-w-md"
                style={{
                    background: "#141414",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <DialogHeader>
                    <DialogTitle
                        className="text-xl font-bold tracking-tight"
                        style={{ color: "#FAFAFA" }}
                    >
                        Create Topic
                    </DialogTitle>
                    <DialogDescription style={{ color: "rgba(255,255,255,0.4)" }}>
                        Add a new topic to your OSINT Tech Watch system.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5 py-4">
                    {/* Topic Name */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs font-medium uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            htmlFor="topic-name"
                        >
                            Topic Name
                        </label>
                        <input
                            id="topic-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Cybersecurity"
                            className="rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)] focus:ring-2"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "#FAFAFA",
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = `${BRAND}60`
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}20`
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                                e.currentTarget.style.boxShadow = "none"
                            }}
                        />
                    </div>

                    {/* Theme Color */}
                    <div className="flex flex-col gap-3">
                        <label
                            className="text-xs font-medium uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            htmlFor="topic-color"
                        >
                            Theme Color
                        </label>

                        <div className="flex items-center gap-3">
                            {/* Cuadrado de previsualización convertido en Botón de Color Nativo */}
                            <div
                                className="relative size-10 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
                                style={{
                                    background: color,
                                    boxShadow: `0 0 12px ${color}40`,
                                    border: "1px solid rgba(255,255,255,0.1)",
                                }}
                            >
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    title="Choose a custom color"
                                />
                            </div>

                            {/* Input de texto con validación visual */}
                            <div className="flex-1 relative">
                                <input
                                    id="topic-color"
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    placeholder="#BED600"
                                    className="w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all placeholder:text-[rgba(255,255,255,0.2)]"
                                    style={{
                                        background: "rgba(255,255,255,0.04)",
                                        border: `1px solid ${isColorTaken ? "#EF4444" : "rgba(255,255,255,0.08)"}`,
                                        color: isColorTaken ? "#EF4444" : "#FAFAFA",
                                    }}
                                    onFocus={(e) => {
                                        if (!isColorTaken) {
                                            e.currentTarget.style.borderColor = `${BRAND}60`
                                            e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}20`
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!isColorTaken) {
                                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                                            e.currentTarget.style.boxShadow = "none"
                                        }
                                    }}
                                />
                                {isColorTaken && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-red-500">
                                        In Use!
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Paleta Dinámica de Colores Libres */}
                        <div className="flex flex-wrap gap-2 mt-1">
                            {displayColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    onClick={() => setColor(presetColor)}
                                    className="size-6 rounded-full border-2 transition-transform hover:scale-125 focus:outline-none"
                                    style={{
                                        backgroundColor: presetColor,
                                        borderColor: color.toUpperCase() === presetColor ? "rgba(255,255,255,0.9)" : "transparent"
                                    }}
                                    title={presetColor}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Keywords */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-xs font-medium uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.4)" }}
                            htmlFor="keyword-input"
                        >
                            Keywords
                        </label>
                        <div
                            className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2.5"
                            style={{
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                minHeight: "48px",
                            }}
                        >
                            {keywords.map((kw) => (
                                <span
                                    key={kw}
                                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                                    style={{
                                        background: `${color}15`,
                                        border: `1px solid ${color}30`,
                                        color: color,
                                    }}
                                >
                                    {kw}
                                    <button
                                        onClick={() => handleRemoveKeyword(kw)}
                                        className="rounded-full p-0.5 transition-colors hover:bg-[rgba(255,255,255,0.1)]"
                                        aria-label={`Remove keyword ${kw}`}
                                    >
                                        <X className="size-3" />
                                    </button>
                                </span>
                            ))}
                            <input
                                id="keyword-input"
                                type="text"
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={handleAddKeyword}
                                placeholder={
                                    keywords.length === 0 ? "Type and press Enter..." : ""
                                }
                                className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[rgba(255,255,255,0.2)]"
                                style={{ color: "#FAFAFA" }}
                            />
                        </div>
                        <span
                            className="text-xs"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                            Press Enter to add a keyword
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={handleCancel}
                        className="rounded-xl border-0 font-medium"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.6)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)"
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)"
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!name.trim() || isColorTaken}
                        className="rounded-xl border-0 font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                            background: (!name.trim() || isColorTaken) ? "rgba(255,255,255,0.1)" : BRAND,
                            color: (!name.trim() || isColorTaken) ? "rgba(255,255,255,0.3)" : "#0A0A0A",
                        }}
                        onMouseEnter={(e) => {
                            if (name.trim() && !isColorTaken) {
                                e.currentTarget.style.background = "#D4EC00"
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (name.trim() && !isColorTaken) {
                                e.currentTarget.style.background = BRAND
                            }
                        }}
                    >
                        Save Topic
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}