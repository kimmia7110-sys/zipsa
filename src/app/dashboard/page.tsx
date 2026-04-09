"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

interface Activity {
  id: string;
  pet_id: string;
  type: string;
  details: string;
  timestamp: string;
  pets: { name: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, families(*)")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      if (profileData?.family_id) {
        // Fetch pets
        const { data: petsData } = await supabase
          .from("pets")
          .select("*")
          .eq("family_id", profileData.family_id);

        if (petsData) {
          setPets(petsData);
          if (petsData.length > 0 && !selectedPetId) {
            setSelectedPetId(petsData[0].id);
          }
        }

        // Fetch recent activities
        const { data: activityData } = await supabase
          .from("activities")
          .select("*, pets(name)")
          .order("timestamp", { ascending: false })
          .limit(10);

        setActivities((activityData as unknown as Activity[]) || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-xs tracking-[0.2em] font-light animate-pulse uppercase">로딩 중...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center px-6 py-8">
        <Link href="/dashboard" className="text-xl font-light tracking-tighter">집착</Link>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/profile"
            className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors"
          >
            마이페이지
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors"
          >
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 py-12 space-y-20">
        {/* Welcome Section */}
        <section className="space-y-4">
          <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">대시보드</p>
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight">안녕하세요, {profile?.nickname || profile?.name}님</h2>
            <p className="text-xs text-zinc-400">
              사랑스러운 나의 {pets.length}마리의 아이들을 돌봐주세요  ദ്ദി⁼ˆ╹⥿╹ˆ⁼)
            </p>
          </div>
        </section>

        {/* Pets Section */}
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">아이 프로필을 선택해주세요</h3>

            <Link
              href="/dashboard/add-pet"
              className="text-[10px] underline underline-offset-4 decoration-[0.5px] hover:text-zinc-500"
            >
              아이 추가하기
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {pets.map((pet) => (
              <div 
                key={pet.id} 
                onClick={() => setSelectedPetId(pet.id)}
                className={`group space-y-3 cursor-pointer p-2 rounded-xl transition-all ${selectedPetId === pet.id ? 'bg-zinc-50 ring-1 ring-black' : 'hover:bg-zinc-50'}`}
              >
                <div className="aspect-square bg-white border border-zinc-100 flex items-center justify-center overflow-hidden transition-colors">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover transition-all duration-500" />
                  ) : (
                    <div className="w-10 h-10 bg-zinc-200" />
                  )}
                </div>
                <div className="space-y-0.5 relative group/card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold">{pet.name}</p>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{pet.species}</p>
                    </div>
                    <Link 
                      href={`/dashboard/edit-pet/${pet.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[9px] text-zinc-300 hover:text-black transition-colors"
                    >
                      수정
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {pets.length === 0 && (
              <Link
                href="/dashboard/add-pet"
                className="col-span-full border border-dashed border-zinc-200 aspect-[4/1] flex items-center justify-center text-[10px] text-zinc-400 uppercase tracking-widest hover:border-black hover:text-black transition-colors"
              >
                등록된 아이가 없습니다
              </Link>
            )}
          </div>
        </section>

        {/* Quick Activity Section */}
        <section className="space-y-8">
          <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">🗒️오늘 하루를 기록해주세요!</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {((): string[] => {
              const selectedPet = pets.find(p => p.id === selectedPetId);
              const isCat = selectedPet?.species?.includes('고양이');
              return ['밥 먹이기', isCat ? '사냥놀이하기' : '산책하기', '약 먹이기', '간식 먹기', '기타'];
            })().map((type) => (
              <button
                key={type}
                className="group border border-zinc-100 p-6 space-y-4 hover:border-black transition-all text-left"
              >
                <div className="w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <span className="text-[10px] font-bold">+</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold">{type}</p>
                  <p className="text-[9px] text-zinc-300 uppercase tracking-tighter">Quick Record</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Activity Log */}
        <section className="space-y-8">
          <h3 className="text-xs tracking-widest text-zinc-400 uppercase font-medium">최근 기록</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center py-4 border-b border-zinc-50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-[10px]">
                      {activity.type[0]}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium">{activity.pets.name} - {activity.type}</p>
                      <p className="text-[10px] text-zinc-400">{activity.details || '상세 내용 없음'}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-300 font-mono">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-300 py-10 text-center uppercase tracking-widest">
                최근 기록이 없습니다.
              </p>
            )}
          </div>
        </section>

        {/* Family Info */}
        <footer className="pt-20 border-t border-zinc-100 pb-10">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
            <span>가족 코드: {profile?.families?.invite_code}</span>
            <span>© 2024 ZIPCHAK</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
