"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Lock,
    Unlock,
    Sparkles,
    Send,
    FileText,
    RefreshCw,
    CheckCircle2,
    Zap
} from "lucide-react"

// Colores del tema CodeSyntax
const colors = {
    background: "#0A0A0A",
    primary: "#BED600",
    textPrimary: "#FAFAFA",
    textSecondary: "rgba(255,255,255,0.5)",
    cardBorder: "rgba(255,255,255,0.08)",
    blue: "#60A5FA",
}

// Texto por defecto generado por la IA
const AI_DRAFT = `2026ko Otsaileko Txostena - AI Zirriborroa

Laburpen Exekutiboa:
Hilabete honetan errendimendu sendoa izan dugu, %58ko produktibitatearekin (%70eko helburuaren azpitik pixka bat). Lantaldeak 2.961 ordu erregistratu ditu proiektu guztietan eta 90 Kanban ataza itxi dira.

Fakturazioa eta Proiektuak:
- Hileko fakturazioa 41.7K EUR-ra iritsi da.
- Tokikom proiektua izan da ordu gehien erregistratu dituena (245h).
- Tagzania barne-proiektuak espero baino denbora gehiago hartu du (198h).

Zirriborro hau AI Copilot-ek sortu du eta giza-berrikuspena behar du bidali aurretik.`

type Phase = "waiting" | "unlocked" | "animating" | "ready"

// ==========================================
// GENERADOR DE MALLA NEURONAL (50+ Nodos)
// ==========================================
const NEURAL_NODES: Array<{ id: string, x: number, y: number, layer: number }> = []
const NEURAL_LINKS: Array<{ id: string, x1: number, y1: number, x2: number, y2: number, layer: number }> = []

const centerX = 250, centerY = 250
let prevLayer = [{ x: centerX, y: centerY, layer: 0 }]

// Capas de la red: 8 nodos (cerca), 16 nodos (medio), 24 nodos (lejos)
const layers = [
    { count: 8, radius: 60 },
    { count: 16, radius: 130 },
    { count: 24, radius: 210 }
]

layers.forEach((l, layerIdx) => {
    const currentLayer: Array<{ x: number, y: number, layer: number }> = []
    for (let i = 0; i < l.count; i++) {
        // Distribuimos en círculo con un pequeño desfase orgánico
        const angle = (i / l.count) * Math.PI * 2 + (layerIdx * 0.2)
        const x = centerX + Math.cos(angle) * l.radius
        const y = centerY + Math.sin(angle) * l.radius
        const node = { id: `n-${layerIdx}-${i}`, x, y, layer: layerIdx + 1 }

        NEURAL_NODES.push(node)
        currentLayer.push(node)

        // Conectar con la capa anterior (radiales)
        const parentIdx = Math.floor((i / l.count) * prevLayer.length)
        NEURAL_LINKS.push({
            id: `l-rad-${layerIdx}-${i}`,
            x1: prevLayer[parentIdx].x, y1: prevLayer[parentIdx].y,
            x2: x, y2: y,
            layer: layerIdx + 1
        })

        // Conectar con el nodo vecino de la misma capa (malla horizontal)
        if (i > 0) {
            NEURAL_LINKS.push({
                id: `l-horiz-${layerIdx}-${i}`,
                x1: currentLayer[i - 1].x, y1: currentLayer[i - 1].y,
                x2: x, y2: y,
                layer: layerIdx + 1
            })
        }
    }
    // Cerrar el círculo horizontal de la capa
    NEURAL_LINKS.push({
        id: `l-close-${layerIdx}`,
        x1: currentLayer[l.count - 1].x, y1: currentLayer[l.count - 1].y,
        x2: currentLayer[0].x, y2: currentLayer[0].y,
        layer: layerIdx + 1
    })
    prevLayer = currentLayer
})
// ==========================================


export function M2_MonthClose() {
    const [phase, setPhase] = useState<Phase>("waiting")
    const [draftText, setDraftText] = useState(AI_DRAFT)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const [timeLeft, setTimeLeft] = useState({ days: 12, hours: 16, minutes: 45 })

    useEffect(() => {
        if (phase !== "waiting") return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1 }
                return { ...prev, hours: prev.hours - 1, minutes: 59 }
            })
        }, 60000)
        return () => clearInterval(timer)
    }, [phase])

    const handleSkipWait = () => {
        setPhase("unlocked")
    }

    const handleViewBulletin = () => {
        setPhase("animating")
        // Animación de red neuronal (3.5 segundos)
        setTimeout(() => {
            setPhase("ready")
        }, 3500)
    }

    const handleRegenerate = () => {
        setIsRegenerating(true)
        setTimeout(() => {
            setDraftText(AI_DRAFT.replace("%58ko", "%62ko").replace("41.7K", "43.2K"))
            setIsRegenerating(false)
        }, 1500)
    }

    const appleEase = [0.22, 1, 0.36, 1]

    // Reveal limpio, sin sombras raras
    const cleanRevealVariants = {
        hidden: { opacity: 0, scale: 0.98, y: 10 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 1, ease: appleEase }
        }
    }

    return (
        <div
            style={{ backgroundColor: colors.background }}
            className="flex-1 h-screen overflow-y-auto custom-scrollbar text-white w-full relative"
        >
            <AnimatePresence mode="wait">

                {/* FASE 1 & 2: ESPERA Y DESBLOQUEO */}
                {(phase === "waiting" || phase === "unlocked") && (
                    <motion.div
                        key="waiting-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                        transition={{ duration: 0.8, ease: appleEase }}
                        className="min-h-full flex items-center justify-center p-8"
                    >
                        <div
                            className="max-w-xl w-full p-10 rounded-3xl relative overflow-hidden flex flex-col items-center text-center"
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                boxShadow: phase === "unlocked" ? `0 0 80px ${colors.primary}15` : "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                                backdropFilter: "blur(20px)"
                            }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[80px] opacity-20 pointer-events-none transition-colors duration-1000"
                                style={{ background: phase === "unlocked" ? colors.primary : colors.blue }}
                            />

                            <motion.div
                                animate={phase === "waiting" ? {} : { scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.8, ease: appleEase }}
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative z-10"
                                style={{
                                    background: phase === "unlocked" ? `${colors.primary}15` : "rgba(255,255,255,0.03)",
                                    border: `1px solid ${phase === "unlocked" ? `${colors.primary}40` : "rgba(255,255,255,0.06)"}`
                                }}
                            >
                                {phase === "waiting" ? (
                                    <Lock size={32} className="text-white/40" />
                                ) : (
                                    <Unlock size={32} style={{ color: colors.primary }} />
                                )}
                            </motion.div>

                            <h2 className="text-2xl font-bold mb-3 text-[#FAFAFA]">
                                {phase === "waiting" ? "Datuak biltzen eta aztertzen..." : "Txostena Prest Dago"}
                            </h2>
                            <p className="text-white/50 mb-8 leading-relaxed">
                                {phase === "waiting"
                                    ? "Sistemak hilabete honetako KPI-ak eta Kanban errendimendua prozesatzen ari da behin betiko txostena sortzeko."
                                    : "AI-ak hilabeteko datu guztiak prozesatu ditu. Zirriborroa prest dago zure berrikuspenerako."}
                            </p>

                            {phase === "waiting" && (
                                <div className="flex gap-4 mb-8">
                                    {[
                                        { label: "Egun", value: timeLeft.days },
                                        { label: "Ordu", value: timeLeft.hours },
                                        { label: "Minutu", value: timeLeft.minutes }
                                    ].map((unit, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold font-mono" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                                {unit.value.toString().padStart(2, "0")}
                                            </div>
                                            <span className="text-xs text-white/30 mt-2 uppercase tracking-wider">{unit.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {phase === "waiting" ? (
                                <button
                                    onClick={handleSkipWait}
                                    className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-white/5 text-white/50 hover:text-white border border-white/5"
                                >
                                    Itxaronaldia saltatu (Dev)
                                </button>
                            ) : (
                                <motion.button
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={handleViewBulletin}
                                    className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-3 relative group overflow-hidden"
                                    style={{ background: colors.primary, color: colors.background, boxShadow: `0 0 40px ${colors.primary}30` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                    <FileText size={22} />
                                    Ikusi Boletina
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* FASE 3: RED NEURONAL EXTENSA Y FLUIDA */}
                {phase === "animating" && (
                    <motion.div
                        key="animating-screen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
                        transition={{ duration: 0.8, ease: appleEase }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden pointer-events-none"
                        style={{
                            background: "rgba(10, 10, 10, 0.8)",
                            backdropFilter: "blur(30px)",
                            WebkitBackdropFilter: "blur(30px)"
                        }}
                    >
                        <div className="relative flex flex-col items-center justify-center">

                            {/* Malla Neuronal Compleja (50+ Nodos, 90+ Enlaces) */}
                            <svg width="500" height="500" viewBox="0 0 500 500" className="absolute">
                                <defs>
                                    <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Dibujar Conexiones primero para que queden debajo */}
                                {NEURAL_LINKS.map((link) => (
                                    <motion.line
                                        key={link.id}
                                        x1={link.x1} y1={link.y1}
                                        x2={link.x2} y2={link.y2}
                                        stroke={colors.primary}
                                        strokeWidth="1"
                                        filter="url(#soft-glow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: [0, 0.5, 0.1] }}
                                        transition={{
                                            duration: 1.5,
                                            delay: link.layer * 0.4, // Se expande desde el centro hacia afuera
                                            ease: "easeOut",
                                            opacity: { duration: 2 + link.layer * 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
                                        }}
                                    />
                                ))}

                                {/* Dibujar Nodos */}
                                {NEURAL_NODES.map((node) => (
                                    <motion.circle
                                        key={node.id}
                                        cx={node.x} cy={node.y} r="2.5"
                                        fill={colors.primary}
                                        filter="url(#soft-glow)"
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: [0, 1, 0.4], scale: [0, 1, 0.8] }}
                                        transition={{
                                            duration: 0.8,
                                            delay: (node.layer * 0.4) + 0.2,
                                            ease: appleEase,
                                            opacity: { duration: 1.5 + node.layer * 0.1, repeat: Infinity, repeatType: "reverse", ease: "linear" }
                                        }}
                                    />
                                ))}
                            </svg>

                            {/* Brillo Central */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
                                className="absolute w-40 h-40 rounded-full"
                                style={{
                                    background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
                                    filter: "blur(20px)"
                                }}
                            />

                            {/* Icono central (El Cerebro/Chip) */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                transition={{ duration: 1.2, ease: appleEase, delay: 0.2 }}
                                className="relative z-10 flex flex-col items-center"
                            >
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden"
                                    style={{ border: `1px solid ${colors.primary}40`, background: "rgba(0,0,0,0.7)" }}>
                                    <Zap size={32} style={{ color: colors.primary }} className="relative z-10 drop-shadow-[0_0_8px_rgba(190,214,0,0.8)]" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-[-50%] opacity-30"
                                        style={{ background: `conic-gradient(transparent 0deg, ${colors.primary} 180deg, transparent 360deg)` }}
                                    />
                                    <div className="absolute inset-1 bg-[#0A0A0A] rounded-xl z-0" />
                                </div>

                                <h3 className="text-xl font-light tracking-widest text-[#FAFAFA] font-mono">
                                    LasAI
                                </h3>
                                <motion.p
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-sm font-light mt-2"
                                    style={{ color: colors.primary }}
                                >
                                    Txostena sortzen...
                                </motion.p>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* FASE 4: VISTA FINAL (SIN SOMBRA FEA, SOLO REVEAL LIMPIO Y ELEGANTE) */}
                {phase === "ready" && (
                    <div className="max-w-7xl mx-auto px-8 py-10 min-h-full flex flex-col">

                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5 w-full">
                            <div>
                                <h1 className="text-3xl font-bold text-[#FAFAFA] flex items-center gap-3">
                                    Month Close <span style={{ color: colors.primary }}>Final Review</span>
                                    <CheckCircle2 className="text-[#BED600]" size={28} />
                                </h1>
                                <p className="text-white/50 mt-2">Zirriborroa prest. Berrikusi datuak eta onartu txostena bezeroei/arduradunei bidaltzeko.</p>
                            </div>
                        </div>

                        {/* Este contenedor anima la aparición de ambas columnas a la vez limpiamente */}
                        <motion.div
                            variants={cleanRevealVariants}
                            initial="hidden"
                            animate="visible"
                            className="flex-1 flex flex-col w-full"
                        >
                            <div className="flex flex-col md:flex-row gap-8 flex-1 mb-8 w-full">

                                {/* COLUMNA IZQUIERDA: AI Text Editor */}
                                <div
                                    className="w-full md:w-1/2 p-7 rounded-3xl backdrop-blur-md flex flex-col h-[650px]"
                                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl" style={{ background: "rgba(190, 214, 0, 0.1)" }}>
                                                <Sparkles size={18} style={{ color: colors.primary }} />
                                            </div>
                                            <h2 className="text-lg font-semibold text-[#FAFAFA]">AI Editor (Iruzkinak)</h2>
                                        </div>
                                        <button
                                            onClick={handleRegenerate}
                                            disabled={isRegenerating}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/5 disabled:opacity-50 border border-white/5"
                                            style={{ color: colors.primary }}
                                        >
                                            <RefreshCw size={13} className={isRegenerating ? "animate-spin" : ""} />
                                            <span className="text-sm font-medium">Birsorkuntza</span>
                                        </button>
                                    </div>

                                    <textarea
                                        value={draftText}
                                        onChange={(e) => setDraftText(e.target.value)}
                                        className="w-full flex-1 p-6 rounded-2xl text-[15px] custom-scrollbar leading-relaxed resize-none focus:outline-none transition-shadow"
                                        style={{
                                            background: "rgba(0,0,0,0.2)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            color: colors.textPrimary,
                                            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
                                            outlineColor: `${colors.primary}80`
                                        }}
                                    />
                                </div>

                                {/* COLUMNA DERECHA: PDF Preview */}
                                <div
                                    className="w-full md:w-1/2 p-7 rounded-3xl backdrop-blur-md flex flex-col h-[650px]"
                                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <h2 className="text-lg font-semibold text-[#FAFAFA] mb-6 flex items-center gap-2.5">
                                        <FileText size={18} className="text-white/40" />
                                        PDF Prebisualizazioa
                                    </h2>

                                    <div className="flex-1 bg-[#F0F0F0] rounded-2xl p-3 overflow-y-auto custom-scrollbar">
                                        <div className="bg-white min-h-[850px] shadow-lg p-9 text-black mx-auto relative max-w-[95%]">
                                            <div className="flex justify-between items-end border-b-2 border-[#BED600] pb-5 mb-7">
                                                <div>
                                                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">CodeSyntax</h1>
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1.5 font-bold">Errendimendu Txostena</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">Otsaila 2026</p>
                                                    <p className="text-[11px] text-gray-400">ID: CS-26-02-REV</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-5 mb-7">
                                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                                    <p className="text-[11px] text-gray-500 uppercase font-bold mb-1.5 tracking-wider">Produktibitatea</p>
                                                    <p className="text-3xl font-black text-[#BED600]">58%</p>
                                                </div>
                                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                                                    <p className="text-[11px] text-gray-500 uppercase font-bold mb-1.5 tracking-wider">Orduak Guztira</p>
                                                    <p className="text-3xl font-black text-gray-800">2.961h</p>
                                                </div>
                                            </div>

                                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[13px]">
                                                {draftText.split('\n').map((line, i) => (
                                                    <p key={i} className={`mb-2.5 ${line.includes(':') || line.includes('-') ? 'ml-4' : ''}`}>
                                                        {line || <br />}
                                                    </p>
                                                ))}
                                            </div>

                                            <div className="absolute bottom-9 left-9 right-9 text-center text-[11px] text-gray-400 border-t border-gray-200 pt-5">
                                                Konfidentziala - CodeSyntax S.L. &copy; 2026 - www.codesyntax.com
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BARRA INFERIOR: Botón Enviar */}
                            <div className="flex justify-end pt-5 border-t border-white/5 mt-auto">
                                <button
                                    className="px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 relative group overflow-hidden"
                                    style={{
                                        background: colors.primary,
                                        color: colors.background,
                                        boxShadow: `0 0 40px ${colors.primary}30`,
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                                    <Send size={22} className="relative z-10" />
                                    <span className="relative z-10">Aprobatu eta Bidali</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}