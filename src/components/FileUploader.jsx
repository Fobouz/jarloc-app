import React from 'react';
import { Upload, FileArchive, CheckCircle } from 'lucide-react';

const FileUploader = ({ files, onFileChange, title = "Arrastra tus Mods (.jar) aquí", subtitle = "Soporta múltiples archivos .jar y .zip" }) => {
    const isMultiple = files && files.length > 1;

    return (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600/20 to-cyan-600/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <input
                type="file"
                accept=".jar,.zip"
                multiple
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            <div className={`
            relative p-8 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 glass-panel
            ${files && files.length > 0
                    ? 'border-green-500/50 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : 'border-white/10 hover:border-fuchsia-500/50 hover:bg-black/40'
                }
        `}>
                {files && files.length > 0 ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                            <CheckCircle className="text-green-400" size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                                {isMultiple ? `${files.length} archivos seleccionados` : files[0].name}
                            </h3>
                            <p className="text-sm text-gray-400 font-mono">
                                {isMultiple ? 'Listo para procesar en lote' : 'Archivo listo para analizar'}
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10 group-hover:border-fuchsia-500/50 group-hover:shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                            <Upload className="text-gray-400 group-hover:text-fuchsia-400" size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-300 group-hover:text-fuchsia-300 transition-colors">{title}</h3>
                            <p className="text-sm text-gray-500 group-hover:text-gray-400">{subtitle}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
