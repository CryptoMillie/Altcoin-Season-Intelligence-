export const metadata = {
  title: 'Altseason Signal Board',
  description: 'Crypto market analysis dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0f1120', color: '#fff', fontFamily: 'Space Mono, monospace' }}>
        {children}
      </body>
    </html>
  );
}
