import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Mise à jour pour le SEO et le nom de l'onglet du navigateur
export const metadata: Metadata = {
  title: "GlassPilot | Espace Pro",
  description: "La plateforme tout-en-un pour la gestion de votre centre de vitrage automobile.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr" // 2. Passé en français
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // 3. Le correctif pour l'erreur d'hydratation (Extensions)
    >
      <body 
        className="min-h-full flex flex-col"
        suppressHydrationWarning // Ajouté ici aussi pour une sécurité maximale
      >
        {/* DECORATIVE BACKGROUND BLUEPRINT & WATERMARK */}
        <div className="bg-circles">
          <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blueprint Grid Circles */}
            <circle cx="50%" cy="20%" r="150" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="300" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="50%" cy="20%" r="450" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="600" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1.5" strokeDasharray="7 7" />
            <circle cx="50%" cy="20%" r="750" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="900" stroke="rgba(56, 189, 248, 0.02)" strokeWidth="1.5" strokeDasharray="9 9" />
            <circle cx="50%" cy="20%" r="1050" stroke="rgba(56, 189, 248, 0.015)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="1200" stroke="rgba(56, 189, 248, 0.01)" strokeWidth="1.5" />
            
            <circle cx="15%" cy="60%" r="200" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="15%" cy="60%" r="400" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" />
            <circle cx="15%" cy="60%" r="600" stroke="rgba(56, 189, 248, 0.015)" strokeWidth="1.5" strokeDasharray="7 7" />
            
            <circle cx="85%" cy="45%" r="300" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1.5" strokeDasharray="7 7" />
            <circle cx="85%" cy="45%" r="500" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" />

            {/* Aligned Light Blue GlassPilot Gestion Watermark */}
            {/* Circle Monogram */}
            <circle cx="30%" cy="50%" r="8vw" stroke="rgba(56, 189, 248, 0.16)" strokeWidth="0.3vw" fill="rgba(56, 189, 248, 0.03)" />

            {/* GP Monogram Text */}
            <text x="30%" y="53.8%" fontSize="10vw" fontWeight="900" fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.5" textAnchor="middle" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GP</text>

            {/* GLASSPILOT */}
            <text x="40%" y="45%" fontSize="6vw" fontWeight="900" fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.5" textAnchor="start" letterSpacing="0.05em" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GLASSPILOT</text>

            {/* GESTION */}
            <text x="40%" y="59%" fontSize="6vw" fontWeight="900" fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.22)" strokeWidth="1.5" textAnchor="start" letterSpacing="0.05em" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GESTION</text>
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}