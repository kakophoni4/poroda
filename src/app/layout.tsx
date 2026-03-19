import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import CartDock from "@/components/CartDock";
import PageTransition from "@/components/PageTransition";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PORODA Cosmetics",
  description: "Профессиональная уходовая косметика. Главная страница в разработке.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} overflow-x-hidden`}>
      <body className="min-h-screen overflow-x-hidden bg-transparent font-sans text-zinc-900 antialiased">
        {/* SVG-фильтры «жидкого стекла» (искажение + dock) */}
        <svg aria-hidden="true" className="absolute h-0 w-0 overflow-hidden" style={{ position: "absolute" }}>
          <defs>
            <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="btn-glass" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
              <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
              <feDisplacementMap in="SourceGraphic" in2="blur" scale="60" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
              <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="1" seed="5" result="turbulence" />
              <feComponentTransfer in="turbulence" result="mapped">
                <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
                <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
                <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
              </feComponentTransfer>
              <feGaussianBlur in="turbulence" stdDeviation="8" result="softMap" />
              <feSpecularLighting in="softMap" surfaceScale="3" specularConstant="1" specularExponent="80" lightingColor="white" result="specLight">
                <fePointLight x="-200" y="-200" z="300" />
              </feSpecularLighting>
              <feComposite in="specLight" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litImage" />
              <feDisplacementMap in="SourceGraphic" in2="softMap" scale="60" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
        {/* Фон: фото с размытием, светлая подложка */}
        <div
          className="fixed inset-0 z-0 bg-zinc-100"
          aria-hidden
        >
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat opacity-90"
            style={{
              backgroundImage: "url(/images/obshchie/bg.jpg)",
              filter: "blur(20px)",
            }}
          />
        </div>
        <Providers>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Header />
            <CartDock />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
