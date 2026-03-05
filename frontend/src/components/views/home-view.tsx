"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Lock, Rocket, Brain, BarChart3, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HomeViewProps {
  onNavigate: (view: string) => void
}

const BRAND = "#BED600"

const modules = [
  {
    id: "techwatch",
    title: "Zaintza Teknologikoa",
    description:
      "Autonomous Multi-Agent System for technical news curation and PDF generation.",
    status: "Active",
    locked: false,
    icon: Rocket,
  },
  {
    id: "competitive",
    title: "Lehiakortasun Inteligentzia",
    description:
      "AI-powered competitive intelligence monitoring and strategic insights engine.",
    status: "Garatzen",
    locked: true,
    icon: Brain,
  },
  {
    id: "market",
    title: "Merkatu Analisia",
    description:
      "Deep market analysis with predictive modeling and trend forecasting.",
    status: "Garatzen",
    locked: true,
    icon: BarChart3,
  },
]

const fadeSlideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.15,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.6,
    },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1],
    },
  },
}

function CurrentDateTime() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return <div className="h-5 w-40" />

  return (
    <span className="font-mono text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
      {now.toLocaleDateString("eu-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      {" / "}
      {now.toLocaleTimeString("eu-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </span>
  )
}

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto" style={{ background: "#0A0A0A" }}>
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className="flex h-16 shrink-0 items-center justify-between px-8 lg:px-16"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="text-xl font-bold tracking-tighter" style={{ color: "#FAFAFA" }}>
          {"Code"}
          <span style={{ color: BRAND }}>{"Syntax"}</span>
        </div>
        <CurrentDateTime />
      </motion.nav>

      {/* Hero */}
      <section className="flex flex-col items-center px-8 pt-20 pb-16 lg:pt-28 lg:pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex max-w-3xl flex-col items-center text-center"
        >
          <motion.div
            custom={0}
            variants={fadeSlideUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{
              background: `${BRAND}15`,
              border: `1px solid ${BRAND}30`,
            }}
          >
            <div className="size-1.5 rounded-full" style={{ background: BRAND }} />
            <span className="text-xs font-medium tracking-wide" style={{ color: BRAND }}>
              PLATFORM v2.0
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeSlideUp}
            className="text-5xl font-bold tracking-tighter text-balance sm:text-7xl lg:text-8xl"
            style={{ color: "#FAFAFA" }}
          >
            {"TechWatch "}
            <span style={{ color: BRAND }}>{"2.0"}</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeSlideUp}
            className="mt-6 max-w-lg text-lg leading-relaxed sm:text-xl"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {"Adimen Artifizialak bultzatutako zaintza."}
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeSlideUp}
            className="mt-3 text-sm"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {"AI-driven technological surveillance for the modern enterprise."}
          </motion.div>
        </motion.div>
      </section>

      {/* Module Grid */}
      <section className="flex-1 px-8 pb-20 lg:px-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3"
        >
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              variants={cardVariant}
              whileHover={
                mod.locked
                  ? {}
                  : {
                    scale: 1.02,
                    y: -4,
                    transition: { duration: 0.3, ease: [0.25, 0.4, 0.25, 1] },
                  }
              }
              className="group relative flex flex-col rounded-2xl p-6 lg:p-8"
              style={{
                background: mod.locked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                border: mod.locked
                  ? "1px solid rgba(255,255,255,0.05)"
                  : "1px solid rgba(255,255,255,0.08)",
                opacity: mod.locked ? 0.55 : 1,
                filter: mod.locked ? "grayscale(1)" : "none",
                cursor: mod.locked ? "not-allowed" : "pointer",
                boxShadow: mod.locked
                  ? "none"
                  : `0 0 0 0 ${BRAND}00`,
                transition: "box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!mod.locked) {
                  e.currentTarget.style.boxShadow = `0 0 40px ${BRAND}25, 0 0 80px ${BRAND}10`
                }
              }}
              onMouseLeave={(e) => {
                if (!mod.locked) {
                  e.currentTarget.style.boxShadow = `0 0 0 0 ${BRAND}00`
                }
              }}
            >
              {/* Icon */}
              <div
                className="mb-6 flex size-12 items-center justify-center rounded-xl"
                style={{
                  background: mod.locked ? "rgba(255,255,255,0.04)" : `${BRAND}15`,
                }}
              >
                {mod.locked ? (
                  <Lock className="size-5" style={{ color: "rgba(255,255,255,0.3)" }} />
                ) : (
                  <mod.icon className="size-5" style={{ color: BRAND }} />
                )}
              </div>

              {/* Status */}
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="size-2 rounded-full"
                  style={{
                    background: mod.locked ? "rgba(255,255,255,0.2)" : BRAND,
                    boxShadow: mod.locked ? "none" : `0 0 8px ${BRAND}80`,
                  }}
                />
                <span
                  className="text-xs font-medium uppercase tracking-widest"
                  style={{
                    color: mod.locked ? "rgba(255,255,255,0.25)" : BRAND,
                  }}
                >
                  {mod.status}
                </span>
              </div>

              {/* Title */}
              <h3
                className="mb-2 text-lg font-semibold tracking-tight"
                style={{ color: mod.locked ? "rgba(255,255,255,0.35)" : "#FAFAFA" }}
              >
                {mod.title}
              </h3>

              {/* Description */}
              <p
                className="mb-8 flex-1 text-sm leading-relaxed"
                style={{ color: mod.locked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)" }}
              >
                {mod.description}
              </p>

              {/* Action */}
              {mod.locked ? (
                <div
                  className="flex items-center gap-2 text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <Lock className="size-3.5" />
                  {"Coming Soon"}
                </div>
              ) : (
                <Button
                  onClick={() => onNavigate("module")}
                  className="group/btn w-full gap-2 rounded-xl border-0 font-semibold"
                  style={{
                    background: BRAND,
                    color: "#0A0A0A",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#D4EC00"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = BRAND
                  }}
                >
                  {"Launch Module"}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        className="flex shrink-0 items-center justify-center px-8 py-8"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span className="text-xs tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
          {"Powered by LangGraph & CodeSyntax"}
        </span>
      </footer>
    </div>
  )
}
