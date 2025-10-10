import { useEffect, useState } from 'react';
import type { Track } from '../types/player';

interface BackgroundSlideshowProps {
  tracks: Track[];
  currentTrack?: Track;
  interval?: number;
  className?: string;
}

/**
 * Background slideshow displaying track thumbnails
 * Shows when no video is playing or during transitions
 */
export function BackgroundSlideshow({
  tracks,
  currentTrack,
  interval = 8000,
  className = '',
}: BackgroundSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get thumbnail URL from videoId
  const getThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (tracks.length === 0) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % tracks.length);
        setIsTransitioning(false);
      }, 500);
    }, interval);

    return () => clearInterval(timer);
  }, [tracks.length, interval]);

  if (tracks.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black ${className}`}>
        <div className="text-center text-white/50">
          <div className="text-6xl mb-4">🎵</div>
          <div className="text-2xl font-bold">No tracks in queue</div>
          <div className="text-lg mt-2">Add songs to get started</div>
        </div>
      </div>
    );
  }

  const currentSlide = tracks[currentIndex];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-10" />

      {/* Slideshow images */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <img
          src={getThumbnail(currentSlide.videoId)}
          alt={currentSlide.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default thumbnail on error
            const target = e.target as HTMLImageElement;
            target.src = `https://img.youtube.com/vi/${currentSlide.videoId}/hqdefault.jpg`;
          }}
        />
      </div>

      {/* Track info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
        <div className="max-w-4xl">
          <div className="text-white/70 text-sm uppercase tracking-wider mb-2">
            Coming Up #{currentIndex + 1}
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">{currentSlide.title}</h2>
          <p className="text-2xl text-white/80">{currentSlide.artist}</p>
          {currentSlide.isRequest && (
            <div className="mt-4">
              <span className="inline-block px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-semibold">
                💿 Requested
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Slideshow indicators */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        {tracks.slice(0, 5).map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-orange-500'
                : 'w-1 bg-white/30'
            }`}
          />
        ))}
        {tracks.length > 5 && (
          <div className="h-1 w-4 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white/50 text-xs">+{tracks.length - 5}</span>
          </div>
        )}
      </div>

      {/* Now playing indicator (if applicable) */}
      {currentTrack && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/50 text-xs uppercase tracking-wider mb-1">
                  Now Playing
                </div>
                <div className="text-white font-semibold truncate">{currentTrack.title}</div>
                <div className="text-white/70 text-sm truncate">{currentTrack.artist}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ambient blur effect */}
      <div 
        className="absolute inset-0 opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #FF6B00 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
