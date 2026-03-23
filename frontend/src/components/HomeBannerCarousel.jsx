import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HomeBannerCarousel = ({ banners = [], autoScroll = true, scrollInterval = 5, compact = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [containerHeight, setContainerHeight] = useState('auto');
  const firstImageRef = useRef(null);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, scrollInterval * 1000);

    return () => clearInterval(interval);
  }, [autoScroll, banners.length, scrollInterval, isPaused]);

  // Set container height based on first image (for vertical scroll)
  useEffect(() => {
    if (compact && firstImageRef.current) {
      const updateHeight = () => {
        if (firstImageRef.current) {
          setContainerHeight(firstImageRef.current.offsetHeight);
        }
      };
      
      const img = firstImageRef.current;
      img.addEventListener('load', updateHeight);
      
      // Also try immediately in case already loaded
      if (img.complete) {
        updateHeight();
      }
      
      return () => img.removeEventListener('load', updateHeight);
    }
  }, [compact, banners]);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handleBannerClick = (banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if no banners
  if (!banners || banners.length === 0) {
    return null;
  }

  // Sort banners by order
  const sortedBanners = [...banners].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Compact mode for inside grid - vertical scroll, one banner visible at a time
  if (compact) {
    return (
      <div 
        className="relative rounded-2xl shadow-lg w-full"
        data-testid="home-banner-carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Fixed height container that clips overflow */}
        <div 
          style={{ 
            overflow: 'hidden',
            height: containerHeight !== 'auto' ? containerHeight : '150px',
            position: 'relative'
          }}
        >
          {/* Banner Container - Vertical scroll */}
          <div 
            style={{ 
              transform: `translateY(-${currentIndex * (containerHeight !== 'auto' ? containerHeight : 150)}px)`,
              transition: 'transform 700ms ease-in-out'
            }}
          >
            {sortedBanners.map((banner, index) => (
              <div
                key={banner.id || index}
                onClick={() => handleBannerClick(banner)}
                className="w-full"
                style={{ 
                  cursor: banner.link_url ? 'pointer' : 'default'
                }}
              >
                <img
                  ref={index === 0 ? firstImageRef : null}
                  src={banner.image_url}
                  alt={banner.alt_text || `Banner ${index + 1}`}
                  className="w-full h-auto object-cover block"
                  data-testid={`banner-image-${index}`}
                  onLoad={(e) => {
                    if (index === 0) {
                      setContainerHeight(e.target.offsetHeight);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots Navigation - Only show if more than 1 banner */}
        {sortedBanners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {sortedBanners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-[#c41e3a] w-6' 
                    : 'bg-white/60 w-2 hover:bg-white'
                }`}
                aria-label={`Go to banner ${index + 1}`}
                data-testid={`banner-dot-${index}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section 
      className="w-full bg-slate-50 py-4"
      data-testid="home-banner-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* Banner Container */}
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {sortedBanners.map((banner, index) => (
              <div
                key={banner.id || index}
                className="w-full flex-shrink-0"
                onClick={() => handleBannerClick(banner)}
                style={{ cursor: banner.link_url ? 'pointer' : 'default' }}
              >
                <img
                  src={banner.image_url}
                  alt={banner.alt_text || `Banner ${index + 1}`}
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                  data-testid={`banner-image-${index}`}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows - Only show if more than 1 banner */}
          {sortedBanners.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Previous banner"
                data-testid="banner-prev-btn"
              >
                <ChevronLeft className="w-6 h-6 text-[#1e3a5f]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Next banner"
                data-testid="banner-next-btn"
              >
                <ChevronRight className="w-6 h-6 text-[#1e3a5f]" />
              </button>
            </>
          )}

          {/* Dots Navigation - Only show if more than 1 banner */}
          {sortedBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {sortedBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-[#c41e3a] w-6' 
                      : 'bg-white/60 w-2 hover:bg-white'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                  data-testid={`banner-dot-${index}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeBannerCarousel;
