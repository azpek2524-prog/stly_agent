# Agente Stly · Generador de Ideas

Director creativo de IA para la marca **Stly**. Le mandas una referencia —una foto, un reel,
un ángulo de cámara, una idea de prenda o simplemente una duda— y el agente:

- **Chatea contigo** para aclarar dudas y refinar la idea.
- **Genera la Ficha Técnica Visual** con un prompt en inglés listo para pegar en
  **Google AI Studio** (Nano Banana 2 / Gemini 3 Image).

Acepta texto e imágenes (varias a la vez) y mantiene el hilo de la conversación.

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
   # Opcional: cambia el modelo si el de por defecto no está disponible en tu cuenta
   GEMINI_MODEL=gemini-3.1-pro-preview
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

- `src/app/page.tsx` — interfaz de chat (texto + imágenes).
- `src/app/api/chat/route.ts` — endpoint que habla con Gemini y mantiene el historial.
- `src/lib/prompt-generator.ts` — el "cerebro" del agente (system prompt con la voz de Stly).
