// VibeVenue — Settings Page with Profile Editing & Theme Control
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/useAuthStore';
import useUIStore from '../store/useUIStore';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import './SettingsPage.css';

const THEME_OPTIONS = [
  {
    id: 'light',
    label: 'Light',
    desc: 'Clean & bright. Great for daylight use.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
  {
    id: 'dark',
    label: 'Dark',
    desc: 'Easy on the eyes at night.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useUIStore();
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useUIStore();

  const isParticipant = user?.role === 'participant';

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    studentId: user?.studentId || user?.rollNumber || '',
    year: user?.year || '1st Year',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        college: user.college || '',
        studentId: user.studentId || user.rollNumber || '',
        year: user.year || '1st Year',
        department: user.department || '',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setAvatarPreview(b64);
      setProfileForm(p => ({ ...p, avatar: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      addToast({ type: 'warning', title: 'Validation', message: 'Name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        college: profileForm.college.trim(),
        studentId: profileForm.studentId.trim(),
        rollNumber: profileForm.studentId.trim(),
        year: profileForm.year,
        department: profileForm.department.trim(),
        avatar: profileForm.avatar,
      });

      if (success) {
        addToast({ type: 'success', title: 'Profile Updated', message: 'Changes saved successfully.' });
      } else {
        addToast({ type: 'error', title: 'Save Failed', message: 'Could not update profile.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err?.message || 'Something went wrong.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-view">
      <div className="page-header">
        <div className="page-title-group">
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your profile details and preferences</p>
        </div>
      </div>

      <div className="settings-sections">
        {/* Profile & Account Details */}
        <motion.section
          className="settings-section craft-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h3 className="settings-section-title">Profile & Account Information</h3>
              <p className="settings-section-sub">Update your personal and organizational credentials</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-profile-form">
            {/* Avatar Row */}
            <div className="settings-avatar-row">
              <div className="settings-avatar-box">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={profileForm.name} className="settings-avatar-img" />
                ) : (
                  <Avatar name={profileForm.name || user?.name} initials={user?.initials} size="xl" />
                )}
                <button
                  type="button"
                  className="settings-avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload avatar"
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="settings-avatar-info">
                <span className="settings-avatar-name">{profileForm.name || 'User Profile'}</span>
                <span className="settings-avatar-role font-mono">{user?.role?.toUpperCase() || 'MEMBER'}</span>
                {avatarPreview && (
                  <button
                    type="button"
                    className="settings-avatar-remove font-mono"
                    onClick={() => { setAvatarPreview(null); setProfileForm(p => ({ ...p, avatar: '' })); }}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="settings-form-grid">
              <div className="form-field-group">
                <label className="craft-label">Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="text"
                  className="craft-input"
                  value={profileForm.name}
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="craft-input font-mono"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Phone Number</label>
                <input
                  type="tel"
                  className="craft-input font-mono"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">College / Institution</label>
                <input
                  type="text"
                  className="craft-input"
                  value={profileForm.college}
                  onChange={e => setProfileForm(p => ({ ...p, college: e.target.value }))}
                  placeholder="College or Organization"
                />
              </div>

              {isParticipant ? (
                <>
                  <div className="form-field-group">
                    <label className="craft-label">Roll Number / Student ID</label>
                    <input
                      type="text"
                      className="craft-input font-mono"
                      value={profileForm.studentId}
                      onChange={e => setProfileForm(p => ({ ...p, studentId: e.target.value }))}
                      placeholder="e.g. 21CS001"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="craft-label">Year of Study</label>
                    <select
                      className="craft-input"
                      value={profileForm.year}
                      onChange={e => setProfileForm(p => ({ ...p, year: e.target.value }))}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="form-field-group">
                  <label className="craft-label">Designation / Role Title</label>
                  <input
                    type="text"
                    className="craft-input"
                    value={profileForm.studentId}
                    onChange={e => setProfileForm(p => ({ ...p, studentId: e.target.value }))}
                    placeholder="e.g. Convenor, Lead Organizer"
                  />
                </div>
              )}

              <div className="form-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="craft-label">Department / Branch</label>
                <input
                  type="text"
                  className="craft-input"
                  value={profileForm.department}
                  onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>
            </div>

            <div className="settings-form-actions">
              <Button type="submit" variant="primary" loading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </motion.section>

        {/* Appearance */}
        <motion.section
          className="settings-section craft-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <div>
              <h3 className="settings-section-title">Appearance</h3>
              <p className="settings-section-sub">Choose how VibeVenue looks for you</p>
            </div>
          </div>

          <div className="theme-picker-grid">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  id={`theme-option-${opt.id}`}
                  type="button"
                  className={`theme-option ${isSelected ? 'theme-option-selected' : ''}`}
                  onClick={() => setTheme(opt.id)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <div className={`theme-preview theme-preview-${opt.id}`}>
                    <div className="theme-preview-bar" />
                    <div className="theme-preview-content">
                      <div className="theme-preview-line long" />
                      <div className="theme-preview-line short" />
                    </div>
                  </div>
                  <div className="theme-option-info">
                    <div className="theme-option-icon">{opt.icon}</div>
                    <div>
                      <span className="theme-option-label">{opt.label}</span>
                      <span className="theme-option-desc">{opt.desc}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      className="theme-option-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* About */}
        <motion.section
          className="settings-section craft-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 30 }}
        >
          <div className="settings-section-header">
            <div className="settings-section-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <h3 className="settings-section-title">About</h3>
              <p className="settings-section-sub">Platform information</p>
            </div>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">App Name</span>
            <span className="settings-about-value font-mono">VibeVenue</span>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">Version</span>
            <span className="settings-about-value font-mono">v4.0.0</span>
          </div>
          <div className="settings-about-row">
            <span className="settings-about-label">Purpose</span>
            <span className="settings-about-value">College Technical Event Management</span>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SettingsPage;
