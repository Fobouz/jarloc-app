# JarLoc Core v1.0

Prueba la aplicación aquí: [https://jarloc-app.vercel.app/](https://jarloc-app.vercel.app/)

**JarLoc Core** es una herramienta web moderna y potente diseñada para traducir mods y modpacks de Minecraft de forma automática utilizando Inteligencia Artificial. Soporta tanto **Google Gemini** como **LLMs Locales** (vía Ollama), ofreciendo flexibilidad y privacidad.

![JarLoc Logo](public/logo.png)

## Características Principales

*   **Traducción de Mods (.jar)**: Sube tus archivos `.jar` y traduce sus archivos de idioma (`en_us.json`, etc.) automáticamente.
*   **Soporte para Modpacks**: Detecta y traduce misiones de **FTB Quests** y otros archivos de configuración.
*   **Traducción por Lotes (Batch)**: Sube múltiples mods a la vez y procésalos en cola.
*   **Fusión de Resource Packs**:
    *   Combina múltiples paquetes de recursos o traducciones previas en un solo archivo.
    *   Fusiona nuevas traducciones con tus packs base existentes automáticamente.
*   **IA Flexible**:
    *   **Google Gemini**: Rápido y de alta calidad (requiere API Key gratuita).
    *   **Local LLM**: Usa tus propios modelos (Llama 3, Mistral, etc.) corriendo en local con Ollama.
*   **Interfaz Moderna**: Diseño intuitivo con Drag & Drop, modo oscuro y seguimiento de progreso en tiempo real.
*   **Manejo de Errores**: Reintentos automáticos si la API está saturada y alertas visuales.

## Cómo Usar

### 1. Configuración de la IA
*   **Google Gemini**: Selecciona "Gemini" en la barra superior y pega tu API Key.
*   **Local LLM**: Asegúrate de tener [Ollama](https://ollama.com/) corriendo (`ollama serve`) y selecciona "Local LLM". La URL por defecto es `http://localhost:11434`.

### 2. Traducir un Solo Mod
1.  Arrastra tu archivo `.jar` al área de carga "1. Sube tus Mods".
2.  Selecciona el archivo de idioma que quieres traducir de la lista lateral.
3.  Haz clic en el botón de la flecha (->) para traducir.
4.  Revisa la traducción y haz clic en "Descargar" para obtener el Resource Pack.

### 3. Traducción por Lotes (Batch)
1.  Arrastra **varios** archivos `.jar` al área de carga "1. Sube tus Mods".
2.  (Opcional) Arrastra packs de texturas o traducciones viejas al área "2. Packs Base".
3.  Haz clic en "Traducir Lote".
4.  Al finalizar, haz clic en "Fusionar y Descargar" para obtener un único ZIP con todo.

### 4. Solo Fusionar Packs
1.  Arrastra tus resource packs existentes al área "2. Packs Base".
2.  Haz clic en el botón "Fusionar y Descargar" que aparecerá automáticamente.

## Instalación (Desarrollo)

Si quieres ejecutar este proyecto localmente:

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/jarloc-core.git

# Instalar dependencias
cd jarloc-core
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Historial de Versiones

### v1.1fix (Neon Update)
*   **Nuevo Tema Visual**: Diseño "Neon-Galactic" con modo oscuro profundo y acentos brillantes.
*   **Mejoras en Consola**:
    *   Logs detallados al dividir archivos grandes ("Traduciendo parte X de Y...").
    *   Fix: La consola ya no fuerza el scroll de toda la página.
*   **Correcciones**: Solucionado error de pantalla blanca en algunos navegadores.

## Enlaces

*   **Web Oficial**: [https://jarloc-app.vercel.app/](https://jarloc-app.vercel.app/)
*   **Reportar Bugs**: Por favor usa la sección de Issues en GitHub.

---

<div align="center">
  <p>¿Te gusta JarLoc? ¡Considera apoyarme!</p>
  <a href='https://ko-fi.com/foboz' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' />
  </a>
</div>
