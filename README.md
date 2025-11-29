# JarLoc - AI Mod Translator

JarLoc is a specialized tool designed to automate the localization process of Minecraft mods. By leveraging the power of Artificial Intelligence (Google Gemini and Local LLMs), it allows users to translate language files contained within `.jar` or `.zip` archives efficiently and accurately.

## Key Features

-   **AI-Powered Translation**: Integrates with Google Gemini and local LLMs (OpenAI compatible endpoints) to provide context-aware translations.
-   **Smart File Handling**: Automatically detects language files (`.json`) within mod archives.
-   **Large File Support**: Intelligently splits large JSON files into smaller chunks to ensure successful processing by AI models without exceeding token limits.
-   **Modern Interface**: Built with React and Tailwind CSS, offering a responsive and intuitive user experience.
-   **Real-time Logging**: Provides a detailed console output of the translation process, including file analysis, splitting, and translation progress.
-   **Resource Pack Generation**: Exports translations as a ready-to-use `.zip` resource pack compatible with Minecraft.

## Prerequisites

Before running the application, ensure you have the following installed:

-   **Node.js** (Version 16 or higher)
-   **npm** (Node Package Manager)

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Fobouz/jarloc-app.git
    cd jarloc-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Usage

### 1. Configuration

Upon launching the application, configure your AI provider in the header section:

-   **Google Gemini**: Select "Gemini" and enter your valid API Key.
-   **Local LLM**: Select "Local LLM" and provide the endpoint URL (default: `http://localhost:11434/v1` for tools like Ollama or LM Studio).

### 2. Loading a Mod

-   Drag and drop a Minecraft mod file (`.jar` or `.zip`) into the upload area.
-   The application will scan the archive and list all detected language files in the sidebar.

### 3. Translation Process

1.  Select a file from the list to view its original content.
2.  Choose your target language from the dropdown menu.
3.  Select the desired AI model.
4.  Click the **Translate** button.
5.  Monitor the "Output Terminal" for progress updates.

### 4. Export

Once the translation is complete, click the **Download** button to generate a `.zip` file containing the translated resources. This file can be placed directly into the Minecraft `resourcepacks` folder.

## Architecture

This project is built using a modern web development stack:

-   **Core**: React 18, Vite
-   **Styling**: Tailwind CSS
-   **File Processing**: JSZip
-   **State Management**: React Hooks

## License

This project is open source.

## Support

If you find this tool useful, consider supporting the development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/foboz)
