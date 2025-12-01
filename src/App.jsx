import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Download } from 'lucide-react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import Editor from './components/Editor';
import LogConsole from './components/LogConsole';
import BatchProgress from './components/BatchProgress';
import { discoverGeminiModels, translateWithGemini } from './core/translators/gemini';
import { discoverLocalModels, translateWithLocalLLM } from './core/translators/localLLM';
import { discoverOpenAIModels, translateWithOpenAICompatible, PROVIDERS_CONFIG } from './core/translators/openaiCompatible';
import { splitJson, mergeJson } from './utils/helpers';
import { processModpack } from './core/processors/modpackProcessor';
import './App.css';

function App() {
  // --- STATE ---
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'local' | 'groq' | 'deepseek' | 'openrouter'
  const [localUrl, setLocalUrl] = useState('http://localhost:11434/v1');

  // API Keys State
  const [apiKeys, setApiKeys] = useState({
    gemini: localStorage.getItem('gemini_key_v5') || '',
    groq: localStorage.getItem('groq_key') || '',
    deepseek: localStorage.getItem('deepseek_key') || '',
    openrouter: localStorage.getItem('openrouter_key') || ''
  });

  const [modelsList, setModelsList] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [connectionStatus, setConnectionStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const [files, setFiles] = useState([]); // Array of file objects
  const [filesInJar, setFilesInJar] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [logs, setLogs] = useState([]);

  // --- BATCH STATE ---
  const [batchMode, setBatchMode] = useState(false);
  const [batchFiles, setBatchFiles] = useState([]); // { name, file, status: 'pending'|'translating'|'done'|'error', result: blob }
  const [basePacks, setBasePacks] = useState([]); // Array of existing resource packs to merge

  // --- MODPACK STATE ---
  const [isModpack, setIsModpack] = useState(false);
  const [modpackOverrides, setModpackOverrides] = useState(null); // JSZip object with modified SNBTs

  // --- LOGGING ---
  const log = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  // --- HANDLERS ---

  const handleApiKeyChange = (value) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  const handleConnect = async () => {
    setConnectionStatus('loading');
    setModelsList([]);
    const providerName = provider === 'local' ? 'Local LLM' :
      provider === 'gemini' ? 'Google Gemini' :
        PROVIDERS_CONFIG[provider]?.name || provider;

    log(`Conectando a ${providerName}...`, 'info');

    try {
      let validModels = [];
      if (provider === 'gemini') {
        validModels = await discoverGeminiModels(apiKeys.gemini);
        localStorage.setItem('gemini_key_v5', apiKeys.gemini);
      } else if (provider === 'local') {
        validModels = await discoverLocalModels(localUrl);
      } else if (['groq', 'deepseek', 'openrouter'].includes(provider)) {
        validModels = await discoverOpenAIModels(provider, apiKeys[provider]);
        localStorage.setItem(`${provider}_key`, apiKeys[provider]);
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

  const handleBasePacks = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) {
      setBasePacks(selected);
      log(`${selected.length} packs base seleccionados para fusión.`, 'info');
    }
  };

  const handleFile = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);
    setFilesInJar([]);
    setTranslation('');
    setFileContent('');
    setCurrentPath(null);
    setIsModpack(false);
    setModpackOverrides(null);

    if (selectedFiles.length > 1) {
      // BATCH MODE
      setBatchMode(true);
      setBatchFiles(selectedFiles.map(f => ({
        name: f.name,
        file: f,
        status: 'pending',
        result: null
      })));
      log(`Modo Lote activado. ${selectedFiles.length} archivos seleccionados.`, 'info');
    } else {
      // SINGLE MODE
      setBatchMode(false);
      const f = selectedFiles[0];
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
    }
  };

  const handleSelectFile = async (path) => {
    if (isModpack) return; // In modpack mode, we only have one virtual file already loaded

    setCurrentPath(path);
    setTranslation('');
    try {
      const zip = new JSZip();
      const z = await zip.loadAsync(files[0]);
      const text = await z.file(path).async('string');
      setFileContent(text);
    } catch (e) {
      log("Error leyendo archivo interno.", 'error');
    }
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const translateWithRetry = async (apiKey, model, chunkContent, lang, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        if (provider === 'gemini') {
          return await translateWithGemini(apiKeys.gemini, model, chunkContent, lang);
        } else if (provider === 'local') {
          return await translateWithLocalLLM(localUrl, model, chunkContent, lang);
        } else if (['groq', 'deepseek', 'openrouter'].includes(provider)) {
          return await translateWithOpenAICompatible(provider, apiKeys[provider], model, chunkContent, lang);
        }
      } catch (err) {
        const isOverloaded = err.message.includes('overloaded') || err.message.includes('429');
        if (isOverloaded && i < retries - 1) {
          const waitTime = 2000 * (i + 1); // Exponential backoff: 2s, 4s, 6s...
          console.warn(`Model overloaded. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
          await delay(waitTime);
        } else {
          throw err;
        }
      }
    }
  };

  const processSingleFileTranslation = async (content, model, lang) => {
    // Helper function to reuse translation logic
    let isLargeFile = content.length > 15000;
    let chunks = [];
    let splitType = null;

    if (isLargeFile) {
      try {
        const json = JSON.parse(content);
        const splitResult = splitJson(json, 25);
        if (splitResult) {
          chunks = splitResult.chunks;
          splitType = splitResult.type;
        } else {
          isLargeFile = false;
        }
      } catch (e) {
        isLargeFile = false;
      }
    }

    if (!isLargeFile) chunks = [content];

    const translatedParts = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunks.length > 1) {
        log(`Traduciendo parte ${i + 1} de ${chunks.length}...`, 'info');
      }
      const chunkContent = isLargeFile ? JSON.stringify(chunk, null, 2) : chunk;

      // Use retry wrapper
      const partJson = await translateWithRetry(apiKey, model, chunkContent, lang);
      translatedParts.push(partJson);

      // Small delay between chunks to be nice to the API
      if (chunks.length > 1) await delay(1000);
    }

    if (isLargeFile) {
      return mergeJson(translatedParts, splitType);
    } else {
      return translatedParts[0];
    }
  };

  const handleBatchTranslate = async () => {
    if (!selectedModel) return;
    setIsTranslating(true);

    const newBatchFiles = [...batchFiles];

    for (let i = 0; i < newBatchFiles.length; i++) {
      const item = newBatchFiles[i];
      if (item.status === 'done' || item.status === 'warning') continue;

      // Update status to translating
      newBatchFiles[i] = { ...item, status: 'translating' };
      setBatchFiles([...newBatchFiles]);
      log(`Procesando archivo ${i + 1}/${newBatchFiles.length}: ${item.name}...`, 'info');

      try {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(item.file);

        // 1. Find Source Language File (en_us.json or any .json)
        let sourcePath = null;
        loadedZip.forEach((path, entry) => {
          if (!entry.dir && path.includes('/lang/') && path.endsWith('en_us.json')) {
            sourcePath = path;
          }
        });

        if (!sourcePath) {
          loadedZip.forEach((path, entry) => {
            if (!entry.dir && path.includes('/lang/') && path.endsWith('.json')) {
              sourcePath = path;
            }
          });
        }

        if (!sourcePath) {
          newBatchFiles[i] = { ...item, status: 'warning' };
          setBatchFiles([...newBatchFiles]);
          log(`Advertencia en ${item.name}: No se encontró archivo de idioma base. Saltando...`, 'warning');
          continue;
        }

        // 2. Read Source Content
        const sourceContentStr = await loadedZip.file(sourcePath).async('string');
        let sourceJson = {};
        try {
          sourceJson = JSON.parse(sourceContentStr);
        } catch (e) {
          // Try JSON5 or loose parsing if strictly needed, but usually standard JSON for MC
          console.error("Error parsing source JSON", e);
          throw new Error("El archivo de idioma base está corrupto.");
        }

        // 3. Check for Existing Target Language File (Incremental Translation)
        const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;
        const targetFileName = `${langCode}.json`;
        let existingTargetPath = null;

        // Try to find the target file in the same folder structure as source
        const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/') + 1);
        const potentialPath = sourceDir + targetFileName;

        if (loadedZip.file(potentialPath)) {
          existingTargetPath = potentialPath;
        }

        let existingTargetJson = {};
        let keysToTranslate = {};
        let reusedCount = 0;

        if (existingTargetPath) {
          log(`  -> Archivo de idioma existente detectado (${targetFileName}). Analizando faltantes...`, 'info');
          try {
            const existingContentStr = await loadedZip.file(existingTargetPath).async('string');
            existingTargetJson = JSON.parse(existingContentStr);

            // Compare keys
            Object.keys(sourceJson).forEach(key => {
              if (!existingTargetJson[key]) {
                keysToTranslate[key] = sourceJson[key];
              } else {
                reusedCount++;
              }
            });

            if (Object.keys(keysToTranslate).length === 0) {
              log(`  -> ¡Traducción completa encontrada! Reusando 100% (${reusedCount} textos).`, 'success');
            } else {
              log(`  -> Reusando ${reusedCount} textos. Traduciendo ${Object.keys(keysToTranslate).length} nuevos...`, 'info');
            }

          } catch (e) {
            console.warn("Error parsing existing target file, ignoring it.", e);
            keysToTranslate = sourceJson; // Fallback to full translation
          }
        } else {
          keysToTranslate = sourceJson;
        }

        // 4. Translate (if needed)
        let finalTranslatedJson = { ...existingTargetJson };

        if (Object.keys(keysToTranslate).length > 0) {
          const contentToTranslate = JSON.stringify(keysToTranslate, null, 2);
          const translatedPart = await processSingleFileTranslation(contentToTranslate, selectedModel, targetLang);

          // Merge new translations
          finalTranslatedJson = { ...finalTranslatedJson, ...translatedPart };
        }

        // 5. Generate Result ZIP
        const resultZip = new JSZip();
        const newPath = `assets/translated_mod/lang/${targetFileName}`;

        resultZip.file(newPath, JSON.stringify(finalTranslatedJson, null, 2));
        resultZip.file("pack.mcmeta", JSON.stringify({
          pack: {
            pack_format: 15,
            description: `Traducción IA (${targetLang}) por JarLoc: ${item.name}`
          }
        }, null, 2));

        const blob = await resultZip.generateAsync({ type: "blob" });

        newBatchFiles[i] = { ...item, status: 'done', result: blob };
        setBatchFiles([...newBatchFiles]);
        log(`Archivo ${item.name} completado.`, 'success');

        // Delay between files only if we actually translated something
        if (Object.keys(keysToTranslate).length > 0) {
          await delay(1000);
        }

      } catch (err) {
        console.error(err);
        newBatchFiles[i] = { ...item, status: 'error' };
        setBatchFiles([...newBatchFiles]);
        log(`Error en ${item.name}: ${err.message}`, 'error');
      }
    }

    setIsTranslating(false);
    log("Proceso por lotes finalizado.", 'success');
  };

  const handleTranslate = async () => {
    if (batchMode) {
      await handleBatchTranslate();
      return;
    }

    if (!selectedModel || !fileContent) return;
    setIsTranslating(true);

    try {
      // Reuse the helper function logic, but kept inline for now to match original flow or refactor
      // For minimal risk, I'll use the helper here too since it encapsulates the same logic

      log(`Iniciando traducción a ${targetLang} con ${selectedModel}...`, 'info');
      const finalJson = await processSingleFileTranslation(fileContent, selectedModel, targetLang);

      setTranslation(JSON.stringify(finalJson, null, 2));
      log("Traducción completada correctamente.", 'success');

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
            description: `Traducción IA (${targetLang}) por JarLoc: ${files[0].name}`
          }
        }, null, 2));

        const b = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `JarLoc_${files[0].name.replace('.jar', '').replace('.zip', '')}_${targetLang.toUpperCase()}.zip`;
        a.click();
        log("Resource Pack descargado.", 'success');
      }
    } catch (e) {
      console.error(e);
      log("Error al generar el ZIP.", 'error');
    }
  };

  const handleBatchDownload = async () => {
    try {
      const masterZip = new JSZip();
      let count = 0;
      let mergedPacksCount = 0;

      // 1. Merge Base Packs (if any)
      if (basePacks.length > 0) {
        log(`Fusionando ${basePacks.length} packs base...`, 'info');
        for (const pack of basePacks) {
          try {
            const loadedPack = await new JSZip().loadAsync(pack);
            loadedPack.forEach((relativePath, zipEntry) => {
              if (!zipEntry.dir) {
                masterZip.file(relativePath, zipEntry.async('blob'));
              }
            });
            mergedPacksCount++;
          } catch (err) {
            console.error(`Error merging base pack ${pack.name}`, err);
            log(`Error al leer pack base ${pack.name}`, 'error');
          }
        }
      }

      // 2. Merge Translated Files
      for (const item of batchFiles) {
        if (item.status === 'done' && item.result) {
          try {
            // Load the individual resource pack zip
            const individualZip = await new JSZip().loadAsync(item.result);

            // Copy files from individual zip to master zip
            individualZip.forEach((relativePath, zipEntry) => {
              if (!zipEntry.dir && relativePath !== 'pack.mcmeta') { // Skip pack.mcmeta to avoid conflicts
                // We read the content and write it to the master zip
                // This effectively merges the assets folders
                masterZip.file(relativePath, zipEntry.async('blob'));
              }
            });
            count++;
          } catch (err) {
            console.error(`Error merging ${item.name}`, err);
            log(`Error al fusionar ${item.name}`, 'error');
          }
        }
      }

      if (count === 0 && mergedPacksCount === 0) return;

      // 3. Add a unified pack.mcmeta (if not already present from base packs, or overwrite it)
      // We always overwrite to ensure the description is correct
      masterZip.file("pack.mcmeta", JSON.stringify({
        pack: {
          pack_format: 15,
          description: `Pack Fusionado (${targetLang}) por JarLoc - ${mergedPacksCount} bases + ${count} traducciones`
        }
      }, null, 2));

      // 4. Generate and download the master zip
      const b = await masterZip.generateAsync({ type: "blob" });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `JarLoc_Merged_${targetLang.toUpperCase()}.zip`;
      a.click();
      log(`Lote fusionado descargado (${mergedPacksCount} bases + ${count} traducciones).`, 'success');

    } catch (e) {
      console.error(e);
      log("Error al generar el ZIP fusionado.", 'error');
    }
  };

  return (
    <div className="app-container min-h-screen flex flex-col text-gray-100 font-sans selection:bg-fuchsia-500/30">
      <Header
        provider={provider} setProvider={setProvider}
        apiKeys={apiKeys} onApiKeyChange={handleApiKeyChange}
        localUrl={localUrl} setLocalUrl={setLocalUrl}
        modelsList={modelsList} selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        targetLang={targetLang} setTargetLang={setTargetLang}
        onConnect={handleConnect} connectionStatus={connectionStatus}
      />

      <main className="flex-1 flex flex-col p-4 gap-4 max-w-7xl mx-auto w-full">
        <div className="top-section grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploader
            files={files}
            onFileChange={handleFile}
            title="1. Sube tus Mods/Modpacks (.jar)"
            subtitle="Arrastra los mods o modpacks que quieres traducir"
          />
          <FileUploader
            files={basePacks}
            onFileChange={handleBasePacks}
            title="2. (Opcional) Packs Base"
            subtitle="Arrastra texture packs o traducciones previas para fusionar"
          />
        </div>

        {/* Merge Button for Base Packs Only */}
        {basePacks.length > 0 && !batchMode && (
          <div className="flex justify-center">
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl transition-all font-bold shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:scale-105"
            >
              <Download size={20} />
              Fusionar y Descargar
            </button>
          </div>
        )}

        <div className="middle-section flex-1 flex min-h-0">
          {batchMode ? (
            <BatchProgress
              batchFiles={batchFiles}
              onDownloadAll={handleBatchDownload}
              onTranslate={handleTranslate}
              isTranslating={isTranslating}
            />
          ) : (
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
          )}
        </div>

        <div className="bottom-section">
          <LogConsole logs={logs} />
        </div>
      </main>
    </div>
  );
}

export default App;
