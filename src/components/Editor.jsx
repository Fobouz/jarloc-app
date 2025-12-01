import React from 'react';
import { FileJson, ArrowRight, Download, Play } from 'lucide-react';

const Editor = ({
    filesInJar,
    currentPath,
    onSelectFile,
    fileContent,
    translation,
    onTranslate,
    isTranslating,
    onDownload
}) => {
    return (
        <div className="flex-1 flex gap-4 min-h-[400px]">
            {/* Sidebar: File List */}
            <div className="w-64 glass-panel rounded-xl flex flex-col border-l-2 border-l-fuchsia-500/30">
                <div className="p-3 border-b border-white/5 bg-black/20">
                    <h3 className="text-sm font-semibold text-fuchsia-300 flex items-center gap-2 tracking-wide">
                        <FileJson size={16} className="text-fuchsia-400" />
                        ARCHIVOS ({filesInJar.length})
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filesInJar.map((path) => (
                        <button
                            key={path}
                            onClick={() => onSelectFile(path)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs truncate transition-all duration-200 ${currentPath === path
                                ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/40 shadow-[0_0_10px_rgba(217,70,239,0.1)]'
                                : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                            title={path}
                        >
                            {path.split('/').pop()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex-1 flex gap-4">
                    {/* Original Content */}
                    <div className="flex-1 glass-panel rounded-xl flex flex-col relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl"></div>
                        <div className="p-2 border-b border-white/5 bg-black/20 flex justify-between items-center">
                            <span className="text-xs text-cyan-400 font-mono tracking-widest">ORIGINAL</span>
                        </div>
                        <textarea
                            readOnly
                            value={fileContent}
                            className="flex-1 bg-transparent p-4 font-mono text-xs text-gray-300 resize-none outline-none custom-scrollbar"
                            placeholder="Selecciona un archivo para ver su contenido..."
                        />
                    </div>

                    {/* Arrow Action */}
                    <div className="flex flex-col justify-center gap-2">
                        <button
                            onClick={onTranslate}
                            disabled={!fileContent || isTranslating}
                            className={`p-3 rounded-full transition-all shadow-lg ${!fileContent ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700' :
                                isTranslating ? 'bg-yellow-600 text-white animate-pulse shadow-[0_0_15px_rgba(202,138,4,0.4)]' :
                                    'bg-gradient-to-br from-fuchsia-600 to-purple-600 text-white hover:scale-110 hover:shadow-[0_0_20px_rgba(217,70,239,0.6)] border border-fuchsia-500/30'
                                }`}
                            title="Traducir"
                        >
                            {isTranslating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                    </div>

                    {/* Translated Content */}
                    <div className="flex-1 glass-panel rounded-xl flex flex-col border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                        <div className="p-2 border-b border-cyan-500/20 bg-cyan-900/10 flex justify-between items-center">
                            <span className="text-xs text-cyan-300 font-mono tracking-widest neon-text">TRADUCCIÓN IA</span>
                            {translation && (
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-1 px-3 py-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/50 text-xs transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                >
                                    <Download size={12} /> Descargar
                                </button>
                            )}
                        </div>
                        <textarea
                            readOnly
                            value={translation}
                            className="flex-1 bg-transparent p-4 font-mono text-xs text-cyan-100 resize-none outline-none custom-scrollbar"
                            placeholder="La traducción aparecerá aquí..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;
