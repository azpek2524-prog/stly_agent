"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Settings2, Copy, Check, ImagePlus, Send, X, User } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

type ChatImage = { data: string; mimeType: string; preview: string };
type Message = {
  role: "user" | "assistant";
  content: string;
  images?: ChatImage[];
};

const brandName = "Stly";
const brandVibe = "Neo-tribal, Streetwear, Skater, Y2K, Surrealista";

const SUGGESTIONS = [
  "Sube una referencia y adáptala al estilo Stly",
  "Ideas para el post del próximo drop",
  "¿Qué ángulo uso para el hoodie negro?",
  "Genérame un prompt para AI Studio",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ChatImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const fileToImage = (file: File): Promise<ChatImage> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        resolve({
          data: base64String.split(",")[1],
          mimeType: file.type,
          preview: base64String,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const imgs = await Promise.all(files.map(fileToImage));
    setPendingImages((prev) => [...prev, ...imgs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if ((!text && pendingImages.length === 0) || loading) return;

    setError(null);
    const userMessage: Message = {
      role: "user",
      content: text,
      images: pendingImages.length ? pendingImages : undefined,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images?.map((img) => ({ data: img.data, mimeType: img.mimeType })),
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

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md z-50 shrink-0">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-bold text-lg tracking-tight">Agente {brandName}</span>
          </div>
          <span className="px-3 py-1 bg-[var(--border)]/50 rounded-full flex items-center gap-2 text-xs font-medium text-gray-500">
            <Settings2 className="w-3 h-3" />
            <span className="hidden sm:inline">{brandName} • {brandVibe}</span>
            <span className="inline sm:hidden">{brandName}</span>
          </span>
        </div>
      </nav>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center text-center pt-16 pb-8">
              <div className="w-16 h-16 mb-5 rounded-2xl bg-[var(--primary)] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-[var(--primary-foreground)]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Generador de Ideas {brandName}</h1>
              <p className="text-gray-500 max-w-md mb-8">
                Mándame una foto, un reel, un ángulo o una idea de prenda. Lo adapto al estilo{" "}
                <strong>{brandName}</strong> y te doy el prompt listo para Google AI Studio. También
                podemos chatear y aclarar dudas.
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
              {messages.map((msg, idx) => (
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
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.images.map((img, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={img.preview}
                            alt="referencia"
                            className="w-24 h-24 object-cover rounded-lg border border-black/10"
                          />
                        ))}
                      </div>
                    )}
                    {msg.content && msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h3:text-base prose-h3:mt-4 prose-h3:mb-1.5 prose-p:mb-3 prose-p:leading-relaxed marker:text-[var(--primary)] prose-pre:bg-black/5 dark:prose-pre:bg-white/5">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}

                    {msg.role === "assistant" && (
                      <button
                        onClick={() => copyMessage(msg.content, idx)}
                        className="absolute -bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--background)] border border-[var(--border)] rounded-md px-2 py-1 text-xs flex items-center gap-1 text-gray-500 hover:text-[var(--foreground)]"
                      >
                        {copiedIdx === idx ? (
                          <><Check className="w-3 h-3 text-green-500" /> Copiado</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copiar</>
                        )}
                      </button>
                    )}
                  </motion.div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--border)] flex items-center justify-center mt-1">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 shrink-0 rounded-md bg-[var(--primary)] flex items-center justify-center mt-1">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
                    </motion.div>
                  </div>
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-4 py-3 text-sm text-gray-500">
                    El Director Creativo de {brandName} está pensando...
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
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingImages.map((img, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="adjunto" className="w-16 h-16 object-cover rounded-lg border border-[var(--border)]" />
                  <button
                    onClick={() => removePendingImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full flex items-center justify-center"
                    aria-label="Quitar imagen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 focus-within:border-gray-400 transition-colors">
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileInput} accept="image/*" multiple />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl hover:bg-[var(--border)]/50 transition-colors text-gray-500 shrink-0"
              aria-label="Adjuntar imagen"
              title="Adjuntar referencia"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribe una idea, pega una referencia o pregunta lo que quieras…"
              className="flex-1 bg-transparent resize-none outline-none py-2.5 max-h-40 text-sm leading-relaxed"
            />
            <button
              onClick={() => send()}
              disabled={loading || (!input.trim() && pendingImages.length === 0)}
              className="p-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            Enter para enviar · Shift+Enter para salto de línea · El prompt generador sale en inglés, listo para AI Studio.
          </p>
        </div>
      </div>
    </div>
  );
}
