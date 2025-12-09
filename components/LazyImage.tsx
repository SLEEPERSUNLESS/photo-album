"use client";

import React, { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  index?: number;
  placeholderClassName?: string;
  onLoaded?: () => void;
  canLoad?: boolean;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  index = 0,
  placeholderClassName = "",
  onLoaded,
  canLoad = true,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Rozpocznij ładowanie tylko gdy jest w widoku I może się ładować (poprzednie się załadowało)
  useEffect(() => {
    if (isInView && canLoad) {
      setShouldLoad(true);
    }
  }, [isInView, canLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    // Powiadom rodzica, że to zdjęcie się załadowało
    if (onLoaded) {
      onLoaded();
    }
  };

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {/* Placeholder z animacją shimmer */}
      <div
        className={`absolute inset-0 bg-slate-200 transition-opacity duration-500 ${
          isLoaded ? "opacity-0" : "opacity-100"
        } ${placeholderClassName}`}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Właściwy obrazek */}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className={`${className} transition-opacity duration-500 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
