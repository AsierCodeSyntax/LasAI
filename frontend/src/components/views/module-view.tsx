"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Zap,
  FileText,
  PlusCircle,
  Archive,
  Rss,
  BarChart3,
  ArrowRight,
  Loader2,
} from "lucide-react"

type View = "home" | "module" | "add-news" | "review" | "archive" | "sources" | "m2-charts"

interface ModuleViewProps {
  onNavigate: (view: View) => void
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

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
}

const actions = [
  {
    id: "run",
    title: "Run Automatic Generation",
    description: "Scrape, evaluate, and compile the latest tech news automatically via the AI pipeline.",
    icon: Zap,
    view: null as View | null,
    cta: "Start Pipeline",
  },
  {
    id: "review",
    title: "Review Latest Bulletin",
    description: "Review, edit, and approve the generated news bulletin before distributing.",
    icon: FileText,
    view: "review" as View | null,
    cta: "Open Review",
  },
  {
    id: "add",
    title: "Add Manual News",
    description: "Manually inject an article URL to be evaluated and scored by the AI agents.",
    icon: PlusCircle,
    view: "add-news" as View | null,
    cta: "Add Article",
  },
  {
    id: "archive",
    title: "Bulletin Archive",
    description: "Browse, preview, and download previously published weekly bulletins.",
    icon: Archive,
    view: "archive" as View | null,
    cta: "Open Archive",
  },
  {
    id: "sources",
    title: "RSS Sources",
    description: "Manage and validate RSS feed sources for automated news ingestion.",
    icon: Rss,
    view: "sources" as View | null,
    cta: "Manage Sources",
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    description: "View pipeline performance metrics, article scores, and source health trends.",
    icon: BarChart3,
    view: "m2-charts" as View | null,
    cta: "See analytics",
  },
]

export function ModuleView({ onNavigate }: ModuleViewProps) {
  const [isRunning, setIsRunning] = useState(false)

  async function handleRunPipeline() {
    setIsRunning(true)
    try {
      const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";
      const response = await fetch(`${MOD1_API_URL}/api/bulletin/run`, {
        method: "POST"
      })
      if (!response.ok) throw new Error("Error en la ejecución")

      alert("¡Borrador generado con éxito! Puedes ir a revisarlo.")
    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un error al ejecutar el pipeline.")
    } finally {
      setIsRunning(false)
    }
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
          onClick={() => onNavigate("home")}
          className="text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
          }
        >
          CodeSyntax
        </button>
        <span
          className="text-sm"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          /
        </span>
        <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
          Weekly News Bulletin
        </span>
      </nav>

      {/* Hero Header */}
      <section className="px-8 pt-12 pb-10 lg:px-16">
        <motion.div initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeSlideUp} className="mb-4 flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl"
              style={{ background: `${BRAND} 15` }}
            >
              <Zap className="size-5" style={{ color: BRAND }} />
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                background: `${BRAND} 12`,
                border: `1px solid ${BRAND} 25`,
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
                Workflow
              </span>
            </div>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeSlideUp}
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "#FAFAFA" }}
          >
            News Bulletin
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeSlideUp}
            className="mt-2 max-w-lg text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Manage your weekly technology news bulletin workflow.
          </motion.p>
        </motion.div>
      </section>

      {/* Cards Grid */}
      <section className="flex-1 px-8 pb-20 lg:px-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {actions.map((action) => {
            const Icon = action.icon
            const isRunCard = action.id === "run"

            return (
              <motion.div
                key={action.id}
                variants={cardVariant}
                whileHover={
                  isRunning && isRunCard
                    ? {}
                    : {
                      scale: 1.02,
                      y: -4,
                      transition: { duration: 0.3, ease: [0.25, 0.4, 0.25, 1] },
                    }
                }
                className="group relative flex flex-col rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  opacity: (isRunning && isRunCard) ? 0.55 : 1,
                  cursor: (isRunning && isRunCard) ? "not-allowed" : "pointer",
                  transition: "box-shadow 0.3s ease, opacity 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  if (!(isRunning && isRunCard)) {
                    e.currentTarget.style.boxShadow = `0 0 30px ${BRAND} 20, 0 0 60px ${BRAND}08`
                    e.currentTarget.style.borderColor = `${BRAND} 30`
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                }}
                onClick={() => {
                  if (isRunCard) {
                    if (!isRunning) handleRunPipeline()
                    return
                  }
                  if (action.view) onNavigate(action.view)
                }}
              >
                {/* Icon */}
                <div
                  className="mb-5 flex size-11 items-center justify-center rounded-xl"
                  style={{ background: `${BRAND} 15` }}
                >
                  {isRunning && isRunCard ? (
                    <Loader2
                      className="size-5 animate-spin"
                      style={{ color: BRAND }}
                    />
                  ) : (
                    <Icon className="size-5" style={{ color: BRAND }} />
                  )}
                </div>

                {/* Title */}
                <h3
                  className="mb-1.5 text-sm font-semibold tracking-tight"
                  style={{ color: "#FAFAFA" }}
                >
                  {action.title}
                </h3>

                {/* Description */}
                <p
                  className="mb-6 flex-1 text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {action.description}
                </p>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    color:
                      isRunning && isRunCard
                        ? BRAND
                        : "rgba(255,255,255,0.5)",
                  }}
                >
                  {isRunning && isRunCard ? (
                    <>
                      <Loader2 className="size-3 animate-spin" />
                      Running pipeline...
                    </>
                  ) : (
                    <>
                      {action.cta}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </section>
    </div>
  )
}