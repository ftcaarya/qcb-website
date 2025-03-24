import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Queen City Blendz - Hair Cutting & Nail Services",
  description: "Book your appointment with Queen City Blendz for professional hair cutting and nail services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white py-4 shadow-md">
          <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-xl font-bold">
                QCB
              </div>
              <span className="font-bold text-xl">Queen City Blendz</span>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <a href="/" className="hover:text-pink-300 transition-colors">Book Now</a>
                </li>
                <li>
                  <a href="/admin" className="hover:text-pink-300 transition-colors">Admin</a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        {children}
      </body>
    </html>
  );
}
