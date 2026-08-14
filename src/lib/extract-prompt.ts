/**
 * Extrae el "PROMPT GENERADOR" en inglés de una Ficha Técnica Visual.
 * Devuelve null si el mensaje no contiene una sección de prompt.
 */
export function extractGeneratorPrompt(markdown: string): string | null {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const headingIdx = lines.findIndex(
    (line) => /^#{1,6}\s/.test(line) && /prompt\s+generador/i.test(line)
  );
  if (headingIdx === -1) return null;

  // Recogemos todo hasta el siguiente encabezado markdown.
  const collected: string[] = [];
  for (let i = headingIdx + 1; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i])) break;
    collected.push(lines[i]);
  }

  let prompt = collected.join("\n").trim();

  // Limpiamos envoltorios comunes: fences de código, corchetes de plantilla, comillas.
  prompt = prompt
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
  if (prompt.startsWith("[") && prompt.endsWith("]")) {
    prompt = prompt.slice(1, -1).trim();
  }

  return prompt.length > 0 ? prompt : null;
}
