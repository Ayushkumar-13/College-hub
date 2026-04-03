/* 
 * FILE: frontend/src/components/Home/LikesModal.jsx
 * PURPOSE: A modal to display users who liked a post or comment
 */
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { postApi } from '@/api/postApi';

const LikesModal = ({ isOpen, onClose, targetId, postId, type }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehavior = 'auto';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !targetId) return;

    const fetchLikes = async () => {
      try {
        setLoading(true);
        let data;
        if (type === 'post') {
          data = await postApi.getPostLikes(targetId);
        } else if (type === 'comment') {
          data = await postApi.getCommentLikes(postId, targetId);
        }
        setUsers(data || []);
      } catch (error) {
        console.error('Failed to fetch likes', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [isOpen, targetId, postId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-surface dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-border-card flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between p-4 border-b border-border-card">
          <h2 className="text-lg font-bold text-text-main">Likes</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-6 text-text-dim text-sm">No likes yet.</p>
          ) : (
            <div className="space-y-1">
              {users.map((user, idx) => (
                <div key={user._id || idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                  <img 
                    src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700"
                  />
                  <div>
                    <h3 className="font-semibold text-sm text-text-main leading-tight">{user.name}</h3>
                    <p className="text-xs text-text-dim mt-0.5">{user.department} {user.role !== 'Student' && `• ${user.role}`}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;
