import React from 'react';
import { Settings, Globe, Cpu, Link } from 'lucide-react';

const LANGUAGES = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '简体中文' }
];

const Header = ({
    provider, setProvider,
    apiKey, setApiKey,
    localUrl, setLocalUrl,
    modelsList, selectedModel, setSelectedModel,
    targetLang, setTargetLang,
    onConnect, connectionStatus
}) => {
    return (
        <header className="p-4 glass border-b border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/20">
                    <img src="/logo.png" alt="JarLoc Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    JarLoc Core
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    v1.0
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {/* Provider Selector */}
                <div className="flex items-center bg-gray-800/50 rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`px-3 py-1.5 rounded-md text-sm transition-all ${provider === 'gemini' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Gemini
                    </button>
                    <button
                        onClick={() => setProvider('local')}
                        className={`px-3 py-1.5 rounded-md text-sm transition-all ${provider === 'local' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Local LLM
                    </button>
                </div>

                {/* Credentials Input */}
                <div className="relative group">
                    {provider === 'gemini' ? (
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Pegar Gemini API Key..."
                            className="w-48 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    ) : (
                        <input
                            type="text"
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            placeholder="http://localhost:11434..."
                            className="w-48 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                        />
                    )}
                </div>

                {/* Connect Button */}
                <button
                    onClick={onConnect}
                    disabled={connectionStatus === 'loading'}
                    className={`p-2 rounded-lg border transition-all ${connectionStatus === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                        connectionStatus === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                            'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                        }`}
                >
                    {connectionStatus === 'loading' ? <Cpu className="anim-spin" size={18} /> : <Link size={18} />}
                </button>

                {/* Model Selector */}
                {modelsList.length > 0 && (
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                    >
                        {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                )}

                {/* Ko-fi Button */}
                <a
                    href="https://ko-fi.com/foboz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#FF5E5B]/10 border border-[#FF5E5B]/50 text-[#FF5E5B] hover:bg-[#FF5E5B]/20 transition-all flex items-center justify-center"
                    title="Support on Ko-fi"
                >
                    <span className="font-bold text-xs mr-1">♥</span>
                </a>

                {/* Language Selector */}
                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
                >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;
