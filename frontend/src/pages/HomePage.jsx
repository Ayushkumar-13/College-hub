/*
 * FILE: frontend/src/pages/HomePage.jsx
 * LOCATION: college-social-platform/frontend/src/pages/HomePage.jsx
 * PURPOSE: Production-ready main home page with polished UI and backend integration
 */

import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, MessageSquare, Flag, Users, Bell, LogOut, Heart, 
  MessageCircle, Share2, Repeat2, MoreVertical, Image as ImageIcon, 
  Video, X 
} from 'lucide-react';
import { useAuth, usePost, useNotification } from '@/hooks';
import { getTimeAgo, validateFile } from '@/utils/helpers';
import { POST_FILTERS } from '@/utils/constants';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { posts, loading, filter, setFilter, createPost, likePost, sharePost, repostPost } = usePost();
  const { unreadCount } = useNotification();
  
  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const urls = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
        urls.push(URL.createObjectURL(file));
      } else {
        alert(validation.error + ': ' + file.name);
      }
    });

    setSelectedFiles(validFiles);
    setPreviewUrls(urls);
  };

  // Remove selected file
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!newPost.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media');
      return;
    }

    try {
      setSubmitting(true);
      const result = await createPost(newPost, selectedFiles);
      if (result.success) {
        setNewPost('');
        setSelectedFiles([]);
        setPreviewUrls([]);
      } else {
        alert(result.error || 'Failed to create post');
      }
    } catch (error) {
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              CS
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
              College Social
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-2 hover:bg-indigo-50 rounded-lg transition"
            >
              <Bell size={22} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-indigo-100 hover:ring-indigo-300 transition"
            />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-[61px] z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-6 overflow-x-auto">
          {[
            { to: "/", icon: <Home size={18} />, label: "Feed" },
            { to: "/messages", icon: <MessageSquare size={18} />, label: "Messages" },
            { to: "/issues", icon: <Flag size={18} />, label: "Issues" },
            { to: "/contacts", icon: <Users size={18} />, label: "Contacts" },
          ].map((link, i) => (
            <Link
              key={i}
              to={link.to}
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-indigo-600 hover:border-indigo-400 transition font-medium"
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-xl shadow p-3 flex gap-2 overflow-x-auto">
            {Object.values(POST_FILTERS).map(filterOption => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                  filter === filterOption 
                    ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>

          {/* Create Post */}
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex gap-4 mb-3">
              <img src={user?.avatar} alt="" className="w-10 h-10 rounded-full ring-2 ring-indigo-100" />
              <input
                type="text"
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="flex-1 bg-gray-100 rounded-full px-5 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            
            {/* Media Preview */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt="" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <ImageIcon size={18} />
                  <span>Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center gap-2 text-pink-600 hover:bg-pink-50 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <Video size={18} />
                  <span>Video</span>
                </button>
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={submitting || loading}
                className="bg-gradient-to-r from-indigo-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-pink-600 font-medium shadow transition disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loader border-4 border-indigo-300 border-t-indigo-600 rounded-full w-10 h-10 animate-spin"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow">
              <Home size={50} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-lg">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map(post => {
              const isLiked = post.likes && post.likes.includes(user?.id);
              return (
                <div key={post._id} className="bg-white rounded-xl shadow hover:shadow-md transition">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={post.userId?.avatar} 
                        alt="" 
                        className="w-10 h-10 rounded-full ring-2 ring-pink-100"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{post.userId?.name}</h3>
                        <p className="text-xs text-gray-500">
                          {post.userId?.role} • {getTimeAgo(post.createdAt)}
                        </p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                    
                    {post.isRepost && (
                      <div className="flex items-center gap-1 text-pink-600 text-xs mb-2">
                        <Repeat2 size={14} />
                        <span>Reposted</span>
                      </div>
                    )}
                    
                    <p className="mb-3 text-sm text-gray-800">{post.content}</p>
                    
                    {post.media && post.media.length > 0 && (
                      <div className="grid gap-2 mb-3">
                        {post.media.map((m, i) => (
                          m.type === 'image' ? (
                            <img key={i} src={m.url} alt="" className="w-full rounded-lg" />
                          ) : (
                            <video key={i} src={m.url} controls className="w-full rounded-lg" />
                          )
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2 pt-2 border-t">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>{post.comments?.length || 0} comments • {post.shares || 0} shares</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => likePost(post._id)}
                        className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition ${
                          isLiked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                        <span>Like</span>
                      </button>
                      <button className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                        <MessageCircle size={16} />
                        <span>Comment</span>
                      </button>
                      <button 
                        onClick={() => sharePost(post._id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <Share2 size={16} />
                        <span>Share</span>
                      </button>
                      <button 
                        onClick={() => repostPost(post._id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        <Repeat2 size={16} />
                        <span>Repost</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
