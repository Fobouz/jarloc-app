import React from 'react';
import { Upload, FileArchive, CheckCircle } from 'lucide-react';

const FileUploader = ({ file, onFileChange, filesInJar }) => {
    return (
        <div className="relative group">
            <input
                type="file"
                accept=".jar,.zip"
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`
            p-8 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3
            ${file
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-gray-700 hover:border-blue-500/50 hover:bg-blue-500/5'
                }
        `}>
                {file ? (
                    <>
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="text-green-400" size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-green-400">{file.name}</h3>
                            <p className="text-sm text-gray-400">{filesInJar.length} archivos de idioma detectados</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="text-gray-400 group-hover:text-blue-400" size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-300">Arrastra tu Mod (.jar) aquí</h3>
                            <p className="text-sm text-gray-500">Soporta archivos .jar y .zip</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FileUploader;
