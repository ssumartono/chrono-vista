import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { getAppPreferences } from '@/lib/app-preferences';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChronoVista",
  description: "Personal Photography Archive & Publishing Studio",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const preferences = getAppPreferences();
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      data-theme={preferences.theme}
      style={{ '--chrono-accent': preferences.accent } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
