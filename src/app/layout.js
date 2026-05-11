import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PerformanceMonitor from "@/components/PerformanceMonitor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Fitness Race Pro | AI Football Game",
  description: "Score goals and win races by performing physical exercises in this AI-powered motion game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PerformanceMonitor />
        {children}
      </body>
    </html>
  );
}
