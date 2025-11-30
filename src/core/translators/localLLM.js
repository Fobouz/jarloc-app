/**
 * localLLM.js
 * Conexión con LLMs locales.
 */

import JSON5 from 'json5';

export const discoverLocalModels = async (url) => {
    const res = await fetch(`${url}/models`);
    if (!res.ok) throw new Error("No se pudo conectar al servidor local. Asegúrate de que esté corriendo y permita CORS.");
    const data = await res.json();

    if (data.data && Array.isArray(data.data)) {
        return data.data.map(m => m.id).sort();
    } else {
        throw new Error("Formato de respuesta desconocido del servidor local.");
    }
};

export const translateWithLocalLLM = async (url, model, text, targetLang) => {
    const prompt = `
      TASK: Translate the values of this JSON to target language code: "${targetLang}".
      CRITICAL RULES: 
      1. Output MUST be valid, parseable JSON. No markdown formatting.
      2. DO NOT translate keys.
      3. Preserve all formatting codes (§, %, <br>).

      INPUT JSON:
      ${text}
  `;

    const res = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: "You are a helpful assistant that translates JSON files." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1
        })
    });

    if (!res.ok) throw new Error(`Error del servidor local: ${res.statusText}`);
    const data = await res.json();
    if (!data.choices?.[0]?.message?.content) throw new Error("La IA local no generó respuesta.");

    let txt = data.choices[0].message.content;
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
