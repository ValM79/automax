import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Star, RotateCw, Trash2 } from 'lucide-react';

export default function ImageViewer({ photos, initialIndex, onClose, onSetCover, onRotate, onDelete }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotation, setRotation] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    setRotation(0);
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    onRotate(currentIndex, newRotation);
  };

  const handleDelete = () => {
    onDelete(currentIndex);
    if (currentIndex === photos.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col">
      {/* Header with counter */}
      <div
        className="flex items-center justify-between px-4 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>
        <div className="text-white text-sm font-medium">
          📷 {currentIndex + 1} / {photos.length}
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-card/20 rounded-full p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/20 hover:bg-card/40 text-white rounded-full p-3 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Image */}
        <div className="max-w-4xl max-h-[70vh] flex items-center justify-center">
          <img
            src={currentPhoto.preview}
            alt=""
            className="max-w-full max-h-full object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/20 hover:bg-card/40 text-white rounded-full p-3 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Footer with actions */}
      <div
        className="flex items-center justify-center gap-4 px-6 pt-6 border-t border-white/10"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}>
        <button
          onClick={() => onSetCover(currentIndex)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
        >
          <Star className="w-4 h-4" />
          Cover
        </button>
        <button
          onClick={handleRotate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          Rotate
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  );
}