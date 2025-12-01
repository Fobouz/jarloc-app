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
    apiKeys, onApiKeyChange,
    localUrl, setLocalUrl,
    modelsList, selectedModel, setSelectedModel,
    targetLang, setTargetLang,
    onConnect, connectionStatus
}) => {
    return (
        <header className="glass-panel rounded-2xl p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
            {/* Glow effect behind header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 opacity-50"></div>

            <div className="flex items-center gap-4 z-10">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-12 h-12 bg-black rounded-full flex items-center justify-center border border-gray-800">
                        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" />
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-cyan-400 neon-text tracking-wider">
                        JarLoc <span className="text-xs align-top opacity-70 font-mono text-cyan-300">CORE</span>
                    </h1>
                    <p className="text-xs text-gray-400 tracking-widest uppercase">Advanced Localization System</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 z-10">
                {/* Provider Selector */}
                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10 backdrop-blur-sm overflow-x-auto max-w-[300px] md:max-w-none custom-scrollbar">
                    <button onClick={() => setProvider('gemini')} className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${provider === 'gemini' ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.4)]' : 'text-gray-400 hover:text-white'}`}>Gemini</button>
                    <button onClick={() => setProvider('groq')} className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${provider === 'groq' ? 'bg-orange-600 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'text-gray-400 hover:text-white'}`}>Groq</button>
                    <button onClick={() => setProvider('deepseek')} className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${provider === 'deepseek' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white'}`}>DeepSeek</button>
                    <button onClick={() => setProvider('openrouter')} className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${provider === 'openrouter' ? 'bg-violet-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]' : 'text-gray-400 hover:text-white'}`}>OpenRouter</button>
                    <button onClick={() => setProvider('local')} className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${provider === 'local' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}>Local</button>
                </div>

                {/* Credentials Input */}
                <div className="relative group">
                    {provider === 'local' ? (
                        <input
                            type="text"
                            value={localUrl}
                            onChange={(e) => setLocalUrl(e.target.value)}
                            placeholder="http://localhost:11434..."
                            className="w-48 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-cyan-100 placeholder-gray-600"
                        />
                    ) : (
                        <input
                            type="password"
                            value={apiKeys[provider] || ''}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder={`API Key de ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`}
                            className={`w-48 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-1 outline-none transition-all placeholder-gray-600
                                ${provider === 'gemini' ? 'focus:ring-fuchsia-500 text-fuchsia-100' :
                                    provider === 'groq' ? 'focus:ring-orange-500 text-orange-100' :
                                        provider === 'deepseek' ? 'focus:ring-blue-500 text-blue-100' :
                                            'focus:ring-violet-500 text-violet-100'
                                }`}
                        />
                    )}
                </div>

                {/* Connect Button */}
                <button
                    onClick={onConnect}
                    disabled={connectionStatus === 'loading'}
                    className={`p-2 rounded-lg border transition-all ${connectionStatus === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                        connectionStatus === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                            'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                        }`}
                >
                    {connectionStatus === 'loading' ? <Cpu className="animate-spin text-fuchsia-400" size={18} /> : <Link size={18} />}
                </button>

                {/* Model Selector */}
                {modelsList.length > 0 && (
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-fuchsia-500 text-gray-300"
                    >
                        {modelsList.map(m => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                    </select>
                )}

                {/* Ko-fi Button */}
                <a
                    href="https://ko-fi.com/foboz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#FF5E5B]/10 border border-[#FF5E5B]/50 text-[#FF5E5B] hover:bg-[#FF5E5B]/20 transition-all flex items-center justify-center hover:shadow-[0_0_10px_rgba(255,94,91,0.3)]"
                    title="Support on Ko-fi"
                >
                    <span className="font-bold text-xs mr-1">♥</span>
                </a>

                {/* Language Selector */}
                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-500 text-gray-300"
                >
                    {LANGUAGES.map(l => (
                        <option key={l.code} value={l.code} className="bg-gray-900">{l.name}</option>
                    ))}
                </select>
            </div>
        </header>
    );
};

export default Header;
