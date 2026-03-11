"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  Newspaper,
  Rss,
  PlusCircle,
  Eye,
  Archive,
  BarChart3,
  Lock,
  Settings,
  User,
  ChevronDown,
  Rocket,
  Brain,
  TrendingUp,
  Clock,
} from "lucide-react"

export type View =
  | "home"
  | "module"
  | "add-news"
  | "review"
  | "archive"
  | "sources"
  | "m2-charts"
  | "coming-soon"
  | "topics"
  | "m2-dashboard"
  | "m2-month-close"
  | "m2-vault"

const BRAND = "#BED600"

interface AppSidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

const techwatchSubItems = [
  { id: "module" as View, label: "Dashboard", icon: Newspaper },
  { id: "sources" as View, label: "RSS Sources", icon: Rss },
  { id: "add-news" as View, label: "Add News", icon: PlusCircle },
  { id: "review" as View, label: "Review Bulletin", icon: Eye },
  { id: "archive" as View, label: "Archive", icon: Archive },
  { id: "m2-charts" as View, label: "Analytics", icon: BarChart3 },
  { id: "topics" as View, label: "Topics", icon: Home },
]

// NUEVO: Sub-ítems para Lehiakortasun Inteligentzia
const lehiakortasunSubItems = [
  { id: "m2-dashboard" as View, label: "Dashboard", icon: BarChart3 },
  { id: "m2-month-close" as View, label: "Month Close", icon: Clock },
  { id: "m2-vault" as View, label: "Vault", icon: Lock },
]

// "Lehiakortasun Inteligentzia" eliminado de aquí
const lockedModules = [
  { title: "Merkatu Analisia", icon: TrendingUp },
]

const techwatchViewIds: View[] = ["module", "add-news", "review", "archive", "sources", "m2-charts", "topics"]
// NUEVO: IDs para el nuevo módulo
const lehiakortasunViewIds: View[] = ["m2-dashboard", "m2-month-close"]

export function AppSidebar({ currentView, onNavigate }: AppSidebarProps) {
  const isTechWatchActive = techwatchViewIds.includes(currentView)
  const isLehiakortasunActive = lehiakortasunViewIds.includes(currentView)

  const [techwatchOpen, setTechwatchOpen] = useState(isTechWatchActive || true)
  // NUEVO: Estado para abrir/cerrar el nuevo acordeón
  const [lehiakortasunOpen, setLehiakortasunOpen] = useState(isLehiakortasunActive)

  return (
    <aside
      className="flex h-screen w-64 shrink-0 flex-col shadow-2xl"
      style={{
        background: "#1A1A1A",
        borderRight: "1px solid rgba(255,255,255,0.12)",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 shrink-0 items-center gap-2.5 px-5 cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.03)]"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}
        onClick={() => onNavigate("home")}
      >
        <div className="flex items-center">
          <img src="/CodeSyntaxLogoa.png" alt="CodeSyntax Logo" className="h-8 w-auto brightness-0 invert" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-0 py-4">
        {/* General */}
        <span
          className="mb-2 px-6 text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          General
        </span>

        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 px-6 py-2.5 text-sm font-semibold transition-colors relative"
          style={{
            color: currentView === "home" ? BRAND : "#E0E0E0",
            background: currentView === "home" ? `rgba(190, 214, 0, 0.15)` : "transparent",
          }}
          onMouseEnter={(e) => {
            if (currentView !== "home") {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)"
              e.currentTarget.style.color = "#FFFFFF"
            }
          }}
          onMouseLeave={(e) => {
            if (currentView !== "home") {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.color = "#E0E0E0"
            }
          }}
        >
          {currentView === "home" && (
            <div className="absolute right-0 top-0 h-full w-1" style={{ background: BRAND, boxShadow: `0 0 10px ${BRAND}` }} />
          )}
          <Home className="size-4 shrink-0" />
          Home
        </button>

        {/* Modules Divider */}
        <div className="mt-8 mb-2 px-6">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Modules
          </span>
        </div>

        {/* MÓDULO 1: Zaintza Teknologikoa - Accordion */}
        <div className="relative">
          <button
            onClick={() => setTechwatchOpen(!techwatchOpen)}
            className="flex w-full items-center gap-3 px-6 py-2.5 text-sm font-bold transition-colors"
            style={{
              color: isTechWatchActive ? "#FFFFFF" : "#E0E0E0",
              background: isTechWatchActive && !techwatchOpen ? `rgba(255,255,255,0.05)` : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isTechWatchActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                e.currentTarget.style.color = "#FFFFFF"
              }
            }}
            onMouseLeave={(e) => {
              if (!isTechWatchActive) {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#E0E0E0"
              }
            }}
          >
            {isTechWatchActive && !techwatchOpen && (
              <div className="absolute right-0 top-0 h-full w-1" style={{ background: BRAND, boxShadow: `0 0 10px ${BRAND}` }} />
            )}
            <div
              className="flex size-6 items-center justify-center rounded-md shadow-md shrink-0"
              style={{ background: `${BRAND}`, border: `1px solid ${BRAND}` }}
            >
              <Rocket className="size-3.5" style={{ color: "#1A1A1A" }} />
            </div>
            <span className="flex-1 text-left truncate">Zaintza Teknologikoa</span>
            <motion.div
              animate={{ rotate: techwatchOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-4" style={{ color: isTechWatchActive ? "#FFFFFF" : "rgba(255,255,255,0.5)" }} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {techwatchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                className="overflow-hidden bg-[rgba(0,0,0,0.15)]"
              >
                <div className="flex flex-col gap-0.5 py-2 pl-4">
                  {techwatchSubItems.map((item, idx) => {
                    const Icon = item.icon
                    const isActive = currentView === item.id
                    return (
                      <button
                        key={item.id + idx}
                        onClick={() => onNavigate(item.id)}
                        className="relative flex items-center gap-3 rounded-l-lg px-6 py-2.5 text-[13px] font-semibold transition-all"
                        style={{
                          color: isActive ? BRAND : "#CCCCCC",
                          background: isActive ? `rgba(190, 214, 0, 0.2)` : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#FFFFFF"
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#CCCCCC"
                            e.currentTarget.style.background = "transparent"
                          }
                        }}
                      >
                        {isActive && (
                          <div className="absolute right-0 top-0 h-full w-1" style={{ background: BRAND, boxShadow: `0 0 10px ${BRAND}` }} />
                        )}
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MÓDULO 2 (NUEVO): Lehiakortasun Inteligentzia - Accordion */}
        <div className="relative mt-1">
          <button
            onClick={() => setLehiakortasunOpen(!lehiakortasunOpen)}
            className="flex w-full items-center gap-3 px-6 py-2.5 text-sm font-bold transition-colors"
            style={{
              color: isLehiakortasunActive ? "#FFFFFF" : "#E0E0E0",
              background: isLehiakortasunActive && !lehiakortasunOpen ? `rgba(255,255,255,0.05)` : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isLehiakortasunActive) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                e.currentTarget.style.color = "#FFFFFF"
              }
            }}
            onMouseLeave={(e) => {
              if (!isLehiakortasunActive) {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "#E0E0E0"
              }
            }}
          >
            {isLehiakortasunActive && !lehiakortasunOpen && (
              <div className="absolute right-0 top-0 h-full w-1" style={{ background: BRAND, boxShadow: `0 0 10px ${BRAND}` }} />
            )}
            <div
              className="flex size-6 items-center justify-center rounded-md shadow-md shrink-0"
              style={{ background: `${BRAND}`, border: `1px solid ${BRAND}` }}
            >
              <Brain className="size-3.5" style={{ color: "#1A1A1A" }} />
            </div>
            <span className="flex-1 text-left truncate">Lehiakortasun Int.</span>
            <motion.div
              animate={{ rotate: lehiakortasunOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="size-4" style={{ color: isLehiakortasunActive ? "#FFFFFF" : "rgba(255,255,255,0.5)" }} />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {lehiakortasunOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                className="overflow-hidden bg-[rgba(0,0,0,0.15)]"
              >
                <div className="flex flex-col gap-0.5 py-2 pl-4">
                  {lehiakortasunSubItems.map((item, idx) => {
                    const Icon = item.icon
                    const isActive = currentView === item.id
                    return (
                      <button
                        key={item.id + idx}
                        onClick={() => onNavigate(item.id)}
                        className="relative flex items-center gap-3 rounded-l-lg px-6 py-2.5 text-[13px] font-semibold transition-all"
                        style={{
                          color: isActive ? BRAND : "#CCCCCC",
                          background: isActive ? `rgba(190, 214, 0, 0.2)` : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#FFFFFF"
                            e.currentTarget.style.background = "rgba(255,255,255,0.05)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.color = "#CCCCCC"
                            e.currentTarget.style.background = "transparent"
                          }
                        }}
                      >
                        {isActive && (
                          <div className="absolute right-0 top-0 h-full w-1" style={{ background: BRAND, boxShadow: `0 0 10px ${BRAND}` }} />
                        )}
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Locked Modules */}
        {lockedModules.map((mod) => {
          const Icon = mod.icon
          return (
            <button
              key={mod.title}
              onClick={() => onNavigate("coming-soon")}
              className="flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors mt-1"
              style={{
                color: "rgba(255,255,255,0.45)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                e.currentTarget.style.color = "rgba(255,255,255,0.7)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.color = "rgba(255,255,255,0.45)"
              }}
            >
              <div
                className="flex size-6 items-center justify-center rounded-md shrink-0"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <Icon className="size-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
              </div>
              <span className="flex-1 text-left truncate">{mod.title}</span>
              <Lock className="size-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div
        className="flex flex-col gap-2 px-4 pb-4 pt-3 mt-auto"
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
      >
        <button
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
          style={{ color: "#E0E0E0" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FFFFFF"
            e.currentTarget.style.background = "rgba(255,255,255,0.08)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#E0E0E0"
            e.currentTarget.style.background = "transparent"
          }}
        >
          <Settings className="size-4" />
          Settings
        </button>

        <div
          className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors cursor-pointer bg-[rgba(0,0,0,0.2)]"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex size-8 items-center justify-center rounded-full text-xs font-bold shadow-md shrink-0"
            style={{ background: `${BRAND}`, color: "#1A1A1A" }}
          >
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate" style={{ color: "#FFFFFF" }}>
              Admin User
            </span>
            <span className="text-[10px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
              admin@codesyntax.com
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}