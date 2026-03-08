import './globals.css';
import { Inter, Orbitron, Space_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const orbitron = Orbitron({ 
  subsets: ['latin'], 
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700'],
});
const spaceMono = Space_Mono({ 
  subsets: ['latin'], 
  variable: '--font-space-mono',
  weight: ['400', '700'],
});

export const metadata = {
  title: 'Altseason Signal Board',
  description: 'Real-time crypto dashboard tracking 7 key indicators for altseason signals',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${spaceMono.variable}`}>
      <body className="bg-[#07080d] text-white min-h-screen">{children}</body>
    </html>
  );
}
