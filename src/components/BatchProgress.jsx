import React from 'react';
import { FileText, CheckCircle, Loader2, AlertCircle, Download, AlertTriangle } from 'lucide-react';

const BatchProgress = ({ batchFiles, onDownloadAll, onTranslate, isTranslating }) => {
    const completedCount = batchFiles.filter(f => f.status === 'done' || f.status === 'warning').length;
    const totalCount = batchFiles.length;
    const isAllDone = completedCount === totalCount && totalCount > 0;
    const hasPending = batchFiles.some(f => f.status === 'pending');

    return (
        <div className="w-full h-full glass-panel rounded-xl border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 neon-text">
                        Progreso del Lote
                    </h2>
                    <p className="text-sm text-gray-400 font-mono">
                        {completedCount} de {totalCount} archivos procesados
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isAllDone && hasPending && (
                        <button
                            onClick={onTranslate}
                            disabled={isTranslating}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium shadow-lg
                                ${isTranslating
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                                    : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)]'}
                            `}
                        >
                            {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                            {isTranslating ? 'Traduciendo...' : 'Traducir Lote'}
                        </button>
                    )}
                    {completedCount > 0 && (
                        <button
                            onClick={onDownloadAll}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all font-medium shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]"
                        >
                            <Download size={18} />
                            {isAllDone ? 'Descargar Todo' : `Descargar Completados (${completedCount})`}
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                {batchFiles.map((file, index) => (
                    <div
                        key={index}
                        className={`
                            flex items-center justify-between p-3 rounded-lg border transition-all
                            ${file.status === 'translating' ? 'bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.1)]' :
                                file.status === 'done' ? 'bg-green-500/10 border-green-500/30' :
                                    file.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                        file.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                            'bg-white/5 border-white/5 hover:bg-white/10'}
                        `}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                ${file.status === 'translating' ? 'text-fuchsia-400 animate-pulse' :
                                    file.status === 'done' ? 'text-green-400' :
                                        file.status === 'warning' ? 'text-yellow-400' :
                                            file.status === 'error' ? 'text-red-400' :
                                                'text-gray-500'}
                            `}>
                                {file.status === 'translating' ? <Loader2 size={18} className="animate-spin" /> :
                                    file.status === 'done' ? <CheckCircle size={18} /> :
                                        file.status === 'warning' ? <AlertTriangle size={18} /> :
                                            file.status === 'error' ? <AlertCircle size={18} /> :
                                                <FileText size={18} />}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-medium truncate ${file.status === 'translating' ? 'text-fuchsia-200' : 'text-gray-300'}`}>{file.name}</p>
                                <p className="text-xs text-gray-500 truncate font-mono">
                                    {file.status === 'pending' && 'Pendiente'}
                                    {file.status === 'translating' && 'Traduciendo...'}
                                    {file.status === 'done' && 'Completado'}
                                    {file.status === 'warning' && 'Sin traducción'}
                                    {file.status === 'error' && 'Error'}
                                </p>
                            </div>
                        </div>

                        {file.status === 'done' && (
                            <span className="text-xs text-green-400 font-mono px-2 py-1 bg-green-500/10 rounded border border-green-500/20">
                                OK
                            </span>
                        )}
                        {file.status === 'warning' && (
                            <span className="text-xs text-yellow-400 font-mono px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20">
                                SKIP
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BatchProgress;
