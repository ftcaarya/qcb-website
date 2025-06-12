import type { Metadata } from "next";
import { Bree_Serif, Libre_Baskerville } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const breeSerif = Bree_Serif({ 
  weight: '400',
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-bree',
});

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-baskerville',
});

export const metadata: Metadata = {
  title: "Queen City Blendz - Haircuts",
  description: "Book your appointment with Queen City Blendz for professional haircuts.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${breeSerif.variable} ${libreBaskerville.variable} ${breeSerif.className}`}>
        <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white py-4 shadow-md">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-xl font-display font-bold italic">
                QCB
              </div>
              <span className="font-display text-xl font-bold tracking-wide italic">Queen City Blends</span>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/" className="hover:text-pink-300 transition-colors">Book Now</Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-pink-300 transition-colors">Admin</Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        {children}
        
        <footer className="bg-gray-900 text-white py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm">
              Made by{' '}
              <span className="font-semibold text-purple-300">Aarya Raut</span>
              {' '}• DM{' '}
              <a 
                href="https://instagram.com/just.aaryaraut" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-300 hover:text-pink-200 transition-colors underline"
              >
                @just.aaryaraut
              </a>
              {' '}on Instagram for websites
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
