"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Check, Trash2 } from "lucide-react";
import { useRef } from "react";

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
    address: "",
    avatar_url: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, nickname, phone, gender, address, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || "",
          nickname: data.nickname || "",
          phone: data.phone || "",
          gender: data.gender || "",
          address: data.address || "",
          avatar_url: data.avatar_url || ""
        });
      }
    } catch (error: any) {
      console.error("ProfilePage Fetch Error:", JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsSubmitting(true);
      let userId = profile?.id;
      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        userId = authData?.user?.id;
      }

      if (!userId) {
        alert("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 데이터 유실 방지: 닉네임이 비어있으면 저장을 막습니다.
      if (!formData.nickname.trim()) {
        alert("닉네임은 필수입니다. 데이터 유실 방지를 위해 저장이 중단되었습니다.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          nickname: formData.nickname,
          phone: formData.phone,
          gender: formData.gender,
          address: formData.address,
          avatar_url: formData.avatar_url
        })
        .eq("id", userId);

      if (error) throw error;
      alert("성공적으로 수정되었습니다!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("ProfilePage Update Error:", JSON.stringify(error, null, 2));
      alert("수정 중 오류가 발생했습니다: " + (error.message || JSON.stringify(error)));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // Fallback to 'profile-photos' if 'avatars' bucket doesn't exist/work
        const { error: secondError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file);
        if (secondError) throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      let userId = profile?.id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (userId) {
        await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      }
      
      alert("프로필 사진이 변경되었습니다.");
    } catch (error: any) {
      alert("업로드 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (!confirm("프로필 사진을 삭제하시겠습니까?")) return;
      setIsSubmitting(true);
      
      let userId = profile?.id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) return;

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (error) throw error;
      
      setFormData(prev => ({ ...prev, avatar_url: "" }));
      alert("사진이 삭제되었습니다.");
    } catch (error: any) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
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
          {isSubmitting ? "저장 중..." : "완료"}
        </button>
      </nav>

      <div className="max-w-[500px] mx-auto px-6 py-8 space-y-12 pb-32">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
               {formData.avatar_url ? (
                 <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl font-light text-zinc-300 uppercase">{formData.nickname?.[0] || formData.name?.[0] || "?"}</span>
               )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Camera size={14} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-zinc-400 uppercase tracking-widest hover:text-black transition-colors font-bold"
            >
              프로필 사진 변경
            </button>
            <div className="w-[1px] h-2 bg-zinc-100" />
            <button 
              onClick={handleRemovePhoto}
              className="text-[10px] text-zinc-400 uppercase tracking-widest hover:text-red-500 transition-colors font-bold"
            >
              삭제
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-10">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">실명</label>
            <input 
              type="text"
              placeholder="본인의 성함을 입력해주세요"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">닉네임</label>
            <input 
              type="text"
              placeholder="활동할 닉네임을 입력해주세요"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">전화번호</label>
            <input 
              type="text"
              placeholder="010-0000-0000"
              className="w-full p-4 bg-zinc-50 rounded-2xl text-sm focus:ring-0 focus:border-black border-transparent transition-all placeholder:text-zinc-200"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">성별</label>
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
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">주소</label>
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
