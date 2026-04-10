"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Plus, ArrowLeft } from "lucide-react";

interface Pet {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
}

export default function EditPetListPage() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (profile?.family_id) {
        const { data: petsData } = await supabase
          .from("pets")
          .select("*")
          .eq("family_id", profile.family_id)
          .order("created_at", { ascending: false });

        if (petsData) setPets(petsData);
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex justify-between items-center px-6 py-8">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-zinc-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">아이 관리</h1>
        <div className="w-9" /> {/* Spacer */}
      </nav>

      <div className="max-w-[600px] mx-auto px-6 py-8 space-y-10">
        <div className="space-y-2">
          <h2 className="text-2xl font-light tracking-tight">우리 가족 아이들</h2>
          <p className="text-xs text-zinc-400">수정하고 싶은 아이를 선택해주세요.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => (
              <motion.div
                key={pet.id}
                whileHover={{ x: 4 }}
                className="group relative"
              >
                <Link
                  href={`/dashboard/edit-pet/${pet.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-black transition-all bg-white"
                >
                  <div className="w-16 h-16 rounded-xl bg-zinc-50 overflow-hidden flex-shrink-0 border border-zinc-50">
                    {pet.photo_url ? (
                      <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-200 uppercase text-[10px] font-bold">
                        {pet.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 mb-0.5">{pet.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{pet.species}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-black transition-colors" />
                </Link>
              </motion.div>
            ))}

            <Link
              href="/dashboard/add-pet"
              className="flex items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-zinc-100 text-zinc-400 hover:border-black hover:text-black transition-all group"
            >
              <Plus size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold uppercase tracking-widest">새로운 아이 등록</span>
            </Link>
          </div>
        )}

        {pets.length === 0 && !loading && (
          <div className="text-center py-20 space-y-4">
            <p className="text-xs text-zinc-300 italic uppercase tracking-widest">등록된 아이가 없습니다</p>
          </div>
        )}
      </div>
    </main>
  );
}
