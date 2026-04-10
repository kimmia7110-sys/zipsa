"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Flame, 
  Calendar, 
  ChevronRight, 
  Moon, 
  Sun, 
  Wind, 
  Zap,
  Activity as ActivityIcon,
  Circle,
  ChevronDown
} from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
  medications?: any[];
  heart_points: number;
  active_days_count: number;
  last_activity_date: string | null;
  is_hatched: boolean;
  created_at?: string;
}

interface Activity {
  id: string;
  pet_id: string;
  user_id: string;
  type: string;
  details: string;
  timestamp: string;
  pets?: { name: string };
  profiles?: { nickname: string };
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
  const [eggVibrate, setEggVibrate] = useState(0);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editDetails, setEditDetails] = useState("");
  const [editMealData, setEditMealData] = useState({ type: '', amountValue: '', amountUnit: 'g' });
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [myFamilies, setMyFamilies] = useState<any[]>([]);
  const [activeMyPageTab, setActiveMyPageTab] = useState<'root' | 'family' | 'profile' | 'switch'>('root');
  const [profileDraft, setProfileDraft] = useState({ nickname: '', phone: '' });
  const [familyDraftName, setFamilyDraftName] = useState("");
  const [showInlineFamilies, setShowInlineFamilies] = useState(false);
  const [isEditingTamagotchi, setIsEditingTamagotchi] = useState(false);
  const [tamagotchiNameDraft, setTamagotchiNameDraft] = useState("");
  const [historyViewMode, setHistoryViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [historySelectedDate, setHistorySelectedDate] = useState(new Date());
  
  // Navigation State
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'pocket' | 'calendar'>('home');
  
  // Notification States
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Mailbox States
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [readLetters, setReadLetters] = useState<string[]>([]);

  const mailboxLetters = useMemo(() => {
    if (!profile || pets.length === 0) return [];
    
    const ownerName = profile.nickname || profile.name || '집사님';
    const letters: any[] = [];
    const today = new Date();
    
    pets.forEach(pet => {
      const petCreatedDate = new Date(pet.created_at || Date.now());
      const isAnniversary = petCreatedDate.getMonth() === today.getMonth() && petCreatedDate.getDate() === today.getDate() && petCreatedDate.getFullYear() !== today.getFullYear();
      
      // 1. 처음 만난 날 (Every pet has this as default welcome)
      letters.push({
        id: `welcome-${pet.id}`,
        petId: pet.id,
        petName: pet.name,
        petPhoto: pet.photo_url || null,
        title: '안녕! 나야 나! 💌',
        content: `${ownerName}! 나랑 우리 집에 처음 온 날 기억나? 그때 완전 콩닥콩닥 떨렸는데, 지금은 ${ownerName} 없이는 하루도 못 살 것 같아구려! 헤헤. 앞으로도 맨날맨날 나랑 놀아줘야 해. 알았지? 🐾\n\n- ${ownerName}의 껌딱지 ${pet.name} (이)가`,
        date: petCreatedDate.toISOString(),
        isSpecial: false
      });
      
      // 2. Anniversary letter
      if (isAnniversary) {
        letters.push({
          id: `anniv-${pet.id}-${today.getFullYear()}`,
          petId: pet.id,
          petName: pet.name,
          petPhoto: pet.photo_url || null,
          title: '우리 벌써 1년이야! 🎂',
          content: `대박! 벌써 시간이 이렇게 됐다구? ${ownerName}랑 같이 밥 먹고 뒹굴거린 지 벌써 1년이나 지났네. 요즘 매일매일이 소풍 온 것 같이 재밌어! 앞으로도 간식 많이 주고 내 옆에 꼭 붙어있어라! 사랑해 와앙! ❤️\n\n- ${ownerName}만 파는 ${pet.name} (이)가`,
          date: new Date().toISOString(),
          isSpecial: true
        });
      }
      
      // 3. Heart > 100 
      const family = typeof profile.families === 'object' ? profile.families : undefined;
      const heartPoints = family?.heart_points || 0;
      if (heartPoints >= 100) {
        letters.push({
          id: `heart100-${pet.id}`,
          petId: pet.id,
          petName: pet.name,
          petPhoto: pet.photo_url || null,
          title: '내 마음이 느껴져? 💕',
          content: `요즘 ${ownerName}가 나 엄청 챙겨주는 거 다 알고 있다구. 밥도 주고 놀아줘서 내 마음속 하트가 100% 꽉 찼어! 빵빵해! ${ownerName} 냄새 맡으면서 잘 때가 제일 좋아. 진짜 진짜 고마워!\n\n- 사랑 듬뿍 받은 ${pet.name}`,
          date: new Date(Date.now() - 1000*60*60*24).toISOString(),
          isSpecial: true
        });
      }

      // 4. 특별 샘플 편지 (항상 보임)
      letters.push({
        id: `sample-${pet.id}`,
        petId: pet.id,
        petName: pet.name,
        petPhoto: pet.photo_url || null,
        title: '깜짝 편지야! 🌼',
        content: `짜잔! 깜짝 놀랐어? 오늘 하루도 나 먹여살리느라 완전 고생 많았어!\n${ownerName}가 날 쓰다듬어 주면 구름 위를 통통 걷는 기분이야. 오늘 밤엔 내 옆에서 코오 자자~ 내가 나쁜 꿈 다 쫓아내 줄게! 🌙✨\n\n- ${ownerName} 껌딱지 ${pet.name}`,
        date: new Date().toISOString(),
        isSpecial: true
      });

    });
    
    return letters.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [profile, pets]);

  useEffect(() => {
    fetchData();
    fetchNotifications();
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('zipsa_read_letters');
        if (stored) setReadLetters(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  const handleReadLetter = (letter: any) => {
    setSelectedLetter(letter);
    if (!readLetters.includes(letter.id)) {
      const newRead = [...readLetters, letter.id];
      setReadLetters(newRead);
      if (typeof window !== 'undefined') {
        localStorage.setItem('zipsa_read_letters', JSON.stringify(newRead));
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;
      
      const { data: prof } = await supabase.from("profiles").select("id, family_id").eq("id", user.id).single();
      if (!prof || !prof.family_id) return;

      let lastCheck = localStorage.getItem('zipsa_last_notification_check');
      if (!lastCheck) {
          lastCheck = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          localStorage.setItem('zipsa_last_notification_check', lastCheck);
      }

      const { data: petData } = await supabase.from('pets').select('id').eq('family_id', prof.family_id);
      if (!petData || petData.length === 0) return;
      const petIds = petData.map(p => p.id);

      const { data, error } = await supabase
          .from('activities')
          .select('id, type, details, timestamp, pets(name), profiles(nickname)')
          .in('pet_id', petIds)
          .neq('user_id', prof.id)
          .gt('timestamp', lastCheck)
          .order('timestamp', { ascending: false })
          .limit(10);
          
      if (!error && data) {
          setRecentNotifications(data);
          setNotificationCount(data.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedPetId) {
      fetchActivities();
    }
  }, [selectedPetId]);

  const fetchActivities = async () => {
    if (!selectedPetId) return;
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*, pets(name), profiles(nickname)")
        .eq("pet_id", selectedPetId)
        .order("timestamp", { ascending: false })
        .limit(500);

      if (error) throw error;
      setActivities((data as unknown as Activity[]) || []);
    } catch (error: any) {
      console.error("Error fetching activities:", error.message);
    }
  };

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        router.push("/");
        return;
      }

      // Fetch profile and initial family data
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*, families(*)")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error("Dashboard Profile Fetch Error:", JSON.stringify(profileError, null, 2));
        throw new Error(profileError.message || "프로필 정보를 가져오는데 실패했습니다.");
      }

      if (profileData) {
        setProfile(profileData);
        setProfileDraft({ nickname: profileData?.nickname || '', phone: profileData?.phone || '' });
        setFamilyDraftName(profileData?.families?.name || '');
        setTamagotchiNameDraft(profileData?.families?.tamagotchi_name || '');

        // Fetch family leader manually
        if (profileData.families) {
          const { data: leaderData } = await supabase
            .from("profiles")
            .select("name, nickname")
            .eq("id", profileData.families.created_by)
            .maybeSingle();
          
          if (leaderData) {
            profileData.families.leader = leaderData;
          }
        }

        if (profileData.family_id) {
          try {
            // Fetch pets
            const { data: petsData, error: petsError } = await supabase
              .from("pets")
              .select("*")
              .eq("family_id", profileData.family_id);

            if (petsError) {
              console.error("Dashboard Pets Fetch Error:", petsError.message);
            } else if (petsData) {
              setPets(petsData);
              if (petsData.length > 0 && !selectedPetId) {
                setSelectedPetId(petsData[0].id);
              }
            }

            // Fetch activities
            let activityQuery = supabase
              .from("activities")
              .select("*, pets(name), profiles(nickname)")
              .order("timestamp", { ascending: false })
              .limit(500);

            if (selectedPetId) {
              activityQuery = activityQuery.eq("pet_id", selectedPetId);
            }

            const { data: activityData, error: activityError } = await activityQuery;

            if (activityError) {
              console.error("Dashboard Activity Fetch Error:", JSON.stringify(activityError, null, 2));
            } else {
              setActivities((activityData as unknown as Activity[]) || []);
            }

            // Fetch family members
            const { data: membersData, error: membersError } = await supabase
              .from("profiles")
              .select("id, name, nickname")
              .eq("family_id", profileData.family_id);
            
            if (membersError) {
              console.error("Dashboard Members Fetch Error:", membersError.message);
            } else if (membersData) {
              setFamilyMembers(membersData);
            }
          } catch (internalError: any) {
            console.error("Dashboard Internal Data Fetch Crash:", JSON.stringify(internalError, null, 2));
          }
        }
      }
    } catch (error: any) {
      console.error("Dashboard Main FetchData Error:", JSON.stringify(error, null, 2));
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [healthDraft, setHealthDraft] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'medical'>('status');

  useEffect(() => {
    const subscription = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activities' 
      }, () => {
        fetchData(true);
        fetchNotifications();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pets'
      }, () => {
        fetchData(true);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'families'
      }, () => {
        fetchData(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedPetId]);

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

  const handleUpdateTamagotchiName = async () => {
    if (!profile?.family_id) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('families')
        .update({ tamagotchi_name: tamagotchiNameDraft })
        .eq('id', profile.family_id);

      if (error) throw error;
      
      const updatedProfile = {
        ...profile,
        families: {
          ...profile.families,
          tamagotchi_name: tamagotchiNameDraft
        }
      };
      setProfile(updatedProfile);
      setIsEditingTamagotchi(false);
    } catch (error: any) {
      alert("이름을 변경하는 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
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
    if (!selectedPetId) {
      alert("아이를 선택해주세요.");
      return;
    }
    if (!recordingType) {
      alert("기록 유형이 선택되지 않았습니다.");
      return;
    }
    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      setIsSubmitting(false);
      return;
    }

    let details = "";
    if (recordingType === '밥 먹이기') {
      const value = recordData.amountValue || "0";
      const unit = recordData.amountUnit || "g";
      details = `${recordData.type} - ${value}${unit}`;
    } else if (recordingType === '산책하기' || recordingType === '사냥놀이하기') {
      details = `${recordData.duration}분 동안 ${recordData.mood}${recordData.memo ? ` (${recordData.memo})` : ''}`;
    } else if (recordingType === '약 먹이기') {
      if (recordData.type === '기타') {
        details = recordData.memo;
      } else {
        details = `${recordData.type}${recordData.amountValue ? ` (${recordData.amountValue})` : ''}${recordData.memo ? ` - ${recordData.memo}` : ''}`;
      }
    } else if (recordingType === '간식 먹이기') {
      const value = recordData.amountValue || "0";
      const unit = recordData.amountUnit || "개";
      details = `${recordData.memo || '간식'} - ${value}${unit}`;
    } else {
      details = recordData.memo;
    }

    try {
      if (!profile?.families) {
        throw new Error("가족 그룹 정보를 찾을 수 없습니다.");
      }
      const family = profile.families;

      const today = new Date().toISOString().split('T')[0];
      const activitiesToday = activities.filter(a => 
        a.timestamp.startsWith(today) && 
        a.type === recordingType
      );

      let pointsToAdd = 0;
      if (recordingType === '밥 먹이기' && activitiesToday.length < 3) pointsToAdd = 5;
      else if ((recordingType === '산책하기' || recordingType === '사냥놀이하기' || recordingType === '자유시간주기' || recordingType === '운동시키기') && activitiesToday.length < 3) pointsToAdd = 10;
      else if (recordingType === '간식 먹이기' && activitiesToday.length < 2) pointsToAdd = 5;

      let newActiveDays = family.active_days_count || 0;
      if (family.last_activity_date !== today) {
        newActiveDays = Math.min(7, newActiveDays + 1);
      }

      const newHeartPoints = Math.min(100, (family.heart_points || 0) + pointsToAdd);

      const activityPromise = supabase
        .from('activities')
        .insert([{
          pet_id: selectedPetId,
          user_id: user.id,
          type: recordingType,
          details: details,
          timestamp: new Date().toISOString()
        }])
        .select('*, pets(name), profiles(nickname)');

      const familyPromise = supabase
        .from('families')
        .update({
          heart_points: newHeartPoints,
          active_days_count: newActiveDays,
          last_activity_date: today
        })
        .eq('id', family.id);

      const [actResult, famResult] = await Promise.all([activityPromise, familyPromise]);

      if (actResult.error) throw actResult.error;
      if (famResult.error) throw famResult.error;

      if (actResult.data) {
        setActivities([actResult.data[0] as unknown as Activity, ...activities]);
      }
      
      setProfile({
        ...profile,
        families: {
          ...profile.families,
          heart_points: newHeartPoints,
          active_days_count: newActiveDays,
          last_activity_date: today
        }
      });

      setEggVibrate(v => v + 1);
      setRecordingType(null);
      setRecordStep(1);
      setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '', duration: '', mood: '' });
    } catch (error: any) {
      alert(error.message || "기록 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm("기록을 삭제하시겠습니까?")) return;

    try {
      const activityToDelete = activities.find(a => a.id === id);
      if (!activityToDelete) return;

      const today = new Date().toISOString().split('T')[0];
      const isToday = activityToDelete.timestamp.startsWith(today);
      const family = profile?.families;

      if (isToday && family) {
        let pointsToDeduct = 0;
        const type = activityToDelete.type;
        
        const othersOfSameTypeToday = activities.filter(a => 
          a.id !== id && 
          a.timestamp.startsWith(today) && 
          a.type === type
        );

        if (type === '밥 먹이기' && othersOfSameTypeToday.length < 3) pointsToDeduct = 5;
        else if ((type === '산책하기' || type === '사냥놀이하기' || type === '자유시간주기' || type === '운동시키기') && othersOfSameTypeToday.length < 3) pointsToDeduct = 10;
        else if (type === '간식 먹이기' && othersOfSameTypeToday.length < 2) pointsToDeduct = 5;

        const anyOthersToday = activities.filter(a => a.id !== id && a.timestamp.startsWith(today));
        
        let newActiveDays = family.active_days_count;
        let newLastDate = family.last_activity_date;

        if (anyOthersToday.length === 0) {
          newActiveDays = Math.max(0, (family.active_days_count || 0) - 1);
          newLastDate = null; 
        }

        const newHeartPoints = Math.max(0, (family.heart_points || 0) - pointsToDeduct);

        await supabase
          .from('families')
          .update({
            heart_points: newHeartPoints,
            active_days_count: newActiveDays,
            last_activity_date: newLastDate
          })
          .eq('id', family.id);
      }

      const { error } = await supabase.from('activities').delete().eq('id', id);
      if (error) throw error;
      setActivities(activities.filter(a => a.id !== id));
    } catch (error: any) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleRemoveMember = async (memberId: string, memberNickname: string) => {
    if (!profile?.families?.id) return;
    if (!confirm(`${memberNickname}님을 가족에서 내보내시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ family_id: null })
        .eq('id', memberId);

      if (error) throw error;
      setFamilyMembers(familyMembers.filter(m => m.id !== memberId));
      alert(`${memberNickname}님이 가족에서 제외되었습니다.`);
    } catch (error: any) {
      alert("멤버 내보내기 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleTransferLeadership = async (memberId: string, memberNickname: string) => {
    if (!profile?.families?.id) return;
    if (!confirm(`${memberNickname}님에게 그룹장 권한을 넘기시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from('families')
        .update({ created_by: memberId })
        .eq('id', profile.families.id);

      if (error) throw error;

      setProfile({
        ...profile,
        families: {
          ...profile.families,
          created_by: memberId
        }
      });
      alert(`그룹장 권한이 ${memberNickname}님에게 위임되었습니다.`);
    } catch (error: any) {
      alert("권한 위임 중 오류가 발생했습니다: " + error.message);
    }
  };

  const handleLeaveFamily = async () => {
    if (!profile?.families?.id) return;
    const isLeader = profile.families.created_by === profile.id;
    if (isLeader && familyMembers.length > 1) {
      alert("그룹장은 탈퇴 전 다른 멤버에게 권한을 위임해야 합니다.");
      return;
    }

    if (!confirm("정말 가족 그룹을 탈퇴하시겠습니까? 기록된 활동 내역은 삭제되지 않습니다.")) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ family_id: null })
        .eq('id', profile.id);

      if (error) throw error;
      alert("가족 그룹에서 탈퇴되었습니다.");
      window.location.reload();
    } catch (error: any) {
      alert("탈퇴 중 오류가 발생했습니다: " + error.message);
    }
  };

  const fetchMyFamilies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('families').select('id, name, invite_code, created_by');
      if (error) throw error;

      const filteredData = data.filter(f => f.created_by === user.id || f.id === profile?.family_id);
      const leaderIds = Array.from(new Set(filteredData.map(f => f.created_by)));
      const { data: leaders } = await supabase.from('profiles').select('id, name, nickname').in('id', leaderIds);

      const familiesWithLeaders = filteredData.map(fam => ({
        ...fam,
        leader: leaders?.find(l => l.id === fam.created_by)
      }));
      setMyFamilies(familiesWithLeaders);
    } catch (error: any) {
      console.error("Error fetching families:", error.message);
    }
  };

  const handleSwitchFamily = async (familyId: string, familyName: string) => {
    if (!profile?.id) return;
    if (familyId === profile.family_id) {
      alert("이미 선택된 가족입니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ family_id: familyId })
        .eq('id', profile.id);

      if (error) throw error;
      alert(`${familyName} 그룹으로 전환되었습니다.`);
      window.location.reload();
    } catch (error: any) {
      alert("그룹 전환 중 오류가 발생했습니다: " + error.message);
    }
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

  const handleUpdateProfile = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      if (!profileDraft.nickname.trim()) {
        alert("닉네임을 입력해주세요. 데이터 유실 방지를 위해 저장이 중단되었습니다.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: profileDraft.nickname,
          phone: profileDraft.phone
        })
        .eq("id", user.id);

      if (error) throw error;
      setProfile({ ...profile, nickname: profileDraft.nickname, phone: profileDraft.phone });
      setIsMyPageOpen(false);
      alert("정보가 수정되었습니다.");
    } catch (error: any) {
      alert("수정 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFamilyName = async () => {
    if (!profile?.family_id || !familyDraftName.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('families')
        .update({ name: familyDraftName.trim() })
        .eq('id', profile.family_id);

      if (error) throw error;
      setProfile({
        ...profile,
        families: {
          ...profile.families,
          name: familyDraftName.trim()
        }
      });
      setMyFamilies(prev => prev.map(fam => 
        fam.id === profile.family_id ? { ...fam, name: familyDraftName.trim() } : fam
      ));
      alert("가족 그룹 이름이 변경되었습니다.");
    } catch (error: any) {
      alert("그룹 이름 변경 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsSubmitting(false);
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

  const renderRecordFlow = () => {
    if (recordingType === '약 먹이기') {
      const currentPetId = selectedPetId || (pets.length > 0 ? pets[0].id : null);
      const selectedPet = pets?.find(p => p.id === currentPetId);
      const petMedications = Array.isArray(selectedPet?.medications) ? selectedPet.medications : [];
      const historyMeds = activities.filter(a => a.pet_id === currentPetId && a.type === '약 먹이기');
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
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">품목 선택</span>
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
                    <Link href={`/dashboard/edit-pet/${selectedPetId}`} className="text-[10px] text-zinc-900 underline underline-offset-4 font-semibold">프로필에서 약 등록하기</Link>
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
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">메모</span>
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

    if (recordingType === '산책하기' || recordingType === '사냥놀이하기' || recordingType === '자유시간주기' || recordingType === '운동시키기') {
      const activityLabel = recordingType === '사냥놀이하기' ? '놀이' : recordingType === '자유시간주기' ? '자유시간' : recordingType === '운동시키기' ? '운동' : '산책';
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
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">소요 시간</span>
                <h2 className="text-2xl font-light tracking-tight">
                  {recordingType === '사냥놀이하기' ? '얼마나 놀아주셨나요?' : recordingType === '자유시간주기' ? '자유시간을 얼마나 가졌나요?' : recordingType === '운동시키기' ? '얼마나 운동시켰나요?' : '얼마나 산책했나요?'}
                </h2>
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
              <button disabled={!recordData.duration} onClick={() => setRecordStep(2)} className="w-full py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100">다음으로</button>
            </div>
          ) : recordStep === 2 ? (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">반응</span>
                <h2 className="text-2xl font-light tracking-tight">{recordingType === '자유시간주기' ? '자유시간을 얼마나 즐겼나요?' : '반응은 어땠나요?'}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: '완전 좋아해요! 🔥', value: '완전 좋아해요!' },
                  { label: '적당히 즐거웠어요 🙂', value: '적당히 즐거웠어요' },
                  { label: '조금 지루해 보였어요 🥱', value: '조금 지루해 했어요' },
                  { label: '오늘도 별로였나 봐요 😿', value: '별로였나 봐요' }
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
                <button disabled={!recordData.mood} onClick={() => setRecordStep(3)} className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl disabled:bg-zinc-100">다음으로</button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest">메모</span>
                <h2 className="text-2xl font-light tracking-tight">구체적으로 어떤 {activityLabel}였나요?</h2>
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
                <button disabled={isSubmitting} onClick={handleRecordActivity} className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl active:scale-[0.98] transition-all disabled:bg-zinc-100 disabled:text-zinc-400">
                  {isSubmitting ? "기록 중..." : "기록 완료"}
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (recordingType === '간식 먹이기') {
      const currentPetId = selectedPetId || (pets.length > 0 ? pets[0].id : null);
      const selectedPet = pets.find(p => p.id === currentPetId);
      const historyTreats = activities.filter(a => a.pet_id === currentPetId && a.type === '간식 먹이기');
      const lastTreat = historyTreats[0];
      const today = new Date().toLocaleDateString();
      const todayTreats = historyTreats.filter(a => new Date(a.timestamp).toLocaleDateString() === today);

      return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {(lastTreat || todayTreats.length > 0) && (
            <div className="bg-zinc-50 p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b border-zinc-100/50 pb-3">
                <div className="flex gap-2 items-center">
                  <div className="w-1 h-1 rounded-full bg-black" />
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase tracking-tight">오늘 총 {todayTreats.length}회 간식</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
              </div>
              {lastTreat && (
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400">마지막 간식</span>
                  <span className="text-[10px] text-zinc-900 font-semibold uppercase font-mono">
                    {new Date(lastTreat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({lastTreat.details})
                  </span>
                </div>
              )}
            </div>
          )}
          {recordStep === 1 ? (
            <div className="space-y-10">
              <div className="space-y-4 text-center">
                <h2 className="text-2xl font-light tracking-tight">
                  {selectedPet?.name || '아이'}가 오늘 <span className="font-normal text-black underline underline-offset-8 decoration-zinc-100">맛있는 간식</span>을 먹었나요?
                </h2>
                <p className="text-[11px] text-zinc-400 pt-2">무슨 간식을 먹었는지 적어주세요.</p>
              </div>
              <div className="space-y-8">
                <input
                  autoFocus
                  type="text"
                  placeholder="예: 츄르, 북어 트릿, 닭가슴살 등"
                  className="w-full text-xl font-light border-b border-zinc-100 focus:border-black focus:ring-0 py-4 placeholder:text-zinc-200 text-center"
                  value={recordData.memo}
                  onChange={(e) => setRecordData({ ...recordData, memo: e.target.value })}
                />
                <div className="flex gap-3 pt-6">
                  <button onClick={() => setRecordingType(null)} className="flex-1 py-4 text-xs font-medium border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest text-zinc-400">취소</button>
                  <button disabled={!recordData.memo} onClick={() => { if (!recordData.amountUnit || recordData.amountUnit === 'g') setRecordData({ ...recordData, amountUnit: '개' }); setRecordStep(2); }} className="flex-[2] py-5 text-sm font-semibold bg-black text-white rounded-2xl shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:bg-zinc-100 disabled:shadow-none">다음으로</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 text-center">
              <div className="space-y-4">
                <h2 className="text-2xl font-light tracking-tight">얼마나 주셨나요?</h2>
                <p className="text-[11px] text-zinc-900 font-semibold pt-1">"{recordData.memo}"</p>
              </div>
              <div className="space-y-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex items-end gap-2 border-b border-zinc-100 pb-2">
                    <input autoFocus type="number" placeholder="0" className="w-32 text-5xl font-light border-none focus:ring-0 p-0 text-center placeholder:text-zinc-100" value={recordData.amountValue} onChange={(e) => setRecordData({ ...recordData, amountValue: e.target.value })} />
                    <span className="text-2xl font-light text-zinc-300 pb-1">{recordData.amountUnit || '개'}</span>
                  </div>
                  <div className="flex gap-2">
                    {['개', 'g', '컵'].map((unit) => (
                      <button key={unit} onClick={() => setRecordData({ ...recordData, amountUnit: unit })} className={`px-5 py-2 text-[10px] font-semibold tracking-widest border transition-all rounded-full ${(recordData.amountUnit || '개') === unit ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}>{unit}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button onClick={() => setRecordStep(1)} className="flex-1 py-4 text-xs font-medium border border-zinc-100 rounded-xl hover:bg-zinc-50 transition-colors uppercase tracking-widest text-zinc-400">이전</button>
                  <button disabled={!recordData.amountValue || isSubmitting} onClick={handleRecordActivity} className="flex-[2] py-5 text-sm font-semibold bg-black text-white rounded-2xl shadow-xl shadow-black/10 active:scale-[0.98] transition-all disabled:bg-zinc-100 disabled:shadow-none">
                    {isSubmitting ? "기록 중..." : "기록 완료"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-light tracking-tight">{recordingType} 내용을 간단히 기록해주세요</h2>
        <input autoFocus type="text" placeholder="상세 내용을 입력하세요" className="w-full text-xl font-light border-b border-zinc-100 focus:border-black focus:ring-0 py-4 placeholder:text-zinc-200" value={recordData.memo} onChange={(e) => setRecordData({ ...recordData, memo: e.target.value })} />
        <div className="flex gap-3 pt-6">
          <button onClick={() => setRecordingType(null)} className="flex-1 py-4 text-sm font-medium border border-zinc-100 rounded-xl">취소</button>
          <button disabled={!recordData.memo || isSubmitting} onClick={handleRecordActivity} className="flex-[2] py-4 text-sm font-medium bg-black text-white rounded-xl active:scale-[0.98] transition-all disabled:bg-zinc-100 disabled:text-zinc-400">
            {isSubmitting ? "기록 중..." : "기록 완료"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex justify-between items-center px-6 py-8">
        <Link href="/dashboard" className="text-xl font-light tracking-tighter">집착</Link>
        <div className="flex items-center gap-6 relative">
          <div className="flex items-center gap-4 pr-4 border-r border-zinc-100">
            <div className="relative">
              <button 
                onClick={() => { 
                  setIsNotificationOpen(!isNotificationOpen); 
                  if (!isNotificationOpen) {
                    setNotificationCount(0);
                    localStorage.setItem('zipsa_last_notification_check', new Date().toISOString());
                  }
                }} 
                className="text-zinc-200 hover:text-black transition-colors relative flex items-center justify-center p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                {notificationCount > 0 && (
                  <span className="absolute 0 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-[1.5px] ring-white">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsNotificationOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} className="absolute top-full right-0 mt-3 w-[260px] bg-white z-[70] shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-3xl border border-zinc-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-zinc-50 flex justify-between items-center">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-900 border-l border-black pl-2">새로운 기록 알림</p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                        {recentNotifications.length > 0 ? (
                          recentNotifications.map(n => (
                            <div key={n.id} className="p-3 hover:bg-zinc-50/80 rounded-2xl transition-colors space-y-1.5 flex gap-3 items-start group">
                              <div className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold">{n.profiles?.nickname?.[0] || '가'}</span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[11px] text-zinc-800 leading-tight">
                                  <span className="font-bold">{n.profiles?.nickname || '가족'}</span>님이 <span className="font-bold">{n.pets?.name}</span>의 <span className="text-black font-semibold bg-zinc-100 px-1 rounded">{n.type}</span> 기록을 남겼습니다.
                                </p>
                                <p className="text-[9px] text-zinc-400 font-mono pt-1 group-hover:text-black transition-colors">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center flex flex-col items-center gap-2">
                            <span className="text-2xl opacity-20">📭</span>
                            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">새로운 알림이 없습니다</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button onClick={() => setIsMailboxOpen(!isMailboxOpen)} className="text-zinc-200 hover:text-black transition-colors flex items-center justify-center p-1 relative">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {(() => {
                  const unreadCount = mailboxLetters.filter(l => !readLetters.includes(l.id)).length;
                  if (unreadCount > 0) {
                    return (
                      <span className="absolute 0 -right-1 w-3.5 h-3.5 bg-[#1A1A1A] rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm ring-[1.5px] ring-white">
                        {unreadCount}
                      </span>
                    );
                  }
                  return null;
                })()}
              </button>

              <AnimatePresence>
                {isMailboxOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => { setIsMailboxOpen(false); setSelectedLetter(null); }} />
                    <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} className="absolute top-full right-0 mt-3 w-[280px] sm:w-[320px] bg-[#fffcf5] z-[70] shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-3xl border border-[#efe9dc] overflow-hidden">
                      {selectedLetter ? (
                        <div className="p-5 relative min-h-[300px] flex flex-col items-center text-center">
                          <button onClick={() => setSelectedLetter(null)} className="absolute top-4 left-4 p-1 text-zinc-400 hover:text-black">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                          </button>
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-[#efe9dc] mb-4 mt-2 flex items-center justify-center shrink-0 shadow-sm">
                            {selectedLetter.petPhoto ? <img src={selectedLetter.petPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-xl">🐾</span>}
                          </div>
                          <h4 className="text-sm font-bold text-[#3d3730] mb-6">{selectedLetter.title}</h4>
                          <p className="text-[11px] text-[#5c544a] leading-[1.8] whitespace-pre-wrap font-medium">{selectedLetter.content}</p>
                          <p className="text-[9px] text-zinc-400 font-mono mt-8 mb-2 absolute bottom-2">{new Date(selectedLetter.date).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <>
                          <div className="px-5 py-4 border-b border-[#efe9dc] flex justify-between items-center bg-[#fdfaf3]">
                            <p className="text-[11px] font-bold tracking-widest uppercase text-[#5c544a] flex items-center gap-2"><span className="text-lg">💌</span> 우리 아이들의 편지함</p>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                            {mailboxLetters.length > 0 ? (
                              mailboxLetters.map(letter => (
                                <button key={letter.id} onClick={() => handleReadLetter(letter)} className="w-full p-4 hover:bg-[#f6ebd8]/50 rounded-2xl transition-colors space-y-2 flex gap-4 items-center group text-left">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-[#efe9dc] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                    {letter.petPhoto ? <img src={letter.petPhoto} className="w-full h-full object-cover" alt="" /> : <span className="text-sm">🐾</span>}
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex justify-between items-center pr-1">
                                      <span className="text-[10px] font-bold text-[#8c7e6d]">{letter.petName}</span>
                                      <span className="text-[8px] text-[#b3a89e] font-mono">{new Date(letter.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className={`text-[12px] truncate pr-2 ${!readLetters.includes(letter.id) ? 'text-[#3d3730] font-bold' : 'text-[#8c7e6d] font-normal'}`}>
                                      {!readLetters.includes(letter.id) && <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5 mb-[1px]"></span>}
                                      {letter.title}
                                    </p>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="py-12 text-center flex flex-col items-center gap-3">
                                <span className="text-3xl opacity-20 filter grayscale">📮</span>
                                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">아직 도착한 편지가 없어요</p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          {profile?.role === 'admin' && (
            <Link href="/dashboard/admin" className="text-[10px] tracking-widest text-zinc-400 uppercase hover:text-black transition-colors">
              Admin
            </Link>
          )}
          <div className="relative h-8 flex items-center">
            <button onClick={() => { setIsMyPageOpen(!isMyPageOpen); setActiveMyPageTab('root'); }} className={`text-[10px] tracking-[0.2em] uppercase transition-colors leading-none ${isMyPageOpen ? 'text-black font-bold' : 'text-zinc-400 hover:text-black'}`}>마이페이지</button>
            <AnimatePresence>
              {isMyPageOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setIsMyPageOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.98 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute top-full right-0 mt-2 w-[180px] bg-white z-[70] shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl border border-zinc-100 overflow-hidden">
                    <div className="p-1.5">
                      {activeMyPageTab === 'root' ? (
                        <div className="space-y-0.5">
                          <Link href="/dashboard/profile" className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 transition-all flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold">{profile?.nickname || profile?.name || '사용자'}</span>
                              <span className="text-[8px] text-zinc-400">나의 정보 수정</span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-zinc-300 group-hover:text-black transition-colors" />
                          </Link>
                          <div className="my-1.5 border-t border-zinc-50" />
                          <button onClick={() => setActiveMyPageTab('family')} className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 transition-all flex justify-between items-center group">
                            <span className="text-[10px] font-semibold">나의 가족</span>
                            <ChevronRight className="w-3 h-3 text-zinc-300 group-hover:text-black transition-colors" />
                          </button>
                          <Link href="/dashboard/edit-pet" className="block w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 transition-all flex justify-between items-center group">
                            <span className="text-[10px] font-semibold">아이 관리</span>
                            <ChevronRight className="w-3 h-3 text-zinc-300 group-hover:text-black transition-colors" />
                          </Link>
                          <div className="my-1.5 border-t border-zinc-50" />
                          <button onClick={handleLogout} className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-50 transition-all text-red-500 text-[10px] font-semibold">로그아웃</button>
                        </div>
                      ) : activeMyPageTab === 'profile' ? (
                        <div className="p-1.5 space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <button onClick={() => setActiveMyPageTab('root')} className="p-1 text-zinc-400 hover:text-black"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
                            <span className="text-[10px] font-bold uppercase tracking-tight">나의 정보 수정</span>
                          </div>
                          <div className="space-y-3 px-1">
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">닉네임</label>
                              <input type="text" className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] focus:ring-0 focus:border-black border-transparent transition-all" value={profileDraft.nickname} onChange={(e) => setProfileDraft({ ...profileDraft, nickname: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] text-zinc-400 uppercase tracking-widest pl-1 font-mono">전화번호</label>
                              <input type="text" className="w-full p-2.5 bg-zinc-50 rounded-xl text-[10px] focus:ring-0 focus:border-black border-transparent transition-all" value={profileDraft.phone} onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })} />
                            </div>
                            <button disabled={isSubmitting} onClick={handleUpdateProfile} className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-bold mt-2 disabled:bg-zinc-200">저장하기</button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-3 animate-in fade-in slide-in-from-right-1 duration-200">
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <button onClick={() => setActiveMyPageTab('root')} className="p-1 -ml-1 text-zinc-400 hover:text-black"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>
                            <span className="text-[10px] font-bold uppercase tracking-tight">가족 구성원</span>
                          </div>
                          <div className="space-y-2.5">
                            <div className="p-3 bg-zinc-50 rounded-2xl space-y-3">
                              <div className="space-y-1.5 flex flex-col">
                                <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-mono pl-1">가족 그룹 이름</span>
                                {profile?.id === profile?.families?.created_by ? (
                                  <div className="flex gap-2 items-center">
                                    <input type="text" className="flex-1 px-3 py-2.5 bg-white rounded-xl text-[10px] font-bold border border-zinc-100 focus:border-black outline-none transition-all placeholder:text-zinc-200 min-w-0" value={familyDraftName} onChange={(e) => setFamilyDraftName(e.target.value)} placeholder="이름 입력" />
                                    <button onClick={handleUpdateFamilyName} disabled={isSubmitting || familyDraftName === profile?.families?.name} className="flex-shrink-0 px-3 py-2.5 bg-black text-white text-[9px] font-bold rounded-lg disabled:bg-zinc-100 disabled:text-zinc-300 transition-all active:scale-[0.95]">{isSubmitting ? "..." : "저장"}</button>
                                  </div>
                                ) : ( <p className="text-[11px] font-bold text-zinc-900 px-1">{profile?.families?.name}</p> )}
                              </div>
                              <div className="pt-3 border-t border-zinc-100 space-y-1">
                                <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-mono">가족 초대 코드</span>
                                <div className="flex items-center justify-between px-1">
                                  <p className="text-[11px] font-mono font-black text-zinc-900 tracking-wider font-bold"> {profile?.families?.invite_code} </p>
                                  <button onClick={() => { navigator.clipboard.writeText(profile?.families?.invite_code || ''); alert("초대 코드가 복사되었습니다."); }} className="text-[8px] text-zinc-400 hover:text-black uppercase tracking-tighter">복사</button>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                              {familyMembers.length > 0 ? ( familyMembers.map((member: any) => (
                                <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg border border-zinc-50 bg-white">
                                  <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center text-[7px] font-bold text-zinc-400 overflow-hidden shrink-0"> {member.nickname?.[0] || member.name?.[0] || '?'} </div>
                                  <p className="text-[9px] font-semibold truncate flex-1 flex items-center gap-1"> {member.nickname || member.name || '이름 없음'} 
                                    {member.id === profile?.families?.created_by && ( <span className="text-[7px] bg-zinc-900 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter scale-90">방장</span> )}
                                    {member.id === profile?.id && <span className="text-[7px] text-zinc-300 font-normal">나</span>}
                                  </p>
                                  {profile?.families?.created_by === profile?.id && member.id !== profile?.id && (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleTransferLeadership(member.id, member.nickname || member.name)} className="text-[8px] text-zinc-400 hover:text-blue-500 transition-colors font-medium border-r border-zinc-100 pr-2">위임</button>
                                      <button onClick={() => handleRemoveMember(member.id, member.nickname || member.name)} className="text-[8px] text-zinc-400 hover:text-red-500 transition-colors font-medium">삭제</button>
                                    </div>
                                  )}
                                </div> ))) : ( <p className="text-[8px] text-zinc-300 text-center py-4">합류한 멤버가 없습니다</p> )}
                            </div>
                            <div className="pt-2 border-t border-zinc-50 mt-1 space-y-1">
                              <button onClick={handleLeaveFamily} className="w-full py-2 text-[8px] text-zinc-100 hover:text-red-500 transition-colors uppercase tracking-widest font-bold">가족 그룹 탈퇴하기</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <div className="max-w-[800px] mx-auto px-6 pt-12 pb-28 space-y-12">
        <section className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] tracking-[0.2em] text-zinc-400 uppercase">홈</p>
            <div className="relative">
              <button onClick={() => { fetchMyFamilies(); setShowInlineFamilies(!showInlineFamilies); }} className="flex items-center gap-1.5 group">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-1.5">
                  {(() => {
                    let name = profile?.families?.name || '가족 선택';
                    const leader = (profile?.families as any)?.leader;
                    const nickname = profile?.nickname;
                    const realName = profile?.name;
                    if (leader?.name && leader?.nickname && name === `${leader.name}님의 가족`) return name.replace(leader.name, leader.nickname);
                    if (realName && nickname && name === `${realName}님의 가족`) return name.replace(realName, nickname);
                    if (name === "김민정님의 가족" && nickname) return name.replace("김민정", nickname);
                    return name;
                  })()}
                  <ChevronDown className={`w-5 h-5 text-zinc-300 group-hover:text-black transition-all ${showInlineFamilies ? 'rotate-180' : ''}`} />
                </h1>
              </button>
              <AnimatePresence>
                {showInlineFamilies && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowInlineFamilies(false)} />
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, ease: "easeOut" }} className="absolute top-full left-0 mt-3 w-full max-w-[280px] bg-white z-[70] shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-3xl border border-zinc-100 overflow-hidden p-2">
                      <div className="p-1 space-y-1">
                        <p className="px-3 py-2 text-[8px] text-zinc-400 uppercase tracking-widest font-bold">나의 가족 그룹</p>
                        {myFamilies.length > 0 ? (
                          <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                            {myFamilies.map((fam: any) => (
                              <button key={fam.id} onClick={() => handleSwitchFamily(fam.id, fam.name)} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left ${fam.id === profile?.family_id ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-900'}`}>
                                <div>
                                  <p className="text-[11px] font-bold">
                                    {(() => {
                                      let name = fam.name || '알 수 없는 가족';
                                      const leader = fam.leader;
                                      const nickname = profile?.nickname;
                                      const realName = profile?.name;
                                      if (leader?.name && leader?.nickname && name === `${leader.name}님의 가족`) return name.replace(leader.name, leader.nickname);
                                      if (realName && nickname && name === `${realName}님의 가족`) return name.replace(realName, nickname);
                                      if (name === "김민정님의 가족" && nickname) return name.replace("김민정", nickname);
                                      return name;
                                    })()}
                                  </p>
                                  <p className={`text-[9px] font-mono mt-0.5 ${fam.id === profile?.family_id ? 'text-zinc-400' : 'text-zinc-300'}`}>CODE: {fam.invite_code}</p>
                                </div>
                                {fam.id === profile?.family_id && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                              </button>
                            ))}
                          </div>
                        ) : ( <div className="py-8 text-center"><p className="text-[10px] text-zinc-300 uppercase tracking-widest italic">가족 목록을 불러오는 중...</p></div> )}
                        <div className="mt-2 pt-2 border-t border-zinc-50">
                          <Link href="/dashboard/family/create" className="flex items-center justify-center gap-2 p-3 text-[10px] text-zinc-500 font-bold hover:text-black transition-colors"><span>+</span> 새 가족 만들기 / 합류하기</Link>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-[25px] font-light tracking-tight">안녕하세요, {profile?.nickname || profile?.name}님</h2>
            <p className="text-xs text-zinc-400">사랑스러운 나의 {pets.length}마리의 아이들을 돌봐주세요 ദ്디⁼ˆ╹⥿╹ˆ⁼)</p>
          </div>
        </section>

        {activeBottomTab === 'pocket' && (() => {
          const family = profile?.families;
          if (!family) return null;
          const today = new Date().toISOString().split('T')[0];
          const activitiesToday = activities.filter(a => a.timestamp.startsWith(today));
          return (
            <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-12">
              <div className="space-y-3">
                <span className="text-[10px] tracking-[0.3em] text-zinc-400 uppercase font-mono font-bold">포켓룸</span>
                <div className="relative aspect-video sm:aspect-[21/9] bg-white border-[1px] border-zinc-900 rounded-2xl overflow-hidden flex items-center justify-center group shadow-2xl shadow-zinc-100">
                  <div className="absolute top-6 left-8 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      {isEditingTamagotchi ? (
                        <div className="flex items-center gap-2 animate-in slide-in-from-left-1 duration-300">
                          <input 
                            autoFocus
                            type="text" 
                            className="text-[9px] font-pixel bg-white border border-black px-1.5 py-0.5 rounded-sm outline-none w-24 tracking-widest uppercase font-bold" 
                            value={tamagotchiNameDraft} 
                            onChange={(e) => setTamagotchiNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTamagotchiName()}
                            placeholder="이름 입력"
                          />
                          <button onClick={handleUpdateTamagotchiName} className="text-[7px] text-zinc-900 font-bold uppercase transition-transform hover:scale-105">SAVE</button>
                          <button onClick={() => setIsEditingTamagotchi(false)} className="text-[7px] text-zinc-400 uppercase transition-transform hover:scale-105">ESC</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 group relative">
                          <span className="text-[9px] font-pixel text-zinc-900 tracking-widest uppercase font-bold">{family.tamagotchi_name || '?'}</span>
                          {(!family.tamagotchi_name || family.tamagotchi_name === '?') && (
                            <button onClick={() => { setTamagotchiNameDraft(''); setIsEditingTamagotchi(true); }} className="text-[7px] text-zinc-300 hover:text-black transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-tighter font-pixel">이름짓기</button>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[#888888] font-pixel tracking-tighter">상태: {family.is_hatched ? '부화함' : '대기 중'}</span>
                  </div>
                  <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
                    <div className="space-y-4 w-full max-w-[140px]">
                      <div className="flex justify-between items-end"><span className="text-[10px] filter grayscale group-hover:grayscale-0 transition-all">❤️</span><span className="text-[10px] text-zinc-900 font-bold font-pixel">{family.heart_points || 0}%</span></div>
                      <div className="h-[3px] w-full bg-zinc-50 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${family.heart_points || 0}%` }} className="h-full bg-black" /></div>
                    </div>
                  </div>
                </div>
              </div>
              {(family.heart_points >= 100 && family.active_days_count >= 7 && !family.is_hatched) && (
                <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={async () => { const { error } = await supabase.from('families').update({ is_hatched: true }).eq('id', family.id); if (!error) { setProfile({ ...profile, families: { ...family, is_hatched: true } }); } }} className="w-full py-6 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-[0.4em] shadow-2xl shadow-black/20">기록의 결실: 부화하기</motion.button>
              )}
            </motion.section>
          );
        })()}

        {activeBottomTab === 'home' && (
          <>
            <section className="space-y-8">
          <div className="flex justify-between items-end">
            <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">아이 프로필을 선택해주세요</h3>
            <Link href="/dashboard/add-pet" className="text-[10px] underline underline-offset-4 decoration-[0.5px] hover:text-zinc-500">아이 추가하기</Link>
          </div>
          <div className="flex overflow-x-auto gap-4 py-2 pb-8 snap-x no-scrollbar -mx-6 px-6">
            {pets.map((pet) => (
              <div key={pet.id} onClick={() => setSelectedPetId(pet.id)} className={`group shrink-0 w-[180px] snap-start space-y-4 cursor-pointer p-3 rounded-2xl transition-all ${selectedPetId === pet.id ? 'bg-zinc-50 ring-1 ring-black ring-offset-4' : 'hover:bg-zinc-50'}`}>
                <div className="aspect-square bg-white border border-zinc-100 flex items-center justify-center rounded-2xl overflow-hidden shadow-sm transition-colors">
                  {pet.photo_url ? ( <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" /> ) : (
                    <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-zinc-200">
                      {pet.species?.includes('고양이') ? <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.5 2 9.17 2.48 8.08 3.28L6.44 2.1C6.26 1.97 6 1.97 5.82 2.1C5.64 2.23 5.59 2.47 5.71 2.66L6.96 4.67C4.64 6.34 3 9.07 3 12.2C3 17.06 6.94 21 11.8 21C16.66 21 20.6 17.06 20.6 12.2C20.6 9.07 18.96 6.34 16.64 4.67L17.89 2.66C18.02 2.47 17.97 2.23 17.78 2.1C17.6 1.97 17.34 1.97 17.16 2.1L15.52 3.28C14.43 2.48 13.11 2 11.61 2H12ZM9.5 11C10.33 11 11 11.67 11 12.5C11 13.33 10.33 14 9.5 14C8.67 14 8 13.33 8 12.5C8 11.67 8.67 11 9.5 11ZM14.5 11C15.33 11 16 11.67 16 12.5C16 13.33 15.33 14 14.5 14C13.67 14 13 13.33 13 12.5C13 11.67 13.67 11 14.5 11Z" /></svg> : <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C10.5 2 9 3.5 9 5V6.5C9 7.33 8.33 8 7.5 8H6C4.34 8 3 9.34 3 11V16C3 17.66 4.34 19 6 19H7V21C7 21.55 7.45 22 8 22H10C10.55 22 11 21.55 11 21V19H13V21C13 21.55 13.45 22 14 22H16C16.55 22 17 21.55 17 21V19H18C19.66 19 21 17.66 21 16V11C21 9.34 19.66 8 18 8H16.5C15.67 8 15 7.33 15 6.5V5C15 3.5 13.5 2 12 2ZM9.5 11C10.33 11 11 11.67 11 12.5C11 13.33 10.33 14 9.5 14C8.67 14 8 13.33 8 12.5C8 11.67 8.67 11 9.5 11ZM14.5 11C15.33 11 16 11.67 16 12.5C16 13.33 15.33 14 14.5 14C13.67 14 13 13.33 13 12.5C13 11.67 13.67 11 14.5 11Z" /></svg>}
                    </div> )}
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-sm font-bold text-zinc-900 truncate">{pet.name}</p>
                  <div className="flex justify-between items-center"><p className="text-[10px] text-zinc-400 uppercase tracking-tight truncate w-3/4">{pet.species}</p><Link href={`/dashboard/edit-pet/${pet.id}`} onClick={(e) => e.stopPropagation()} className="text-[10px] text-zinc-300 hover:text-black font-medium">수정</Link></div>
                </div>
              </div> ))}
            <Link href="/dashboard/add-pet" className="group shrink-0 w-[180px] snap-start aspect-square border-[1.5px] border-dashed border-zinc-100 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-black transition-all bg-zinc-50/30">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-black transition-colors">
                <span className="text-zinc-400 group-hover:text-white text-lg">+</span>
              </div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold group-hover:text-black">아이 추가하기</span>
            </Link>
            {pets.length === 0 && ( <p className="text-[10px] text-zinc-300 py-10 pl-6 uppercase tracking-widest italic">등록된 아이가 없습니다</p> )}
          </div>
        </section>

        <section className="space-y-8">
          <h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">🗒️오늘 하루를 기록해주세요!</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {((): string[] => {
              const selectedPet = pets.find(p => p.id === selectedPetId);
              const species = (selectedPet?.species || '').toLowerCase();
              const activityLabel = species.includes('고양이') ? '사냥놀이하기' : (species.includes('햄스터') ? '운동시키기' : (species.includes('토끼') || species.includes('새') ? '자유시간주기' : '산책하기'));
              return ['밥 먹이기', activityLabel, '약 먹이기', '간식 먹이기', '기타'];
              })().map((type) => ( <button key={type} onClick={() => { setRecordingType(type); setRecordStep(1); setRecordData({ type: '', amountValue: '', amountUnit: 'g', memo: '', duration: '', mood: '' }); }} className="group border border-zinc-100 p-6 space-y-4 hover:border-black transition-all text-left"><div className="w-8 h-8 bg-zinc-50 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors"><span className="text-[10px] font-bold">+</span></div><div className="space-y-1"><p className="text-xs font-semibold">{type}</p><p className="text-[9px] text-zinc-300 uppercase tracking-tighter">간편 기록</p></div></button> ))}
          </div>
        </section>

        {(() => {
          const selectedPet = pets.find(p => p.id === selectedPetId);
          if (!selectedPet) return null;
          const meds = Array.isArray(selectedPet.medications) ? selectedPet.medications : [];
          return (
            <section className="space-y-6">
              <div className="flex justify-between items-end"><h3 className="text-xs tracking-widest text-zinc-900 uppercase font-semibold">💊 {selectedPet.name}의 복용 중인 약</h3><Link href={`/dashboard/edit-pet/${selectedPet.id}`} className="text-[9px] text-zinc-400 hover:text-black transition-colors underline underline-offset-4">수정/관리하기</Link></div>
              {meds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"> {meds.map((med: any) => (
                    <div key={med.id} className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-100/50 flex items-center gap-3"><div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs border border-zinc-100 shadow-sm">💊</div><div className="space-y-0.5"><p className="text-[11px] font-semibold text-zinc-900">{med.name}</p><p className="text-[9px] text-zinc-400 font-medium uppercase">{med.frequency}</p></div></div> ))} </div>
              ) : ( <div className="bg-zinc-50/30 p-6 rounded-xl border border-dashed border-zinc-100 flex flex-center justify-center"><p className="text-[10px] text-zinc-300 uppercase tracking-widest">등록된 복용 중인 약이 없습니다</p></div> )}
            </section>
          );
        })()}

        <section className="space-y-8">
          <h3 className="text-xs tracking-widest text-zinc-400 uppercase font-medium">최근 기록</h3>
          <div className="space-y-4">
            {activities.filter(a => {
              const isToday = new Date(a.timestamp).toDateString() === new Date().toDateString();
              return a.pet_id === selectedPetId && isToday;
            }).length > 0 ? (
              activities.filter(a => {
                const isToday = new Date(a.timestamp).toDateString() === new Date().toDateString();
                return a.pet_id === selectedPetId && isToday;
              }).map((activity) => (
                <div key={activity.id} className="group relative py-6 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors px-2 -mx-2 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-[11px] font-semibold text-zinc-400">{activity.type[0]}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5"><span className="text-[9px] font-bold px-1.5 py-0.5 bg-zinc-100 rounded text-zinc-500 uppercase tracking-tighter">{(activity as any).profiles?.nickname || '집사'}</span><p className="text-[12px] font-bold text-zinc-900">{activity.pets?.name || "아이"} — {activity.type}</p></div>
                        <p className="text-[11px] text-zinc-500 leading-relaxed font-normal">{activity.details || '상세 내용 없음'}</p>
                        <p className="text-[10px] text-zinc-300 font-mono pt-1">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    {activity.user_id === profile?.id && (
                      <div className="flex gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingActivity(activity); if (activity.type === '밥 먹이기') { const [typePart, amountPart] = activity.details.split(' - '); const amountMatch = amountPart?.match(/^(\d+)(.*)$/); setEditMealData({ type: typePart || '', amountValue: amountMatch?.[1] || '', amountUnit: amountMatch?.[2] || 'g' }); } else { setEditDetails(activity.details); } }} className="text-[10px] text-zinc-400 hover:text-black">수정</button>
                        <button onClick={() => handleDeleteActivity(activity.id)} className="text-[10px] text-zinc-200 hover:text-red-400">삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : ( <p className="text-[10px] text-zinc-300 py-10 text-center">최근 기록이 없습니다.</p> )}
          </div>
        </section>
          </>
        )}

        {activeBottomTab === 'calendar' && (
          <section className="space-y-12 border-t border-zinc-50 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-xs tracking-widest text-[#888888] uppercase font-medium">활동 히스토리</h3>
              <h4 className="text-[20px] font-light tracking-tight text-[#1A1A1A]">
                {historySelectedDate.getFullYear()}년 {historySelectedDate.getMonth() + 1}월
              </h4>
            </div>
            
            <div className="flex bg-zinc-50 p-1 rounded-lg">
              {(['day', 'week', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setHistoryViewMode(mode)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${
                    historyViewMode === mode ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  {mode === 'day' ? '일' : mode === 'week' ? '주' : '월'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calendar View */}
            <div className="bg-white border border-zinc-900 rounded-3xl p-6 shadow-2xl shadow-zinc-100/50">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setHistorySelectedDate(new Date(historySelectedDate.getFullYear(), historySelectedDate.getMonth() - 1))} className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-300 hover:text-[#1A1A1A]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-[12px] font-pixel tracking-widest uppercase font-bold text-[#1A1A1A]">
                  {historySelectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                </span>
                <button onClick={() => setHistorySelectedDate(new Date(historySelectedDate.getFullYear(), historySelectedDate.getMonth() + 1))} className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-300 hover:text-[#1A1A1A]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {historyViewMode === 'month' && (
                <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <span key={day} className="text-[8px] font-mono font-bold text-zinc-300 tracking-widest">{day}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const d = historySelectedDate;
                  
                  if (historyViewMode === 'day') {
                    return (
                      <div className="col-span-7 py-2 flex flex-col items-center justify-center space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
                        <div className="w-12 h-12 bg-[#1A1A1A] text-white rounded-xl flex flex-col items-center justify-center shadow-lg shadow-zinc-100">
                          <span className="text-lg font-bold font-mono tracking-tighter">{d.getDate()}</span>
                          <span className="text-[7px] uppercase tracking-widest opacity-40 font-black">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                        <p className="text-[7px] text-zinc-300 uppercase tracking-widest font-black">Day View</p>
                      </div>
                    );
                  }

                  if (historyViewMode === 'week') {
                    const startOfWeek = new Date(d);
                    startOfWeek.setDate(d.getDate() - d.getDay()); 
                    
                    const weekDays = [];
                    for (let i = 0; i < 7; i++) {
                      const day = new Date(startOfWeek);
                      day.setDate(startOfWeek.getDate() + i);
                      const isSelected = d.toDateString() === day.toDateString();
                      const isToday = new Date().toDateString() === day.toDateString();
                      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                      const hasActivity = activities.some(a => a.timestamp.startsWith(dateStr) && (!selectedPetId || a.pet_id === selectedPetId));

                      weekDays.push(
                        <button
                          key={i}
                          onClick={() => setHistorySelectedDate(day)}
                          className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative group ${
                            isSelected ? 'bg-[#1A1A1A] text-white shadow-xl scale-105 z-10' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <span className="text-[8px] font-mono text-zinc-300 mb-1">{['S','M','T','W','T','F','S'][i]}</span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'font-bold' : 'text-[#1A1A1A]'} ${isToday && !isSelected ? 'text-red-500 font-bold underline' : ''}`}>{day.getDate()}</span>
                          {hasActivity && !isSelected && (
                            <div className="w-1 h-1 rounded-full bg-black mt-1 opacity-20 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      );
                    }
                    return <div className="col-span-7 grid grid-cols-7 gap-1 animate-in slide-in-from-left-2 duration-300">{weekDays}</div>;
                  }

                  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
                  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                  
                  const days = [];
                  for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);
                  for (let dNum = 1; dNum <= daysInMonth; dNum++) {
                    const currentLoopDay = new Date(d.getFullYear(), d.getMonth(), dNum);
                    const dateStr = `${currentLoopDay.getFullYear()}-${String(currentLoopDay.getMonth() + 1).padStart(2, '0')}-${String(currentLoopDay.getDate()).padStart(2, '0')}`;
                    const hasActivity = activities.some(a => a.timestamp.startsWith(dateStr) && (!selectedPetId || a.pet_id === selectedPetId));
                    const isSelected = historySelectedDate.getDate() === dNum && historySelectedDate.getMonth() === d.getMonth();
                    const isToday = new Date().toDateString() === currentLoopDay.toDateString();
                    
                    days.push(
                      <button
                        key={dNum}
                        onClick={() => setHistorySelectedDate(new Date(d.getFullYear(), d.getMonth(), dNum))}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all relative group animate-in fade-in duration-300 ${
                          isSelected ? 'bg-[#1A1A1A] text-white shadow-xl scale-105 z-10' : 'hover:bg-zinc-50'
                        }`}
                      >
                        <span className={`text-[10px] font-mono ${isSelected ? 'font-bold' : 'text-[#1A1A1A]'} ${isToday && !isSelected ? 'text-red-500 font-bold underline' : ''}`}>{dNum}</span>
                        {hasActivity && !isSelected && (
                          <div className="w-1 h-1 rounded-full bg-black mt-1 opacity-20 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>

            {/* History Details View */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                <h5 className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-widest">
                  {historyViewMode === 'day' ? '일간 기록' : historyViewMode === 'week' ? '주간 기록' : '월간 기록'}
                </h5>
                <span className="text-[10px] text-[#888888] font-mono">
                  {historyViewMode === 'day' ? (
                    historySelectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
                  ) : historyViewMode === 'week' ? (
                    '최근 7일'
                  ) : (
                    `${historySelectedDate.getMonth() + 1}월 전체`
                  )}
                </span>
              </div>

              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {(() => {
                  const filtered = activities.filter(a => {
                    const aDate = new Date(a.timestamp);
                    const sDate = historySelectedDate;
                    
                    if (selectedPetId && a.pet_id !== selectedPetId) return false;

                    if (historyViewMode === 'day') {
                      return aDate.toDateString() === sDate.toDateString();
                    } else if (historyViewMode === 'week') {
                      const diff = sDate.getTime() - aDate.getTime();
                      return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
                    } else {
                      return aDate.getMonth() === sDate.getMonth() && aDate.getFullYear() === sDate.getFullYear();
                    }
                  });

                  return filtered.length > 0 ? (
                    filtered.map((activity) => (
                      <div key={activity.id} className="flex gap-4 items-start group border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0">
                          <span className="text-[10px] filter grayscale group-hover:grayscale-0 transition-all">
                            {activity.type === '밥 먹이기' ? '🥣' : 
                             activity.type === '산책하기' ? '🦮' : 
                             activity.type === '약 먹이기' ? '💊' : 
                             activity.type === '놀아주기' ? '🧶' : '📝'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-[#1A1A1A]">{activity.type}</p>
                          <p className="text-[10px] text-[#888888] leading-relaxed line-clamp-2 font-light">{activity.details}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[8px] font-mono text-zinc-300 uppercase tracking-widest">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-zinc-50 rounded text-zinc-400">{(activity as any).profiles?.nickname}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="text-3xl opacity-10">🗓️</div>
                      <p className="text-[10px] text-zinc-300 uppercase tracking-[0.2em] italic font-light">해당 기간의 기록이 없습니다.</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
        )}

        <footer className="pt-20 border-t border-zinc-100 pb-10">
          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono"><span>가족 코드: {profile?.families?.invite_code}</span><span>© 2026 ZIPCHAK</span></div>
        </footer>

        {recordingType && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[450px] rounded-[32px] p-8 space-y-10 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center"><span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">{recordingType} — {recordStep} / {recordingType === '밥 먹이기' ? 2 : (recordingType === '산책하기' || recordingType === '사냥놀이하기' ? 3 : 2)}</span><button onClick={() => setRecordingType(null)} className="text-zinc-300 hover:text-black"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
              {renderRecordFlow()}
            </div>
          </div>
        )}

        {editingActivity && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest text-zinc-400 uppercase font-mono">기록 수정 — {editingActivity.type}</span>
                <h2 className="text-xl font-light tracking-tight">{editingActivity.pets?.name}의 기록을 수정합니다</h2>
              </div>
              {editingActivity.type === '밥 먹이기' ? (
                <div className="space-y-10">
                  <div className="space-y-4"><label className="text-[10px] text-zinc-400 uppercase tracking-widest">분류</label><div className="grid grid-cols-2 gap-2">{['건식 사료', '습식 사료', '자연식', '기타'].map((t) => ( <button key={t} onClick={() => setEditMealData({ ...editMealData, type: t })} className={`py-3 px-4 text-xs rounded-xl border transition-all ${editMealData.type === t ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-500'}`}>{t}</button> ))}</div></div>
                  <div className="space-y-4"><label className="text-[10px] text-zinc-400 uppercase tracking-widest">양 및 단위</label><div className="flex items-end gap-2 border-b border-zinc-100 pb-2"><input type="number" className="w-full text-3xl font-light border-none focus:ring-0 p-0" value={editMealData.amountValue} onChange={(e) => setEditMealData({ ...editMealData, amountValue: e.target.value })} /><span className="text-xl font-light text-zinc-300 pb-0.5">{editMealData.amountUnit}</span></div><div className="flex gap-2">{['g', 'kg', '컵'].map((unit) => ( <button key={unit} onClick={() => setEditMealData({ ...editMealData, amountUnit: unit })} className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all ${editMealData.amountUnit === unit ? 'border-black bg-black text-white' : 'border-zinc-100 text-zinc-400'}`}>{unit}</button> ))}</div></div>
                </div>
              ) : (
                <div className="space-y-4"><label className="text-[10px] text-zinc-400 uppercase tracking-widest">상세 내용</label><input autoFocus type="text" className="w-full text-lg border-b border-zinc-100 focus:border-black focus:ring-0 py-4" value={editDetails} onChange={(e) => setEditDetails(e.target.value)} /></div>
              )}
              <div className="flex gap-3 pt-4"><button onClick={() => setEditingActivity(null)} className="flex-1 py-4 text-xs font-medium border border-zinc-100 rounded-xl">취소</button><button disabled={isSubmitting} onClick={handleUpdateActivity} className="flex-[2] py-4 text-xs font-medium bg-black text-white rounded-xl">{isSubmitting ? "저장 중..." : "수정 완료"}</button></div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 z-[100] px-6 py-2 flex justify-between items-center max-w-[800px] mx-auto pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <button onClick={() => setActiveBottomTab('home')} className={`flex flex-col items-center gap-1.5 transition-colors flex-1 py-1 sm:py-2 ${activeBottomTab === 'home' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={activeBottomTab === 'home' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span className="text-[10px] font-bold tracking-widest uppercase">홈</span>
        </button>
        <button onClick={() => setActiveBottomTab('pocket')} className={`flex flex-col items-center gap-1.5 transition-colors flex-1 py-1 sm:py-2 ${activeBottomTab === 'pocket' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={activeBottomTab === 'pocket' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          <span className="text-[10px] font-bold tracking-widest uppercase">포켓룸</span>
        </button>
        <button onClick={() => setActiveBottomTab('calendar')} className={`flex flex-col items-center gap-1.5 transition-colors flex-1 py-1 sm:py-2 ${activeBottomTab === 'calendar' ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={activeBottomTab === 'calendar' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span className="text-[10px] font-bold tracking-widest uppercase">일정</span>
        </button>
      </nav>
    </main>
  );
}
