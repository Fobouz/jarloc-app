/**
 * gemini.js
 * Conexión con Google Gemini API.
 */

import JSON5 from 'json5';

export const discoverGeminiModels = async (apiKey) => {
    if (!apiKey) throw new Error("Por favor pega tu API Key primero");
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace('models/', ''))
        .sort();
};

export const translateWithGemini = async (apiKey, model, text, targetLang) => {
    const prompt = `
      TASK: Translate the values of this JSON to target language code: "${targetLang}".
      CRITICAL RULES: 
      1. Output MUST be valid, parseable JSON. No markdown formatting.
      2. DO NOT translate keys.
      3. Preserve all formatting codes (§, %, <br>).

      INPUT JSON:
      ${text}
  `;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 8192,
            }
        })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) throw new Error("La IA no generó respuesta.");

    let txt = data.candidates[0].content.parts[0].text;
    txt = txt.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();

    try {
        return JSON.parse(txt);
    } catch (parseError) {
        try {
            return JSON5.parse(txt);
        } catch (e) {
            let patched = txt;
            if (!patched.trim().endsWith('}')) patched += '}';
            return JSON5.parse(patched);
        }
    }
};
