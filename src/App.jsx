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

  // Refs for runtime access in async loops
  const providerRef = React.useRef(provider);
  const apiKeysRef = React.useRef(apiKeys);
  const selectedModelRef = React.useRef(selectedModel);

  useEffect(() => {
    providerRef.current = provider;
    apiKeysRef.current = apiKeys;
    selectedModelRef.current = selectedModel;
  }, [provider, apiKeys, selectedModel]);

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
  const [batchStatus, setBatchStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'stopped'
  const batchStatusRef = React.useRef(batchStatus);

  useEffect(() => {
    batchStatusRef.current = batchStatus;
  }, [batchStatus]);

  // --- SINGLE TRANSLATION STATE ---
  const [translationStatus, setTranslationStatus] = useState('idle'); // 'idle' | 'translating' | 'paused' | 'stopped'
  const translationStatusRef = React.useRef(translationStatus);

  useEffect(() => {
    translationStatusRef.current = translationStatus;
  }, [translationStatus]);

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

  const getExistingTranslation = async (zip, targetLang) => {
    try {
      let existingFile = null;
      const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;

      // Search for exact match first (e.g., es_es.json)
      zip.forEach((path, entry) => {
        if (!entry.dir && path.includes('/lang/') && path.toLowerCase().endsWith(`${langCode}.json`)) {
          existingFile = path;
        }
      });

      // If not found, try generic (e.g., es.json) if target is 2 chars
      if (!existingFile && targetLang.length === 2) {
        zip.forEach((path, entry) => {
          if (!entry.dir && path.includes('/lang/') && path.toLowerCase().endsWith(`${targetLang}.json`)) {
            existingFile = path;
          }
        });
      }

      if (existingFile) {
        const content = await zip.file(existingFile).async('string');
        return JSON.parse(content);
      }
    } catch (e) {
      console.warn("Error reading existing translation:", e);
    }
    return null;
  };

  const translateWithRetry = async (model, chunkContent, lang, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const currentProvider = providerRef.current;
        const currentKeys = apiKeysRef.current;

        if (currentProvider === 'gemini') {
          return await translateWithGemini(currentKeys.gemini, model, chunkContent, lang);
        } else if (currentProvider === 'local') {
          return await translateWithLocalLLM(localUrl, model, chunkContent, lang);
        } else if (['groq', 'deepseek', 'openrouter'].includes(currentProvider)) {
          return await translateWithOpenAICompatible(currentProvider, currentKeys[currentProvider], model, chunkContent, lang);
        }
      } catch (err) {
        const isOverloaded = err.message.includes('overloaded') || err.message.includes('429');
        if (isOverloaded && i < retries - 1) {
          const waitTime = 2000 * (i + 1);
          console.warn(`Model overloaded. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
          await delay(waitTime);
        } else {
          throw err;
        }
      }
    }
  };

  const processSingleFileTranslation = async (content, model, lang, isBatchMode = false) => {
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
      // Check status at start of each iteration
      const currentStatus = isBatchMode ? batchStatusRef.current : translationStatusRef.current;
      if (currentStatus === 'stopped') break;

      // Pause Logic
      while ((isBatchMode ? batchStatusRef.current : translationStatusRef.current) === 'paused') {
        if ((isBatchMode ? batchStatusRef.current : translationStatusRef.current) === 'stopped') break;
        await delay(500);
      }

      if ((isBatchMode ? batchStatusRef.current : translationStatusRef.current) === 'stopped') break;

      const chunk = chunks[i];
      if (chunks.length > 1) {
        log(`Traduciendo parte ${i + 1} de ${chunks.length}...`, 'info');
      }
      const chunkContent = isLargeFile ? JSON.stringify(chunk, null, 2) : chunk;

      try {
        // Use the ref to get the LATEST selected model, allowing runtime switching
        const currentModel = selectedModelRef.current || model;
        const partJson = await translateWithRetry(currentModel, chunkContent, lang);
        translatedParts.push(partJson);
      } catch (err) {
        // Auto-pause on error
        console.error(err);
        log(`Error en parte ${i + 1}: ${err.message}. Pausando...`, 'error');

        if (isBatchMode) {
          setBatchStatus('paused');
        } else {
          setTranslationStatus('paused');
        }

        // Wait for state update to propagate to refs
        await delay(500);

        i--; // Retry this chunk when resumed
        continue;
      }

      if (chunks.length > 1) await delay(1000);
    }

    if (translationStatusRef.current === 'stopped') {
      throw new Error("Traducción detenida por el usuario.");
    }

    if (isLargeFile) {
      return mergeJson(translatedParts, splitType);
    } else {
      return translatedParts[0];
    }
  };

  const handlePauseBatch = () => setBatchStatus('paused');
  const handleResumeBatch = () => setBatchStatus('running');
  const handleStopBatch = () => setBatchStatus('stopped');
  const handleClearBatch = () => {
    setFiles([]);
    setBatchFiles([]);
    setBatchStatus('idle');
  };

  const handleBatchTranslate = async () => {
    if (batchFiles.length === 0) return;
    setBatchStatus('running');
    setIsTranslating(true);

    const newBatchFiles = [...batchFiles];

    for (let i = 0; i < newBatchFiles.length; i++) {
      // Check status at start of each iteration
      if (batchStatusRef.current === 'stopped') break;

      // Pause Logic
      while (batchStatusRef.current === 'paused') {
        if (batchStatusRef.current === 'stopped') break;
        await delay(500);
      }

      if (batchStatusRef.current === 'stopped') break;

      if (newBatchFiles[i].status === 'pending' || newBatchFiles[i].status === 'error') {
        newBatchFiles[i].status = 'translating';
        setBatchFiles([...newBatchFiles]);

        try {
          // 1. Check if it's a Modpack
          const tempZip = new JSZip();
          const loadedZip = await tempZip.loadAsync(newBatchFiles[i].file);
          const isFTB = Object.keys(loadedZip.files).some(path => path.includes('config/ftbquests/quests/chapters/'));

          let finalTranslation = null;

          if (isFTB) {
            log(`[Batch] Procesando Modpack: ${newBatchFiles[i].name}`, 'info');
            const result = await processModpack(newBatchFiles[i].file);
            if (result.count > 0) {
              // For modpacks, we just need the langJson to be translated
              // But processModpack returns overridesZip.
              // We need to translate the langJson content.
              const jsonContent = JSON.stringify(result.langJson, null, 2);
              finalTranslation = await processSingleFileTranslation(jsonContent, selectedModel, targetLang, true);

              // We need to store the result differently for modpacks in batch? 
              // For now, let's assume we store the translated JSON and handle it in download.
              // Actually, handleBatchDownload expects a ZIP in 'result'.
              // So we need to create a mini-zip here for the result.
              const miniZip = new JSZip();
              // Add overrides
              const overridesFiles = Object.keys(result.overridesZip.files);
              for (const path of overridesFiles) {
                if (!result.overridesZip.files[path].dir) {
                  const content = await result.overridesZip.file(path).async('string');
                  miniZip.file(path, content);
                }
              }
              // Add lang
              const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;
              miniZip.file(`kubejs/assets/kubejs/lang/${langCode}.json`, JSON.stringify(finalTranslation, null, 2));

              const blob = await miniZip.generateAsync({ type: "blob" });
              newBatchFiles[i].result = blob;
              newBatchFiles[i].status = 'done';
            } else {
              newBatchFiles[i].status = 'warning'; // No quests found
            }

          } else {
            // Standard Mod
            log(`[Batch] Traduciendo: ${newBatchFiles[i].name}`, 'info');
            let langPath = null;
            loadedZip.forEach((path, entry) => {
              if (!entry.dir && path.includes('/lang/') && path.endsWith('.json') && path.includes('en_us')) {
                langPath = path;
              }
            });

            if (!langPath) {
              // Try any json in lang
              loadedZip.forEach((path, entry) => {
                if (!entry.dir && path.includes('/lang/') && path.endsWith('.json')) {
                  langPath = path;
                }
              });
            }

            if (langPath) {
              const text = await loadedZip.file(langPath).async('string');

              // --- INCREMENTAL BATCH LOGIC ---
              let contentToTranslate = text;
              let existingTranslation = await getExistingTranslation(loadedZip, targetLang);
              let originalJson = null;

              try {
                originalJson = JSON.parse(text);
                if (existingTranslation) {
                  const missingKeys = {};
                  let missingCount = 0;
                  for (const key in originalJson) {
                    if (!existingTranslation.hasOwnProperty(key)) {
                      missingKeys[key] = originalJson[key];
                      missingCount++;
                    }
                  }
                  if (missingCount === 0) {
                    log(`[Batch] ${newBatchFiles[i].name}: Ya traducido.`, 'success');
                    finalTranslation = existingTranslation;
                    // Skip translation call
                  } else {
                    log(`[Batch] ${newBatchFiles[i].name}: ${missingCount} claves nuevas.`, 'info');
                    contentToTranslate = JSON.stringify(missingKeys, null, 2);
                  }
                }
              } catch (e) {
                // Ignore
              }

              if (!finalTranslation) {
                // Use ref for model to allow switching
                const currentModel = selectedModelRef.current || selectedModel;
                finalTranslation = await processSingleFileTranslation(contentToTranslate, currentModel, targetLang, true);
                if (existingTranslation) {
                  finalTranslation = { ...existingTranslation, ...finalTranslation };
                }
              }
              // -------------------------------

              // Create result ZIP
              const miniZip = new JSZip();
              const langCode = targetLang.length === 2 ? `${targetLang}_${targetLang}` : targetLang;
              const langFileName = `${langCode}.json`;
              let newPath = `assets/translated_mod/lang/${langFileName}`;

              // Try to preserve path structure if possible
              const pathParts = langPath.split('/');
              if (pathParts.length >= 3 && pathParts.includes('lang')) {
                pathParts[pathParts.length - 1] = langFileName;
                newPath = pathParts.join('/');
              }

              miniZip.file(newPath, JSON.stringify(finalTranslation, null, 2));
              const blob = await miniZip.generateAsync({ type: "blob" });
              newBatchFiles[i].result = blob;
              newBatchFiles[i].status = 'done';

            } else {
              newBatchFiles[i].status = 'warning';
              log(`[Batch] No se encontró archivo de idioma en ${newBatchFiles[i].name}`, 'warning');
            }
          }

        } catch (err) {
          console.error(err);
          log(`[Batch] Error en ${newBatchFiles[i].name}: ${err.message}`, 'error');
          newBatchFiles[i].status = 'error';

          // Auto-pause on error
          setBatchStatus('paused');
          log(`[Batch] Proceso PAUSADO por error. Revisa y pulsa Reanudar.`, 'warning');
        }

        setBatchFiles([...newBatchFiles]);
      }
    }

    setIsTranslating(false);
    if (batchStatusRef.current !== 'paused') {
      setBatchStatus('idle');
    }
  };

  const handlePauseTranslation = () => setTranslationStatus('paused');
  const handleResumeTranslation = () => setTranslationStatus('translating');
  const handleStopTranslation = () => setTranslationStatus('stopped');

  const handleTranslate = async () => {
    if (batchMode) {
      await handleBatchTranslate();
      return;
    }

    if (!selectedModel || !fileContent) return;
    setIsTranslating(true);
    setTranslationStatus('translating');

    try {
      log(`Iniciando traducción a ${targetLang} con ${selectedModel}...`, 'info');

      // --- INCREMENTAL LOGIC ---
      let contentToTranslate = fileContent;
      let existingTranslation = null;
      let originalJson = null;

      try {
        originalJson = JSON.parse(fileContent);
        // Only try incremental if it's a valid JSON object/array
        if (files.length > 0 && !isModpack) {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(files[0]);
          existingTranslation = await getExistingTranslation(loadedZip, targetLang);

          if (existingTranslation) {
            log("Se encontró una traducción existente. Analizando claves faltantes...", 'info');
            const missingKeys = {};
            let missingCount = 0;

            // Helper to flatten/compare? For now assume flat or simple nested
            // Simple flat key comparison for now (standard lang files)
            for (const key in originalJson) {
              if (!existingTranslation.hasOwnProperty(key)) {
                missingKeys[key] = originalJson[key];
                missingCount++;
              }
            }

            if (missingCount === 0) {
              log("¡Todas las claves ya están traducidas! Nada nuevo que hacer.", 'success');
              setTranslation(JSON.stringify(existingTranslation, null, 2));
              setIsTranslating(false);
              setTranslationStatus('idle');
              return;
            }

            log(`Se encontraron ${missingCount} claves nuevas/faltantes para traducir.`, 'info');
            contentToTranslate = JSON.stringify(missingKeys, null, 2);
          }
        }
      } catch (e) {
        // Not a JSON or error parsing, skip incremental
      }
      // -------------------------

      const finalJson = await processSingleFileTranslation(contentToTranslate, selectedModel, targetLang);

      // Merge back if incremental
      let result = finalJson;
      if (existingTranslation) {
        result = { ...existingTranslation, ...finalJson };
        log("Traducción incremental completada y fusionada.", 'success');
      } else {
        log("Traducción completada correctamente.", 'success');
      }

      setTranslation(JSON.stringify(result, null, 2));

    } catch (err) {
      console.error(err);
      if (err.message === "Traducción detenida por el usuario.") {
        log("Traducción detenida.", 'warning');
      } else {
        log(`Error: ${err.message}`, 'error');
      }
    } finally {
      setIsTranslating(false);
      setTranslationStatus('idle');
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

        // Add logo as pack.png
        try {
          const logoBlob = await fetch('/logo.png').then(r => r.blob());
          zip.file("pack.png", logoBlob);
        } catch (e) {
          console.warn("No se pudo cargar el logo para pack.png", e);
        }

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
      // Add logo as pack.png
      try {
        const logoBlob = await fetch('/logo.png').then(r => r.blob());
        masterZip.file("pack.png", logoBlob);
      } catch (e) {
        console.warn("No se pudo cargar el logo para pack.png", e);
      }

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
              batchStatus={batchStatus}
              onPause={handlePauseBatch}
              onResume={handleResumeBatch}
              onStop={handleStopBatch}
              onClear={handleClearBatch}
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
              translationStatus={translationStatus}
              onPause={handlePauseTranslation}
              onResume={handleResumeTranslation}
              onStop={handleStopTranslation}
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
