import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import LandscapeGuard from "@/components/LandscapeGuard";
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FitClash | AI Fitness Game",
  description: "Race to the finish line and score goals by performing physical exercises in this AI-powered motion game.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PerformanceMonitor />
        <LandscapeGuard>
          {children}
        </LandscapeGuard>
        <GoogleAnalytics gaId="G-91QEX080ZK" />
        <Script id="microsoft-clarity" strategy="afterInteractive">
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
