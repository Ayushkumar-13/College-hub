/*
 * FILE: frontend/src/pages/ContactsPage.jsx
 * LOCATION: college-social-platform/frontend/src/pages/ContactsPage.jsx
 * PURPOSE: Contacts/Users directory page - FULLY CONNECTED TO BACKEND
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, MessageSquare, Flag, Users, Bell, LogOut, 
  Search, Mail, Phone, Briefcase, UserPlus, UserCheck,
  Filter, X
} from 'lucide-react';
import { useAuth, useUser, useNotification, useMessage } from '@/hooks';
import { USER_ROLES } from '@/utils/constants';

const ContactsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { users, loading, followedUsers, followUser } = useUser();
  const { unreadCount } = useNotification();
  const { selectChat } = useMessage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMessageClick = (contactUser) => {
    selectChat(contactUser);
    navigate('/messages');
  };

  const handleFollowClick = async (userId) => {
    await followUser(userId);
  };

  // Filter users
  const filteredUsers = users
    .filter(u => u._id !== user?.id)
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === 'all' || u.role === selectedRole;
      return matchesSearch && matchesRole;
    });

  // Group users by role
  const groupedUsers = {
    [USER_ROLES.VIP]: filteredUsers.filter(u => u.role === USER_ROLES.VIP),
    [USER_ROLES.FACULTY]: filteredUsers.filter(u => u.role === USER_ROLES.FACULTY),
    [USER_ROLES.STAFF]: filteredUsers.filter(u => u.role === USER_ROLES.STAFF),
    [USER_ROLES.STUDENT]: filteredUsers.filter(u => u.role === USER_ROLES.STUDENT)
  };

  // Profile Modal Component
  const ProfileModal = ({ user: modalUser, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="relative h-40 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="px-8 pb-8">
          <div className="flex items-start -mt-20 mb-6">
            <img
              src={modalUser.avatar}
              alt={modalUser.name}
              className="w-36 h-36 rounded-3xl border-4 border-white bg-white shadow-xl"
            />
            <div className="ml-6 mt-20">
              <h2 className="text-3xl font-bold text-gray-900">{modalUser.name}</h2>
              <p className="text-gray-600 font-medium">{modalUser.role} • {modalUser.department}</p>
            </div>
          </div>
          
          <div className="flex gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{modalUser.followers?.length || 0}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">{modalUser.following?.length || 0}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
          </div>
          
          <div className="space-y-5">
            <p className="text-gray-700 text-lg">{modalUser.bio}</p>
            
            <div className="grid grid-cols-1 gap-4 bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <Mail className="text-primary-600" size={24} />
                <span className="font-semibold text-gray-700">Email:</span>
                <a href={`mailto:${modalUser.email}`} className="text-primary-600 hover:underline font-medium">
                  {modalUser.email}
                </a>
              </div>
              
              {modalUser.phone && (
                <div className="flex items-center gap-4">
                  <Phone className="text-green-600" size={24} />
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <a href={`tel:${modalUser.phone}`} className="text-primary-600 hover:underline font-medium">
                    {modalUser.phone}
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Briefcase className="text-secondary-600" size={24} />
                <span className="font-semibold text-gray-700">Department:</span>
                <span className="font-medium">{modalUser.department}</span>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => {
                  handleMessageClick(modalUser);
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-secondary-600 font-semibold shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={20} />
                Message
              </button>
              <button 
                onClick={() => handleFollowClick(modalUser._id)}
                className={`px-8 py-3 rounded-xl font-semibold transform hover:scale-[1.02] transition-all ${
                  followedUsers[modalUser._id]
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gradient-to-r from-accent-100 to-secondary-100 text-secondary-600 hover:from-accent-200 hover:to-secondary-200'
                }`}
              >
                {followedUsers[modalUser._id] ? 'Unfollow' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
              title="Logout"
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
            <Link
              to="/"
              className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium"
            >
              <Home size={20} />
              <span>Feed</span>
            </Link>
            <Link
              to="/messages"
              className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium"
            >
              <MessageSquare size={20} />
              <span>Messages</span>
            </Link>
            <Link
              to="/issues"
              className="flex items-center gap-2 px-5 py-4 border-b-4 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all font-medium"
            >
              <Flag size={20} />
              <span>Issues</span>
            </Link>
            <Link
              to="/contacts"
              className="flex items-center gap-2 px-5 py-4 border-b-4 border-primary-500 text-primary-600 font-medium"
            >
              <Users size={20} />
              <span>Contacts</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold gradient-text">Contacts Directory</h2>
          <p className="text-gray-600 mt-1">Connect with students, faculty, and staff</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-colors appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value={USER_ROLES.VIP}>{USER_ROLES.VIP}</option>
                <option value={USER_ROLES.FACULTY}>{USER_ROLES.FACULTY}</option>
                <option value={USER_ROLES.STAFF}>{USER_ROLES.STAFF}</option>
                <option value={USER_ROLES.STUDENT}>{USER_ROLES.STUDENT}</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-gray-600 mt-4">
            Found <span className="font-bold text-primary-600">{filteredUsers.length}</span> contacts
          </p>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <Users size={80} className="mx-auto mb-6 text-gray-300" />
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No contacts found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Group by Role */}
            {Object.entries(groupedUsers).map(([role, roleUsers]) => {
              if (roleUsers.length === 0) return null;
              
              return (
                <div key={role}>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      role === USER_ROLES.VIP ? 'bg-purple-100 text-purple-800' :
                      role === USER_ROLES.FACULTY ? 'bg-blue-100 text-blue-800' :
                      role === USER_ROLES.STAFF ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {role}
                    </span>
                    <span className="text-gray-500">({roleUsers.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {roleUsers.map(contact => (
                      <div 
                        key={contact._id} 
                        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-[1.02] cursor-pointer"
                        onClick={() => setSelectedUser(contact)}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <img 
                            src={contact.avatar} 
                            alt={contact.name} 
                            className="w-16 h-16 rounded-2xl ring-2 ring-secondary-100" 
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-800 truncate">{contact.name}</h3>
                            <p className="text-sm text-gray-600 font-medium">{contact.role}</p>
                            <p className="text-sm text-gray-500 truncate">{contact.department}</p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                            <Mail size={16} className="flex-shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={16} className="flex-shrink-0" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(contact);
                            }}
                            className="flex-1 border-2 border-gray-200 px-4 py-2 rounded-xl hover:border-primary-300 hover:bg-primary-50 text-sm font-medium transition-all"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageClick(contact);
                            }}
                            className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-xl hover:from-primary-600 hover:to-secondary-600 text-sm font-medium shadow-lg transform hover:scale-[1.02] transition-all"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Profile Modal */}
      {selectedUser && (
        <ProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
};

export default ContactsPage;