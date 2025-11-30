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
            <div className="w-64 glass-panel rounded-lg flex flex-col">
                <div className="p-3 border-b border-gray-700/50">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                        <FileJson size={16} className="text-blue-400" />
                        Archivos ({filesInJar.length})
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filesInJar.map((path) => (
                        <button
                            key={path}
                            onClick={() => onSelectFile(path)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs truncate transition-colors ${currentPath === path
                                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
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
                    <div className="flex-1 glass-panel rounded-lg flex flex-col">
                        <div className="p-2 border-b border-gray-700/50 bg-gray-900/30 flex justify-between items-center">
                            <span className="text-xs text-gray-400 font-mono">ORIGINAL</span>
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
                            className={`p-3 rounded-full transition-all shadow-lg ${!fileContent ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
                                    isTranslating ? 'bg-yellow-600 text-white animate-pulse' :
                                        'bg-blue-600 text-white hover:bg-blue-500 hover:scale-110 hover:shadow-blue-500/50'
                                }`}
                            title="Traducir"
                        >
                            {isTranslating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={20} />}
                        </button>
                    </div>

                    {/* Translated Content */}
                    <div className="flex-1 glass-panel rounded-lg flex flex-col border border-green-500/10">
                        <div className="p-2 border-b border-gray-700/50 bg-green-900/10 flex justify-between items-center">
                            <span className="text-xs text-green-400 font-mono">TRADUCCIÓN IA</span>
                            {translation && (
                                <button
                                    onClick={onDownload}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs transition-colors"
                                >
                                    <Download size={12} /> Descargar
                                </button>
                            )}
                        </div>
                        <textarea
                            readOnly
                            value={translation}
                            className="flex-1 bg-transparent p-4 font-mono text-xs text-green-300 resize-none outline-none custom-scrollbar"
                            placeholder="La traducción aparecerá aquí..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Editor;
