"use client"

import { useState, useEffect, useRef } from "react"
import { Brain, Bot, Trash2, Loader2, Upload } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { Topic } from "@/lib/types"

const BRAND = "#BED600"
// Usamos la variable de entorno o localhost por defecto
const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

interface EditRubricSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    topic: Topic | null
    onSave: (topicId: string, rubricMode: Topic["rubricMode"], customRubric?: Topic["customRubric"]) => void
}

const tiers = [
    {
        key: "tier1" as const,
        label: "Tier 1: Critical & Official",
        score: "Score 9.0 - 10.0",
        placeholder: "e.g., Official vendor security advisories, CVE disclosures from NIST...",
    },
    {
        key: "tier2" as const,
        label: "Tier 2: Senior Engineering & Production",
        score: "Score 7.0 - 8.9",
        placeholder: "e.g., In-depth technical blogs from recognized experts...",
    },
    {
        key: "tier3" as const,
        label: "Tier 3: Mid-Level & Standard",
        score: "Score 4.0 - 6.9",
        placeholder: "e.g., General tech news articles, basic tutorials...",
    },
    {
        key: "tier4" as const,
        label: "Tier 4: Junk & Clickbait",
        score: "Score 0.0 - 3.9",
        placeholder: "e.g., Clickbait articles, rehashed press releases...",
    },
]

export function EditRubricSheet({
    open,
    onOpenChange,
    topic,
    onSave,
}: EditRubricSheetProps) {
    const [isCustom, setIsCustom] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null) // 🔥 Referencia para el input de archivo

    const [rubric, setRubric] = useState({
        tier1: "",
        tier2: "",
        tier3: "",
        tier4: "",
        penalties: "",
    })

    useEffect(() => {
        if (topic) {
            setIsCustom(topic.rubricMode === "custom")
            if (topic.customRubric) {
                setRubric(topic.customRubric)
            } else {
                setRubric({ tier1: "", tier2: "", tier3: "", tier4: "", penalties: "" })
            }
        }
    }, [topic])

    if (!topic) return null

    // 1. GUARDAR LA RÚBRICA PERSONALIZADA (Genera el .md)
    async function handleSaveCustom() {
        if (!topic) return
        setIsSaving(true)
        try {
            // Preparamos el payload exacto que espera Pydantic en FastAPI
            const payload = {
                tier1_critical: rubric.tier1,
                tier2_senior: rubric.tier2,
                tier3_mid: rubric.tier3,
                tier4_junk: rubric.tier4,
                // Convertimos el texto de penalizaciones en un array separando por saltos de línea
                penalties: rubric.penalties.split('\n').filter(p => p.trim() !== '')
            }

            const response = await fetch(`${MOD1_API_URL}/api/topics/${topic.id}/skill/form`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!response.ok) throw new Error("Fallo al guardar en la API")

            // Actualizamos el estado padre (TopicsView)
            onSave(topic.id, "custom", rubric)
            onOpenChange(false)
        } catch (error) {
            console.error("Error saving custom rubric:", error)
            alert("Hubo un error al guardar la rúbrica en el servidor.")
        } finally {
            setIsSaving(false)
        }
    }

    // 🔥 2. SUBIR ARCHIVO .MD DIRECTAMENTE 🔥
    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !topic) return

        if (!file.name.endsWith('.md')) {
            alert("Por favor, sube solo archivos Markdown (.md)")
            return
        }

        const reader = new FileReader()
        reader.onload = async (event) => {
            const content = event.target?.result as string
            setIsSaving(true)

            try {
                // Enviamos el texto directamente al nuevo endpoint de FastAPI
                const response = await fetch(`${MOD1_API_URL}/api/topics/${topic.id}/skill/upload`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content })
                })

                if (!response.ok) throw new Error("Fallo al subir el archivo")

                // Le decimos a React que ahora es Custom
                onSave(topic.id, "custom", topic.customRubric)
                onOpenChange(false)

                // Recargamos la página para que TopicsView lea el nuevo .md y extraiga los textos auto-mágicamente
                window.location.reload()

            } catch (error) {
                console.error("Error al subir archivo:", error)
                alert("Hubo un error al subir el archivo.")
            } finally {
                setIsSaving(false)
            }
        }
        reader.readAsText(file)
    }

    // 3. BORRAR LA RÚBRICA Y VOLVER AL MODO DINÁMICO (Elimina el .md)
    async function handleRevertToDynamic() {
        if (!topic) return
        setIsSaving(true)
        try {
            const response = await fetch(`${MOD1_API_URL}/api/topics/${topic.id}/skill`, {
                method: "DELETE"
            })

            if (!response.ok) throw new Error("Fallo al borrar en la API")

            // Limpiamos los estados
            setIsCustom(false)
            setRubric({ tier1: "", tier2: "", tier3: "", tier4: "", penalties: "" })
            // Actualizamos el estado padre
            onSave(topic.id, "dynamic", undefined)
            onOpenChange(false)
        } catch (error) {
            console.error("Error deleting rubric:", error)
            alert("Hubo un error al borrar la rúbrica del servidor.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full overflow-y-auto border-0 sm:max-w-lg"
                style={{
                    background: "#111111",
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                <SheetHeader className="px-6 pt-6 pb-0">
                    <SheetTitle
                        className="text-xl font-bold tracking-tight"
                        style={{ color: "#FAFAFA" }}
                    >
                        AI Evaluation Rubric
                    </SheetTitle>
                    <SheetDescription style={{ color: "rgba(255,255,255,0.4)" }}>
                        {"for "}
                        <span style={{ color: topic.color, fontWeight: 600 }}>
                            {topic.name}
                        </span>
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-6 py-6">
                    {/* Status Banner */}
                    <div
                        className="flex items-start gap-3 rounded-xl p-4 transition-colors duration-300"
                        style={{
                            background: isCustom ? "rgba(255,255,255,0.04)" : `${BRAND}10`,
                            border: isCustom ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${BRAND}25`,
                        }}
                    >
                        <div
                            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                            style={{
                                background: isCustom ? "rgba(255,255,255,0.06)" : `${BRAND}20`,
                            }}
                        >
                            {isCustom ? (
                                <Brain className="size-4" style={{ color: "rgba(255,255,255,0.6)" }} />
                            ) : (
                                <Bot className="size-4" style={{ color: BRAND }} />
                            )}
                        </div>
                        <div className="flex-1">
                            <p
                                className="text-sm font-medium"
                                style={{ color: isCustom ? "rgba(255,255,255,0.7)" : BRAND }}
                            >
                                {isCustom ? "Custom Mode Active" : "Dynamic AI Mode Active"}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {isCustom
                                    ? "You are defining custom grading rules for the AI evaluator."
                                    : "The AI is generating rules automatically based on your keywords."}
                            </p>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                    >
                        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
                            Custom Rubric Mode
                        </span>
                        <Switch
                            checked={isCustom}
                            onCheckedChange={setIsCustom}
                        />
                    </div>

                    {/* 🔥 NUEVA SECCIÓN DE UPLOAD 🔥 */}
                    <div
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px dashed rgba(255,255,255,0.15)",
                        }}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Upload .md File</span>
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Directly inject your prompt file.</span>
                        </div>
                        {/* Input de archivo oculto */}
                        <input
                            type="file"
                            accept=".md"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isSaving}
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 gap-2 rounded-lg border-0 transition-colors"
                            style={{
                                background: "rgba(255,255,255,0.05)",
                                color: "#FAFAFA"
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
                        >
                            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                            Upload
                        </Button>
                    </div>

                    {/* Custom Rubric Form */}
                    {isCustom && (
                        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300">
                            {tiers.map((tier) => (
                                <div key={tier.key} className="flex flex-col gap-2">
                                    <div className="flex items-baseline justify-between">
                                        <label
                                            className="text-xs font-medium uppercase tracking-widest"
                                            style={{ color: "rgba(255,255,255,0.4)" }}
                                            htmlFor={`rubric-${tier.key}`}
                                        >
                                            {tier.label}
                                        </label>
                                        <span className="font-mono text-xs" style={{ color: `${BRAND}90` }}>
                                            {tier.score}
                                        </span>
                                    </div>
                                    <textarea
                                        id={`rubric-${tier.key}`}
                                        value={rubric[tier.key]}
                                        onChange={(e) =>
                                            setRubric({ ...rubric, [tier.key]: e.target.value })
                                        }
                                        placeholder={tier.placeholder}
                                        rows={3}
                                        className="resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-[rgba(255,255,255,0.15)]"
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
                            ))}

                            {/* Penalties */}
                            <div className="flex flex-col gap-2">
                                <label
                                    className="text-xs font-medium uppercase tracking-widest"
                                    style={{ color: "rgba(255,255,255,0.4)" }}
                                    htmlFor="rubric-penalties"
                                >
                                    Penalties
                                </label>
                                <textarea
                                    id="rubric-penalties"
                                    value={rubric.penalties}
                                    onChange={(e) =>
                                        setRubric({ ...rubric, penalties: e.target.value })
                                    }
                                    placeholder="e.g., Subtract 2 points if the article is behind a paywall... (One per line)"
                                    rows={3}
                                    className="resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-[rgba(255,255,255,0.15)]"
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
                        </div>
                    )}
                </div>

                <SheetFooter className="flex-col gap-3 border-0 px-6 pb-6">
                    {isCustom && (
                        <>
                            <Button
                                onClick={handleSaveCustom}
                                disabled={isSaving}
                                className="w-full rounded-xl border-0 font-semibold disabled:opacity-50"
                                style={{
                                    background: BRAND,
                                    color: "#0A0A0A",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSaving) e.currentTarget.style.background = "#D4EC00"
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSaving) e.currentTarget.style.background = BRAND
                                }}
                            >
                                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                                Save Custom Rubric
                            </Button>
                            <Button
                                onClick={handleRevertToDynamic}
                                disabled={isSaving}
                                className="w-full gap-2 rounded-xl border-0 font-medium disabled:opacity-50"
                                style={{
                                    background: "rgba(239,68,68,0.1)",
                                    color: "#EF4444",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSaving) e.currentTarget.style.background = "rgba(239,68,68,0.2)"
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSaving) e.currentTarget.style.background = "rgba(239,68,68,0.1)"
                                }}
                            >
                                {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                Delete Custom Rules & Revert
                            </Button>
                        </>
                    )}
                    {!isCustom && (
                        <div
                            className="rounded-xl px-4 py-3 text-center text-sm"
                            style={{
                                background: `${BRAND}08`,
                                border: `1px solid ${BRAND}15`,
                                color: "rgba(255,255,255,0.4)",
                            }}
                        >
                            Dynamic AI mode is active. Toggle Custom Rubric Mode above to define your own rules.
                        </div>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}