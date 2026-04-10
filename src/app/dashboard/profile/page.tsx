"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Check } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    phone: "",
    gender: "",
    address: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const isMasterMode = localStorage.getItem("zipsa_master_mode") === "true";
      
      let user: any = null;
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;

      // [마스터 인증 추월]
      if (!user && isMasterMode) {
        const { data: anyProfile } = await supabase
          .from("profiles")
          .select("id, name, nickname, phone, gender, address")
          .limit(1)
          .single();
        
        if (anyProfile) {
          user = { id: anyProfile.id };
          setProfile(anyProfile);
          setFormData({
            name: anyProfile.name || "",
            nickname: anyProfile.nickname || "",
            phone: anyProfile.phone || "",
            gender: anyProfile.gender || "",
            address: anyProfile.address || ""
          });
          return;
        }
      }

      if (!user) {
        console.warn("User session not found.");
        router.push("/");
        return;
      }

      // Using a simple query to avoid any complex joins during RLS transition
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, nickname, phone, gender, address")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        if (error.message?.includes("recursion")) {
          console.error("DB Recursion still detected. Attempting cache bypass...");
        }
        throw error;
      }
      
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
          gender: data.gender || "",
          address: data.address || ""
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;
      alert("성공적으로 수정되었습니다!");
      router.push("/dashboard");
    } catch (error: any) {
      alert("수정 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex justify-between items-center px-6 py-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">나의 정보 수정</h1>
        <button 
          onClick={handleUpdate}
          disabled={isSubmitting}
          className="p-2 -mr-2 text-black hover:opacity-50 transition-all font-bold text-xs uppercase tracking-widest"
        >
          {isSubmitting ? "Saving..." : "Done"}
        </button>
      </nav>

      <div className="max-w-[500px] mx-auto px-6 py-8 space-y-12 pb-32">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
               <span className="text-2xl font-light text-zinc-300 uppercase">{formData.nickname?.[0] || formData.name?.[0] || "?"}</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Camera size={14} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">프로필 사진 변경</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Real Name</label>
            <input 
              type="text"
              placeholder="본인의 성함을 입력해주세요"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Nickname</label>
            <input 
              type="text"
              placeholder="활동할 닉네임을 입력해주세요"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Phone Number</label>
            <input 
              type="text"
              placeholder="010-0000-0000"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              {["남성", "여성"].map((g) => (
                <button
                  key={g}
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={`py-4 rounded-2xl text-xs font-semibold border transition-all ${
                    formData.gender === g ? "border-black bg-black text-white" : "border-zinc-100 text-zinc-400"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">Address</label>
            <input 
              type="text"
              placeholder="주 거주지를 입력해주세요"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isSubmitting}
          className="w-full py-5 bg-black text-white rounded-2xl font-bold text-sm shadow-2xl shadow-black/10 hover:shadow-black/20 transition-all active:scale-[0.98] disabled:bg-zinc-100"
        >
          {isSubmitting ? "업데이트 중..." : "정보 수정 완료"}
        </button>
      </div>
    </main>
  );
}
