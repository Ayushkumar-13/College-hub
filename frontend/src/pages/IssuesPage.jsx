/*
 * FILE: frontend/src/pages/IssuesPage.jsx
 * LOCATION: college-social-platform/frontend/src/pages/IssuesPage.jsx
 * PURPOSE: Issue reporting and management page - FULLY CONNECTED TO BACKEND
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, MessageSquare, Flag, Users, Bell, LogOut, 
  Plus, X, Camera, AlertCircle, Clock, CheckCircle
} from 'lucide-react';
import { useAuth, useUser, useNotification } from '@/hooks';
import { issueApi } from '@/api/issueApi';
import { getTimeAgo, validateFile } from '@/utils/helpers';
import { ISSUE_STATUS, USER_ROLES } from '@/utils/constants';

const IssuesPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { users } = useUser();
  const { unreadCount } = useNotification();
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    if (filterStatus === 'all') return true;
    return issue.status === filterStatus;
  });

  // Create Issue Modal Component
  const CreateIssueModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      assignedTo: ''
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

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

    const handleSubmit = async () => {
      if (!formData.title || !formData.description || !formData.assignedTo) {
        alert('Please fill all required fields');
        return;
      }

      try {
        setSubmitting(true);
        await issueApi.createIssue(
          formData.title,
          formData.description,
          formData.assignedTo,
          selectedFiles
        );
        await loadIssues();
        onClose();
        alert('Issue reported successfully!');
      } catch (error) {
        alert('Failed to create issue. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold gradient-text">Report an Issue</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the issue"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information about the issue..."
                rows="5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assign To *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Select person...</option>
                {users
                  .filter(u => u.role === USER_ROLES.VIP || u.role === USER_ROLES.STAFF)
                  .map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 transition-colors flex items-center justify-center gap-2 text-gray-600"
              >
                <Camera size={20} />
                <span>Add Photos</span>
              </button>

              {previewUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt="" className="w-full h-24 object-cover rounded-xl" />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl hover:from-primary-600 hover:to-secondary-600 font-semibold shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Issue Detail Modal Component
  const IssueDetailModal = ({ issue, onClose }) => {
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
      try {
        setUpdatingStatus(true);
        await issueApi.updateIssueStatus(issue._id, newStatus);
        await loadIssues();
        alert('Issue status updated!');
        onClose();
      } catch (error) {
        alert('Failed to update status');
      } finally {
        setUpdatingStatus(false);
      }
    };

    const canUpdateStatus = user?.role === USER_ROLES.VIP || user?.role === USER_ROLES.STAFF;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">{issue.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Reporter Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <img src={issue.userId?.avatar} alt="" className="w-12 h-12 rounded-full" />
              <div>
                <p className="font-semibold text-gray-900">{issue.userId?.name}</p>
                <p className="text-sm text-gray-500">
                  Reported {getTimeAgo(issue.createdAt)} • {issue.userId?.role}
                </p>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              {canUpdateStatus ? (
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updatingStatus}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors"
                >
                  <option value={ISSUE_STATUS.OPEN}>{ISSUE_STATUS.OPEN}</option>
                  <option value={ISSUE_STATUS.IN_PROGRESS}>{ISSUE_STATUS.IN_PROGRESS}</option>
                  <option value={ISSUE_STATUS.RESOLVED}>{ISSUE_STATUS.RESOLVED}</option>
                </select>
              ) : (
                <span className={`inline-block px-4 py-2 rounded-xl text-sm font-semibold ${
                  issue.status === ISSUE_STATUS.OPEN ? 'bg-yellow-100 text-yellow-800' :
                  issue.status === ISSUE_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {issue.status}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <div className="p-4 bg-gray-50 rounded-xl text-gray-700 whitespace-pre-wrap">
                {issue.description}
              </div>
            </div>

            {/* Assigned To */}
            {issue.assignedTo && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl">
                  <img src={issue.assignedTo.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-900">{issue.assignedTo.name}</p>
                    <p className="text-sm text-gray-500">{issue.assignedTo.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {issue.media && issue.media.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments</label>
                <div className="grid grid-cols-2 gap-3">
                  {issue.media.map((m, i) => (
                    <img key={i} src={m.url} alt="" className="w-full h-48 object-cover rounded-xl" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40 border-b-2 border-primary-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              CS
            </div>
            <h1 className="text-2xl font-bold gradient-text">College Social</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative p-3 hover:bg-primary-50 rounded-xl transition-colors"
            >
              <Bell size={24} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleLogout}
              className="p-3 hover:bg-red-50 rounded-xl text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={24} />
            </button>
            <img 
              src={user?.avatar} 
              alt={user?.name} 
              className="w-12 h-12 rounded-xl cursor-pointer ring-2 ring-primary-100 hover:ring-primary-300 transition-all"
            />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-primary-100 sticky top-[73px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto">
            <Link to="/" className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium">
              <Home size={20} />
              <span>Feed</span>
            </Link>
            <Link to="/messages" className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium">
              <MessageSquare size={20} />
              <span>Messages</span>
            </Link>
            <Link to="/issues" className="flex items-center gap-2 px-5 py-4 border-b-4 border-primary-500 text-primary-600 font-medium">
              <Flag size={20} />
              <span>Issues</span>
            </Link>
            <Link to="/contacts" className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium">
              <Users size={20} />
              <span>Contacts</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Issue Reports</h2>
            <p className="text-gray-600 mt-1">Report and track campus issues</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 font-semibold shadow-lg transform hover:scale-[1.02] transition-all"
          >
            <Plus size={20} />
            Report Issue
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {['all', ISSUE_STATUS.OPEN, ISSUE_STATUS.IN_PROGRESS, ISSUE_STATUS.RESOLVED].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-5 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All Issues' : status} 
                <span className="ml-2 text-sm">
                  ({status === 'all' ? issues.length : issues.filter(i => i.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Issues Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <Flag size={80} className="mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No issues found</h3>
            <p className="text-gray-500">
              {filterStatus === 'all' 
                ? 'Be the first to report an issue' 
                : `No ${filterStatus.toLowerCase()} issues`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredIssues.map(issue => (
              <div
                key={issue._id}
                onClick={() => setSelectedIssue(issue)}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02]"
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 ${
                    issue.status === ISSUE_STATUS.OPEN ? 'bg-yellow-100 text-yellow-800' :
                    issue.status === ISSUE_STATUS.IN_PROGRESS ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {issue.status === ISSUE_STATUS.OPEN && <AlertCircle size={16} />}
                    {issue.status === ISSUE_STATUS.IN_PROGRESS && <Clock size={16} />}
                    {issue.status === ISSUE_STATUS.RESOLVED && <CheckCircle size={16} />}
                    {issue.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-xl text-gray-900 mb-2">{issue.title}</h3>

                {/* Description Preview */}
                <p className="text-gray-600 mb-4 line-clamp-2">{issue.description}</p>

                {/* Reporter Info */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <img src={issue.userId?.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{issue.userId?.name}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(issue.createdAt)}</p>
                  </div>
                </div>

                {/* Attachments Count */}
                {issue.media && issue.media.length > 0 && (
                  <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                    <Camera size={16} />
                    <span>{issue.media.length} attachment{issue.media.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            ))}
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