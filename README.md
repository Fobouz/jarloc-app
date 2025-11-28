JarLoc is a web tool designed to automatically translate language files (`.json`) inside Minecraft mods (`.jar` or `.zip`) using Artificial Intelligence.

### What's New in v0.12

#### Local LLM Support
You can now use language models running on your own machine (like Ollama, LM Studio, LocalAI) to perform translations, removing the dependency on Google Gemini API.
- **Total Privacy**: Your files never leave your local network.
- **No API Limits**: Translate as much as you want without worrying about quotas.
- **OpenAI Compatible**: Works with any local server offering an OpenAI-compatible API.

#### Large File Support (Chunking)
An intelligent system has been implemented to handle massive language files that previously caused timeouts.
- **Automatic Splitting**: Large files are split into small chunks.
- **Sequential Processing**: Each chunk is translated individually to prevent errors.
- **Auto-Merge**: The final result is reconstructed perfectly without user intervention.

### Usage Guide

#### 1. AI Provider Setup

**Option A: Google Gemini (Cloud)**
1.  Select **Google Gemini** from the dropdown menu.
2.  Paste your Google AI Studio **API Key**.

**Option B: Local LLM (Ollama / LocalAI)**
1.  Ensure your local server is running (e.g., `ollama serve`).
2.  Select **Local / OpenAI** from the dropdown menu.
3.  Enter your server URL (default is `http://localhost:11434/v1`).
4.  Click **Conectar** (Connect).
5.  Select your desired model from the list.

#### 2. Load & Translate
1.  Drag your `.jar` or `.zip` mod file to the left panel.
2.  Select the `.json` file from the list.
3.  Choose your **Target Language** and click **Traducir con IA** (Translate with AI).
4.  Once finished, click **Descargar ZIP** to get your Resource Pack.

### Requirements for Local Use
- An OpenAI API compatible inference server (recommended: [Ollama](https://ollama.com/)).
- **IMPORTANT:** Enable CORS on your local server if using the web version.
  - For Ollama: Run `OLLAMA_ORIGINS="*" ollama serve`

---

### Credits
Developed by **Foboz**.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/foboz)

---

*Disclaimer: JarLoc is an unofficial tool and is not affiliated with Mojang or Microsoft.*
