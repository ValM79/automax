import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

export default function ImageGallery({ images = [], title = '' }) {
  const photos = images.length > 0 ? images : [];
  const extendedPhotos = photos.length > 1 ? [...photos, ...photos] : photos;
  const [activeIndex, setActiveIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const thumbnailRef = useRef(null);
  const lastTapRef = useRef(0);
  const touchStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasMovedRef = useRef(false);

  const displayIndex = photos.length > 0 ? ((activeIndex % photos.length) + photos.length) % photos.length : 0;

  // Re-enable transitions after a no-transition jump
  useEffect(() => {
    if (noTransition) {
      const id = requestAnimationFrame(() => setNoTransition(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noTransition]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailRef.current && thumbnailRef.current.children[displayIndex]) {
      thumbnailRef.current.children[displayIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [displayIndex]);

  const openLightbox = (index) => {
    setNoTransition(false);
    setActiveIndex(index);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const nextImage = useCallback(() => {
    setNoTransition(false);
    setActiveIndex(prev => prev + 1);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const prevImage = useCallback(() => {
    setNoTransition(false);
    setActiveIndex(prev => prev - 1);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleTransitionEnd = () => {
    if (activeIndex >= photos.length) {
      setNoTransition(true);
      setActiveIndex(activeIndex - photos.length);
    } else if (activeIndex < 0) {
      setNoTransition(true);
      setActiveIndex(activeIndex + photos.length);
    }
  };

  const zoomIn = () => setZoom(z => Math.min(z + 0.5, 4));
  const zoomOut = () => {
    setZoom(z => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleTap = () => {
    if (zoom === 1) {
      setZoom(2);
    } else {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    hasMovedRef.current = false;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, panX: pan.x, panY: pan.y };
    if (zoom > 1) setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1 || !isDragging || zoom <= 1) return;
    hasMovedRef.current = true;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    setPan({ x: touchStartRef.current.panX + dx, y: touchStartRef.current.panY + dy });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, nextImage, prevImage]);

  if (photos.length === 0) {
    return (
      <div className="overflow-hidden bg-secondary h-72 sm:h-96 flex items-center justify-center">
        <span className="text-muted-foreground">No photos available</span>
      </div>
    );
  }

  const remaining = photos.length - 4;

  return (
    <>
      <div className="block">
      {/* Infinite carousel */}
      <div
        className="relative overflow-hidden bg-foreground h-72 sm:h-[420px] cursor-pointer"
        onClick={() => openLightbox(displayIndex)}
      >
        <div
          className={`flex h-full ${noTransition ? '' : 'transition-transform duration-300 ease-in-out'}`}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedPhotos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`${title} - photo ${(i % photos.length) + 1}`}
              className="w-full h-full object-cover flex-[0_0_100%]"
              draggable={false}
            />
          ))}
        </div>

        {/* Photo count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          <Camera className="w-3 h-3" /> {photos.length}
        </div>

        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Horizontal thumbnails */}
      {photos.length > 1 && (
        <div ref={thumbnailRef} className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => { setNoTransition(false); setActiveIndex(i); }}
              className={`flex-shrink-0 w-20 h-16 sm:w-28 sm:h-[84px] overflow-hidden relative ${
                i === displayIndex ? 'border-b-2 border-primary' : ''
              }`}
            >
              <img src={photo} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pb-4 z-10"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
            onClick={e => e.stopPropagation()}
          >
            <span className="text-white text-sm font-medium">
              {displayIndex + 1} / {photos.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={zoom <= 1}
                className="w-10 h-10 bg-card/10 hover:bg-card/20 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={zoomIn}
                disabled={zoom >= 4}
                className="w-10 h-10 bg-card/10 hover:bg-card/20 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={closeLightbox}
                className="w-10 h-10 bg-card/10 hover:bg-card/20 text-white rounded-full flex items-center justify-center transition-colors ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex items-center justify-center w-full h-full overflow-hidden"
            onClick={e => { if (hasMovedRef.current) e.stopPropagation(); else e.stopPropagation(); }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={photos[displayIndex]}
              alt={`${title} - photo ${displayIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-100 select-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
              draggable={false}
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/10 hover:bg-card/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/10 hover:bg-card/20 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {zoom === 1 && (
            <div
              className="absolute left-1/2 -translate-x-1/2 bg-card/10 text-white/80 text-xs px-3 py-1.5 rounded-full"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
              Double-tap to zoom · Drag to pan · Esc to close
            </div>
          )}
        </div>
      )}
    </>
  );
}