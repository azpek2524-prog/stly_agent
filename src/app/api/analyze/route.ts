import { GoogleGenAI } from '@google/genai';
import { getAgentSystemPrompt } from '@/lib/prompt-generator';

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'Falta la API Key de Gemini. Configúrala en el archivo .env' }, { status: 500 });
    }

    // Initialize the AI client inside the route to ensure it picks up the env var correctly
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = getAgentSystemPrompt("Stly", "Neo-tribal, Streetwear, Skater, Y2K, Surrealista");

    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType: mimeType
                        }
                    },
                    {
                        text: "Analiza esta referencia visual y genera la Ficha Técnica Visual siguiendo estrictamente tus instrucciones."
                    }
                ]
            }
        ],
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        }
    });

    return Response.json({ result: response.text });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message || 'Error analizando la imagen' }, { status: 500 });
  }
}
