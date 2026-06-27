import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';

import Navbar from '@/components/Navbar';
import { useAuth, useUser, useNotification, useMessage } from '@/hooks';

import ContactsHeader from '@/components/Contacts/ContactsHeader';
import ContactsGroup from '@/components/Contacts/ContactsGroup';
import ProfileModal from '@/components/Contacts/ProfileModal';
import { CONTACT_ROLE_ORDER, getContactId } from '@/utils/contactHelpers';

const PAGE_SIZE = 18;

const ContactsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [localFollow, setLocalFollow] = useState({});
  const [hasMore, setHasMore] = useState(true);

  const bottomRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => setLocalFollow({ ...followedUsers }), [followedUsers]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await fetchUsers({ page: 1, limit: PAGE_SIZE });
        if (!data || data.length < PAGE_SIZE) setHasMore(false);
        setError(null);
      } catch {
        setError('Failed to load contacts. Please try again.');
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (page === 1 || !hasMore) return;

    const loadMore = async () => {
      try {
        const data = await fetchUsers({ page, limit: PAGE_SIZE });
        if (!data || data.length < PAGE_SIZE) setHasMore(false);
        setError(null);
      } catch {
        setError('Failed to load more contacts.');
      }
    };

    loadMore();
  }, [page, hasMore]);

  const handleIntersect = useCallback(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore]
  );

  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });

    if (bottomRef.current) {
      observerRef.current.observe(bottomRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [handleIntersect]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return users
      .filter(Boolean)
      .filter((u) => {
        const matchSearch =
          !q ||
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q);

        const matchRole =
          selectedRole === 'all' ||
          (u.role || '').toLowerCase() === selectedRole.toLowerCase();

        return matchSearch && matchRole;
      });
  }, [users, searchQuery, selectedRole]);

  const groupedUsers = useMemo(() => {
    const byRole = Object.fromEntries(CONTACT_ROLE_ORDER.map((role) => [role, []]));

    filteredUsers.forEach((u) => {
      const role = CONTACT_ROLE_ORDER.find(
        (r) => r.toLowerCase() === (u.role || '').toLowerCase()
      );
      if (role) byRole[role].push(u);
    });

    return byRole;
  }, [filteredUsers]);

  const toggleFollow = async (targetUserId) => {
    const wasFollowing = !!localFollow[targetUserId];

    setLocalFollow((prev) => ({
      ...prev,
      [targetUserId]: !wasFollowing,
    }));

    try {
      if (wasFollowing) await unfollowUser(targetUserId);
      else await followUser(targetUserId);
      notify(wasFollowing ? 'Unfollowed' : 'Followed', 'success');
    } catch {
      setLocalFollow((prev) => ({
        ...prev,
        [targetUserId]: wasFollowing,
      }));
      notify('Action failed. Try again.', 'error');
    }
  };

  const openModal = (u) => setSelectedUser(u);
  const closeModal = () => setSelectedUser(null);

  const handleMessageClick = (u) => {
    closeModal();
    const userId = getContactId(u);
    navigate(`/messages?userId=${userId}`);
    try {
      selectChat?.(u);
    } catch {
      /* optional */
    }
  };

  const visibleGroups = CONTACT_ROLE_ORDER.filter(
    (role) => groupedUsers[role]?.length > 0
  );

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            Contacts Directory
          </h1>
        </header>

        <ContactsHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />

        {error && (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        {usersLoading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-dim">
            <Loader2 className="mb-3 animate-spin" size={36} aria-hidden />
            <p className="text-sm">Loading contacts…</p>
          </div>
        ) : (
          <div className="space-y-10">
            {visibleGroups.map((role) => (
              <ContactsGroup
                key={role}
                role={role}
                users={groupedUsers[role]}
                openModal={openModal}
                onMessageClick={handleMessageClick}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {!usersLoading && filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <Search size={56} className="mx-auto mb-4 text-text-dim/25" aria-hidden />
            <p className="text-lg font-medium text-text-main">No contacts found</p>
            <p className="mt-2 text-sm text-text-dim">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {hasMore && <div ref={bottomRef} className="h-10" aria-hidden />}
      </main>

      {selectedUser && (
        <ProfileModal
          modalUser={selectedUser}
          currentUserId={currentUserId}
          onClose={closeModal}
          onMessageClick={handleMessageClick}
          onToggleFollow={toggleFollow}
          isFollowing={!!localFollow[getContactId(selectedUser)]}
        />
      )}
    </div>
  );
};

export default ContactsPage;
