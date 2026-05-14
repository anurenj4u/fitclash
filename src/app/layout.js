import { Geist, Geist_Mono, Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import LandscapeGuard from "@/components/LandscapeGuard";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "ClashofCardio | AI-Powered Motion Fitness Game",
  description: "Transform your workout into an arcade experience. Use your camera to race, score goals, and stay fit with AI motion tracking. No equipment needed.",
  keywords: ["AI fitness", "motion game", "workout game", "ClashofCardio", "computer vision fitness", "squat game"],
  authors: [{ name: "ClashofCardio Team" }],
  openGraph: {
    title: "ClashofCardio | AI-Powered Motion Fitness Game",
    description: "Race to the finish line by performing real-world exercises. Your body is the controller.",
    url: "https://clashofcardio.fit",
    siteName: "ClashofCardio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClashofCardio Gameplay",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClashofCardio | AI-Powered Motion Fitness Game",
    description: "The future of fitness is here. Play to get fit.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-icon.png',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};


import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${rajdhani.variable}`}>
      <body>
        <AuthProvider>
          <PerformanceMonitor />
          <Navbar />
          <main style={{ flex: 1, paddingTop: '70px' }}>
            <LandscapeGuard>
              {children}
            </LandscapeGuard>
          </main>
          <Footer />
        </AuthProvider>
        <GoogleAnalytics gaId="G-91QEX080ZK" />
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "wpbj8t785x");
          `}
        </Script>
      </body>
    </html>
  );
}
