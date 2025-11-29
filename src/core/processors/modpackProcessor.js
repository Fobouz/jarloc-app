// src/core/processors/modpackProcessor.js
import JSZip from 'jszip';
import { processSNBT } from '../parsers/snbtUtils';

export const processModpack = async (zipFile) => {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipFile);

    const newOverrides = new JSZip(); // Aquí guardaremos los archivos.snbt modificados
    const langKeys = {}; // Aquí acumularemos TODAS las traducciones
    let filesFound = 0;

    // Recorremos todos los archivos del ZIP
    const entries = Object.keys(loadedZip.files);

    for (const path of entries) {
        const file = loadedZip.files[path];
        if (file.dir) continue;

        // DETECTAR: ¿Es una misión de FTB Quests?
        // Ruta típica: overrides/config/ftbquests/quests/chapters/xxx.snbt
        if (path.includes('config/ftbquests/quests/chapters/') && path.endsWith('.snbt')) {
            const content = await file.async('string');
            const fileName = path.split('/').pop().replace('.snbt', '');

            // ¡Cirugía!
            const result = processSNBT(content, fileName);

            if (Object.keys(result.keys).length > 0) {
                filesFound++;
                // Guardamos las claves extraídas en nuestro diccionario maestro
                Object.assign(langKeys, result.keys);

                // Guardamos el archivo modificado en el nuevo ZIP de salida (carpeta overrides)
                // Mantenemos la estructura relativa
                newOverrides.file(path, result.snbt);
            }
        }
    }

    return {
        overridesZip: newOverrides, // Esto será parte del ZIP final
        langJson: langKeys,         // Esto es lo que enviaremos a la IA para traducir
        count: filesFound
    };
};
