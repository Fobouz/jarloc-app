/**
 * jsonParser.js
 * Lógica para parsear archivos JSON.
 */

export const parseJSON = (content) => {
    try {
        return JSON.parse(content);
    } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
    }
};
