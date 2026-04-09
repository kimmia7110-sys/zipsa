"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { regionsData } from "@/lib/regions";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    nickname: "",
    phone: "--",
    gender: "",
    address: " ",
    inviteCode: "",
    inputInviteCode: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Fetch family invite code
      const { data: family } = await supabase
        .from("families")
        .select("invite_code")
        .eq("id", profile.family_id)
        .single();

      setFormData({
        email: user.email || "",
        name: profile.name || "",
        nickname: profile.nickname || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        address: profile.address || " ",
        inviteCode: family?.invite_code || "코드 없음",
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'nickname') setNicknameStatus('idle');
  };

  const checkNickname = async () => {
    if (!formData.nickname) return;
    setNicknameStatus('checking');
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('nickname', formData.nickname)
      .neq('id', user?.id)
      .maybeSingle();
    
    setNicknameStatus(data ? 'taken' : 'available');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.name,
          nickname: formData.nickname,
          phone: formData.phone,
          gender: formData.gender,
          address: formData.address,
        })
        .eq("id", user?.id);

      if (error) {
        if (error.code === "23505") throw new Error("이미 사용 중인 닉네임입니다.");
        throw error;
      }
      
      alert("프로필이 수정되었습니다.");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.inviteCode);
    alert("초대 코드가 복사되었습니다.");
  };

  const handleJoinFamily = async () => {
    if (!formData.inputInviteCode) return;
    
    setSaving(true);
    try {
      const { data: family, error: familyError } = await supabase
        .from("families")
        .select("id")
        .eq("invite_code", formData.inputInviteCode.toUpperCase())
        .maybeSingle();

      if (familyError || !family) {
        throw new Error("유효하지 않은 초대 코드입니다.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ family_id: family.id })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      alert("가족에 합류하셨습니다!");
      fetchProfile(); // Refresh profile and invitation code
    } catch (error: any) {
      alert(error.message || "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xs tracking-[0.2em] font-light animate-pulse uppercase">로딩 중...</p>
      </div>
    );
  }

  const selectedRegion = formData.address.split(" ")[0] || "";
  const subCities = regionsData[selectedRegion] || [];

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[400px] space-y-16">
        <header className="space-y-4">
          <Link href="/dashboard" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← 대시보드로 돌아가기
          </Link>
          <div className="pt-4">
            <h1 className="text-3xl font-light tracking-tighter">마이페이지</h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">회원 정보 및 프로필을 수정할 수 있습니다.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-10">
            {/* Account Info */}
            <div className="group">
              <h3 className="text-lg font-normal text-black mb-6 tracking-tight">계정 정보</h3>
              <div className="group">
                <label className="label-minimal">이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="input-minimal opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="group pt-6 border-t border-zinc-100">
              <h3 className="text-lg font-normal text-black mb-6 tracking-tight">프로필 정보</h3>
              <div className="space-y-10 mt-4">
                <div className="group">
                  <label className="label-minimal">보호자 성함</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-minimal"
                  />
                </div>
                <div className="group">
                  <label className="label-minimal">닉네임</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="nickname"
                      required
                      value={formData.nickname}
                      onChange={handleChange}
                      onBlur={checkNickname}
                      className="input-minimal pr-16"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <button 
                        type="button" 
                        onClick={checkNickname}
                        disabled={nicknameStatus === 'checking' || !formData.nickname}
                        className="text-[9px] tracking-widest text-zinc-400 uppercase hover:text-black px-2"
                      >
                        {nicknameStatus === 'checking' ? '...' : 'Check'}
                      </button>
                    </div>
                  </div>
                  {nicknameStatus !== 'idle' && (
                    <p className={`text-[10px] mt-2 ${nicknameStatus === 'available' ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {nicknameStatus === 'available' ? "✓ 사용 가능" : "✕ 사용 불가"}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label className="label-minimal">연락처</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      maxLength={3}
                      className="input-minimal text-center flex-1"
                      value={formData.phone.split("-")[0] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const parts = formData.phone.split("-");
                        while (parts.length < 3) parts.push("");
                        parts[0] = val;
                        setFormData({ ...formData, phone: parts.join("-") });
                      }}
                    />
                    <span className="text-zinc-300 text-xs">-</span>
                    <input
                      type="tel"
                      maxLength={4}
                      className="input-minimal text-center flex-1"
                      value={formData.phone.split("-")[1] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const parts = formData.phone.split("-");
                        while (parts.length < 3) parts.push("");
                        parts[1] = val;
                        setFormData({ ...formData, phone: parts.join("-") });
                      }}
                    />
                    <span className="text-zinc-300 text-xs">-</span>
                    <input
                      type="tel"
                      maxLength={4}
                      className="input-minimal text-center flex-1"
                      value={formData.phone.split("-")[2] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        const parts = formData.phone.split("-");
                        while (parts.length < 3) parts.push("");
                        parts[2] = val;
                        setFormData({ ...formData, phone: parts.join("-") });
                      }}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="label-minimal">성별</label>
                  <div className="flex gap-8 pt-2">
                    {["남성", "여성"].map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={formData.gender === option}
                          onChange={handleChange}
                          className="w-3 h-3 border border-black rounded-full appearance-none checked:bg-black transition-all"
                        />
                        <span className={`text-sm ${formData.gender === option ? 'text-black' : 'text-zinc-400'}`}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="group">
                  <label className="label-minimal">주소</label>
                  <div className="flex gap-2">
                    <select
                      required
                      className="input-minimal flex-1 bg-transparent cursor-pointer appearance-none"
                      value={formData.address.split(" ")[0] || ""}
                      onChange={(e) => {
                        const region = e.target.value;
                        setFormData({ ...formData, address: region + " " });
                      }}
                    >
                      <option value="" disabled>시/도</option>
                      {Object.keys(regionsData).map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>

                    <select
                      required
                      disabled={!selectedRegion}
                      className="input-minimal flex-1 bg-transparent cursor-pointer appearance-none"
                      value={formData.address.split(" ")[1] || ""}
                      onChange={(e) => {
                        const city = e.target.value;
                        setFormData({ ...formData, address: `${selectedRegion} ${city}` });
                      }}
                    >
                      <option value="" disabled>시/군/구</option>
                      {subCities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Family Connection Section */}
            <div className="group pt-6 border-t border-zinc-100">
              <h3 className="text-lg font-normal text-black mb-6 tracking-tight">가족 관리</h3>
              
              {/* Existing Family Code */}
              <div className="bg-zinc-50 p-6 space-y-4 mb-6">
                <label className="label-minimal text-zinc-400">나의 가족 초대 코드</label>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-light tracking-[0.2em]">{formData.inviteCode}</span>
                  <button 
                    type="button"
                    onClick={handleCopyCode}
                    className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black border-b border-zinc-200 pb-0.5"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  이 코드를 가족에게 공유하여 같은 아이들을 함께 돌볼 수 있습니다.
                </p>
              </div>

              {/* Join Family Section */}
              <div className="border border-zinc-100 p-6 space-y-4">
                <label className="label-minimal text-zinc-400">초대받은 코드가 있나요?</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="inputInviteCode"
                    placeholder="코드 6자리 입력"
                    className="input-minimal flex-[2] uppercase font-mono tracking-widest"
                    value={formData.inputInviteCode}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={handleJoinFamily}
                    disabled={saving || !formData.inputInviteCode}
                    className="flex-1 text-[11px] font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    합류하기
                  </button>
                </div>
                <p className="text-[10px] text-zinc-300 italic">
                  * 다른 가족에 합류하면 기존 가족 그룹에서 변경됩니다.
                </p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full btn-black py-4"
          >
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </form>
      </div>
    </main>
  );
}
