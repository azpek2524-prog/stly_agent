import { GoogleGenAI } from '@google/genai';

// Modelo de imagen (Nano Banana / Gemini Image). Configurable desde .env.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image-preview';

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt: string };

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: 'Falta la API Key de Gemini. Ponla en el archivo .env como GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    if (!prompt?.trim()) {
      return Response.json({ error: 'No hay prompt para generar la imagen.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Extraemos las partes de imagen que devuelve el modelo.
    const images: string[] = [];
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part.inlineData;
      if (inline?.data) {
        const mime = inline.mimeType || 'image/png';
        images.push(`data:${mime};base64,${inline.data}`);
      }
    }

    if (images.length === 0) {
      return Response.json(
        {
          error:
            'El modelo no devolvió imágenes. Puede que GEMINI_IMAGE_MODEL no sea un modelo de imagen válido para tu cuenta. Ejecuta `node list-models.js` y ajusta el .env.',
        },
        { status: 502 }
      );
    }

    return Response.json({ images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generando la imagen';
    console.error('[api/generate-image]', error);
    return Response.json({ error: message }, { status: 500 });
  }
}
