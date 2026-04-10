"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Trash2, KeyRound, Pencil, X } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  gender: string | null;
  address: string | null;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", nickname: "", phone: "", gender: "", address: "", role: "" });
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/"); return; }

    setToken(session.access_token);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") { router.push("/dashboard"); return; }

    await fetchUsers(session.access_token, "");
  };

  const fetchUsers = async (accessToken: string, query: string) => {
    setLoading(true);
    const params = query ? `?search=${encodeURIComponent(query)}` : "";
    const res = await fetch(`/api/admin/users${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const handleSearch = () => fetchUsers(token, search);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      nickname: user.nickname || "",
      phone: user.phone || "",
      gender: user.gender || "",
      address: user.address || "",
      role: user.role,
    });
  };

  const handleEditSubmit = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditingUser(null);
    await fetchUsers(token, search);
    setActionLoading(false);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.email} 유저를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) { alert(data.error); }
    await fetchUsers(token, search);
    setActionLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    setActionLoading(true);
    const res = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (data.error) { alert(data.error); } else { alert("비밀번호가 변경되었습니다."); }
    setResetUser(null);
    setNewPassword("");
    setActionLoading(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <nav className="flex justify-between items-center px-6 py-8">
        <button onClick={() => router.push("/dashboard")} className="p-2 -ml-2 text-zinc-400 hover:text-black transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-sm font-bold tracking-widest uppercase">Admin</h1>
        <div className="w-6" />
      </nav>

      <div className="max-w-[800px] mx-auto px-6 pb-32">
        {/* Search */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
            <input
              type="text"
              placeholder="이메일, 이름, 닉네임으로 검색"
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 rounded-2xl text-sm focus:ring-0 border-transparent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="px-6 py-3 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest">
            검색
          </button>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-zinc-100 border-t-black rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="group p-5 bg-zinc-50 rounded-2xl flex items-center justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{user.nickname || user.name || "이름없음"}</span>
                    {user.role === "admin" && (
                      <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest">admin</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  <p className="text-[10px] text-zinc-300">{new Date(user.created_at).toLocaleDateString("ko-KR")}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(user)} className="p-2 text-zinc-400 hover:text-black transition-colors" title="수정">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setResetUser(user)} className="p-2 text-zinc-400 hover:text-black transition-colors" title="비밀번호 초기화">
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => handleDelete(user)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="삭제">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-center text-zinc-300 text-sm py-20">유저가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-light tracking-tight">유저 정보 수정</h2>
              <button onClick={() => setEditingUser(null)} className="text-zinc-400 hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-xs text-zinc-400">{editingUser.email}</p>
            <div className="space-y-4">
              {(["name", "nickname", "phone", "gender", "address"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">{field}</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-zinc-50 rounded-xl text-sm border-transparent"
                    value={editForm[field]}
                    onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">role</label>
                <select
                  className="w-full p-3 bg-zinc-50 rounded-xl text-sm border-transparent"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleEditSubmit}
              disabled={actionLoading}
              className="w-full py-4 bg-black text-white rounded-2xl text-sm font-bold disabled:bg-zinc-100"
            >
              {actionLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-[400px] rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-light tracking-tight">비밀번호 초기화</h2>
              <button onClick={() => { setResetUser(null); setNewPassword(""); }} className="text-zinc-400 hover:text-black"><X size={18} /></button>
            </div>
            <p className="text-xs text-zinc-400">{resetUser.email}</p>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">new password</label>
              <input
                type="text"
                className="w-full p-3 bg-zinc-50 rounded-xl text-sm border-transparent font-mono"
                placeholder="새 비밀번호 (6자 이상)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handleResetPassword}
              disabled={actionLoading || newPassword.length < 6}
              className="w-full py-4 bg-black text-white rounded-2xl text-sm font-bold disabled:bg-zinc-100"
            >
              {actionLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
