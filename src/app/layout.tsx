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
        
        <footer className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Queen City Blendz</h3>
                <p className="text-purple-200">Professional hair cutting and nail services for everyone.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Contact Us</h3>
                <p className="text-purple-200">Email: queencityblendzzz@gmail.com</p>
                <p className="text-purple-200">Phone: (980) 833-9861</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Hours</h3>
                <p className="text-purple-200">Monday - Friday: 9am - 6pm</p>
                <p className="text-purple-200">Saturday: 10am - 4pm</p>
                <p className="text-purple-200">Sunday: Closed</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-purple-700 text-center text-purple-300">
              <p>&copy; {new Date().getFullYear()} Queen City Blendz. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
