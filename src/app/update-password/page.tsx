"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Lock, Check, ArrowRight } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if we have a session (should be present if redirected from email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("세션이 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.");
        router.push("/");
      }
    };
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      alert("비밀번호는 6자리 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setStatus('success');
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error: any) {
      alert(error.message || "비밀번호 변경 중 오류가 발생했습니다.");
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 font-light">
      <div className="w-full max-w-[320px] text-center space-y-12">
        <header className="space-y-4">
          <div className="w-12 h-12 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={20} className="text-zinc-900" />
          </div>
          <h1 className="text-2xl font-light tracking-tighter">비밀번호 재설정</h1>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest leading-relaxed">
            새로운 비밀번호를 입력하여 <br /> 계정 보안을 강화하세요.
          </p>
        </header>

        {status === 'success' ? (
          <div className="py-10 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <Check size={32} className="text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold">변경 완료!</p>
              <p className="text-[10px] text-zinc-400">잠시 후 로그인 화면으로 이동합니다.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-8 text-left animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="space-y-6">
              <div className="group">
                <label className="label-minimal">새 비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-minimal"
                  placeholder="6자리 이상 비밀번호"
                  autoFocus
                />
              </div>
              <div className="group">
                <label className="label-minimal">비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-minimal"
                  placeholder="다시 한번 입력하세요"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !password || password !== confirmPassword} 
              className="w-full btn-black flex items-center justify-center gap-2 group"
            >
              {loading ? "변경 중..." : (
                <>
                  비밀번호 변경하기
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <footer className="pt-20">
          <p className="text-[10px] text-zinc-300 uppercase tracking-widest italic">Zipsa Security Service</p>
        </footer>
      </div>
    </main>
  );
}
