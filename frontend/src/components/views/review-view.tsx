"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Trash2,
  FileText,
  Mail,
  CheckCircle,
  Eye,
  Loader2,
} from "lucide-react"

type View = "home" | "module" | "add-news" | "review" | "archive" | "sources"

interface NewsArticle {
  id: number
  title: string
  topic: string
  color: string // ¡Añadimos el color dinámico!
  summary_short: string
  llm_score: number
  url: string
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

const listItem = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.06,
      ease: [0.25, 0.4, 0.25, 1],
    },
  }),
}

interface ReviewViewProps {
  onNavigate: (view: View) => void
}

export function ReviewView({ onNavigate }: ReviewViewProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfTimestamp, setPdfTimestamp] = useState(Date.now())
  const [isSending, setIsSending] = useState(false)

  const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

  useEffect(() => {
    fetchBulletinData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchBulletinData() {
    setIsLoading(true)
    try {
      const response = await fetch(`${MOD1_API_URL}/api/bulletin/latest`)
      if (!response.ok) throw new Error("No hay boletín generado todavía.")

      const data = await response.json()
      let flatList: NewsArticle[] = []

      // 🔥 MAGIA DINÁMICA: Leemos el array 'sections' sea cual sea el topic
      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((section: any) => {
          if (section.items && Array.isArray(section.items)) {
            flatList.push(
              ...section.items.map((item: any) => ({
                ...item,
                topic: section.name, // Nombre real (ej. "Artificial Intelligence")
                color: section.color || BRAND // Color real de tu YAML
              }))
            )
          }
        })
      }

      setArticles(flatList)
      if (flatList.length > 0) setSelectedArticle(flatList[0])
      setPdfTimestamp(Date.now())
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendEmail() {
    setIsSending(true)
    try {
      const response = await fetch(`${MOD1_API_URL}/api/bulletin/send`, { method: "POST" })
      if (!response.ok) throw new Error("Fallo al enviar el correo")
      alert("✅ ¡El boletín se ha enviado por correo correctamente!")
    } catch (error) {
      console.error(error)
      alert("❌ Hubo un error al enviar el correo.")
    } finally {
      setIsSending(false)
    }
  }

  async function handleDiscard(id: number) {
    if (!confirm("¿Descartar esta noticia? El sistema buscará un reemplazo automáticamente y regenerará el PDF.")) return

    setIsLoading(true)
    try {
      const response = await fetch(`${MOD1_API_URL}/api/bulletin/discard/${id}`, { method: "POST" })
      if (!response.ok) throw new Error("Fallo al descartar la noticia")
      await fetchBulletinData()
    } catch (error) {
      console.error(error)
      alert("❌ Hubo un error al descartar la noticia.")
      setIsLoading(false)
    }
  }

  function getScoreColor(score: number) {
    if (score >= 9) return "#22c55e"
    if (score >= 8) return BRAND
    if (score >= 7) return "#FB923C"
    return "rgba(255,255,255,0.4)"
  }

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
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
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          CodeSyntax
        </button>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <button
          onClick={() => onNavigate("module")}
          className="text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          News Bulletin
        </button>
        <span className="text-sm" style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
          Review Bulletin
        </span>
      </nav>

      {/* Header */}
      <motion.section
        initial="hidden"
        animate="visible"
        className="shrink-0 px-8 pt-8 pb-6 lg:px-16"
      >
        <motion.div custom={0} variants={fadeSlideUp} className="mb-3 flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-xl"
            style={{ background: `${BRAND}15` }}
          >
            <Eye className="size-5" style={{ color: BRAND }} />
          </div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: `${BRAND}12`,
              border: `1px solid ${BRAND}25`,
            }}
          >
            <div className="size-1.5 rounded-full" style={{ background: BRAND }} />
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: BRAND }}
            >
              {articles.length} Articles
            </span>
          </div>
        </motion.div>
        <motion.h1
          custom={1}
          variants={fadeSlideUp}
          className="text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "#FAFAFA" }}
        >
          Review & Edit Bulletin
        </motion.h1>
        <motion.p
          custom={2}
          variants={fadeSlideUp}
          className="mt-1.5 text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          Review the curated articles, discard irrelevant ones, and approve the final bulletin.
        </motion.p>
      </motion.section>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin" style={{ color: BRAND }} />
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-20">
          <FileText className="size-12" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-base font-medium" style={{ color: "#FAFAFA" }}>No hay un boletín generado.</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Vuelve al dashboard y ejecuta la generación automática.</p>
        </div>
      ) : (
        <div className="flex flex-1 gap-5 overflow-hidden px-8 pb-8 lg:px-16">
          {/* Left Panel - Article List (40%) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex w-[40%] shrink-0 flex-col rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Panel Header */}
            <div
              className="flex shrink-0 items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Curated Articles
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: `${BRAND}15`,
                  color: BRAND,
                }}
              >
                {articles.length}
              </span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto">
              <motion.div initial="hidden" animate="visible">
                {articles.map((article, idx) => {
                  const isSelected = selectedArticle?.id === article.id

                  return (
                    <motion.div
                      key={article.id}
                      custom={idx}
                      variants={listItem}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedArticle(article)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setSelectedArticle(article)
                        }
                      }}
                      className="group/item relative cursor-pointer px-5 py-4 transition-colors"
                      style={{
                        background: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      {/* Selected indicator bar */}
                      {isSelected && (
                        <motion.div
                          layoutId="selectedBar"
                          className="absolute top-0 left-0 h-full w-0.5 rounded-r"
                          style={{ background: BRAND }}
                        />
                      )}

                      <div className="flex items-start gap-3">
                        <div className="flex flex-1 flex-col gap-2">
                          {/* Topic Badge + Score */}
                          <div className="flex items-center gap-2">
                            {/* 🔥 Badge dinámico con el color de tu YAML 🔥 */}
                            <span
                              className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider truncate max-w-[140px]"
                              style={{
                                background: `${article.color}25`,
                                color: article.color,
                                border: `1px solid ${article.color}40`
                              }}
                              title={article.topic}
                            >
                              {article.topic}
                            </span>
                            <span
                              className="text-[10px] font-semibold tabular-nums"
                              style={{ color: getScoreColor(article.llm_score) }}
                            >
                              Score: {article.llm_score}/10
                            </span>
                          </div>

                          {/* Title */}
                          <h3
                            className="text-sm font-medium leading-snug"
                            style={{ color: "#FAFAFA" }}
                          >
                            {article.title}
                          </h3>

                          {/* Summary */}
                          <p
                            className="line-clamp-2 text-xs leading-relaxed"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            {article.summary_short}
                          </p>
                        </div>

                        {/* Discard Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDiscard(article.id)
                          }}
                          className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all group-hover/item:opacity-100"
                          style={{ background: "rgba(239,68,68,0.1)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)" }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                          aria-label={`Discard ${article.title}`}
                        >
                          <Trash2 className="size-3.5" style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Panel - PDF Preview (60%) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-1 flex-col gap-4"
          >
            {/* Preview Card */}
            <div
              className="flex flex-1 flex-col overflow-hidden rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Preview Header */}
              <div
                className="flex shrink-0 items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  PDF Preview
                </span>
              </div>

              {/* Preview Body (iframe real apuntando a FastAPI) */}
              <div className="flex-1 bg-white/5">
                <iframe
                  src={`${MOD1_API_URL}/static/bulletin_compiled.pdf?t=${pdfTimestamp}#toolbar=0`}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              </div>
            </div>

            {/* Approve Button */}
            <motion.button
              whileHover={isSending ? {} : { scale: 1.01, boxShadow: "0 0 30px rgba(34,197,94,0.3), 0 0 60px rgba(34,197,94,0.12)" }}
              whileTap={isSending ? {} : { scale: 0.99 }}
              disabled={articles.length === 0 || isSending}
              onClick={handleSendEmail}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-30"
              style={{
                background: "#22c55e",
                color: "#FAFAFA",
                boxShadow: articles.length > 0 ? "0 0 20px rgba(34,197,94,0.2)" : "none",
              }}
            >
              {isSending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <CheckCircle className="size-5" />
                  <Mail className="size-5" />
                  Approve & Send Email
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  )
}