/*
 * FILE: frontend/src/pages/IssuesPage.jsx
 * LOCATION: college-social-platform/frontend/src/pages/IssuesPage.jsx
 * PURPOSE: Production-ready issue reporting and management page
 * VERSION: 1.0.0
 * LAST MODIFIED: 2025-10-14
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Camera, AlertCircle, Clock, CheckCircle, 
  Flag, Search, Filter, ChevronDown, Paperclip, 
  Send, Edit2, Trash2, MoreVertical, Eye
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth, useUser } from '@/hooks';
import { issueApi } from '@/api/issueApi';
import { messageApi } from '@/api/messageApi';
import { getTimeAgo, validateFile } from '@/utils/helpers';
import { ISSUE_STATUS, USER_ROLES } from '@/utils/constants';

const IssuesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users } = useUser();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Load issues
  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await issueApi.getAllIssues();
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  // Filter and sort issues
  const filteredAndSortedIssues = issues
    .filter(issue => {
      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
      const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           issue.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  const getStatusConfig = (status) => {
    const configs = {
      [ISSUE_STATUS.OPEN]: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: AlertCircle,
        label: 'Open'
      },
      [ISSUE_STATUS.IN_PROGRESS]: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: Clock,
        label: 'In Progress'
      },
      [ISSUE_STATUS.RESOLVED]: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: CheckCircle,
        label: 'Resolved'
      }
    };
    return configs[status] || configs[ISSUE_STATUS.OPEN];
  };

  // Create Issue Modal
  const CreateIssueModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      assignedTo: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [cursorPosition, setCursorPosition] = useState(0);
    const fileInputRef = useRef(null);
    const assignInputRef = useRef(null);

    const validateForm = () => {
      const newErrors = {};
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!selectedUser) newErrors.assignedTo = 'Please mention and assign someone';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Filter non-student users for mentions
    const eligibleUsers = users.filter(u => u.role !== USER_ROLES.STUDENT);

    // Handle mention input
    const handleMentionInput = (e) => {
      const value = e.target.value;
      setMentionQuery(value);
      setCursorPosition(e.target.selectionStart);

      // Only show dropdown if no user is selected yet
      if (!selectedUser) {
        // Check if user is typing @ for mention
        if (value.includes('@')) {
          const lastAtIndex = value.lastIndexOf('@');
          const searchTerm = value.slice(lastAtIndex + 1).toLowerCase();
          
          if (searchTerm.length >= 0) {
            setShowMentionDropdown(true);
          }
        } else {
          setShowMentionDropdown(false);
        }
      }
    };

    // Select user from mention dropdown
    const selectMentionUser = (user) => {
      setMentionQuery(`@${user.name}`);
      setSelectedUser(user);
      setFormData({ ...formData, assignedTo: user._id });
      setShowMentionDropdown(false);
      setErrors({ ...errors, assignedTo: '' });
      
      // Focus back on input
      setTimeout(() => assignInputRef.current?.focus(), 0);
    };

    // Clear selected user
    const clearSelectedUser = () => {
      setSelectedUser(null);
      setMentionQuery('');
      setFormData({ ...formData, assignedTo: '' });
      setShowMentionDropdown(false);
      setTimeout(() => assignInputRef.current?.focus(), 0);
    };

    // Filter users based on search
    const filteredMentionUsers = eligibleUsers.filter(u => {
      if (!mentionQuery.includes('@') || selectedUser) return false;
      const lastAtIndex = mentionQuery.lastIndexOf('@');
      const searchTerm = mentionQuery.slice(lastAtIndex + 1).toLowerCase();
      return u.name.toLowerCase().includes(searchTerm) || u.role.toLowerCase().includes(searchTerm);
    });

    // Send direct message to assigned person with issue details
    const sendAssignmentMessage = async (userId, issue) => {
      try {
        // Create a formatted message with issue details
        const message = `📋 *New Issue Assigned to You*\n\n` +
                       `*Title:* ${issue.title}\n\n` +
                       `*Description:*\n${issue.description}\n\n` +
                       `*Status:* ${ISSUE_STATUS.OPEN}\n` +
                       `*Reported by:* ${user?.name}\n` +
                       `*Date:* ${new Date().toLocaleDateString('en-US', { 
                         year: 'numeric', 
                         month: 'long', 
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit'
                       })}\n\n` +
                       `Please review this issue and take necessary action. Check the Issues page for more details and to update the status.`;
        
        await messageApi.sendMessage(userId, message);
      } catch (error) {
        console.error('Failed to send assignment notification:', error);
        // Don't block issue creation if message fails
      }
    };

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      const validFiles = [];
      const urls = [];

      files.forEach(file => {
        const validation = validateFile(file);
        if (validation.valid && selectedFiles.length + validFiles.length < 5) {
          validFiles.push(file);
          urls.push(URL.createObjectURL(file));
        } else if (!validation.valid) {
          alert(validation.error);
        }
      });

      setSelectedFiles([...selectedFiles, ...validFiles]);
      setPreviewUrls([...previewUrls, ...urls]);
    };

    const removeFile = (index) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      const newUrls = previewUrls.filter((_, i) => i !== index);
      URL.revokeObjectURL(previewUrls[index]);
      setSelectedFiles(newFiles);
      setPreviewUrls(newUrls);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      try {
        setSubmitting(true);
        
        // Create the issue
        const createdIssue = await issueApi.createIssue(
          formData.title,
          formData.description,
          formData.assignedTo,
          selectedFiles
        );
        
        // Send direct message to assigned person with full issue details
        if (selectedUser) {
          const issueData = {
            title: formData.title,
            description: formData.description,
            attachments: selectedFiles.length
          };
          await sendAssignmentMessage(selectedUser._id, issueData);
        }
        
        await loadIssues();
        onClose();
        
        // Success notification
        alert('✅ Issue created successfully! The assigned person has received the full issue details in their messages.');
      } catch (error) {
        alert('Failed to create issue. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Report an Issue</h2>
              <p className="text-sm text-slate-500 mt-0.5">Help us improve the campus experience</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Broken water fountain in Building A"
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                  errors.title 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about the issue, location, and any other relevant details..."
                rows="5"
                className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all resize-none ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Assign To <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={assignInputRef}
                  type="text"
                  value={mentionQuery}
                  onChange={handleMentionInput}
                  onFocus={() => {
                    if (mentionQuery.includes('@') && !selectedUser) {
                      setShowMentionDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowMentionDropdown(false), 200);
                  }}
                  disabled={!!selectedUser}
                  placeholder={selectedUser ? '' : "Type @ to mention someone (e.g., @John)"}
                  className={`w-full px-4 py-2.5 border rounded-lg outline-none transition-all ${
                    selectedUser ? 'bg-slate-50 cursor-not-allowed' : ''
                  } ${
                    errors.assignedTo 
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                      : 'border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                
                {/* Selected User Badge - Inside Input */}
                {selectedUser && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full px-3 py-1.5 shadow-md">
                    <img 
                      src={selectedUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                      alt={selectedUser.name}
                      className="w-5 h-5 rounded-full ring-2 ring-white"
                    />
                    <span className="text-sm font-semibold">{selectedUser.name}</span>
                    <span className="text-xs opacity-90">• {selectedUser.role}</span>
                    <button
                      type="button"
                      onClick={clearSelectedUser}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Mention Dropdown - Enhanced Design */}
                {showMentionDropdown && filteredMentionUsers.length > 0 && !selectedUser && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-80 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Dropdown Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        👥 Available People ({filteredMentionUsers.length})
                      </p>
                    </div>
                    
                    {/* User List */}
                    <div className="overflow-y-auto max-h-64 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      {filteredMentionUsers.map((user, index) => {
                        const getRoleIcon = (role) => {
                          const icons = {
                            [USER_ROLES.VIP]: '👑',
                            [USER_ROLES.STAFF]: '👔',
                            [USER_ROLES.FACULTY]: '🎓',
                            [USER_ROLES.ADMIN]: '⚙️',
                            [USER_ROLES.ALUMNI]: '🎖️'
                          };
                          return icons[role] || '👤';
                        };

                        const getRoleColors = (role) => {
                          const colors = {
                            [USER_ROLES.VIP]: {
                              bg: 'bg-purple-100',
                              text: 'text-purple-700',
                              border: 'border-purple-200',
                              hover: 'hover:bg-purple-50'
                            },
                            [USER_ROLES.STAFF]: {
                              bg: 'bg-blue-100',
                              text: 'text-blue-700',
                              border: 'border-blue-200',
                              hover: 'hover:bg-blue-50'
                            },
                            [USER_ROLES.FACULTY]: {
                              bg: 'bg-green-100',
                              text: 'text-green-700',
                              border: 'border-green-200',
                              hover: 'hover:bg-green-50'
                            },
                            [USER_ROLES.ADMIN]: {
                              bg: 'bg-red-100',
                              text: 'text-red-700',
                              border: 'border-red-200',
                              hover: 'hover:bg-red-50'
                            },
                            [USER_ROLES.ALUMNI]: {
                              bg: 'bg-orange-100',
                              text: 'text-orange-700',
                              border: 'border-orange-200',
                              hover: 'hover:bg-orange-50'
                            }
                          };
                          return colors[role] || {
                            bg: 'bg-slate-100',
                            text: 'text-slate-700',
                            border: 'border-slate-200',
                            hover: 'hover:bg-slate-50'
                          };
                        };

                        const roleColors = getRoleColors(user.role);

                        return (
                          <button
                            key={user._id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectMentionUser(user);
                            }}
                            className={`w-full flex items-center gap-3 p-3 transition-all border-b border-slate-100 last:border-b-0 ${roleColors.hover} ${
                              index === 0 ? '' : ''
                            }`}
                          >
                            {/* Avatar with Status Indicator */}
                            <div className="relative">
                              <img 
                                src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                                alt={user.name}
                                className="w-11 h-11 rounded-full ring-2 ring-slate-200"
                              />
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <span className="text-xs">{getRoleIcon(user.role)}</span>
                              </div>
                            </div>
                            
                            {/* User Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 truncate">
                                  {user.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${roleColors.bg} ${roleColors.text} ${roleColors.border}`}>
                                  {user.role}
                                </span>
                                {user.department && (
                                  <span className="text-xs text-slate-500 truncate">
                                    {user.department}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Select Indicator */}
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-400">
                                  <path d="M12 4L6 10L4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="bg-slate-50 px-4 py-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500 text-center">
                        💬 Message will be sent automatically
                      </p>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {showMentionDropdown && filteredMentionUsers.length === 0 && mentionQuery.includes('@') && !selectedUser && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-6 text-center animate-in fade-in duration-200">
                    <div className="text-slate-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-1">No users found</p>
                    <p className="text-xs text-slate-500">Try searching with a different name or role</p>
                  </div>
                )}
              </div>
              
              {errors.assignedTo && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.assignedTo}
              </p>}
              
              {/* Info Box */}
              {!selectedUser && (
                <div className="mt-2 flex items-start gap-2.5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-600 mt-0.5 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 11V8M8 5H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900 mb-1.5">How to mention & assign:</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                        <span>Type <span className="font-bold bg-blue-100 px-1 rounded">@</span> to see available people</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                        <span>Search by name or role</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-blue-600 rounded-full"></span>
                        <span>Click to select → A message will be sent automatically 💬</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Success Message when user selected */}
              {selectedUser && (
                <div className="mt-2 flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    <span className="font-semibold">{selectedUser.name}</span> will receive the complete issue details (title, description, attachments) in their direct messages
                  </p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Attachments <span className="text-slate-500 text-xs">(Optional, max 5)</span>
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {previewUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-slate-600"
                >
                  <Paperclip size={18} />
                  <span className="font-medium">Add Photos ({selectedFiles.length}/5)</span>
                </button>
              )}

              {previewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="w-full h-28 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Issue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Issue Detail Modal
  const IssueDetailModal = ({ issue, onClose }) => {
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showActions, setShowActions] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
      try {
        setUpdatingStatus(true);
        await issueApi.updateIssueStatus(issue._id, newStatus);
        await loadIssues();
        setSelectedIssue({ ...issue, status: newStatus });
      } catch (error) {
        alert('Failed to update status');
      } finally {
        setUpdatingStatus(false);
      }
    };

    const canUpdateStatus = user?.role === USER_ROLES.VIP || user?.role === USER_ROLES.STAFF;
    const statusConfig = getStatusConfig(issue.status);
    const StatusIcon = statusConfig.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{issue.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {canUpdateStatus && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowActions(!showActions)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={20} className="text-slate-500" />
                    </button>
                    {showActions && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[150px] z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <Edit2 size={14} />
                          Edit Issue
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 size={14} />
                          Delete Issue
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Reporter Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <img 
                src={issue.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                alt={issue.userId?.name} 
                className="w-12 h-12 rounded-full ring-2 ring-white"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{issue.userId?.name}</p>
                <p className="text-sm text-slate-500">
                  Reported {getTimeAgo(issue.createdAt)} • {issue.userId?.role}
                </p>
              </div>
            </div>

            {/* Status Update */}
            {canUpdateStatus && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Update Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(ISSUE_STATUS).map((status) => {
                    const config = getStatusConfig(status);
                    const Icon = config.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={updatingStatus || issue.status === status}
                        className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                          issue.status === status
                            ? `${config.bg} ${config.text} ${config.border}`
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon size={16} />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <div className="p-4 bg-slate-50 rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed">
                {issue.description}
              </div>
            </div>

            {/* Assigned To */}
            {issue.assignedTo && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned To</label>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <img 
                    src={issue.assignedTo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                    alt={issue.assignedTo.name} 
                    className="w-10 h-10 rounded-full ring-2 ring-white"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{issue.assignedTo.name}</p>
                    <p className="text-sm text-slate-600">{issue.assignedTo.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {issue.media && issue.media.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attachments ({issue.media.length})
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {issue.media.map((m, i) => (
                    <div key={i} className="relative group">
                      <img 
                        src={m.url} 
                        alt={`Attachment ${i + 1}`} 
                        className="w-full h-48 object-cover rounded-xl border border-slate-200"
                      />
                      <button className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-xl transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye size={24} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Issue Reports</h1>
              <p className="text-slate-600 mt-1">Track and manage campus issues</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Plus size={18} />
              <span>Report Issue</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search issues..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto">
              {['all', ...Object.values(ISSUE_STATUS)].map((status) => {
                const count = status === 'all' 
                  ? issues.length 
                  : issues.filter(i => i.status === status).length;
                
                return (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    <span className="ml-1.5 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-4 pr-10 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none bg-white font-medium text-sm text-slate-700"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Issues Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAndSortedIssues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Flag size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No issues found</h3>
            <p className="text-slate-500">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : filterStatus === 'all'
                  ? 'Be the first to report an issue'
                  : `No ${filterStatus.toLowerCase().replace('_', ' ')} issues`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredAndSortedIssues.map((issue) => {
              const statusConfig = getStatusConfig(issue.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={issue._id}
                  onClick={() => setSelectedIssue(issue)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="p-5">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-slate-500">{getTimeAgo(issue.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {issue.title}
                    </h3>

                    {/* Description Preview */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {issue.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <img 
                          src={issue.userId?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                          alt={issue.userId?.name} 
                          className="w-7 h-7 rounded-full ring-2 ring-slate-100"
                        />
                        <span className="text-sm font-medium text-slate-700">{issue.userId?.name}</span>
                      </div>
                      {issue.media && issue.media.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Paperclip size={14} />
                          <span>{issue.media.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && <CreateIssueModal onClose={() => setShowCreateModal(false)} />}
      {selectedIssue && <IssueDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}
    </div>
  );
};

export default IssuesPage;