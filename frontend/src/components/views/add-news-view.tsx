"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Link,
  Type,
  Folder,
  MessageSquare,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

type View = "home" | "module" | "add-news" | "review" | "archive" | "sources"

interface AddNewsViewProps {
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

interface TopicOption {
  value: string
  label: string
}

export function AddNewsView({ onNavigate }: AddNewsViewProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // 🔥 Nuevo estado para guardar los topics dinámicos
  const [topics, setTopics] = useState<TopicOption[]>([])

  // Usamos la variable de entorno o localhost por defecto
  const MOD1_API_URL = import.meta.env.VITE_MOD1_API_URL || "http://localhost:8001";

  // 🔥 Cargamos los topics al entrar a la vista
  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch(`${MOD1_API_URL}/api/topics`)
        if (response.ok) {
          const data = await response.json()

          // Reutilizamos la misma lógica robusta que en el TopicsView
          const realTopicsData = data.topics ? data.topics : data

          // Mapeamos el JSON para que encaje con las opciones del <select>
          const fetchedTopics = Object.entries(realTopicsData).map(([slug, info]: [string, any]) => ({
            value: slug,
            label: info.name || slug
          }))

          setTopics(fetchedTopics)
        }
      } catch (error) {
        console.error("Error fetching topics:", error)
      }
    }

    fetchTopics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${MOD1_API_URL}/api/news/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          topic: topic
        }),
      })

      if (!response.ok) {
        throw new Error("Fallo al enviar la noticia a la API")
      }

      setSubmitted(true)
      setUrl("")
      setTitle("")
      setTopic("")
      setNote("")

      setTimeout(() => setSubmitted(false), 3000)

    } catch (error) {
      console.error("Error:", error)
      alert("Hubo un error al conectar con el servidor.")
    } finally {
      setIsLoading(false)
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
          Home
        </button>
        <span
          className="text-sm"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          /
        </span>
        <button
          onClick={() => onNavigate("module")}
          className="text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.4)")
          }
        >
          News Bulletin
        </button>
        <span
          className="text-sm"
          style={{ color: "rgba(255,255,255,0.15)" }}
        >
          /
        </span>
        <span className="text-sm font-medium" style={{ color: "#FAFAFA" }}>
          Add Manual News
        </span>
      </nav>

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-6 pt-16 pb-20 lg:pt-24">
        <motion.div
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl"
        >
          {/* Header */}
          <motion.div custom={0} variants={fadeSlideUp} className="mb-10">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: `${BRAND}15` }}
              >
                <Sparkles className="size-5" style={{ color: BRAND }} />
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
                  Manual Injection
                </span>
              </div>
            </div>

            <h1
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              style={{ color: "#FAFAFA" }}
            >
              Add Manual News
            </h1>
            <p
              className="mt-2 text-base leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Inject a custom article into the AI pipeline.
            </p>
          </motion.div>

          {/* Form Card */}
          <motion.div
            custom={1}
            variants={fadeSlideUp}
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* URL Field */}
              <motion.div
                custom={2}
                variants={fadeSlideUp}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="url"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <Link className="size-3.5" style={{ color: BRAND }} />
                  Article URL
                  <span style={{ color: BRAND }}>*</span>
                </label>
                <input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl px-4 text-sm outline-none transition-shadow placeholder:text-[rgba(255,255,255,0.2)]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#FAFAFA",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}40`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                />
              </motion.div>

              {/* Override Title */}
              <motion.div
                custom={3}
                variants={fadeSlideUp}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="title"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <Type className="size-3.5" style={{ color: BRAND }} />
                  Override Title
                  <span
                    className="text-xs font-normal"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    (optional currently not working)
                  </span>
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="Custom article title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-xl px-4 text-sm outline-none transition-shadow placeholder:text-[rgba(255,255,255,0.2)]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#FAFAFA",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}40`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                />
              </motion.div>

              {/* Topic Select */}
              <motion.div
                custom={4}
                variants={fadeSlideUp}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="topic"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <Folder className="size-3.5" style={{ color: BRAND }} />
                  Topic
                  <span style={{ color: BRAND }}>*</span>
                </label>
                <div className="relative">
                  <select
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    className="h-11 w-full appearance-none rounded-xl px-4 pr-10 text-sm outline-none transition-shadow"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: topic ? "#FAFAFA" : "rgba(255,255,255,0.2)",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}40`)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.boxShadow = "none")
                    }
                  >
                    <option value="" disabled>
                      {topics.length === 0 ? "Loading topics..." : "Select a topic..."}
                    </option>
                    {topics.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m6 9 6 6 6-6"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Note Textarea */}
              <motion.div
                custom={5}
                variants={fadeSlideUp}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="note"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  <MessageSquare className="size-3.5" style={{ color: BRAND }} />
                  Context / Note for the AI
                  <span
                    className="text-xs font-normal"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    (optional currently not working)
                  </span>
                </label>
                <textarea
                  id="note"
                  rows={3}
                  placeholder="Add context to help the AI evaluate this article..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-shadow placeholder:text-[rgba(255,255,255,0.2)]"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#FAFAFA",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}40`)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.boxShadow = "none")
                  }
                />
              </motion.div>

              {/* Divider */}
              <motion.div
                custom={6}
                variants={fadeSlideUp}
                className="h-px w-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />

              {/* Submit Button */}
              <motion.div custom={7} variants={fadeSlideUp}>
                <button
                  type="submit"
                  disabled={!url || !topic || isLoading}
                  className="relative flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: submitted ? "#22c55e" : BRAND,
                    color: submitted ? "#FAFAFA" : "#0A0A0A",
                    boxShadow:
                      !url || !topic || isLoading
                        ? "none"
                        : `0 0 20px ${BRAND}30`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !submitted && url && topic) {
                      e.currentTarget.style.boxShadow = `0 0 30px ${BRAND}50, 0 0 60px ${BRAND}20`
                      e.currentTarget.style.background = "#D4EC00"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitted) {
                      e.currentTarget.style.boxShadow =
                        !url || !topic
                          ? "none"
                          : `0 0 20px ${BRAND}30`
                      e.currentTarget.style.background = BRAND
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Injecting into pipeline...
                    </>
                  ) : submitted ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Article Injected Successfully
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Inject Article
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          </motion.div>

          {/* Helper text */}
          <motion.p
            custom={8}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="mt-6 text-center text-xs"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            The article will be fetched, parsed, evaluated, and scored by the
            AI agents.
          </motion.p>
        </motion.div>
      </main>
    </div>
  )
}