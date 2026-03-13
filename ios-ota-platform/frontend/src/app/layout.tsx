import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OTA App Store',
  description: 'Install iOS apps over the air',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="font-bold text-lg text-blue-600">
              OTA App Store
            </a>
            <a
              href="/admin"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Admin
            </a>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
