/**
 * openaiCompatible.js
 * Conexión genérica para APIs compatibles con OpenAI (Groq, DeepSeek, OpenRouter).
 */

import JSON5 from 'json5';

export const PROVIDERS_CONFIG = {
    groq: {
        name: 'Groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama3-70b-8192',
        apiKeyLink: 'https://console.groq.com/keys'
    },
    deepseek: {
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com',
        defaultModel: 'deepseek-chat',
        apiKeyLink: 'https://platform.deepseek.com/api_keys'
    },
    openrouter: {
        name: 'OpenRouter',
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultModel: 'mistralai/mistral-7b-instruct:free',
        apiKeyLink: 'https://openrouter.ai/keys'
    }
};

export const discoverOpenAIModels = async (providerKey, apiKey) => {
    if (!apiKey) throw new Error("Por favor pega tu API Key primero");

    const config = PROVIDERS_CONFIG[providerKey];
    if (!config) throw new Error("Proveedor desconocido");

    try {
        const res = await fetch(`${config.baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Normalize response (some APIs return .data, others might differ slightly but usually .data list)
        let models = [];
        if (Array.isArray(data.data)) {
            models = data.data.map(m => m.id);
        } else {
            // Fallback if structure is different
            models = [config.defaultModel];
        }

        return models.sort();
    } catch (e) {
        console.warn(`Error fetching models for ${providerKey}:`, e);
        // Fallback to default model if discovery fails (common in some strict APIs)
        return [config.defaultModel];
    }
};

export const translateWithOpenAICompatible = async (providerKey, apiKey, model, text, targetLang) => {
    const config = PROVIDERS_CONFIG[providerKey];
    const prompt = `
      TASK: Translate the values of this JSON to target language code: "${targetLang}".
      CRITICAL RULES: 
      1. Output MUST be valid, parseable JSON. No markdown formatting.
      2. DO NOT translate keys.
      3. Preserve all formatting codes (§, %, <br>).
      
      INPUT JSON:
      ${text}
  `;

    const body = {
        model: model,
        messages: [
            { role: "system", content: "You are a helpful assistant that translates JSON files. You output ONLY valid JSON." },
            { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" } // Supported by Groq/DeepSeek/OpenRouter usually
    };

    // OpenRouter specific headers
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };

    if (providerKey === 'openrouter') {
        headers['HTTP-Referer'] = 'https://jarloc.app'; // Optional but good practice
        headers['X-Title'] = 'JarLoc';
    }

    const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Error ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.choices?.[0]?.message?.content) throw new Error("La IA no generó respuesta.");

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
