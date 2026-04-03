/* 
 * FILE: frontend/src/components/Home/CreatePost.jsx
 * PURPOSE: Post creation component with media upload
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
      <div className="flex gap-4 group mb-4">
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

                {/* Sequence Numbering Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white px-2.5 py-0.5 rounded-md text-[13px] font-bold shadow-md z-10 border border-white/20">
                  {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-black/70 text-white p-2 text-[10px] rounded-full hover:bg-black transition opacity-0 group-hover:opacity-100 z-10 shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Buttons */}
      <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60">
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
