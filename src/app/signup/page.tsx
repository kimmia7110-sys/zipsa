"use client";

import Link from "next/link";
import { useState } from "react";

import { regionsData } from "@/lib/regions";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    const finalData = {
      ...formData,
      inviteCode: hasInviteCode ? formData.inviteCode : "AUTO_GENERATE",
    };
    console.log("Sign up attempt:", finalData);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[400px] space-y-16">
        {/* Header */}
        <header className="space-y-2">
          <Link href="/" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← BACK TO LOGIN
          </Link>
          <h1 className="text-3xl font-light tracking-tighter pt-4">회원가입</h1>
          <p className="text-xs text-zinc-400 font-light">나와 우리 반려동물을 위한 지독한 공간</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-10">
            {/* Account Info */}
            <div className="space-y-10 pb-6 border-b border-zinc-100">
              <label className="label-minimal text-black">Account</label>
              <div className="group">
                <label className="label-minimal">Email</label>
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
                <label className="label-minimal">Password</label>
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
                <label className="label-minimal">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-minimal"
                  placeholder="비밀번호를 한번 더 입력하세요"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="group">
              <label className="label-minimal text-black mb-6">Profile</label>
              <div className="group mt-4">
                <label className="label-minimal">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-minimal"
                  placeholder="이름을 입력하세요"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="group">
              <label className="label-minimal">Contact</label>
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
              <label className="label-minimal">Gender</label>
              <div className="flex gap-8 pt-2">
                {["남성", "여성", "기타"].map((option) => (
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
              <label className="label-minimal">Address</label>
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
              <label className="label-minimal text-black mb-4">Family Connection</label>
              
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
            disabled={hasInviteCode === null}
            className={`w-full py-4 text-sm font-medium transition-all ${
              hasInviteCode === null 
              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            가입하기
          </button>
        </form>
      </div>
    </main>
  );
}
