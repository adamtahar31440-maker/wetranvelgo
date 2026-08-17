"use client";

import { useEffect, useState } from "react";

const SLIDE_DURATION = 3500;
const FADE_DURATION = 1000;

// Background photo slideshow for the homepage hero: crossfades between admin-
// uploaded photos while each one slowly zooms/pans (Ken Burns effect) to read
// as a presentation video without shipping an actual video file.
export function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_DURATION);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center transition-opacity ease-in-out ${
            i % 2 === 0 ? "animate-kenburns-a" : "animate-kenburns-b"
          }`}
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === index ? 1 : 0,
            transitionDuration: `${FADE_DURATION}ms`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-ocean-dark/55" />
    </div>
  );
}
