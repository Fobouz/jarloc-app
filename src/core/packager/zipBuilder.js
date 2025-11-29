/**
 * zipBuilder.js
 * El que arma el ZIP final.
 */

import JSZip from 'jszip'; // Asegúrate de instalar jszip: npm install jszip

export const buildZip = async (files) => {
    const zip = new JSZip();

    // files debe ser un array de objetos { name: "filename.txt", content: "..." }
    files.forEach(file => {
        zip.file(file.name, file.content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    return content;
};
