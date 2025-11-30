import React from 'react';
import { FileText, CheckCircle, Loader2, AlertCircle, Download, AlertTriangle } from 'lucide-react';

const BatchProgress = ({ batchFiles, onDownloadAll, onTranslate, isTranslating }) => {
    const completedCount = batchFiles.filter(f => f.status === 'done' || f.status === 'warning').length;
    const totalCount = batchFiles.length;
    const isAllDone = completedCount === totalCount && totalCount > 0;
    const hasPending = batchFiles.some(f => f.status === 'pending');

    return (
        <div className="w-full h-full bg-gray-800/50 rounded-xl border border-gray-700 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-white">Progreso del Lote</h2>
                    <p className="text-sm text-gray-400">
                        {completedCount} de {totalCount} archivos procesados
                    </p>
                </div>
                <div className="flex gap-2">
                    {!isAllDone && hasPending && (
                        <button
                            onClick={onTranslate}
                            disabled={isTranslating}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
                                ${isTranslating
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'}
                            `}
                        >
                            {isTranslating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                            {isTranslating ? 'Traduciendo...' : 'Traducir Lote'}
                        </button>
                    )}
                    {isAllDone && (
                        <button
                            onClick={onDownloadAll}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
                        >
                            <Download size={18} />
                            Descargar Todo
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {batchFiles.map((file, index) => (
                    <div
                        key={index}
                        className={`
                            flex items-center justify-between p-3 rounded-lg border 
                            ${file.status === 'translating' ? 'bg-blue-500/10 border-blue-500/30' :
                                file.status === 'done' ? 'bg-green-500/10 border-green-500/30' :
                                    file.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                        file.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                                            'bg-gray-700/30 border-gray-700'}
                        `}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                ${file.status === 'translating' ? 'text-blue-400' :
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
                                <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {file.status === 'pending' && 'Pendiente'}
                                    {file.status === 'translating' && 'Traduciendo...'}
                                    {file.status === 'done' && 'Completado'}
                                    {file.status === 'warning' && 'Sin traducción'}
                                    {file.status === 'error' && 'Error'}
                                </p>
                            </div>
                        </div>

                        {file.status === 'done' && (
                            <span className="text-xs text-green-400 font-mono px-2 py-1 bg-green-500/10 rounded">
                                OK
                            </span>
                        )}
                        {file.status === 'warning' && (
                            <span className="text-xs text-yellow-400 font-mono px-2 py-1 bg-yellow-500/10 rounded">
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
