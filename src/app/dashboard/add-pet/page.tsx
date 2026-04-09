"use client";

import { useState } from "react";
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

export default function AddPetPage() {
  const router = useRouter();
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDone(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-6 py-20 font-light">
      <div className="w-full max-w-[450px] space-y-16">
        {/* Header */}
        <header className="space-y-4">
          <Link href="/dashboard" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
            ← CANCEL
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
            <label className="label-minimal text-black">Profile Picture</label>
            <div className="flex items-center gap-8">
              <label className="relative w-32 h-32 border border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden group">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-[20px] font-thin text-zinc-300">+</span>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-tighter group-hover:text-black">Upload</span>
                  </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>

              {/* Pixel Preview (Tamagotchi Effect) */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 border border-zinc-50 space-y-3">
                <div className="h-12 flex items-center justify-center">
                  {previewImage ? (
                    <PixelCharacter color="black" />
                  ) : (
                    <div className="w-8 h-8 bg-zinc-50 rounded-full animate-pulse" />
                  )}
                </div>
                <p className="text-[9px] text-zinc-300 uppercase tracking-widest text-center">
                  {previewImage ? "CHARACTER MATCHED" : "WAITING FOR PHOTO"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {/* Name */}
            <div className="group">
              <label className="label-minimal">Pet Name</label>
              <input
                type="text"
                required
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="input-minimal"
                placeholder="아이의 이름을 입력하세요"
              />
            </div>

            {/* Species */}
            <div className="group">
              <label className="label-minimal">Species</label>
              <select
                required
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="input-minimal bg-transparent cursor-pointer appearance-none"
              >
                <option value="" disabled>종류를 선택하세요</option>
                <option value="dog">강아지 (Dog)</option>
                <option value="cat">고양이 (Cat)</option>
                <option value="hamster">햄스터 (Hamster)</option>
                <option value="bird">새 (Bird)</option>
                <option value="other">기타 (Other)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full btn-black py-5 text-sm">
            등록 완료
          </button>
        </form>
      </div>

      {/* Success Popup */}
      {isDone && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-500">
          <div className="text-center space-y-6">
            <PixelCharacter color="black" />
            <h2 className="text-xl font-light tracking-tight">"이제부터 지독하게 기록해줄게!"</h2>
            <p className="text-xs text-zinc-400 animate-pulse">대시보드로 이동 중...</p>
          </div>
        </div>
      )}
    </main>
  );
}
