import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import PerformanceMonitor from "@/components/PerformanceMonitor";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "ClashofCardio | World Cup Fitness Challenge & AI Trainer",
  description: "Get ready for the FIFA World Cup with ClashofCardio! An AI-powered home fitness training platform. Race in the World Cup Sprint, score goals, and track your workouts using your camera.",
  keywords: ["FIFA World Cup fitness", "AI fitness trainer", "football workout game", "home workout app", "computer vision fitness", "ClashofCardio", "World Cup Challenge", "cardio training"],
  authors: [{ name: "ClashofCardio Team" }],
  openGraph: {
    title: "ClashofCardio | World Cup Fitness Challenge & AI Trainer",
    description: "Train like a pro for the World Cup. Use your camera to track your home workouts and compete in the World Cup Fitness Challenge.",
    url: "https://clashofcardio.fit",
    siteName: "ClashofCardio",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClashofCardio World Cup Fitness",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClashofCardio | World Cup Fitness Challenge",
    description: "The ultimate AI fitness trainer for the World Cup season. Play, train, and get fit at home.",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <PerformanceMonitor />
          <Navbar />
          <main style={{ flex: 1, paddingTop: '70px' }}>
            {children}
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
