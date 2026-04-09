import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"], // Focused on lighter weights for minimalism
});

export const metadata: Metadata = {
  title: "집착 (Zip-Chak) | 지독하게 사랑한다면, 집착하세요",
  description: "반려동물과의 소중한 기록을 함께 나누는 가족 커뮤니티",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geistSans.variable}>
      <body className="antialiased selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}
