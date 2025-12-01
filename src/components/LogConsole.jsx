import React, { useEffect, useRef } from 'react';

const LogConsole = ({ logs }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-48 border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.05)]">
            <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                <span className="text-xs font-mono text-fuchsia-400 tracking-widest neon-text flex items-center gap-2">
                    <span className="w-2 h-2 bg-fuchsia-500 rounded-full animate-pulse"></span>
                    TERMINAL DE SALIDA
                </span>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
            </div>
            <div ref={containerRef} className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar bg-black/20">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic flex items-center gap-2">
                        <span className="animate-pulse">_</span> Esperando acciones...
                    </div>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 animate-fade-in hover:bg-white/5 p-0.5 rounded transition-colors">
                        <span className="text-gray-500 text-xs">[{log.time}]</span>
                        <span className={`
                    ${log.type === 'error' ? 'text-red-400 drop-shadow-[0_0_3px_rgba(248,113,113,0.5)]' :
                                log.type === 'success' ? 'text-green-400 drop-shadow-[0_0_3px_rgba(74,222,128,0.5)]' :
                                    'text-cyan-300'}
                `}>
                            {log.type === 'info' && '> '}
                            {log.type === 'success' && '✔ '}
                            {log.type === 'error' && '✖ '}
                            {log.msg}
                        </span>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default LogConsole;
