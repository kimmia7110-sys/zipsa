"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

const PixelDog = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto my-6">
    {/* Simple Pixel Dog */}
    <rect x="4" y="10" width="2" height="2" fill="black" />
    <rect x="18" y="10" width="2" height="2" fill="black" />
    <rect x="6" y="8" width="12" height="8" fill="black" />
    <rect x="8" y="10" width="2" height="2" fill="white" />
    <rect x="14" y="10" width="2" height="2" fill="white" />
    <rect x="11" y="14" width="2" height="1" fill="white" />
    <rect x="6" y="16" width="2" height="2" fill="black" />
    <rect x="16" y="16" width="2" height="2" fill="black" />
    <rect x="8" y="4" width="2" height="4" fill="black" />
    <rect x="14" y="4" width="2" height="4" fill="black" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[320px] text-center space-y-12">
        {/* Main Visual */}
        <section className="space-y-4 pt-8">
          <p className="text-[10px] tracking-[0.2em] font-light text-zinc-500 uppercase">
            지독하게 사랑한다면, 집착하세요.
          </p>
          <PixelDog />
          <h1 className="text-2xl font-light tracking-tighter">집착</h1>
        </section>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-8 text-left">
          <div className="space-y-6">
            <div className="group">
              <label className="label-minimal">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-minimal"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div className="group">
              <label className="label-minimal">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-minimal"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-black">
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-20 space-y-4">
          <p className="text-[11px] text-zinc-400 mt-4">
            아직 회원이 아니신가요?{" "}
            <Link href="/signup" className="text-black underline underline-offset-4 decoration-[0.5px]">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
