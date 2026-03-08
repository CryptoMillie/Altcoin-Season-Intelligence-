export const metadata = {
  title: 'Altseason Signal Board',
  description: 'Real-time crypto dashboard tracking altseason indicators',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
