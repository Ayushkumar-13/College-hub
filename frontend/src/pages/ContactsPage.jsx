import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Mail,
  Phone,
  Briefcase,
  MessageSquare,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth, useUser, useNotification, useMessage } from "@/hooks";
import { USER_ROLES } from "@/utils/constants";

const PAGE_SIZE = 18;

const ContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    users = [],
    loading: usersLoading = false,
    followedUsers = {},
    followUser,
    unfollowUser,
    fetchUsers,
  } = useUser();
  const { notify } = useNotification();
  const { selectChat } = useMessage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState(null);
  const [localFollow, setLocalFollow] = useState({});

  const scrollPosRef = useRef(0);
  const observerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => setLocalFollow({ ...followedUsers }), [followedUsers]);

  // ✅ Fetch users and sort them by priority (Owner → Director → others)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers({ page: 1, limit: PAGE_SIZE });
        const sorted = data.sort((a, b) => {
          const priority = {
            Owner: 1,
            Director: 2,
            HOD: 3,
            Faculty: 4,
            Staff: 5,
            Student: 6,
          };
          return (priority[a.role] || 999) - (priority[b.role] || 999);
        });
        setError(null);
      } catch {
        setError("Failed to load users");
      }
    };
    loadUsers();
  }, []);

  // ✅ Search and filter logic (safe for missing department)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users
      .filter((u) => u && u._id !== user?.id)
      .filter((u) => {
        const matchSearch =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q);
        const matchRole = selectedRole === "all" || u.role === selectedRole;
        return matchSearch && matchRole;
      });
  }, [users, user, searchQuery, selectedRole]);

  // ✅ Group users properly (including Owner)
  const groupedUsers = useMemo(
    () => ({
      Owner: filteredUsers.filter((u) => u.role === "Owner"),
      Director: filteredUsers.filter((u) => u.role === "Director"),
      HOD: filteredUsers.filter((u) => u.role === "HOD"),
      Faculty: filteredUsers.filter((u) => u.role === "Faculty"),
      Staff: filteredUsers.filter((u) => u.role === "Staff"),
      Student: filteredUsers.filter((u) => u.role === "Student"),
    }),
    [filteredUsers]
  );

  // ✅ Infinite scroll
  const handleIntersect = useCallback(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting || isFetchingMore) return;
      setIsFetchingMore(true);
      const next = page + 1;
      fetchUsers({ page: next, limit: PAGE_SIZE })
        .then(() => {
          setPage(next);
          setIsFetchingMore(false);
        })
        .catch(() => {
          setError("Failed to load more users");
          setIsFetchingMore(false);
        });
    },
    [isFetchingMore, page]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    });
    if (bottomRef.current) observerRef.current.observe(bottomRef.current);
    return () => observerRef.current.disconnect();
  }, [handleIntersect]);

  // ✅ Follow / Unfollow logic
  const toggleFollow = async (targetUserId) => {
    const wasFollowing = !!localFollow[targetUserId];
    setLocalFollow((prev) => ({
      ...prev,
      [targetUserId]: !wasFollowing,
    }));
    try {
      if (wasFollowing) await unfollowUser(targetUserId);
      else await followUser(targetUserId);
      notify(wasFollowing ? "Unfollowed" : "Followed", "success");
    } catch {
      setLocalFollow((prev) => ({
        ...prev,
        [targetUserId]: wasFollowing,
      }));
      notify("Action failed. Try again.", "error");
    }
  };

  // ✅ Modal handlers
  const openModal = (u) => {
    scrollPosRef.current = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollPosRef.current}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    setSelectedUser(u);
  };

  const closeModal = () => {
    setSelectedUser(null);
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.overflow = "";
    window.scrollTo(0, scrollPosRef.current);
  };

  const handleMessageClick = (u) => {
    selectChat(u);
    navigate("/messages");
  };

  // ✅ Modal Component
  const ProfileModal = ({ modalUser, onClose }) => {
    if (!modalUser) return null;
    const isFollowing = !!localFollow[modalUser._id];
    const followersCount = (modalUser.followers?.length || 0) + (isFollowing ? 1 : 0);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-24 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-white/20 text-white p-2 rounded-full hover:bg-white/30"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-6 -mt-16">
              <img
                src={modalUser.avatar}
                alt={modalUser.name}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modalUser.name}
                </h2>
                <p className="text-gray-600 font-medium mt-1">
                  {modalUser.role} • {modalUser.department || "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 bg-slate-50 p-6 rounded-2xl">
              <div className="flex items-center gap-3">
                <Mail className="text-blue-600" />
                <span>{modalUser.email}</span>
              </div>
              {modalUser.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="text-green-600" />
                  <span>{modalUser.phone}</span>
                </div>
              )}
              {modalUser.department && (
                <div className="flex items-center gap-3">
                  <Briefcase className="text-indigo-600" />
                  <span>{modalUser.department}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  handleMessageClick(modalUser);
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:scale-[1.02]"
              >
                <MessageSquare size={18} className="inline mr-2" />
                Message
              </button>

              <button
                onClick={() => toggleFollow(modalUser._id)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  isFollowing
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-gradient-to-r from-indigo-100 to-blue-100 text-blue-700 hover:from-indigo-200 hover:to-blue-200"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Main UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">
          Contacts Directory
        </h2>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full md:w-56 border-2 border-gray-200 rounded-xl py-3 px-4 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {["Owner", "Director", "HOD", "Faculty", "Staff", "Student"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <div className="text-center text-red-600 mb-6">{error}</div>}

        <div className="space-y-8">
          {Object.entries(groupedUsers).map(([role, users]) =>
            users.length > 0 ? (
              <section key={role}>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {role} <span className="text-gray-500">({users.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((u) => (
                    <div
                      key={u._id}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl p-6 transition-all cursor-pointer hover:scale-[1.02]"
                      onClick={() => openModal(u)}
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 truncate">
                            {u.name}
                          </h3>
                          <p className="text-sm text-gray-600">{u.role}</p>
                          <p className="text-sm text-gray-500">{u.department || "—"}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          className="flex-1 border-2 border-gray-200 py-2 rounded-xl hover:border-blue-400 hover:bg-blue-50 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(u);
                          }}
                        >
                          View Profile
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:scale-[1.03]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMessageClick(u);
                          }}
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>

        <div ref={bottomRef} className="h-6" />
        {isFetchingMore && (
          <div className="text-center py-4 text-sm text-gray-600">
            Loading more...
          </div>
        )}
      </main>

      {selectedUser && (
        <ProfileModal modalUser={selectedUser} onClose={closeModal} />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ContactsPage;
