import './globals.css'

export const metadata = {
  title: 'Altseason Signal Board',
  description: 'Real-time crypto dashboard tracking key indicators for altseason signals',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-primary text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
