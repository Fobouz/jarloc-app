import React, { useEffect, useRef } from 'react';

const LogConsole = ({ logs }) => {
    const logEndRef = useRef(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="glass-panel rounded-lg overflow-hidden flex flex-col h-48">
            <div className="bg-gray-900/50 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">TERMINAL DE SALIDA</span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic">Esperando acciones...</div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 animate-fade-in">
                        <span className="text-gray-600">[{log.time}]</span>
                        <span className={`
                    ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                    'text-blue-300'}
                `}>
                            {log.type === 'info' && '> '}
                            {log.type === 'success' && '✔ '}
                            {log.type === 'error' && '✖ '}
                            {log.msg}
                        </span>
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default LogConsole;
