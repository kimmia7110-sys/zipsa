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
  medications?: any[];
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
  const [recordData, setRecordData] = useState({ 
    type: '', 
    amountValue: '', 
    amountUnit: 'g', 
    memo: '',
    duration: '',
    mood: ''
  });
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

  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [healthDraft, setHealthDraft] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'medical'>('status');

  const handleUpdateHealth = async () => {
    if (!selectedPetId) return;
    const { error } = await supabase
      .from('pets')
      .update({ medications: healthDraft })
      .eq('id', selectedPetId);
    
    if (error) {
      alert("건강 정보 수정에 실패했습니다.");
    } else {
      setPets(pets.map(p => p.id === selectedPetId ? { ...p, medications: healthDraft } : p));
      setIsEditingHealth(false);
    }
  };

  const addMedicationItem = () => {
    setHealthDraft([...healthDraft, { id: Date.now().toString(), name: '', frequency: '', notes: '' }]);
  };

  const removeMedicationItem = (id: string) => {
    setHealthDraft(healthDraft.filter(item => item.id !== id));
  };

  const updateMedicationItem = (id: string, field: string, value: string) => {
    setHealthDraft(healthDraft.map(item => item.id === id ? { ...item, [field]: value } : item));
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
    } else if (recordingType === '산책하기' || recordingType === '사냥놀이하기') {
      details = `${recordData.duration}분 동안 ${recordData.mood}${recordData.memo ? ` (${recordData.memo})` : ''}`;
    } else if (recordingType === '약 먹기') {
      if (recordData.type === '기타') {
        details = recordData.memo;
      } else {
        details = `${recordData.type}${recordData.amountValue ? ` (${recordData.amountValue})` : ''}${recordData.memo ? ` - ${recordData.memo}` : ''}`;
      }
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
      setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '', duration: '', mood: '' });
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

  const renderRecordFlow = () => {
    if (recordingType === '약 먹기') {
      const currentPetId = selectedPetId || (pets.length > 0 ? pets[0].id : null);
      const selectedPet = pets?.find(p => p.id === currentPetId);
      const petMedications = Array.isArray(selectedPet?.medications) ? selectedPet.medications : [];
      const historyMeds = activities.filter(a => a.pet_id === currentPetId && a.type === '약 먹기');
      const lastMed = historyMeds[0];
      const today = new Date().toLocaleDateString();
      const todayMeds = historyMeds.filter(a => new Date(a.timestamp).toLocaleDateString() === today);

      return (
        <div className="space-y-12">
          {(lastMed || todayMeds.length > 0) && (
            <div className="bg-zinc-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-100/50 pb-3">
                <div className="flex gap-2 items-center">
                  <div className="w-1 h-1 rounded-full bg-black" />
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase tracking-tight">오늘 총 {todayMeds.length}회 약 복용</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
              </div>
              {lastMed && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400">마지막 복용</span>
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase font-mono">
                    {new Date(lastMed.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({lastMed.details})
                  </span>
                </div>
              )}
            </div>
          )}

          {recordStep === 1 ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">DRUG SELECTION</span>
                <h2 className="text-2xl font-light tracking-tight flex items-center gap-3">
                  <span className="text-3xl">💊</span> {selectedPet?.name || '아이'}가 어떤 약을 먹었나요?
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {petMedications.length > 0 ? (
                  petMedications.map((med: any) => (
                    <button
                      key={med.id}
                      onClick={() => {
                        setRecordData({ ...recordData, type: med.name });
                        setRecordStep(2);
                      }}
                      className={`group p-5 rounded-2xl border transition-all text-left flex justify-between items-center ${
                        recordData.type === med.name ? 'border-black bg-black text-white' : 'border-zinc-100 hover:border-zinc-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{med.name}</p>
                        <p className={`text-[10px] font-medium ${recordData.type === med.name ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          {med.frequency} 복용 중
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        recordData.type === med.name ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-100 bg-zinc-50 group-hover:border-zinc-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${recordData.type === med.name ? 'bg-white' : 'bg-transparent'}`} />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="bg-zinc-50/50 p-8 rounded-2xl border border-dashed border-zinc-100 flex flex-col items-center justify-center space-y-3">
                    <span className="text-2xl opacity-50">💊</span>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">등록된 약이 없습니다</p>
                    <Link 
                      href={`/dashboard/edit-pet/${selectedPetId}`}
                      className="text-[10px] text-zinc-900 underline underline-offset-4 font-semibold"
                    >
                      프로필에서 약 등록하기
                    </Link>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setRecordData({ ...recordData, type: '기타' });
                    setRecordStep(2);
                  }}
                  className={`p-5 rounded-2xl border transition-all text-left flex justify-between items-center ${
                    recordData.type === '기타' ? 'border-black bg-black text-white' : 'border-zinc-100 hover:border-zinc-300 bg-white border-dashed mt-4'
                  }`}
                >
                  <p className="text-sm font-medium">기타 (직접 입력)</p>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    recordData.type === '기타' ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-100 bg-zinc-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${recordData.type === '기타' ? 'bg-white' : 'bg-transparent'}`} />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">MEMO</span>
                <h2 className="text-2xl font-light tracking-tight">추가로 남길 메모가 있나요?</h2>
              </div>
              <input
                autoFocus
                type="text"
                placeholder={recordData.type === '기타' ? "약 이름을 직접 입력하세요" : "특이 사항이 있다면 적어주세요 (선택 사항)"}
                className="w-full text-xl font-light border-b border-zinc-100 focus:border-black focus:ring-0 py-4 placeholder:text-zinc-200"
                value={recordData.memo}
                onChange={(e) => setRecordData({ ...recordData, memo: e.target.value })}
              />
              <div className="flex gap-3 pt-6">
                <button onClick={() => setRecordStep(1)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl hover:bg-zinc-50">이전으로</button>
                <button 
                  disabled={isSubmitting || (recordData.type === '기타' && !recordData.memo)}
                  onClick={handleRecordActivity}
                  className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl"
                >
                  {isSubmitting ? "기록 중..." : "기록 완료"}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (recordingType === '밥 먹이기') {
      const historyMeals = activities.filter(a => a.pet_id === selectedPetId && a.type === '밥 먹이기');
      const lastFeed = historyMeals[0];
      const today = new Date().toLocaleDateString();
      const todayMeals = historyMeals.filter(a => new Date(a.timestamp).toLocaleDateString() === today);

      return (
        <div className="space-y-12">
          {(lastFeed || todayMeals.length > 0) && (
            <div className="bg-zinc-50 p-5 rounded-2xl space-y-3">
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
          )}

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
                <button onClick={() => setRecordStep(1)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl">이전으로</button>
                <button 
                  disabled={!recordData.amountValue || isSubmitting}
                  onClick={handleRecordActivity}
                  className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100"
                >
                  기록 완료
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (recordingType === '산책하기' || recordingType === '사냥놀이하기') {
      const activityLabel = recordingType === '사냥놀이하기' ? '놀이' : '산책';
      const historyActions = activities.filter(a => a.pet_id === selectedPetId && a.type === recordingType);
      const lastAction = historyActions[0];
      const today = new Date().toLocaleDateString();
      const todayActions = historyActions.filter(a => new Date(a.timestamp).toLocaleDateString() === today);

      return (
        <div className="space-y-12">
          {(lastAction || todayActions.length > 0) && (
            <div className="bg-zinc-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-100/50 pb-3">
                <div className="flex gap-2 items-center">
                  <div className="w-1 h-1 rounded-full bg-black" />
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase tracking-tight">오늘 총 {todayActions.length}회 {activityLabel}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
              </div>
              {lastAction && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400">마지막 {activityLabel}</span>
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase font-mono">
                    {new Date(lastAction.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({lastAction.details})
                  </span>
                </div>
              )}
            </div>
          )}

          {recordStep === 1 ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">DURATION</span>
                <h2 className="text-2xl font-light tracking-tight">얼마나 {recordingType === '사냥놀이하기' ? '놀아주셨나요?' : '산책했나요?'}</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-end gap-2 border-b border-zinc-100 pb-2">
                  <input
                    autoFocus
                    type="number"
                    placeholder="0"
                    className="w-full text-5xl font-light border-none focus:ring-0 p-0"
                    value={recordData.duration}
                    onChange={(e) => setRecordData({ ...recordData, duration: e.target.value })}
                  />
                  <span className="text-2xl font-light text-zinc-300 pb-1">분</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['15', '30', '45', '60'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setRecordData({ ...recordData, duration: time })}
                      className={`px-4 py-2 text-[10px] tracking-widest border transition-all ${
                        recordData.duration === time ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'
                      }`}
                    >
                      {time}분
                    </button>
                  ))}
                </div>
              </div>
              <button 
                disabled={!recordData.duration}
                onClick={() => setRecordStep(2)}
                className="w-full py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100"
              >
                다음으로
              </button>
            </div>
          ) : recordStep === 2 ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">REACTION</span>
                <h2 className="text-2xl font-light tracking-tight">반응은 어땠나요?</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: '완전 좋아해요! 🔥', value: '완전 좋아해요!' },
                  { label: '적당히 즐거웠어요 🙂', value: '적당히 즐거웠어요' },
                  { label: '조금 지루해 보였어요 🥱', value: '조금 지루해 했어요' },
                  { label: '오늘은 별로였나 봐요 😿', value: '별로였나 봐요' }
                ].map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setRecordData({ ...recordData, mood: mood.value })}
                    className={`py-4 px-6 text-sm rounded-xl border text-left transition-all ${
                      recordData.mood === mood.value ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setRecordStep(1)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl">이전으로</button>
                <button 
                  disabled={!recordData.mood}
                  onClick={() => setRecordStep(3)}
                  className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100"
                >
                  다음으로
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">MEMO</span>
                <h2 className="text-2xl font-light tracking-tight">구체적으로 어떤 {recordingType === '사냥놀이하기' ? '놀이' : '산책'}였나요?</h2>
              </div>
              <input
                autoFocus
                type="text"
                placeholder="예: 낚시놀이, 공원 산책 등 (선택 사항)"
                className="w-full text-xl font-light border-b border-zinc-100 focus:border-black focus:ring-0 py-4 placeholder:text-zinc-200"
                value={recordData.memo}
                onChange={(e) => setRecordData({ ...recordData, memo: e.target.value })}
              />
              <div className="flex gap-3 pt-6">
                <button onClick={() => setRecordStep(2)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl">이전으로</button>
                <button 
                  disabled={isSubmitting}
                  onClick={handleRecordActivity}
                  className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl"
                >
                  기록 완료
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }


    return (
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
            기록 완료
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="flex justify-between items-center px-6 py-8">
        <Link href="/dashboard" className="text-xl font-light tracking-tighter">집착</Link>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 pr-4 border-r border-zinc-100">
            <button className="text-zinc-200 hover:text-black transition-colors relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-red-500 rounded-full"></span>
            </button>
            <button className="text-zinc-200 hover:text-black transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </button>
          </div>
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
                  setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '', duration: '', mood: '' });
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

        {/* Compact Medication List */}
        {(() => {
          const selectedPet = pets.find(p => p.id === selectedPetId);
          if (!selectedPet) return null;
          const meds = Array.isArray(selectedPet.medications) ? selectedPet.medications : [];

          return (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex justify-between items-end">
                <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">💊 {selectedPet.name}의 복용 약</h3>
                <Link 
                  href={`/dashboard/edit-pet/${selectedPet.id}`}
                  className="text-[9px] text-zinc-400 hover:text-black transition-colors underline underline-offset-4"
                >
                  수정/관리하기
                </Link>
              </div>

              {meds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {meds.map((med: any) => (
                    <div key={med.id} className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100/50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs border border-zinc-100 shadow-sm">
                        💊
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-semibold text-zinc-900">{med.name}</p>
                        <p className="text-[9px] text-zinc-400 font-medium uppercase">{med.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-50/30 p-6 rounded-xl border border-dashed border-zinc-100 flex flex-col items-center justify-center space-y-2">
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest">등록된 복용 약이 없습니다</p>
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
                    <div className="flex gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
            <span>© 2026 ZIPCHAK</span>
          </div>
        </footer>

        {recordingType && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] rounded-t-[32px] sm:rounded-3xl p-8 space-y-10 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">{recordingType} - STEP {recordStep}</span>
                <button onClick={() => setRecordingType(null)} className="text-zinc-300 hover:text-black">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              {renderRecordFlow()}
            </div>
          </div>
        )}

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
