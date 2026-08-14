require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function main() {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = await ai.models.list();
        for (const model of models) {
            console.log(model.name, model.supportedActions);
        }
    } catch (e) {
        console.error(e);
    }
}
main();
