/* 
 * FILE: frontend/src/components/Home/PostMediaCarousel.jsx
 * PURPOSE: Professional Image/Video Carousel for Posts
 */
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const PostMediaCarousel = ({ media = [], onMediaClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const count = media.length;
  const current = media[currentIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? count - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === count - 1 ? 0 : prev + 1));
  };

  const MediaElement = ({ m }) => {
    if (m.type === 'video') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            src={m.url}
            controls
            className="max-w-full max-h-[550px] w-auto h-auto object-contain"
          />
        </div>
      );
    }

    return (
      <img
        src={m.url}
        alt=""
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick && onMediaClick();
        }}
        className="max-w-full max-h-[550px] w-auto h-auto object-contain cursor-pointer transition-transform duration-500 hover:scale-[1.02]"
      />
    );
  };

  return (
    <div className="relative w-full bg-slate-100 dark:bg-slate-900 group overflow-hidden mt-3 min-h-[300px] flex items-center justify-center border-y border-slate-100 dark:border-slate-800">
      {/* Dynamic Counter */}
      {count > 1 && (
        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-full shadow-lg pointer-events-none">
          {currentIndex + 1} / {count}
        </div>
      )}

      {/* Main Media Item */}
      <div className="relative w-full h-full flex items-center justify-center">
         <MediaElement m={current} />
      </div>

      {/* Navigation Controls */}
      {count > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700"
            aria-label="Previous"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700"
            aria-label="Next"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>

          {/* Indicators / Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-30 pointer-events-none">
            {media.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex 
                    ? 'bg-blue-600 w-4 shadow-[0_0_8px_rgba(37,99,235,0.6)]' 
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PostMediaCarousel;
