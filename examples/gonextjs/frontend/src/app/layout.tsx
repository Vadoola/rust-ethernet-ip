import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rust EtherNet/IP Driver - Next.js Demo',
  description: 'EtherNet/IP PLC control with Go backend and Next.js frontend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-600 to-blue-400 text-gray-900">
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 mb-6">
            <span role="img" aria-label="octopus">🐙</span> Rust EtherNet/IP Driver - Next.js Demo
          </h1>
          {children}
        </main>
      </body>
    </html>
  );
} 