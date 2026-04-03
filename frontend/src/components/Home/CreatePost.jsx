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
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800/60 p-5 sm:p-6 transition-shadow duration-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
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
              className={`px-4 py-1.5 rounded-full transition-all duration-300 font-semibold text-xs tracking-wide uppercase ${
                postType === type
                  ? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600/20 dark:ring-blue-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Post Input */}
        <div className="flex gap-4 group">
          <img
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
            alt=""
            className="w-12 h-12 rounded-full object-cover mt-1 flex-shrink-0"
          />
          <textarea
            placeholder="What's on your mind? Use @ to mention someone..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 text-[15px] sm:text-base outline-none resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 mt-2.5"
          />
        </div>

        {/* Problem Description */}
        {postType === 'problem' && (
          <div className="pl-16">
            <textarea
              placeholder="Describe the specific problem in detail..."
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={2}
              className="w-full bg-red-50/50 dark:bg-red-900/10 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm outline-none border border-red-100 dark:border-red-900/30 focus:ring-2 focus:ring-red-500/20 resize-none transition-all placeholder:text-red-300 dark:placeholder:text-red-400/50"
            />
          </div>
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
      <div className="flex justify-between items-center pt-4 mt-2">
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
            className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          >
            <ImageIcon size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          >
            <Video size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Video</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || (!newPost.trim() && selectedFiles.length === 0)}
          className="bg-gradient-to-tr from-blue-600 to-indigo-500 text-white px-8 py-2.5 rounded-full hover:from-blue-700 hover:to-indigo-600 font-bold tracking-wide shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
