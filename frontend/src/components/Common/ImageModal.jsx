import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, imageUrl }) => {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white/80 hover:text-white transition-all z-10"
      >
        <X size={24} />
      </button>

      <div 
        className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center p-4 sm:p-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Expanded view"
          className="max-w-full max-h-full object-contain rounded-sm select-none"
        />
      </div>
    </div>
  );
};

export default ImageModal;
