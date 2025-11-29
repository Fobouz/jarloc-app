import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import LogConsole from './components/LogConsole';
import { discoverGeminiModels, translateWithGemini } from './core/translators/gemini';
import { discoverLocalModels, translateWithLocalLLM } from './core/translators/localLLM';
import { splitJson, mergeJson } from './utils/helpers';
import { processModpack } from './core/processors/modpackProcessor';
import './App.css';

function App() {
  // --- STATE ---
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'local'
  const [localUrl, setLocalUrl] = useState('http://localhost:11434/v1');
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key_v5') || '');

  const [modelsList, setModelsList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const [file, setFile] = useState(null);
  const [filesInJar, setFilesInJar] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [logs, setLogs] = useState([]);

  // --- MODPACK STATE ---
  const [isModpack, setIsModpack] = useState(false);
  const [modpackOverrides, setModpackOverrides] = useState(null); // JSZip object with modified SNBTs

  // --- LOGGING ---
  const log = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  // --- HANDLERS ---

  const handleConnect = async () => {
    setConnectionStatus('loading');
    setModelsList([]);
    log(`Conectando a ${provider === 'gemini' ? 'Google Gemini' : 'Local LLM'}...`, 'info');

    try {
      let validModels = [];
      if (provider === 'gemini') {
        validModels = await discoverGeminiModels(apiKey);
        localStorage.setItem('gemini_key_v5', apiKey);
      } else {
        validModels = await discoverLocalModels(localUrl);
      }

      if (validModels.length === 0) throw new Error("No se encontraron modelos disponibles.");

      setModelsList(validModels);
      setSelectedModel(validModels[0]);
      setConnectionStatus('success');
      log(`Conectado. ${validModels.length} modelos encontrados.`, 'success');
    } catch (err) {
      setConnectionStatus('error');
      log(`Error de conexión: ${err.message}`, 'error');
    }
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);
    setFilesInJar([]);
    setTranslation('');
    setFileContent('');
    setCurrentPath(null);
    setIsModpack(false);
    setModpackOverrides(null);

    log(`Analizando archivo: ${f.name}...`, 'info');

    try {
      // 1. Check if it's a Modpack (look for config/ftbquests)
      const tempZip = new JSZip();
      const loadedZip = await tempZip.loadAsync(f);
      const isFTB = Object.keys(loadedZip.files).some(path => path.includes('config/ftbquests/quests/chapters/'));

      if (isFTB) {
        log("Modpack detectado (FTB Quests). Iniciando extracción de textos...", 'info');
        setIsModpack(true);

        const result = await processModpack(f);

        if (result.count === 0) {
          log("No se encontraron misiones (quests) para traducir.", 'warning');
          return;
        }

        setModpackOverrides(result.overridesZip);

        // Prepare the extracted keys as a "virtual file" content
        const jsonContent = JSON.stringify(result.langJson, null, 2);
        setFileContent(jsonContent);

        // Add a virtual path to the list so it can be selected (though it's auto-selected)
        const virtualPath = "ftbquests/lang/en_us.json";
        setFilesInJar([virtualPath]);
        setCurrentPath(virtualPath);

        log(`Extracción completada. ${result.count} archivos procesados. ${Object.keys(result.langJson).length} textos extraídos.`, 'success');

      } else {
        // 2. Standard Mod Logic
        const list = [];
        loadedZip.forEach((path, entry) => {
          if (!entry.dir && path.includes('/lang/') && path.endsWith('.json')) {
            list.push(path);
          }
        });
        setFilesInJar(list);
        log(`Archivo cargado. ${list.length} traducciones encontradas.`, 'success');
      }

    } catch (e) {
      console.error(e);
      log("Error: El archivo no es un JAR/ZIP válido.", 'error');
    }
  };

  const handleSelectFile = async (path) => {
    if (isModpack) return; // In modpack mode, we only have one virtual file already loaded

    setCurrentPath(path);
    setTranslation('');
    try {
      const zip = new JSZip();
      const z = await zip.loadAsync(file);
      const text = await z.file(path).async('string');
      setFileContent(text);
    } catch (e) {
      log("Error leyendo archivo interno.", 'error');
    }
  };

  const handleTranslate = async () => {
    if (!selectedModel || !fileContent) return;
    setIsTranslating(true);

    try {
      // 1. Detectar si es un archivo grande
      let isLargeFile = fileContent.length > 15000;
      let chunks = [];
      let splitType = null;

      if (isLargeFile) {
        try {
          const json = JSON.parse(fileContent);
          const splitResult = splitJson(json, 25);
          if (splitResult) {
            chunks = splitResult.chunks;
            splitType = splitResult.type;
            log(`Archivo grande detectado (${fileContent.length} chars). Dividido en ${chunks.length} partes.`, 'info');
          } else {
            log("No se pudo dividir el archivo (estructura no soportada). Se traducirá en un solo bloque.", 'warning');
            isLargeFile = false;
          }
        } catch (e) {
          log(`Error al analizar JSON para dividir: ${e.message}. Se traducirá en un solo bloque.`, 'warning');
          isLargeFile = false;
        }
      } else {
        log(`Archivo pequeño (${fileContent.length} chars). Se traducirá en un solo bloque.`, 'info');
      }

      if (!isLargeFile) chunks = [fileContent];

      const translatedParts = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = isLargeFile ? JSON.stringify(chunks[i], null, 2) : chunks[i];

        if (isLargeFile) {
          log(`Traduciendo parte ${i + 1}/${chunks.length}...`, 'info');
        } else {
          log(`Iniciando traducción a ${targetLang} con ${selectedModel}...`, 'info');
        }

        let partJson;
        if (provider === 'gemini') {
          partJson = await translateWithGemini(apiKey, selectedModel, chunkContent, targetLang);
        } else {
          partJson = await translateWithLocalLLM(localUrl, selectedModel, chunkContent, targetLang);
        }

        translatedParts.push(partJson);
      }

      // MERGE
      let finalJson;
      if (isLargeFile) {
        finalJson = mergeJson(translatedParts, splitType);
        log(`¡Todas las partes (${chunks.length}) traducidas y unidas!`, 'success');
      } else {
        finalJson = translatedParts[0];
        log("Traducción completada correctamente.", 'success');
      }

      setTranslation(JSON.stringify(finalJson, null, 2));

    } catch (err) {
      console.error(err);
      log(`Error: ${err.message}`, 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = async () => {
    if (!translation) return;
    try {
      const zip = new JSZip();

      if (isModpack) {
        // --- MODPACK EXPORT ---
        // 1. Add modified SNBTs (from overridesZip)
        // We need to copy files from modpackOverrides (JSZip) to the new zip
        // Since JSZip doesn't have a direct "merge", we iterate
        const overridesFiles = Object.keys(modpackOverrides.files);
        for (const path of overridesFiles) {
          if (!modpackOverrides.files[path].dir) {
            const content = await modpackOverrides.file(path).async('string');
            zip.file(path, content);
          }
        }

        // 2. Add the translated language file (KubeJS format)
        // assets/kubejs/lang/xx_xx.json
        const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;
        zip.file(`kubejs/assets/kubejs/lang/${langCode}.json`, translation);

        zip.file("pack.mcmeta", JSON.stringify({
          pack: {
            pack_format: 15,
            description: `Traducción Modpack (${targetLang}) por JarLoc`
          }
        }, null, 2));

        const b = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `JarLoc_Modpack_${targetLang.toUpperCase()}.zip`;
        a.click();
        log("Modpack traducido descargado. Descomprime en la carpeta del modpack.", 'success');

      } else {
        // --- STANDARD MOD EXPORT ---
        const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;
        const langFileName = `${langCode}.json`;

        let newPath = `assets/translated_mod/lang/${langFileName}`;

        if (currentPath) {
          const pathParts = currentPath.split('/');
          if (pathParts.length >= 3 && pathParts.includes('lang')) {
            pathParts[pathParts.length - 1] = langFileName;
            newPath = pathParts.join('/');
          }
        }

        zip.file(newPath, translation);
        zip.file("pack.mcmeta", JSON.stringify({
          pack: {
            pack_format: 15,
            description: `Traducción IA (${targetLang}) por JarLoc: ${file.name}`
          }
        }, null, 2));

        const b = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `JarLoc_${file.name.replace('.jar', '').replace('.zip', '')}_${targetLang.toUpperCase()}.zip`;
        a.click();
        log("Resource Pack descargado.", 'success');
      }
    } catch (e) {
      console.error(e);
      log("Error al generar el ZIP.", 'error');
    }
  };

  return (
    <div className="app-container min-h-screen flex flex-col bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      <Header
        provider={provider} setProvider={setProvider}
        apiKey={apiKey} setApiKey={setApiKey}
        localUrl={localUrl} setLocalUrl={setLocalUrl}
        modelsList={modelsList} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        targetLang={targetLang} setTargetLang={setTargetLang}
        onConnect={handleConnect} connectionStatus={connectionStatus}
      />

      <main className="flex-1 flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
        <div className="top-section">
          <FileUploader
            file={file}
            onFileChange={handleFile}
            filesInJar={filesInJar}
          />
        </div>

        <div className="middle-section flex-1 flex min-h-0">
          <Editor
            filesInJar={filesInJar}
            currentPath={currentPath}
            onSelectFile={handleSelectFile}
            fileContent={fileContent}
            translation={translation}
            onTranslate={handleTranslate}
            isTranslating={isTranslating}
            onDownload={handleDownload}
          />
        </div>

        <div className="bottom-section">
          <LogConsole logs={logs} />
        </div>
      </main>
    </div>
  );
}

export default App;
