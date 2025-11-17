// FILE: src/pages/ContactsPage.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import Navbar from "@/components/Navbar";
import { useAuth, useUser, useNotification, useMessage } from "@/hooks";

import ContactsHeader from "@/components/contacts/ContactsHeader";
import ContactsGroup from "@/components/contacts/ContactsGroup";
import ProfileModal from "@/components/contacts/ProfileModal";

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
  const [error, setError] = useState(null);
  const [localFollow, setLocalFollow] = useState({});
  const [hasMore, setHasMore] = useState(true);

  const bottomRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => setLocalFollow({ ...followedUsers }), [followedUsers]);

  /** -------------------------
   * Initial Load Page 1
   -------------------------- */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers({ page: 1, limit: PAGE_SIZE });

        // detect if no more users exist
        if (!data || data.length < PAGE_SIZE) setHasMore(false);

        setError(null);
      } catch {
        setError("Failed to load users");
      }
    };
    loadUsers();
  }, []); // load once


  /** -------------------------
   * Load Next Pages
   -------------------------- */
  useEffect(() => {
    if (page === 1 || !hasMore) return;

    const loadMore = async () => {
      try {
        const data = await fetchUsers({ page, limit: PAGE_SIZE });

        if (!data || data.length < PAGE_SIZE) {
          setHasMore(false);
        }

        setError(null);
      } catch {
        setError("Failed to load more users");
      }
    };

    loadMore();
  }, [page, hasMore]);


  /** -------------------------
   * Infinite Scroll Observer  
   -------------------------- */
  const handleIntersect = useCallback(
    (entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;

      if (!hasMore) return;

      setPage((prev) => prev + 1);
    },
    [hasMore]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "200px",
      threshold: 0.1,
    });

    if (bottomRef.current) {
      observerRef.current.observe(bottomRef.current);
    }

    return () => observerRef.current && observerRef.current.disconnect();
  }, [handleIntersect]);


  /** -------------------------
   * Filtering Logic
   -------------------------- */
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return users
      .filter((u) => {
        if (!u) return false;
        if (user?.role === "Owner") return true;
        return u._id !== user?.id;
      })
      .filter((u) => {
        const matchSearch =
          !q ||
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q);

        const matchRole =
          selectedRole === "all" || u.role === selectedRole;

        return matchSearch && matchRole;
      });
  }, [users, user, searchQuery, selectedRole]);


  /** -------------------------
   * Group Users by Role
   -------------------------- */
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


  /** -------------------------
   * Follow / Unfollow
   -------------------------- */
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


  /** -------------------------
   * Modal + Messaging
   -------------------------- */
  const openModal = (u) => setSelectedUser(u);
  const closeModal = () => setSelectedUser(null);

  const handleMessageClick = (u) => {
    if (selectedUser) closeModal();

    const userId = u._id || u.id;
    navigate(`/messages?userId=${userId}`);
    try {
      selectChat && selectChat(u);
    } catch {}
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">Contacts Directory</h2>

        <ContactsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedUsers).map(([role, group]) =>
            group.length > 0 ? (
              <ContactsGroup
                key={role}
                role={role}
                users={group}
                openModal={openModal}
                onMessageClick={handleMessageClick}
              />
            ) : null
          )}
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && !usersLoading && (
          <div className="text-center py-12">
            <Search size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No contacts found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Invisible Observer Target */}
        <div ref={bottomRef} className="h-8" />
      </main>

      {selectedUser && (
        <ProfileModal
          modalUser={selectedUser}
          onClose={closeModal}
          onMessageClick={handleMessageClick}
          onToggleFollow={toggleFollow}
          isFollowing={!!localFollow[selectedUser._id]}
        />
      )}
    </div>
  );
};

export default ContactsPage;
