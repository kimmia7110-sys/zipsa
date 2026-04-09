"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateInviteCode } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { regionsData } from "@/lib/regions";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    nickname: "",
    phone: "--",
    gender: "",
    address: " ",
    inviteCode: "",
  });

  const [hasInviteCode, setHasInviteCode] = useState<boolean | null>(null);

  const selectedRegion = formData.address.split(" ")[0] || "";
  const subCities = regionsData[selectedRegion] || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'nickname') setNicknameStatus('idle');
  };

  const checkNickname = async () => {
    if (!formData.nickname) return;
    setNicknameStatus('checking');
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('nickname', formData.nickname)
      .maybeSingle();
    
    if (error) {
      console.error(error);
      setNicknameStatus('idle');
      return;
    }

    setNicknameStatus(data ? 'taken' : 'available');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("가입 중 오류가 발생했습니다.");

      let familyId = null;

      if (hasInviteCode === true) {
        // 2a. Find family by invite code
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .select("id")
          .eq("invite_code", formData.inviteCode.toUpperCase())
          .single();

        if (familyError || !familyData) {
          throw new Error("유효하지 않은 초대 코드입니다.");
        }
        familyId = familyData.id;
      } else {
        // 2b. Create new family
        const newInviteCode = generateInviteCode();
        const { data: familyData, error: familyError } = await supabase
          .from("families")
          .insert([{ invite_code: newInviteCode, name: `${formData.name}님의 가족` }])
          .select()
          .single();

        if (familyError) throw familyError;
        familyId = familyData.id;
      }

      // 3. Update profile with extra info and family_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          family_id: familyId,
          nickname: formData.nickname,
          phone: formData.phone,
          gender: formData.gender,
          address: formData.address,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      alert("회원가입이 완료되었습니다!");
      router.push("/");
    } catch (error: any) {
      if (error.code === "23505" && error.message.includes("nickname")) {
        alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.");
      } else {
        alert(error.message || "오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[400px] space-y-16">
        {/* Header */}
        <header className="space-y-2">
          <Link href="/" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← 로그인으로 돌아가기
          </Link>
          <h1 className="text-3xl font-light tracking-tighter pt-4">회원가입</h1>
          <p className="text-xs text-zinc-400 font-light">나와 우리 반려동물을 위한 지독한 공간</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-10">
            {/* Account Info */}
            <div className="space-y-10 pb-6 border-b border-zinc-100">
              <h3 className="text-lg font-normal text-black tracking-tight">계정 정보</h3>
              <div className="group">
                <label className="label-minimal">이메일</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-minimal"
                  placeholder="example@email.com"
                />
              </div>
              <div className="group">
                <label className="label-minimal">비밀번호</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-minimal"
                  placeholder="6자리 이상 입력하세요"
                />
              </div>
              <div className="group">
                <label className="label-minimal">비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-minimal"
                  placeholder="비밀번호를 한번 더 입력하세요"
                />
                {formData.confirmPassword && (
                  <p className={`text-[10px] mt-2 ${formData.password === formData.confirmPassword ? 'text-zinc-900' : 'text-zinc-300'}`}>
                    {formData.password === formData.confirmPassword 
                      ? "✓ 비밀번호가 일치합니다." 
                      : "✕ 비밀번호가 일치하지 않습니다."}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="group">
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
                    placeholder="보호자 성함을 입력하세요"
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
                      placeholder="활동하실 닉네임을 입력하세요"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                      <button 
                        type="button" 
                        onClick={checkNickname}
                        disabled={nicknameStatus === 'checking' || !formData.nickname}
                        className="text-[9px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors px-2"
                      >
                        {nicknameStatus === 'checking' ? '...' : 'Check'}
                      </button>
                    </div>
                  </div>
                  {nicknameStatus !== 'idle' && (
                    <p className={`text-[10px] mt-2 ${nicknameStatus === 'available' ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {nicknameStatus === 'available' 
                        ? "✓ 사용 가능한 닉네임입니다." 
                        : "✕ 이미 사용 중인 닉네임입니다."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="group">
              <label className="label-minimal">연락처</label>
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  maxLength={3}
                  placeholder="010"
                  required
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
                  placeholder="0000"
                  required
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
                  placeholder="0000"
                  required
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

            {/* Gender */}
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

            {/* Address */}
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
                  <option value="" disabled>시/도 선택</option>
                  <option value="서울특별시">서울특별시</option>
                  <option value="부산광역시">부산광역시</option>
                  <option value="대구광역시">대구광역시</option>
                  <option value="인천광역시">인천광역시</option>
                  <option value="광주광역시">광주광역시</option>
                  <option value="대전광역시">대전광역시</option>
                  <option value="울산광역시">울산광역시</option>
                  <option value="세종특별자치시">세종특별자치시</option>
                  <option value="경기도">경기도</option>
                  <option value="강원특별자치도">강원특별자치도</option>
                  <option value="충청북도">충청북도</option>
                  <option value="충청남도">충청남도</option>
                  <option value="전북특별자치도">전북특별자치도</option>
                  <option value="전라남도">전라남도</option>
                  <option value="경상북도">경상북도</option>
                  <option value="경상남도">경상남도</option>
                  <option value="제주특별자치도">제주특별자치도</option>
                </select>

                <select
                  required
                  disabled={!selectedRegion}
                  className="input-minimal flex-1 bg-transparent cursor-pointer appearance-none disabled:text-zinc-200"
                  value={formData.address.split(" ")[1] || ""}
                  onChange={(e) => {
                    const city = e.target.value;
                    setFormData({ ...formData, address: `${selectedRegion} ${city}` });
                  }}
                >
                  <option value="" disabled>시/군/구 선택</option>
                  {subCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  <option value="전체">전체/기타</option>
                </select>
              </div>
            </div>

            {/* Family Connection Logic */}
            <div className="group pt-6 border-t border-zinc-100">
              <h3 className="text-lg font-normal text-black mb-4 tracking-tight">가족 연결</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setHasInviteCode(true)}
                    className={`flex-1 py-3 text-[11px] border transition-all ${
                      hasInviteCode === true ? 'border-black text-black' : 'border-zinc-100 text-zinc-400'
                    }`}
                  >
                    초대 코드 있음
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasInviteCode(false)}
                    className={`flex-1 py-3 text-[11px] border transition-all ${
                      hasInviteCode === false ? 'border-black text-black' : 'border-zinc-100 text-zinc-400'
                    }`}
                  >
                    코드 없음 (새 그룹 생성)
                  </button>
                </div>

                {hasInviteCode === true && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <input
                      type="text"
                      name="inviteCode"
                      required
                      value={formData.inviteCode}
                      onChange={handleChange}
                      className="input-minimal font-mono tracking-widest uppercase"
                      placeholder="초대 코드를 입력하세요"
                    />
                    <p className="text-[10px] text-zinc-400 mt-2">공유받은 6자리 코드를 입력해주세요.</p>
                  </div>
                )}

                {hasInviteCode === false && (
                  <div className="p-4 bg-zinc-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-normal">
                      가입 완료 즉시 **새로운 가족 코드**가 이메일 및 알림으로 발급됩니다. 
                      이 코드를 통해 가족을 초대하실 수 있습니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={hasInviteCode === null || loading}
            className={`w-full py-4 text-sm font-medium transition-all ${
              hasInviteCode === null || loading
              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>
      </div>
    </main>
  );
}
