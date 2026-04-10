import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});

export const metadata: Metadata = {
  title: "집사 (Zipsa) | 지독하게 사랑한다면, 집착하세요",
  description: "반려동물과의 소중한 기록을 함께 나누는 가족 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${inter.variable}`}>
      <body className="antialiased selection:bg-zinc-900 selection:text-white text-[#1A1A1A]">
        <Script
          src="https://unpkg.com/react-grab/dist/index.global.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
