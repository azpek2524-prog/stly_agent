# Agente Stly · Generador de Ideas

Director creativo de IA para la marca **Stly**. Le mandas una referencia —una foto, un reel,
un ángulo de cámara, una idea de prenda o simplemente una duda— y el agente:

- **Chatea contigo** para aclarar dudas y refinar la idea.
- **Genera la Ficha Técnica Visual** con un prompt en inglés listo para pegar en
  **Google AI Studio** (Nano Banana 2 / Gemini 3 Image).
- **Genera la imagen aquí mismo** con un clic (botón "Generar imagen") y la descargas.

Acepta **texto, imágenes y video** (arrastrando, pegando o adjuntando; varias a la vez)
y mantiene el hilo de la conversación.

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo `.env` a partir del ejemplo y pon tu API key de
   [Google AI Studio](https://aistudio.google.com/apikey):

   ```bash
   cp .env.example .env
   ```

   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   # Opcional: cambia los modelos si los de por defecto no están disponibles en tu cuenta
   GEMINI_MODEL=gemini-3.1-pro-preview
   GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
   ```

3. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abre [http://localhost:3000](http://localhost:3000).

## ¿El agente da error?

- **"Falta la API Key de Gemini"** → no configuraste `GEMINI_API_KEY` en `.env`.
- **Error de modelo no encontrado / not found** → el modelo de `GEMINI_MODEL` no está
  habilitado para tu API key. Ejecuta `node list-models.js` para ver los modelos disponibles
  y cambia `GEMINI_MODEL` en tu `.env`.

## Cómo funciona

- `src/app/page.tsx` — interfaz de chat (texto + imágenes + video, drag & drop, generar imagen).
- `src/app/api/chat/route.ts` — endpoint que habla con Gemini y mantiene el historial.
- `src/app/api/generate-image/route.ts` — genera la imagen a partir del prompt.
- `src/lib/prompt-generator.ts` — el "cerebro" del agente (system prompt con la voz de Stly).
- `src/lib/extract-prompt.ts` — extrae el prompt en inglés de la Ficha Técnica.
