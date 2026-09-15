"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Commence le fade-out après 2.5 secondes
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // Supprime complètement le composant du DOM après 3.5 secondes (fin du fade-out)
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-black z-10 pointer-events-none opacity-20 mix-blend-overlay"></div>
      <div className="relative w-full max-w-2xl px-6 aspect-video z-10 flex items-center justify-center">
        {/* Effet Etoile Filante/Neon Flash derrière le logo */}
        <div className="absolute w-[80%] h-[20%] bg-white rounded-[100%] animate-shooting-star mix-blend-screen z-0"></div>
        
        <Image 
          src="/logo.jpeg" 
          alt="Glass Pilot Logo" 
          fill
          priority
          className="object-contain animate-cinematic-zoom drop-shadow-[0_0_20px_rgba(56,189,248,0.3)] z-10 relative"
          quality={100}
        />
      </div>
      
      {/* Léger reflet/glow cinématique par-dessus */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-20"></div>
    </div>
  );
}
