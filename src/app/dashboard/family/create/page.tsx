"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Users, Check, ChevronRight } from "lucide-react";
import { generateInviteCode } from "@/lib/utils";

export default function CreateFamilyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection');
  
  // Create state
  const [familyName, setFamilyName] = useState("");
  
  // Join state
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateFamily = async () => {
    if (!familyName.trim()) return;
    
    setLoading(true);
    try {
      const isMasterMode = localStorage.getItem("zipsa_master_mode") === "true";
      let user: any = null;
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;

      if (!user && isMasterMode) {
        const { data: anyProfile } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single();
        if (anyProfile) user = { id: anyProfile.id };
      }

      if (!user) throw new Error("로그인이 필요합니다.");

      const newInviteCode = generateInviteCode();
      
      // 1. Create new family
      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .insert([{ 
          name: familyName.trim(), 
          invite_code: newInviteCode,
          created_by: user.id 
        }])
        .select()
        .single();

      if (familyError) throw familyError;

      // 2. Update user's profile with new family_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: familyData.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      alert(`새로운 가족 '${familyName}'이 생성되었습니다!`);
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "가족 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim() || inviteCode.length < 6) return;

    setLoading(true);
    try {
      const isMasterMode = localStorage.getItem("zipsa_master_mode") === "true";
      let user: any = null;
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;

      if (!user && isMasterMode) {
        const { data: anyProfile } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single();
        if (anyProfile) user = { id: anyProfile.id };
      }

      if (!user) throw new Error("로그인이 필요합니다.");

      // 1. Find family by invite code
      const { data: familyData, error: familyError } = await supabase
        .from("families")
        .select("id, name")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single();

      if (familyError || !familyData) {
        throw new Error("유효하지 않은 초대 코드입니다.");
      }

      // 2. Update user's profile with family_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ family_id: familyData.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      alert(`'${familyData.name}' 가족에 합류했습니다!`);
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "가족 합류 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900 font-light">
      {/* Header */}
      <nav className="flex justify-between items-center px-6 py-10">
        <button 
          onClick={() => mode === 'selection' ? router.back() : setMode('selection')} 
          className="p-2 -ml-2 text-zinc-400 hover:text-black transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">Family Management</h1>
        <div className="w-10" />
      </nav>

      <div className="max-w-[400px] mx-auto px-6 py-10 space-y-16">
        <header className="space-y-4">
          <h2 className="text-3xl font-light tracking-tighter leading-tight">
            가족과 함께 <br />
            반려동물을 케어하세요.
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            새로운 가족 그룹을 만들거나, 공유받은 초대 코드를 입력하여 기존 그룹에 합류할 수 있습니다.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setMode('create')}
                className="w-full p-8 rounded-[32px] bg-zinc-50 border border-zinc-100 flex flex-col items-center gap-6 hover:bg-zinc-100 hover:border-zinc-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold">새 가족 그룹 만들기</p>
                  <p className="text-[10px] text-zinc-400">직접 그룹장이 되어 가족을 초대하세요</p>
                </div>
              </button>

              <button 
                onClick={() => setMode('join')}
                className="w-full p-8 rounded-[32px] bg-white border border-zinc-100 flex flex-col items-center gap-6 hover:bg-zinc-50 hover:border-zinc-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center group-hover:bg-zinc-200 group-hover:text-black transition-all group-hover:scale-110">
                  <Users size={20} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold">초대 코드로 합류하기</p>
                  <p className="text-[10px] text-zinc-400">공유받은 6자리 코드를 입력하세요</p>
                </div>
              </button>
            </motion.div>
          ) : mode === 'create' ? (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Family Name</label>
                  <input 
                    type="text"
                    autoFocus
                    placeholder="예: 우리집, 본가, 언니네 등"
                    className="w-full p-5 bg-zinc-50 rounded-2xl text-lg focus:ring-0 border-none transition-all placeholder:text-zinc-200"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 leading-relaxed">
                  가족 그룹을 생성하면 고유한 초대 코드가 발급됩니다. <br />
                  이 코드로 다른 가족 구성원을 초대할 수 있습니다.
                </p>
              </div>

              <button 
                onClick={handleCreateFamily}
                disabled={!familyName.trim() || loading}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-sm shadow-2xl shadow-black/10 hover:shadow-black/20 transition-all active:scale-[0.98] disabled:bg-zinc-100 disabled:text-zinc-300"
              >
                {loading ? "생성 중..." : "가족 그룹 만들기"}
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Invite Code</label>
                  <input 
                    type="text"
                    autoFocus
                    maxLength={6}
                    placeholder="6자리 코드 입력"
                    className="w-full p-5 bg-zinc-50 rounded-2xl text-2xl font-mono tracking-[0.3em] uppercase text-center focus:ring-0 border-none transition-all placeholder:text-zinc-200 placeholder:tracking-normal placeholder:text-sm"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 leading-relaxed text-center">
                  전달받은 초대 코드를 정확히 입력해주세요. <br />
                  이미 생성된 가족 그룹에 바로 합류하게 됩니다.
                </p>
              </div>

              <button 
                onClick={handleJoinFamily}
                disabled={inviteCode.length < 6 || loading}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold text-sm shadow-2xl shadow-black/10 hover:shadow-black/20 transition-all active:scale-[0.98] disabled:bg-zinc-100 disabled:text-zinc-300"
              >
                {loading ? "확인 중..." : "가족 합류하기"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <footer className="fixed bottom-10 left-0 w-full text-center">
        <p className="text-[10px] text-zinc-300 uppercase tracking-widest">Zipsa Family Services</p>
      </footer>
    </main>
  );
}
