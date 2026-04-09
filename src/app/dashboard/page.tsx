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
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [prefDraft, setPrefDraft] = useState({ treats: '', toys: '', food: '' });
  const [recordingType, setRecordingType] = useState<string | null>(null);
  const [recordStep, setRecordStep] = useState(1);
  const [recordData, setRecordData] = useState({ type: '', amountValue: '', amountUnit: 'g', memo: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editMealData, setEditMealData] = useState({ type: '', amountValue: '', amountUnit: 'g' });

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
          .limit(30);

        setActivities((activityData as unknown as Activity[]) || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrefs = async () => {
    if (!selectedPetId) return;
    const { error } = await supabase
      .from('pets')
      .update({ preferences: prefDraft })
      .eq('id', selectedPetId);

    if (error) {
      alert("취향 기록 저장에 실패했습니다.");
    } else {
      setPets(pets.map(p => p.id === selectedPetId ? { ...p, preferences: prefDraft } : p));
      setIsEditingPrefs(false);
    }
  };

  const handleRecordActivity = async () => {
    if (!selectedPetId || !recordingType) return;
    setIsSubmitting(true);
    
    let details = "";
    if (recordingType === '밥 먹이기') {
      const value = recordData.amountValue || "0";
      const unit = recordData.amountUnit || "g";
      details = `${recordData.type} - ${value}${unit}`;
    } else {
      details = recordData.memo;
    }

    const { data: newActivity, error } = await supabase
      .from('activities')
      .insert([{
        pet_id: selectedPetId,
        type: recordingType,
        details: details,
        timestamp: new Date().toISOString()
      }])
      .select('*, pets(name)')
      .single();

    if (error) {
      alert("기록 저장에 실패했습니다.");
    } else {
      setActivities([newActivity as Activity, ...activities]);
      setRecordingType(null);
      setRecordStep(1);
      setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '' });
    }
    setIsSubmitting(false);
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("기록을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) alert("삭제에 실패했습니다.");
    else setActivities(activities.filter(a => a.id !== id));
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    setIsSubmitting(true);
    
    let finalDetails = editDetails;
    if (editingActivity.type === '밥 먹이기') {
      finalDetails = `${editMealData.type} - ${editMealData.amountValue}${editMealData.amountUnit}`;
    }

    const { error } = await supabase
      .from('activities')
      .update({ details: finalDetails })
      .eq('id', editingActivity.id);

    if (error) {
      alert("수정에 실패했습니다.");
    } else {
      setActivities(activities.map(a => a.id === editingActivity.id ? { ...a, details: finalDetails } : a));
      setEditingActivity(null);
    }
    setIsSubmitting(false);
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
          <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase">홈</p>
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
                <div className="aspect-square bg-white border border-zinc-100 flex items-center justify-center rounded-xl overflow-hidden transition-colors">
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
              return ['밥 먹이기', isCat ? '사냥놀이하기' : '산책하기', '약 먹기', '간식 먹기', '기타'];
            })().map((type) => (
              <button
                key={type}
                onClick={() => {
                  setRecordingType(type);
                  setRecordStep(1);
                  setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '' });
                }}
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

        {/* Pet Preferences Section */}
        {(() => {
          const selectedPet = pets.find(p => p.id === selectedPetId);
          if (!selectedPet) return null;

          return (
            <section className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">✨ {selectedPet.name}의 취향 기록</h3>
                {!isEditingPrefs && (
                  <button 
                    onClick={() => {
                      setPrefDraft({
                        treats: selectedPet.preferences?.treats || '',
                        toys: selectedPet.preferences?.toys || '',
                        food: selectedPet.preferences?.food || ''
                      });
                      setIsEditingPrefs(true);
                    }}
                    className="text-[9px] text-zinc-400 hover:text-black transition-colors underline underline-offset-4"
                  >
                    기록하기 / 수정
                  </button>
                )}
              </div>

              {isEditingPrefs ? (
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-tighter">Favorite Treats</label>
                      <input 
                        className="input-minimal bg-white" 
                        placeholder="좋아하는 간식"
                        value={prefDraft.treats}
                        onChange={e => setPrefDraft({ ...prefDraft, treats: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-tighter">Favorite Toys</label>
                      <input 
                        className="input-minimal bg-white" 
                        placeholder="좋아하는 장난감"
                        value={prefDraft.toys}
                        onChange={e => setPrefDraft({ ...prefDraft, toys: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-tighter">Favorite Food</label>
                      <input 
                        className="input-minimal bg-white" 
                        placeholder="좋아하는 사료"
                        value={prefDraft.food}
                        onChange={e => setPrefDraft({ ...prefDraft, food: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setIsEditingPrefs(false)} className="text-[10px] text-zinc-400 hover:text-black">취소</button>
                    <button onClick={handleUpdatePrefs} className="text-[10px] font-semibold text-black underline underline-offset-4">저장하기</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Favorite Treats', value: selectedPet.preferences?.treats, placeholder: '좋아하는 간식을 기록해 주세요' },
                    { label: 'Favorite Toys', value: selectedPet.preferences?.toys, placeholder: '좋아하는 장난감을 기록해 주세요' },
                    { label: 'Favorite Food', value: selectedPet.preferences?.food, placeholder: '좋아하는 사료를 기록해 주세요' }
                  ].map((pref, i) => (
                    <div key={i} className="bg-zinc-50/50 p-5 rounded-2xl border border-zinc-100/50 group hover:border-zinc-200 transition-all">
                      <p className="text-[9px] text-zinc-400 uppercase tracking-tighter mb-2">{pref.label}</p>
                      <p className={`text-xs ${pref.value ? 'text-zinc-900 font-medium' : 'text-zinc-300 italic'}`}>
                        {pref.value || pref.placeholder}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* Activity Log */}
        <section className="space-y-8">
          <h3 className="text-xs tracking-widest text-zinc-400 uppercase font-medium">최근 기록</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="group relative py-6 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors px-2 -mx-2 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-[11px] font-semibold text-zinc-400">
                        {activity.type[0]}
                      </div>
                      <div className="space-y-1">
                        <p className="text-[12px] font-bold text-zinc-900">{activity.pets.name} — {activity.type}</p>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">{activity.details || '상세 내용 없음'}</p>
                        <p className="text-[10px] text-zinc-300 font-mono pt-1">
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingActivity(activity);
                          if (activity.type === '밥 먹이기') {
                            // Parse "Type - 60g"
                            const [typePart, amountPart] = activity.details.split(' - ');
                            const amountMatch = amountPart?.match(/^(\d+)(.*)$/);
                            setEditMealData({
                              type: typePart || '',
                              amountValue: amountMatch?.[1] || '',
                              amountUnit: amountMatch?.[2] || 'g'
                            });
                          } else {
                            setEditDetails(activity.details);
                          }
                        }}
                        className="text-[10px] text-zinc-400 hover:text-black transition-colors"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-[10px] text-zinc-200 hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
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

        {/* Recording Modal */}
        {recordingType && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] rounded-t-[32px] sm:rounded-3xl p-8 space-y-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">{recordingType} - STEP {recordStep}</span>
                <button onClick={() => setRecordingType(null)} className="text-zinc-300 hover:text-black">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {recordingType === '밥 먹이기' ? (
                <div className="space-y-12">
                  {/* Last Record & Daily Count Check */}
                  {(() => {
                    const petMeals = activities.filter(a => a.pet_id === selectedPetId && a.type === '밥 먹이기');
                    const lastFeed = petMeals[0];
                    
                    const today = new Date().toLocaleDateString();
                    const todayMeals = petMeals.filter(a => new Date(a.timestamp).toLocaleDateString() === today);

                    if (!lastFeed && todayMeals.length === 0) return null;
                    
                    return (
                      <div className="bg-zinc-50 p-5 rounded-2xl space-y-3 animate-in fade-in duration-700">
                        <div className="flex justify-between items-center border-b border-zinc-100/50 pb-3">
                          <div className="flex gap-2 items-center">
                            <div className="w-1 h-1 rounded-full bg-black" />
                            <span className="text-[10px] text-zinc-900 font-semibold uppercase tracking-tight">오늘 총 {todayMeals.length}회 급여</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                        </div>
                        
                        {lastFeed && (
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-zinc-400">마지막 급여</span>
                            <span className="text-[10px] text-zinc-900 font-semibold uppercase font-mono">
                              {new Date(lastFeed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({lastFeed.details})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {recordStep === 1 ? (
                    <div className="space-y-8">
                      <h2 className="text-2xl font-light tracking-tight">무엇을 먹었나요?</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {['건식 사료', '습식 사료', '자연식', '기타'].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setRecordData({ ...recordData, type: t });
                              setRecordStep(2);
                            }}
                            className={`py-4 px-6 text-sm rounded-xl border transition-all ${
                              recordData.type === t ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-500 hover:border-zinc-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <h2 className="text-2xl font-light tracking-tight">얼마나 주셨나요?</h2>
                      <div className="space-y-6">
                        <div className="flex items-end gap-2 border-b border-zinc-100 pb-2">
                          <input
                            autoFocus
                            type="number"
                            placeholder="0"
                            className="w-full text-5xl font-light border-none focus:ring-0 p-0 placeholder:text-zinc-100"
                            value={recordData.amountValue}
                            onChange={(e) => setRecordData({ ...recordData, amountValue: e.target.value })}
                          />
                          <span className="text-2xl font-light text-zinc-300 pb-1">{recordData.amountUnit}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          {['g', 'kg', '컵'].map((unit) => (
                            <button
                              key={unit}
                              onClick={() => setRecordData({ ...recordData, amountUnit: unit })}
                              className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-all ${
                                recordData.amountUnit === unit ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                              }`}
                            >
                              {unit}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-6">
                        <button onClick={() => setRecordStep(1)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-all">이전으로</button>
                        <button 
                          disabled={!recordData.amountValue || isSubmitting}
                          onClick={handleRecordActivity}
                          className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl hover:bg-zinc-800 transition-all disabled:bg-zinc-100"
                        >
                          {isSubmitting ? "기록 중..." : "기록 완료"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <h2 className="text-2xl font-light tracking-tight">{recordingType} 내용을 간단히 기록해주세요</h2>
                  <input
                    autoFocus
                    type="text"
                    placeholder="상세 내용을 입력하세요"
                    className="w-full text-xl font-light border-b border-zinc-100 focus:border-black focus:ring-0 py-4 placeholder:text-zinc-200"
                    value={recordData.memo}
                    onChange={(e) => setRecordData({ ...recordData, memo: e.target.value })}
                  />
                  <div className="flex gap-3 pt-6">
                    <button onClick={() => setRecordingType(null)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl">취소</button>
                    <button 
                      disabled={!recordData.memo || isSubmitting}
                      onClick={handleRecordActivity}
                      className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100"
                    >
                      {isSubmitting ? "기록 중..." : "기록 완료"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Edit Modal */}
        {editingActivity && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">기록 수정 — {editingActivity.type}</span>
                <h2 className="text-xl font-light tracking-tight">{editingActivity.pets.name}의 기록을 수정합니다</h2>
              </div>
              
              {editingActivity.type === '밥 먹이기' ? (
                <div className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest">분류</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['건식 사료', '습식 사료', '자연식', '기타'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setEditMealData({ ...editMealData, type: t })}
                          className={`py-3 px-4 text-xs rounded-xl border transition-all ${
                            editMealData.type === t ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-500'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-widest">양 및 단위</label>
                    <div className="flex items-end gap-2 border-b border-zinc-100 pb-2">
                      <input
                        type="number"
                        className="w-full text-3xl font-light border-none focus:ring-0 p-0"
                        value={editMealData.amountValue}
                        onChange={(e) => setEditMealData({ ...editMealData, amountValue: e.target.value })}
                      />
                      <span className="text-xl font-light text-zinc-300 pb-0.5">{editMealData.amountUnit}</span>
                    </div>
                    <div className="flex gap-2">
                      {['g', 'kg', '컵'].map((unit) => (
                        <button
                          key={unit}
                          onClick={() => setEditMealData({ ...editMealData, amountUnit: unit })}
                          className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all ${
                            editMealData.amountUnit === unit ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400'
                          }`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest">상세 내용</label>
                  <input
                    autoFocus
                    type="text"
                    className="input-minimal text-lg"
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setEditingActivity(null)} className="flex-1 py-4 text-xs font-medium border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-all">취소</button>
                <button 
                  disabled={isSubmitting}
                  onClick={handleUpdateActivity}
                  className="flex-[2] py-4 text-xs font-medium bg-black text-white rounded-xl hover:bg-zinc-800 transition-all"
                >
                  {isSubmitting ? "저장 중..." : "수정 완료"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
