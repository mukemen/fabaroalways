// app/layout.tsx
import type { ReactNode } from 'react'

export const metadata = {
  title: 'FABARO ALWAYS',
  description: 'AI Teman Curhat — by FABARO GROUP',
  manifest: '/manifest.json',
  themeColor: '#0EA5E9',
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
