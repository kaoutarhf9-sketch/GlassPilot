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

// SEO + nom de l'onglet du navigateur
export const metadata: Metadata = {
  metadataBase: new URL("https://www.glasspilotgestion.com"),
  title: {
    default: "GlassPilot Gestion | Logiciel de gestion de vitrage automobile",
    template: "%s | GlassPilot Gestion",
  },
  description:
    "GlassPilot Gestion : la plateforme tout-en-un pour la gestion de votre centre de vitrage automobile (devis, clients, interventions et suivi).",
  applicationName: "GlassPilot Gestion",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://www.glasspilotgestion.com",
    siteName: "GlassPilot Gestion",
    title: "GlassPilot Gestion | Logiciel de gestion de vitrage automobile",
    description:
      "La plateforme tout-en-un pour la gestion de votre centre de vitrage automobile.",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr" // Passé en français
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // Correctif pour l'erreur d'hydratation (extensions)
    >
      <body
        className="min-h-full flex flex-col"
        suppressHydrationWarning // Ajouté ici aussi pour une sécurité maximale
      >
        {/* DECORATIVE BACKGROUND BLUEPRINT & WATERMARK */}
        <div className="bg-circles">
          <svg width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Blueprint Grid Circles */}
            <circle cx="50%" cy="20%" r="150" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="300" stroke="rgba(56, 189, 248, 0.04)" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="50%" cy="20%" r="450" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="600" stroke="rgba(56, 189, 248, 0.02)" strokeWidth="1.5" strokeDasharray="7 7" />
            <circle cx="50%" cy="20%" r="750" stroke="rgba(56, 189, 248, 0.015)" strokeWidth="1.5" />
            <circle cx="50%" cy="20%" r="900" stroke="rgba(56, 189, 248, 0.01)" strokeWidth="1.5" strokeDasharray="9 9" />
            <circle cx="50%" cy="20%" r="1050" stroke="rgba(56, 189, 248, 0.005)" strokeWidth="1.5" />

            <circle cx="15%" cy="60%" r="200" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" strokeDasharray="5 5" />
            <circle cx="15%" cy="60%" r="400" stroke="rgba(56, 189, 248, 0.02)" strokeWidth="1.5" />

            <circle cx="85%" cy="45%" r="300" stroke="rgba(56, 189, 248, 0.03)" strokeWidth="1.5" strokeDasharray="7 7" />
            <circle cx="85%" cy="45%" r="500" stroke="rgba(56, 189, 248, 0.02)" strokeWidth="1.5" />

            {/* Aligned Dark Blue GlassPilot Gestion Watermark */}
            {/* Circle Monogram */}
            <circle cx="30%" cy="50%" r="8vw" stroke="#38bdf8" strokeWidth="0.3vw" strokeOpacity="0.1" fill="#38bdf8" fillOpacity="0.04" />

            {/* GP Monogram Text */}
            <text x="30%" y="53.8%" fontSize="10vw" fontWeight="900" fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeOpacity="0.1" strokeWidth="1.5" textAnchor="middle" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GP</text>

            {/* GLASSPILOT */}
            <text x="40%" y="45%" fontSize="6vw" fontWeight="900" fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeOpacity="0.1" strokeWidth="1.5" textAnchor="start" letterSpacing="0.05em" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GLASSPILOT</text>

            {/* GESTION */}
            <text x="40%" y="59%" fontSize="6vw" fontWeight="900" fill="#38bdf8" fillOpacity="0.08" stroke="#38bdf8" strokeOpacity="0.1" strokeWidth="1.5" textAnchor="start" letterSpacing="0.05em" style={{ fontFamily: "var(--font-sans), sans-serif" }}>GESTION</text>
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}