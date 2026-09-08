import { GoogleGenAI } from '@google/genai';
import { getAgentSystemPrompt } from '@/lib/prompt-generator';
import { db } from '@/lib/firebase';
import { promises as fs } from 'fs';
import path from 'path';

const BRAND_NAME = 'Stly Vault';
const BRAND_VIBE = 'Neo-tribal, Streetwear, Skater, Y2K, Surrealista';

// Puedes cambiar el modelo desde el .env sin tocar el código.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';
const MEMORY_DOC_ID = 'brand_memory';

type ChatImage = { data: string; mimeType: string };
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
};

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'Falta la API Key de Gemini. Créala en Google AI Studio y ponla en el archivo .env como GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'No hay mensajes que procesar.' }, { status: 400 });
    }

    // Leer la memoria de la marca desde Firestore, fallback a local
    let brandMemory = "";
    if (db) {
      try {
        const docRef = db.collection('stly_vault_memory').doc(MEMORY_DOC_ID);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          brandMemory = docSnap.data()?.content || "";
        }
      } catch (e) {
        console.warn("No se pudo leer la memoria desde Firebase.", e);
      }
    } else {
      try {
        const memoryPath = path.join(process.cwd(), 'BRAND_MEMORY.md');
        brandMemory = await fs.readFile(memoryPath, 'utf-8');
      } catch (e) {
        console.warn("No se encontró o no se pudo leer BRAND_MEMORY.md localmente.");
      }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemInstruction = getAgentSystemPrompt(BRAND_NAME, BRAND_VIBE, brandMemory);

    const contents = messages.map((msg) => {
      const parts: Array<Record<string, unknown>> = [];

      if (msg.images?.length) {
        for (const img of msg.images) {
          parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        }
      }

      if (msg.content?.trim()) {
        parts.push({ text: msg.content });
      }

      if (parts.length === 0) {
        parts.push({ text: '(sin texto)' });
      }

      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let text = response.text;
    if (!text) {
      return Response.json(
        { error: 'El agente no devolvió respuesta.' },
        { status: 502 }
      );
    }

    // Comprobar si el agente quiere actualizar la memoria
    const memoryMatch = text.match(/\[ACTUALIZAR_MEMORIA:\s*"([^"]+)"\]/);
    if (memoryMatch) {
      const newMemory = memoryMatch[1];
      
      // Guardar en Firebase si está disponible
      if (db) {
        try {
          const docRef = db.collection('stly_vault_memory').doc(MEMORY_DOC_ID);
          const docSnap = await docRef.get();
          let currentContent = docSnap.exists ? docSnap.data()?.content : "";
          const updatedContent = currentContent + `\n- ${newMemory}`;
          
          await docRef.set({ content: updatedContent }, { merge: true });
          console.log(`Memoria actualizada en Firebase: ${newMemory}`);
        } catch (e) {
          console.error("Error al actualizar la memoria en Firebase:", e);
        }
      } 
      
      // Siempre guardar en local (para el entorno de desarrollo)
      try {
        const memoryPath = path.join(process.cwd(), 'BRAND_MEMORY.md');
        await fs.appendFile(memoryPath, `\n- ${newMemory}\n`);
      } catch (e) {
        console.error("Error al actualizar BRAND_MEMORY.md:", e);
      }
      
      // Limpiar la etiqueta
      text = text.replace(/\[ACTUALIZAR_MEMORIA:\s*"([^"]+)"\]/, '').trim();
    }

    return Response.json({ result: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error procesando el mensaje';
    console.error('[api/chat]', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
