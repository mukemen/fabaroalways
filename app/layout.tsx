// app/layout.tsx
import type { ReactNode } from 'react'

export const metadata = {
  title: 'FABARO ALWAYS',
  description: 'teman curhat - By FABARO GROUP',
  manifest: '/manifest.json',
  themeColor: '#0EA5E9',

  // Biar link preview (OG/Twitter) ikut teks yang sama
  openGraph: {
    title: 'FABARO ALWAYS',
    description: 'teman curhat - By FABARO GROUP',
    siteName: 'FABARO GROUP',
    type: 'website',
    images: ['/icon-512.png'], // pastikan file ini ada di /public
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FABARO ALWAYS',
    description: 'teman curhat - By FABARO GROUP',
    images: ['/icon-512.png'],
  },
};

import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
      {/* Theme bootstrap (read localStorage before paint) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('fabaro-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
        }}
      />
    </html>
  );
}
