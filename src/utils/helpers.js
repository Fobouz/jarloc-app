/**
 * helpers.js
 * Pequeñas ayudas y utilidades.
 */

export const isLargeFile = (sizeInBytes) => {
    const LIMIT = 1024 * 1024 * 5; // 5MB limit example
    return sizeInBytes > LIMIT;
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES').format(date);
};

// --- UTILS PARA SPLIT/MERGE (Migrado de index.html) ---

export const splitJson = (data, chunkSize = 25) => {
    if (Array.isArray(data)) {
        const chunks = [];
        for (let i = 0; i < data.length; i += chunkSize) {
            chunks.push(data.slice(i, i + chunkSize));
        }
        return { type: 'list', chunks };
    } else if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        const chunks = [];
        for (let i = 0; i < keys.length; i += chunkSize) {
            const chunkKeys = keys.slice(i, i + chunkSize);
            const chunk = {};
            chunkKeys.forEach(k => chunk[k] = data[k]);
            chunks.push(chunk);
        }
        return { type: 'dict', chunks };
    }
    return null;
};

export const mergeJson = (parts, type) => {
    if (type === 'list') {
        return parts.flat();
    } else if (type === 'dict') {
        return Object.assign({}, ...parts);
    }
    return null;
};
