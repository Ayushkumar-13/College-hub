import React from 'react';
import { File, X } from 'lucide-react';

const FileUpload = ({ files, onRemove }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 flex gap-2 flex-wrap p-2 bg-white rounded-xl shadow-lg border border-slate-200">
      {files.map((file, idx) => (
        <div key={idx} className="relative group/preview">
          {file.type && file.type.startsWith('image') ? (
            <div className="relative">
              <img
                src={file.preview}
                alt="preview"
                className="w-16 h-16 object-cover rounded-xl ring-2 ring-slate-200 transition-transform duration-200 group-hover/preview:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/10 rounded-xl transition-colors duration-200" />
            </div>
          ) : (
            <div className="w-16 h-16 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl ring-2 ring-slate-200 p-1">
              <File size={20} className="text-slate-600 mb-1" />
              <span className="text-[8px] text-slate-600 truncate w-full text-center px-1">
                {file.name?.split('.').pop()?.toUpperCase()}
              </span>
            </div>
          )}
          <button
            onClick={() => onRemove(idx)}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform duration-200 active:scale-95"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FileUpload;