import { GoogleGenAI } from '@google/genai';
import { getAgentSystemPrompt } from '@/lib/prompt-generator';

const BRAND_NAME = 'Stly';
const BRAND_VIBE = 'Neo-tribal, Streetwear, Skater, Y2K, Surrealista';

// Puedes cambiar el modelo desde el .env sin tocar el código.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-pro-preview';

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

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const systemInstruction = getAgentSystemPrompt(BRAND_NAME, BRAND_VIBE);

    // Convertimos el historial de chat al formato que espera Gemini.
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

      // Gemini no acepta partes vacías: si un turno solo trae imagen, añadimos un texto mínimo.
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

    const text = response.text;
    if (!text) {
      return Response.json(
        { error: 'El agente no devolvió respuesta. Revisa el nombre del modelo (GEMINI_MODEL) o vuelve a intentarlo.' },
        { status: 502 }
      );
    }

    return Response.json({ result: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error procesando el mensaje';
    console.error('[api/chat]', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
