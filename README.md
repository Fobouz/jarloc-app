# JarLoc Core v1.3

Prueba la aplicación aquí: [https://jarloc-app.vercel.app/](https://jarloc-app.vercel.app/)

**JarLoc Core** es una herramienta web moderna y potente diseñada para traducir mods y modpacks de Minecraft de forma automática utilizando Inteligencia Artificial. Soporta múltiples proveedores como **Google Gemini**, **Groq**, **DeepSeek** y **LLMs Locales** (vía Ollama), ofreciendo máxima flexibilidad y privacidad.

![JarLoc Logo](public/logo.png)

## Características Principales

*   **Traducción de Mods (.jar)**: Sube tus archivos `.jar` y traduce sus archivos de idioma (`en_us.json`, etc.) automáticamente.
*   **Soporte para Modpacks**: Detecta y traduce misiones de **FTB Quests** y otros archivos de configuración.
*   **Traducción por Lotes (Batch)**: Sube múltiples mods a la vez y procésalos en cola.
*   **Controles de Lote**: Pausa, reanuda, cancela o limpia la cola de traducción en cualquier momento.
*   **Traducción Incremental**: Detecta claves ya traducidas para ahorrar tiempo y tokens.
*   **Fusión de Resource Packs**:
    *   Combina múltiples paquetes de recursos o traducciones previas en un solo archivo.
    *   Fusiona nuevas traducciones con tus packs base existentes automáticamente.
*   **IA Flexible**:
    *   **Google Gemini**: Rápido, gratuito y de alta calidad.
    *   **Groq / DeepSeek / OpenRouter**: Velocidad extrema y modelos de última generación.
    *   **Local LLM**: Privacidad total usando tus propios modelos con Ollama.
*   **Interfaz Moderna**: Diseño "Neon-Galactic" con modo oscuro, efectos de cristal y seguimiento en tiempo real.

## Cómo Usar

### 1. Configuración de la IA
*   **Google Gemini**: Selecciona "Gemini" y pega tu API Key.
*   **Groq / DeepSeek / OpenRouter**: Selecciona el proveedor correspondiente y usa tu API Key.
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
4.  Usa los controles (Pausa/Reanudar) si necesitas detener el proceso temporalmente.
5.  Al finalizar, haz clic en "Fusionar y Descargar" para obtener un único ZIP con todo.

### 4. Solo Fusionar Packs
1.  Arrastra tus resource packs existentes al área "2. Packs Base".
2.  Haz clic en el botón "Fusionar y Descargar" que aparecerá automáticamente.

## 🛠️ Instalación de Traducciones (Modpacks)

Una vez que hayas traducido tus mods o modpack completo, aquí te explicamos cómo instalarlos:

### Opción A: Mods Sueltos (Carpeta `mods`)
Si tradujiste archivos `.jar` individuales:
1. Ve a tu carpeta de instalación de Minecraft (o del perfil de CurseForge/Prism).
2. Abre la carpeta `mods`.
3. **Reemplaza** los archivos originales con los nuevos `.jar` traducidos que descargaste de JarLoc.
   - *Nota: JarLoc mantiene el nombre original del archivo para facilitar esto.*

### Opción B: Modpack Completo (Resource Pack + Mods)
Si usaste la función de "Fusionar Packs" o procesaste un Modpack:

> [!IMPORTANT]
> **Requisito Obligatorio**: Para que las traducciones de modpacks funcionen, el mod **KubeJS** (y sus dependencias como Rhino) debe estar instalado en tu instancia. Si el modpack no lo incluye, descárgalo e instálalo manualmente.

**1. Archivos `.jar` (Mods)**
- Igual que la Opción A: reemplaza los `.jar` en la carpeta `mods` con los traducidos.

**2. Archivos de Configuración (FTB Quests, etc.)**
- Si el ZIP incluye carpetas como `config` o `kubejs`, arrástralas a la raíz de tu instancia de Minecraft y sobrescribe.

**3. Resource Pack (Idioma)**
- El archivo `resources.zip` (o similar) generado es un **Resource Pack**.
- Colócalo en la carpeta `resourcepacks` de tu instancia.
- En el juego, ve a `Opciones` -> `Paquetes de Recursos` y activa el paquete "Traducción IA por JarLoc".
- Asegúrate de que esté **arriba** en la lista de prioridades.

## Historial de Versiones

### v1.3 (Batch Controls & Polish)
- **Controles de Lote**: Nuevos botones para **Pausar**, **Reanudar**, **Cancelar** y **Limpiar** la cola de traducción.
- **Manejo de Errores Inteligente**: Auto-pausa en caso de errores de API para evitar fallos en cascada.
- **UI Polish**: Mejoras visuales generales, selección de texto personalizada y transiciones más suaves.

### v1.2 (Multi-Provider & Smart Batch)
- **Nuevos Proveedores**: Soporte nativo para **Groq**, **DeepSeek** y **OpenRouter**.
- **Traducción Incremental**: Ahorro de tokens traduciendo solo lo nuevo.
- **Descarga Parcial**: Descarga archivos individuales de un lote en cuanto están listos.

### v1.1fix (Neon Update)
- **Nuevo Tema Visual**: Diseño "Neon-Galactic".
- **Mejoras en Consola**: Logs detallados y fix de auto-scroll.

## Instalación (Desarrollo)

Si quieres ejecutar este proyecto localmente:

```bash
git clone https://github.com/tu-usuario/jarloc-core.git
cd jarloc-core
npm install
npm run dev
```

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
