"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PixelCharacter = ({ color = "black" }: { color?: string }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
    <rect x="6" y="8" width="12" height="10" fill={color} />
    <rect x="8" y="6" width="2" height="2" fill={color} />
    <rect x="14" y="6" width="2" height="2" fill={color} />
    <rect x="9" y="10" width="1" height="1" fill="white" />
    <rect x="14" y="10" width="1" height="1" fill="white" />
    <rect x="6" y="18" width="2" height="2" fill={color} />
    <rect x="16" y="18" width="2" height="2" fill={color} />
  </svg>
);

const BREED_DATA: Record<string, string[]> = {
  dog: ['말티즈', '푸들', '포메라니안', '치와와', '시고르자브종', '시바견', '골든 리트리버', '진돗개', '비숑 프리제', '웰시코기', '기타'],
  cat: ['코리안 숏헤어', '페르시안', '러시안 블루', '샴', '스코티쉬 폴드', '먼치킨', '뱅갈', '랙돌', '브리티시 숏헤어', '기타']
};

export default function AddPetPage() {
  const router = useRouter();
  const [petName, setPetName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [otherInput, setOtherInput] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [gender, setGender] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [weight, setWeight] = useState("");
  const [dietMode, setDietMode] = useState(false);

  const addMedicationItem = () => {
    setMedications([...medications, { id: Date.now().toString(), name: '', frequency: '', notes: '' }]);
  };

  const removeMedicationItem = (id: string) => {
    setMedications(medications.filter(item => item.id !== id));
  };

  const updateMedicationItem = (id: string, field: string, value: string) => {
    setMedications(medications.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      // 1. Get profile/family_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) throw new Error("가족 그룹이 없습니다.");

      let photoUrl = null;

      // 2. Upload photo if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profile.family_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // 3. Validation
      if (!gender) throw new Error("아이의 성별을 선택해 주세요.");
      if (!birthDate) throw new Error("아이의 생년월일을 선택해 주세요.");

      // 4. Save pet record
      let finalSpecies = "";
      if (mainCategory === "dog") finalSpecies = `강아지 (${subCategory})`;
      else if (mainCategory === "cat") finalSpecies = `고양이 (${subCategory})`;
      else if (mainCategory === "other") finalSpecies = `기타 (${otherInput})`;
      else if (mainCategory === "hamster") finalSpecies = "햄스터";
      else if (mainCategory === "rabbit") finalSpecies = "토끼";
      else if (mainCategory === "ferret") finalSpecies = "페럿";

      if (!finalSpecies || ( (mainCategory === 'dog' || mainCategory === 'cat') && !subCategory)) {
        throw new Error("아이의 종류를 정확히 선택해 주세요.");
      }

      const { error: insertError } = await supabase
        .from("pets")
        .insert([{
          family_id: profile.family_id,
          name: petName,
          species: finalSpecies,
          photo_url: photoUrl,
          birth_date: birthDate,
          adoption_date: adoptionDate || null,
          gender: gender,
          medications: medications,
          weight: weight ? parseFloat(weight) : null,
          diet_mode: dietMode
        }]);

      if (insertError) throw insertError;

      setIsDone(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      alert(error.message || "등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[450px] space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <Link href="/dashboard" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← 취소
          </Link>
          <div className="pt-4">
            <h1 className="text-3xl font-light tracking-tighter">우리 아이 등록하기</h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              "안녕 집사야! 네가 집착할 내 이름을 알려줘."
            </p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Photo Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal text-black tracking-tight">프로필 사진</h3>
            <div className="flex justify-center pt-4">
              <label className="relative w-40 h-40 border border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden group">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-[24px] font-thin text-zinc-300">+</span>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-tighter group-hover:text-black">프로필 사진 업로드</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          <div className="space-y-10">
            {/* Name */}
            <div className="group">
              <h3 className="text-lg font-normal text-black mb-4 tracking-tight">아이 이름 *</h3>
              <input
                type="text"
                required
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="input-minimal"
                placeholder="아이의 이름을 입력하세요"
              />
            </div>

            {/* Species Selection */}
            <div className="space-y-6">
              <div className="group">
                <h3 className="text-lg font-normal text-black mb-4 tracking-tight">종류 *</h3>
                <select
                  required
                  value={mainCategory}
                  onChange={(e) => {
                    setMainCategory(e.target.value);
                    setSubCategory("");
                    setOtherInput("");
                  }}
                  className="input-minimal bg-transparent cursor-pointer appearance-none"
                >
                  <option value="" disabled>아이의 종류를 선택해주세요.</option>
                  <option value="dog">강아지</option>
                  <option value="cat">고양이</option>
                  <option value="hamster">햄스터</option>
                  <option value="rabbit">토끼</option>
                  <option value="ferret">페럿</option>
                  <option value="other">기타</option>
                </select>
              </div>

              {/* Conditional Breed Selection */}
              {(mainCategory === 'dog' || mainCategory === 'cat') && (
                <div className="group animate-in fade-in slide-in-from-top-1 duration-300">
                  <label className="label-minimal">{mainCategory === 'dog' ? '강아지 품종' : '고양이 품종'}</label>
                  <select
                    required
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="input-minimal bg-transparent cursor-pointer appearance-none"
                  >
                    <option value="" disabled>상세 품종을 선택하세요</option>
                    {BREED_DATA[mainCategory].map((breed) => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Other Input */}
              {mainCategory === 'other' && (
                <div className="group animate-in fade-in slide-in-from-top-1 duration-300">
                  <label className="label-minimal">기타 종류 입력</label>
                  <input
                    type="text"
                    required
                    value={otherInput}
                    onChange={(e) => setOtherInput(e.target.value)}
                    className="input-minimal"
                    placeholder="아이의 종류를 직접 입력하세요 (예: 거북이, 고슴도치 등)"
                  />
                </div>
              )}

              {/* Weight and Diet Mode */}
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="group">
                  <h3 className="text-lg font-normal text-black mb-4 tracking-tight">몸무게</h3>
                  <div className="flex items-center gap-2 border-b border-zinc-100 focus-within:border-black transition-colors">
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full py-4 text-base font-light bg-transparent outline-none"
                      placeholder="0.0"
                    />
                    <span className="text-sm text-zinc-300 font-light">kg</span>
                  </div>
                </div>

                <div className="group">
                  <h3 className="text-lg font-normal text-black mb-4 tracking-tight">다이어트 모드</h3>
                  <div className="flex items-center h-[57px]">
                    <button
                      type="button"
                      onClick={() => setDietMode(!dietMode)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${dietMode ? 'bg-black' : 'bg-zinc-100'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${dietMode ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                    <span className={`ml-3 text-xs font-medium tracking-widest uppercase ${dietMode ? 'text-black' : 'text-zinc-300'}`}>
                      {dietMode ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="pt-10 space-y-12 border-t border-zinc-100">
              <div className="group">
                <h3 className="text-lg font-normal text-black mb-4 tracking-tight">성별 *</h3>
                <div className="flex gap-6 pt-2">
                  {["남아", "여아", "모름"].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer group/radio">
                      <input
                        type="radio"
                        name="gender"
                        value={opt}
                        checked={gender === opt}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-3 h-3 border border-black rounded-full appearance-none checked:bg-black transition-all"
                      />
                      <span className={`text-sm ${gender === opt ? 'text-black' : 'text-zinc-400'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="group">
                <h3 className="text-lg font-normal text-black mb-4 tracking-tight">생년월일 *</h3>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="input-minimal uppercase"
                />
              </div>

              <div className="group">
                <h3 className="text-lg font-normal text-black mb-4 tracking-tight">가족이 된 날</h3>
                <input
                  type="date"
                  value={adoptionDate}
                  onChange={(e) => setAdoptionDate(e.target.value)}
                  className="input-minimal uppercase"
                />
                <p className="text-[9px] text-zinc-400 mt-2 uppercase tracking-tight">가족이 된 특별한 날을 기록해 주세요.</p>
              </div>

              <div className="group pt-10 border-t border-zinc-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-normal text-black tracking-tight">💊 복용 중인 약</h3>
                  <button 
                    type="button"
                    onClick={addMedicationItem}
                    className="text-[10px] text-zinc-400 hover:text-black transition-colors underline underline-offset-4"
                  >
                    + 항목 추가
                  </button>
                </div>
                
                <div className="space-y-4">
                  {medications.map((item) => (
                    <div key={item.id} className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 space-y-4 relative group/item">
                      <button 
                        type="button"
                        onClick={() => removeMedicationItem(item.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-zinc-100 rounded-full flex items-center justify-center text-[10px] text-zinc-300 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                      >
                        ✕
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">약 이름</label>
                          <input 
                            className="input-minimal bg-white text-xs h-10" 
                            placeholder="약 이름"
                            value={item.name}
                            onChange={e => updateMedicationItem(item.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">복용 주기</label>
                          <input 
                            className="input-minimal bg-white text-xs h-10" 
                            placeholder="복용 횟수 (예: 일 2회)"
                            value={item.frequency}
                            onChange={e => updateMedicationItem(item.id, 'frequency', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-zinc-400 uppercase tracking-tighter">메모</label>
                        <input 
                          className="input-minimal bg-white text-xs h-10" 
                          placeholder="추가 메모"
                          value={item.notes}
                          onChange={e => updateMedicationItem(item.id, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {medications.length === 0 && (
                    <p className="text-[10px] text-zinc-400 text-center py-4 border border-dashed border-zinc-100 rounded-2xl italic">
                      등록된 약이 없습니다. 항목을 추가해 보세요.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full btn-black py-5 text-sm">
            {loading ? "등록 중..." : "등록 완료"}
          </button>
        </form>
      </div>

      {/* Success Popup */}
      {isDone && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-500">
          <div className="text-center space-y-6">
            <h2 className="text-xl font-light tracking-tight">"이제부터 지독하게 기록해줄게!"</h2>
            <p className="text-xs text-zinc-400 animate-pulse">대시보드로 이동 중...</p>
          </div>
        </div>
      )}
    </main>
  );
}
