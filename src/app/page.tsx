"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, Image as ImageIcon, Settings2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const brandName = "Stly";
  const brandVibe = "Neo-tribal, Streetwear, Skater, Y2K, Surrealista";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Por favor sube solo imágenes (JPG, PNG, WEBP).");
      return;
    }

    setResult(null);
    setError(null);
    
    // Create local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    // Convert file to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      setAnalyzing(true);
      
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Hubo un error procesando la imagen');
        }

        setResult(data.result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setAnalyzing(false);
      }
    };
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Navbar */}
      <nav className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--primary-foreground)]" />
            </div>
            <span className="font-bold text-lg tracking-tight">AI Content Agent</span>
          </div>
          <div className="flex items-center gap-4 text-xs lg:text-sm font-medium text-gray-500">
            <span className="px-3 py-1 bg-[var(--border)]/50 rounded-full flex items-center gap-2">
              <Settings2 className="w-3 h-3" />
              <span className="hidden sm:inline">{brandName} • {brandVibe}</span>
              <span className="inline sm:hidden">{brandName}</span>
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">Generador de Ideas</h1>
            <p className="text-gray-500">
              Sube una referencia visual y el agente la adaptará al estilo <strong>{brandName}</strong>, generándote un prompt hiperrealista para Nano Banana 2.
            </p>
          </div>

          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileInput}
            accept="image/*"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative group border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300
              ${isDragging ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-gray-400'}
              ${analyzing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {previewImage ? (
              <div className="absolute inset-0 w-full h-full p-2">
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover rounded-xl opacity-20 grayscale" />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                   <div className="w-16 h-16 mb-4 rounded-full bg-[var(--background)] flex items-center justify-center shadow-lg">
                    <Upload className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full font-medium shadow-xl hover:opacity-90 transition-opacity">
                    Cambiar referencia
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mb-4 rounded-full bg-[var(--border)]/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Arrastra tu referencia aquí</h3>
                <p className="text-sm text-gray-500 mb-6">JPG, PNG o WEBP</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-full font-medium hover:opacity-90 transition-opacity">
                  Seleccionar archivo
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm h-full min-h-[600px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card)]">
              <h2 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Ficha Técnica Visual
              </h2>
              {analyzing && (
                <span className="flex items-center gap-2 text-sm text-[var(--primary)]">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Analizando...
                </span>
              )}
              {result && (
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-[var(--border)]/50 rounded-md transition-colors flex items-center gap-2 text-sm text-gray-600"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar todo'}</span>
                </button>
              )}
            </div>

            <div className="p-8 flex-1 flex flex-col overflow-y-auto">
              {!analyzing && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 opacity-50" />
                  </div>
                  <p>Esperando referencia...</p>
                  <p className="text-sm mt-2 max-w-sm">
                    El resultado incluirá la dirección creativa, iluminación, pose y el prompt exacto listo para Nano Banana 2.
                  </p>
                </div>
              )}

              {analyzing && !result && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
                  <p>El Agente de Stly está trabajando...</p>
                </div>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:mb-4 prose-p:leading-relaxed marker:text-[var(--primary)]"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
