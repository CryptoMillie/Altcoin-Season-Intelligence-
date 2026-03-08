import { Orbitron, Space_Mono, DM_Sans } from 'next/font/google';
import './globals.css';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  display: 'swap',
  weight: ['400', '700'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata = {
  title: 'Altseason Signal Board',
  description: 'Real-time crypto dashboard tracking 7 market indicators that signal when altseason is approaching',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${spaceMono.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
