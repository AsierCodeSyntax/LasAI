"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Calendar,
    Download,
    BarChart2,
    FileText,
    Clock,
    CheckCircle,
    Euro,
    TrendingUp,
    TrendingDown
} from "lucide-react"

// Colores del tema CodeSyntax
const colors = {
    background: "#0A0A0A",
    primary: "#BED600",
    textPrimary: "#FAFAFA",
    textSecondary: "rgba(255,255,255,0.5)",
    cardBorder: "rgba(255,255,255,0.08)",
    orange: "#F59E0B",
    blue: "#60A5FA",
    purple: "#C084FC",
}

// Curva de animación suave
const appleEase = [0.22, 1, 0.36, 1]

// Mock Data de los meses históricos
const HISTORICAL_DATA = [
    { id: "jan-2026", period: "Urtarrila 2026", prod: 72, hours: 3100, kanban: 110, billing: 45.2 },
    { id: "dec-2025", period: "Abendua 2025", prod: 68, hours: 2800, kanban: 95, billing: 39.8 },
    { id: "nov-2025", period: "Azaroa 2025", prod: 75, hours: 3250, kanban: 120, billing: 48.5 },
    { id: "oct-2025", period: "Urria 2025", prod: 65, hours: 2900, kanban: 88, billing: 41.0 },
    { id: "sep-2025", period: "Iraila 2025", prod: 80, hours: 3400, kanban: 135, billing: 52.1 },
    { id: "aug-2025", period: "Abuztua 2025", prod: 55, hours: 2200, kanban: 60, billing: 31.5 }, // Bajón de verano
]

interface VaultProps {
    onNavigateToDashboard?: (monthId: string) => void;
}

export function M2_Vault({ onNavigateToDashboard }: VaultProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [filterYear, setFilterYear] = useState("All")

    // Lógica de filtrado y búsqueda
    const filteredData = useMemo(() => {
        return HISTORICAL_DATA.filter((item) => {
            const matchesSearch = item.period.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesYear = filterYear === "All" || item.period.includes(filterYear)
            return matchesSearch && matchesYear
        })
    }, [searchQuery, filterYear])

    const handleDownloadPDF = (period: string) => {
        // Simulación de descarga
        console.log(`Deskargatzen PDF: ${period}`)
        alert(`${period} txostena deskargatzen...`)
    }

    const handleViewDashboard = (id: string) => {
        // Aquí conectarías con tu lógica para cambiar la vista al dashboard de ese mes
        console.log(`Bidaia denboran: ${id} dashboard-era`)
        if (onNavigateToDashboard) {
            onNavigateToDashboard(id)
        }
    }

    // Animaciones para el Grid
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: appleEase } }
    }

    return (
        <div
            style={{ backgroundColor: colors.background }}
            className="flex-1 h-screen overflow-y-auto custom-scrollbar text-white w-full"
        >
            <div className="max-w-7xl mx-auto px-8 py-10 min-h-full flex flex-col">

                {/* HEADER & CONTROLS */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: appleEase }}
                    className="mb-10"
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#FAFAFA] flex items-center gap-3">
                                Historical <span style={{ color: colors.primary }}>Vault</span>
                                <FileText className="text-[#BED600]/50" size={28} />
                            </h1>
                            <p className="text-white/50 mt-2">Iraganeko txostenak eta errendimendu datuak kontsultatu.</p>
                        </div>

                        {/* Búsqueda y Filtros */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Buscador */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#BED600] transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Bilatu hilabetea..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-64 pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-1"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: colors.textPrimary,
                                        outlineColor: colors.primary
                                    }}
                                />
                            </div>

                            {/* Filtro de Año */}
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="w-full sm:w-40 pl-11 pr-4 py-3 rounded-2xl text-sm appearance-none cursor-pointer transition-all focus:outline-none focus:ring-1"
                                    style={{
                                        background: "rgba(255,255,255,0.03)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: colors.textPrimary,
                                        outlineColor: colors.primary
                                    }}
                                >
                                    <option value="All" className="bg-[#1A1A1A]">Urte guztiak</option>
                                    <option value="2026" className="bg-[#1A1A1A]">2026</option>
                                    <option value="2025" className="bg-[#1A1A1A]">2025</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* GRID DE TARJETAS */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10"
                >
                    <AnimatePresence>
                        {filteredData.map((data) => {
                            const isTargetMet = data.prod >= 70
                            const prodColor = isTargetMet ? colors.primary : colors.orange

                            return (
                                <motion.div
                                    key={data.id}
                                    variants={itemVariants}
                                    layout
                                    className="p-6 rounded-3xl backdrop-blur-md flex flex-col group transition-all duration-300 hover:scale-[1.02]"
                                    style={{
                                        background: "rgba(255,255,255,0.02)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
                                    }}
                                >
                                    {/* Tarjeta Header */}
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                        <h3 className="text-xl font-bold text-[#FAFAFA]">{data.period}</h3>
                                        <div
                                            className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
                                            style={{
                                                background: `${prodColor}15`,
                                                color: prodColor,
                                                border: `1px solid ${prodColor}30`
                                            }}
                                        >
                                            {isTargetMet ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            Prod: {data.prod}%
                                        </div>
                                    </div>

                                    {/* Grid de Datos Pequeño */}
                                    <div className="grid grid-cols-2 gap-4 mb-8 flex-1">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 text-white/40 text-xs uppercase tracking-wider font-semibold">
                                                <Clock size={12} style={{ color: colors.blue }} /> Orduak
                                            </div>
                                            <div className="text-lg font-bold text-white">{data.hours.toLocaleString()}h</div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-1 text-white/40 text-xs uppercase tracking-wider font-semibold">
                                                <CheckCircle size={12} style={{ color: colors.purple }} /> Kanban
                                            </div>
                                            <div className="text-lg font-bold text-white">{data.kanban}</div>
                                        </div>

                                        <div className="col-span-2 mt-2">
                                            <div className="flex items-center gap-2 mb-1 text-white/40 text-xs uppercase tracking-wider font-semibold">
                                                <Euro size={12} style={{ color: colors.primary }} /> Fakturazioa
                                            </div>
                                            <div className="text-2xl font-black text-[#FAFAFA]">{data.billing.toFixed(1)}K €</div>
                                        </div>
                                    </div>

                                    {/* Botones de Acción */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                        <button
                                            onClick={() => handleDownloadPDF(data.period)}
                                            className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/5 text-sm font-semibold border border-white/10 text-white/70 hover:text-white group-hover:border-white/20"
                                        >
                                            <Download size={16} />
                                            PDF-a
                                        </button>

                                        <button
                                            onClick={() => handleViewDashboard(data.id)}
                                            className="flex-[2] py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 text-sm font-bold relative overflow-hidden"
                                            style={{
                                                background: `${colors.primary}15`,
                                                color: colors.primary,
                                                border: `1px solid ${colors.primary}40`
                                            }}
                                        >
                                            <BarChart2 size={16} />
                                            Ikusi Dashboard-a
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>

                    {/* Empty State */}
                    {filteredData.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="col-span-full py-20 flex flex-col items-center justify-center text-center"
                        >
                            <FileText size={48} className="text-white/10 mb-4" />
                            <p className="text-xl font-semibold text-white/50">Ez da emaitzarik aurkitu</p>
                            <p className="text-sm text-white/30 mt-2">Saiatu beste bilaketa edo urte batekin.</p>
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Estilos CSS globales para ocultar barra de scroll en inputs/selects si se desea */}
            <style dangerouslySetInnerHTML={{
                __html: `
        select option {
          background-color: #1A1A1A;
          color: white;
        }
      `}} />
        </div>
    )
}