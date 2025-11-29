// src/core/parsers/snbtUtils.js

/**
 * Genera una clave única (hash) corta basada en el texto.
 * Ejemplo: "Hola Mundo" -> "a1b2c3"
 */
export const generateHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convertir a 32bit integer
    }
    // Convertimos a hex y tomamos los últimos 8 caracteres para que sea corto
    return Math.abs(hash).toString(16).substring(0, 8);
};

/**
 * Procesa el contenido de un archivo SNBT (texto plano).
 * 1. Busca títulos, subtítulos y descripciones.
 * 2. Extrae el texto en inglés.
 * 3. Lo reemplaza por una clave {quest.id}.
 * 4. Devuelve el archivo modificado y un mapa de traducciones.
 */
export const processSNBT = (fileContent, chapterName) => {
    const translations = {};
    let modifiedContent = fileContent;

    // 1. Reemplazo de Títulos y Subtítulos (Campos simples)
    // Busca: title: "Texto"  o  subtitle: "Texto"
    const simpleRegex = /(title|subtitle)\s*:\s*"([^"]+)"/g;

    modifiedContent = modifiedContent.replace(simpleRegex, (match, key, text) => {
        // Si ya es una clave (empieza por {), lo ignoramos
        if (text.startsWith("{") && text.endsWith("}")) return match;

        const id = generateHash(text);
        const langKey = `quest.${chapterName}.${key}.${id}`;

        // Guardamos el original para traducir
        translations[langKey] = text;

        // Reemplazamos en el archivo por la clave
        return `${key}: "{${langKey}}"`;
    });

    // 2. Reemplazo de Descripciones (Arrays de strings)
    // Busca: description: [ "Linea 1", "Linea 2" ]
    // Este es más complejo, lo hacemos línea por línea dentro del bloque
    const descBlockRegex = /description\s*:\s*\[([\s\S]*?)\]/g;

    modifiedContent = modifiedContent.replace(descBlockRegex, (match, innerContent) => {
        // Dentro del array, buscamos las cadenas de texto "..."
        const stringRegex = /"([^"]+)"/g;

        const newInner = innerContent.replace(stringRegex, (strMatch, text) => {
            if (text.startsWith("{") && text.endsWith("}")) return strMatch; // Ignorar si ya tiene clave
            if (text.trim() === "") return strMatch; // Ignorar líneas vacías

            const id = generateHash(text);
            const langKey = `quest.${chapterName}.desc.${id}`;

            translations[langKey] = text;

            return `"{${langKey}}"`;
        });

        return `description: [${newInner}]`;
    });

    return {
        snbt: modifiedContent, // El texto del archivo modificado (con claves)
        keys: translations     // El objeto JSON { clave: "Texto Original" }
    };
};
