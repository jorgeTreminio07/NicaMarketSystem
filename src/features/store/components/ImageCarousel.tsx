import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../../../utils/productUtils';

interface ImageCarouselProps {
  images: string[];
  altText: string;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, altText }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = images && images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
        <img
          src={safeImages[currentIndex]}
          alt={`${altText} - Imagen ${currentIndex + 1}`}
          className="w-full h-full object-cover object-center transition-all duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
          }}
        />

        {/* Carousel Navigation Arrows */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 shadow-md"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all opacity-90 group-hover:opacity-100 shadow-md"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Counter Badge */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-slate-300" />
              <span>{currentIndex + 1} / {safeImages.length}</span>
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative aspect-square w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                idx === currentIndex
                  ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'border-slate-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
