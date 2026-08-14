"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Settings2,
  Copy,
  Check,
  ImagePlus,
  Send,
  X,
  User,
  Wand2,
  Download,
  Plus,
  Film,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { extractGeneratorPrompt } from "@/lib/extract-prompt";

type Media = {
  data: string;
  mimeType: string;
  preview: string;
  kind: "image" | "video";
};
type Message = {
  role: "user" | "assistant";
  content: string;
  media?: Media[];
};

const brandName = "Stly";
const brandVibe = "Neo-tribal, Streetwear, Skater, Y2K, Surrealista";
const MAX_FILE_MB = 20;

const SUGGESTIONS = [
  "Sube una referencia y adáptala al estilo Stly",
  "Ideas para el post del próximo drop",
  "¿Qué ángulo uso para el hoodie negro?",
  "Genérame un prompt para AI Studio",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Estado de imágenes generadas por mensaje del asistente.
  const [generated, setGenerated] = useState<Record<number, string[]>>({});
  const [genLoading, setGenLoading] = useState<Record<number, boolean>>({});
  const [genError, setGenError] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, generated]);

  // Textarea que crece con el contenido.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const fileToMedia = (file: File): Promise<Media> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve({
          data: base64String.split(",")[1],
          mimeType: file.type,
          preview: base64String,
          kind: file.type.startsWith("video") ? "video" : "image",
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = useCallback(async (files: File[]) => {
    const media = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (media.length === 0) return;

    const tooBig = media.find((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" pesa demasiado. Máximo ${MAX_FILE_MB} MB por archivo.`);
      return;
    }
    setError(null);
    const converted = await Promise.all(media.map(fileToMedia));
    setPending((prev) => [...prev, ...converted]);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await addFiles(Array.from(e.target.files ?? []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files ?? []);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  };

  // Drag & drop en toda la ventana.
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) setDragActive(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files ?? []));
  };

  const removePending = (idx: number) => setPending((prev) => prev.filter((_, i) => i !== idx));

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && pending.length === 0) || loading) return;

    setError(null);
    const userMessage: Message = {
      role: "user",
      content: text,
      media: pending.length ? pending : undefined,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPending([]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.media?.map((x) => ({ data: x.data, mimeType: x.mimeType })),
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Hubo un error procesando tu mensaje");

      setMessages((prev) => [...prev, { role: "assistant", content: data.result }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (idx: number, prompt: string) => {
    setGenLoading((p) => ({ ...p, [idx]: true }));
    setGenError((p) => ({ ...p, [idx]: "" }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar la imagen");
      setGenerated((p) => ({ ...p, [idx]: [...(p[idx] ?? []), ...data.images] }));
    } catch (err) {
      setGenError((p) => ({ ...p, [idx]: err instanceof Error ? err.message : "Error generando la imagen" }));
    } finally {
      setGenLoading((p) => ({ ...p, [idx]: false }));
    }
  };

  const downloadImage = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = name;
    a.click();
  };

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const newChat = () => {
    setMessages([]);
    setGenerated({});
    setGenError({});
    setError(null);
    setPending([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className="h-screen flex flex-col bg-[var(--background)] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black"
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Overlay de arrastre */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[var(--background)]/90 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="border-2 border-dashed border-[var(--primary)] rounded-3xl px-16 py-12 text-center">
              <ImagePlus className="w-10 h-10 mx-auto mb-3 text-[var(--primary)]" />
              <p className="font-semibold text-lg">Suelta tu referencia aquí</p>
              <p className="text-sm text-gray-500">Imágenes o video · máx {MAX_FILE_MB} MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md z-50 shrink-0">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-bold text-lg tracking-tight">Agente {brandName}</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEmpty && (
              <button
                onClick={newChat}
                className="px-3 py-1.5 rounded-full border border-[var(--border)] hover:border-gray-400 hover:bg-[var(--card)] transition-colors text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva
              </button>
            )}
            <span className="px-3 py-1 bg-[var(--border)]/50 rounded-full flex items-center gap-2 text-xs font-medium text-gray-500">
              <Settings2 className="w-3 h-3" />
              <span className="hidden md:inline">{brandVibe}</span>
              <span className="inline md:hidden">{brandName}</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center text-center pt-14 pb-8">
              <div className="w-16 h-16 mb-5 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[var(--primary-foreground)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Generador de Ideas {brandName}</h1>
              <p className="text-gray-500 max-w-md mb-8">
                Mándame una foto, un video, un ángulo o una idea de prenda. Lo adapto al estilo{" "}
                <strong>{brandName}</strong>, te doy el prompt para Google AI Studio y puedo{" "}
                <strong>generar la imagen aquí mismo</strong>. También podemos chatear y aclarar dudas.
              </p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl border border-[var(--border)] hover:border-gray-400 hover:bg-[var(--card)] transition-colors text-gray-600 dark:text-gray-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => {
                const prompt = msg.role === "assistant" ? extractGeneratorPrompt(msg.content) : null;
                const imgs = generated[idx] ?? [];
                return (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--primary)] flex items-center justify-center mt-1">
                        <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                          : "bg-[var(--card)] border border-[var(--border)]"
                      }`}
                    >
                      {msg.media && msg.media.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.media.map((m, i) =>
                            m.kind === "video" ? (
                              <video
                                key={i}
                                src={m.preview}
                                className="w-28 h-28 object-cover rounded-lg border border-black/10"
                                muted
                                controls
                              />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={m.preview}
                                alt="referencia"
                                className="w-24 h-24 object-cover rounded-lg border border-black/10"
                              />
                            )
                          )}
                        </div>
                      )}

                      {msg.content && msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1.5 prose-p:mb-3 prose-p:leading-relaxed marker:text-[var(--primary)] prose-pre:bg-black/5 dark:prose-pre:bg-white/5">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* Acciones para respuestas con prompt generador */}
                      {msg.role === "assistant" && prompt && (
                        <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => generateImage(idx, prompt)}
                            disabled={genLoading[idx]}
                            className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {genLoading[idx] ? (
                              <>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                  <Sparkles className="w-3.5 h-3.5" />
                                </motion.div>
                                Generando…
                              </>
                            ) : (
                              <><Wand2 className="w-3.5 h-3.5" /> {imgs.length ? "Generar otra" : "Generar imagen"}</>
                            )}
                          </button>
                          <button
                            onClick={() => copyMessage(prompt, idx)}
                            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:border-gray-400 transition-colors"
                          >
                            {copiedIdx === idx ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar prompt</>}
                          </button>
                        </div>
                      )}

                      {genError[idx] && (
                        <p className="mt-2 text-xs text-red-500">{genError[idx]}</p>
                      )}

                      {imgs.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {imgs.map((src, i) => (
                            <div key={i} className="relative group/img">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="generada" className="w-full rounded-xl border border-[var(--border)]" />
                              <button
                                onClick={() => downloadImage(src, `stly-${idx}-${i + 1}.png`)}
                                className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity bg-[var(--background)]/90 border border-[var(--border)] rounded-md p-1.5 text-gray-600 hover:text-[var(--foreground)]"
                                aria-label="Descargar imagen"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Copiar respuesta completa (solo texto, sin prompt destacado) */}
                      {msg.role === "assistant" && !prompt && (
                        <button
                          onClick={() => copyMessage(msg.content, idx)}
                          className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--background)] border border-[var(--border)] rounded-md px-2 py-1 text-xs flex items-center gap-1 text-gray-500 hover:text-[var(--foreground)]"
                        >
                          {copiedIdx === idx ? <><Check className="w-3 h-3 text-green-500" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                        </button>
                      )}
                    </motion.div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--border)] flex items-center justify-center mt-1">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--primary)] flex items-center justify-center mt-1">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
                    </motion.div>
                  </div>
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-gray-500">
                    El Director Creativo de {brandName} está pensando…
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pending.map((m, i) => (
                <div key={i} className="relative">
                  {m.kind === "video" ? (
                    <div className="w-16 h-16 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
                      <Film className="w-6 h-6 text-gray-500" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.preview} alt="adjunto" className="w-16 h-16 object-cover rounded-lg border border-[var(--border)]" />
                  )}
                  <button
                    onClick={() => removePending(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full flex items-center justify-center"
                    aria-label="Quitar archivo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 focus-within:border-gray-400 transition-colors">
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept="image/*,video/*"
              multiple
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-[var(--border)]/50 transition-colors text-gray-500 shrink-0"
              aria-label="Adjuntar imagen o video"
              title="Adjuntar imagen o video"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              rows={1}
              placeholder="Escribe una idea, pega una referencia o pregunta lo que quieras…"
              className="flex-1 bg-transparent resize-none outline-none py-2.5 max-h-40 text-sm leading-relaxed"
            />
            <button
              onClick={() => send()}
              disabled={loading || (!input.trim() && pending.length === 0)}
              className="p-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Enter para enviar · Shift+Enter salto de línea · Arrastra o pega imágenes y video · El prompt sale en inglés para AI Studio.
          </p>
        </div>
      </div>
    </div>
  );
}
