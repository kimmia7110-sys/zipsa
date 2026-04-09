"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const BREED_DATA: Record<string, string[]> = {
  dog: ['말티즈', '푸들', '포메라니안', '치와와', '시바견', '골든 리트리버', '진돗개', '비숑 프리제', '웰시코기', '기타'],
  cat: ['코리안 숏헤어', '페르시안', '러시안 블루', '샴', '스코티쉬 폴드', '먼치킨', '뱅갈', '랙돌', '브리티시 숏헤어', '기타']
};

export default function EditPetPage() {
  const router = useRouter();
  const params = useParams();
  const petId = params.id as string;

  const [petName, setPetName] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [otherInput, setOtherInput] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [gender, setGender] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPet();
  }, [petId]);

  const fetchPet = async () => {
    const { data: pet, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", petId)
      .single();

    if (error || !pet) {
      alert("아이 정보를 정보를 불러오는데 실패했습니다.");
      router.push("/dashboard");
      return;
    }

    setPetName(pet.name);
    setPreviewImage(pet.photo_url);
    setBirthDate(pet.birth_date || "");
    setAdoptionDate(pet.adoption_date || "");
    setGender(pet.gender || "");
    
    // Parse species string
    if (pet.species.startsWith("강아지")) {
      setMainCategory("dog");
      const sub = pet.species.match(/\((.*)\)/)?.[1];
      if (sub) setSubCategory(sub);
    } else if (pet.species.startsWith("고양이")) {
      setMainCategory("cat");
      const sub = pet.species.match(/\((.*)\)/)?.[1];
      if (sub) setSubCategory(sub);
    } else if (pet.species.startsWith("기타")) {
      setMainCategory("other");
      const other = pet.species.match(/\((.*)\)/)?.[1];
      if (other) setOtherInput(other);
    } else {
      setMainCategory(pet.species.toLowerCase());
    }
    
    setLoading(false);
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
    setSaving(true);

    try {
      let photoUrl = previewImage;

      // 1. Upload new photo if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `pet-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // 2. Prepare final species string
      let finalSpecies = "";
      if (mainCategory === "dog") finalSpecies = `강아지 (${subCategory})`;
      else if (mainCategory === "cat") finalSpecies = `고양이 (${subCategory})`;
      else if (mainCategory === "other") finalSpecies = `기타 (${otherInput})`;
      else if (mainCategory === "hamster") finalSpecies = "햄스터";
      else if (mainCategory === "rabbit") finalSpecies = "토끼";
      else if (mainCategory === "ferret") finalSpecies = "페럿";

      // 3. Validation
      if (!gender) throw new Error("아이의 성별을 선택해 주세요.");
      if (!birthDate) throw new Error("아이의 생년월일을 선택해 주세요.");

      // 4. Update pet record
      const { error: updateError } = await supabase
        .from("pets")
        .update({
          name: petName,
          species: finalSpecies,
          photo_url: photoUrl,
          birth_date: birthDate,
          adoption_date: adoptionDate || null,
          gender: gender,
        })
        .eq("id", petId);

      if (updateError) throw updateError;

      alert("아이 정보가 수정되었습니다.");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xs tracking-[0.2em] font-light animate-pulse uppercase">정보 불러오는 중...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[450px] space-y-16">
        <header className="space-y-4">
          <Link href="/dashboard" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← 뒤로가기
          </Link>
          <div className="pt-4">
            <h1 className="text-3xl font-light tracking-tighter">정보 수정하기</h1>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              아이의 이름, 종류, 사진을 최신 정보로 변경해 주세요.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Photo Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-normal text-black tracking-tight">프로필 사진</h3>
            <div className="flex justify-center pt-4">
              <div className="relative group">
                <label className="block w-40 h-40 border border-zinc-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden bg-zinc-50">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-center space-y-1">
                      <span className="text-[24px] font-thin text-zinc-300">+</span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-tighter">사진 추가</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                
                {/* Edit Icon Button */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg border-4 border-white cursor-pointer group-hover:scale-110 transition-all pointer-events-none">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* Name */}
            <div className="group">
              <h3 className="text-lg font-normal text-black mb-4 tracking-tight">아이 이름</h3>
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
                <h3 className="text-lg font-normal text-black mb-4 tracking-tight">종류</h3>
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
                    placeholder="아이의 종류를 직접 입력하세요"
                  />
                </div>
              )}
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
              </div>
            </div>

          </div>

          <button type="submit" disabled={saving} className="w-full btn-black py-5 text-sm">
            {saving ? "저장 중..." : "수정 완료"}
          </button>
        </form>
      </div>
    </main>
  );
}
