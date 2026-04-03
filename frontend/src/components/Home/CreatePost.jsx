/* 
 * FILE: frontend/src/components/Home/CreatePost.jsx
 * PURPOSE: Post creation component with media upload (RELOAD FIXED)
 */
import React, { useRef } from 'react';
import { Image as ImageIcon, Video, X } from 'lucide-react';

const CreatePost = ({
  user,
  newPost,
  setNewPost,
  selectedFiles,
  setSelectedFiles,
  previewUrls,
  setPreviewUrls,
  submitting,
  postType,
  setPostType,
  problemDescription,
  setProblemDescription,
  onSubmit
}) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const urls = [];

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name} (max 10MB)`);
        return;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert(`Invalid file type: ${file.name}`);
        return;
      }
      validFiles.push(file);
      urls.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const getMediaGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    return 'grid-cols-2';
  };

  return (
    <div className="bg-surface dark:bg-slate-900 rounded-2xl shadow-sm border border-border-card p-5 ">
      <div className="flex flex-col gap-2 mb-4">

        {/* Post Type Selector */}
        <div className="flex gap-2 text-sm mb-2">
          {['status', 'problem'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setPostType(type);
                if (type === 'status') setProblemDescription('');
              }}
              className={`px-3 py-1 rounded-full transition-all duration-200 font-medium ${
                postType === type
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-dim hover:text-text-main hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Post Input */}
        <div className="flex gap-4">
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt=""
            className="w-12 h-12 rounded-full ring-2 ring-slate-100"
          />
          <textarea
            placeholder="What's on your mind? Use @ to mention someone..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-text-main rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 resize-none transition-all placeholder:text-text-dim/60"
          />
        </div>

        {/* Problem Description */}
        {postType === 'problem' && (
          <textarea
            placeholder="Describe the problem..."
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 dark:bg-slate-800/50 text-text-main rounded-2xl px-4 py-3 text-sm outline-none border border-red-200 dark:border-red-900/30 focus:ring-2 focus:ring-red-500/20 resize-none mt-2 transition-all placeholder:text-text-dim/50"
          />
        )}
      </div>

      {/* Media Preview */}
      {previewUrls.length > 0 && (
        <div className={`grid ${getMediaGridClass(previewUrls.length)} gap-2 mb-4`}>
          {previewUrls.map((url, index) => {
            const file = selectedFiles[index];
            const isVideo = file?.type.startsWith('video/');

            return (
              <div key={index} className="relative group">
                {isVideo ? (
                  <video src={url} className="w-full h-64 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 border border-border-card shadow-inner" controls />
                ) : (
                  <img src={url} alt="" className="w-full h-64 object-cover rounded-xl bg-slate-100 dark:bg-slate-800 border border-border-card shadow-inner" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black transition opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-border-card">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          >
            <ImageIcon size={20} />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          >
            <Video size={20} />
            <span>Video</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || (!newPost.trim() && selectedFiles.length === 0)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-2.5 rounded-full hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
