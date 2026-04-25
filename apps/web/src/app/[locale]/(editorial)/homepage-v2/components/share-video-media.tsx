'use client';

import { useRef, useState, useCallback } from 'react';

interface ShareVideoMediaProps {
  thumbnailUrl?: string;
  videoUrl: string;
  durationSeconds?: number;
  alt?: string;
}

export function ShareVideoMedia({ thumbnailUrl, videoUrl, durationSeconds, alt }: ShareVideoMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  const handleEnter = useCallback(() => {
    setHovering(true);
    videoRef.current?.play().catch(() => {});
  }, []);

  const handleLeave = useCallback(() => {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const duration = durationSeconds
    ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, '0')}`
    : null;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Thumbnail */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={alt || ''}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? 'opacity-0' : 'opacity-100'}`}
        />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Duration badge — top right */}
      {duration && (
        <div
          className="absolute"
          style={{
            top: 14, right: 12, padding: '2px 8px',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            borderRadius: 4, fontFamily: 'var(--ed-font-serif-italic)',
            fontSize: 11, fontStyle: 'italic', color: 'var(--ed-paper)', zIndex: 2,
          }}
        >
          {duration}
        </div>
      )}

      {/* Play button — small red circle, below duration */}
      <div
        className={`absolute transition-opacity duration-200 ${hovering ? 'opacity-0' : 'opacity-100'}`}
        style={{ top: duration ? 40 : 14, right: 14, zIndex: 2 }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 28, height: 28,
            background: 'var(--ed-accent)',
            borderRadius: '50%',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--ed-paper)" style={{ marginLeft: 1 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
