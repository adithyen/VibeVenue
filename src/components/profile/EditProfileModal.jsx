// EditProfileModal — Interactive Profile Editor for Organizers & Student Participants
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import useUIStore from '../../store/useUIStore';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import './EditProfileModal.css';

const EditProfileModal = ({ open, onClose }) => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useUIStore();
  const [isSaving, setIsSaving] = useState(false);

  const isParticipant = user?.role === 'participant';

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    studentId: user?.studentId || user?.rollNumber || '',
    year: user?.year || '1st Year',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const fileInputRef = React.useRef(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (user && open) {
      setFormData({
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
  }, [user, open]);

  if (!open || !user) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setAvatarPreview(b64);
      setFormData(p => ({ ...p, avatar: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({ type: 'warning', title: 'Validation Error', message: 'Name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        studentId: formData.studentId.trim(),
        rollNumber: formData.studentId.trim(),
        year: formData.year,
        department: formData.department.trim(),
        avatar: formData.avatar,
      });

      if (success) {
        addToast({ type: 'success', title: 'Profile Updated', message: 'Your details have been saved successfully.' });
        onClose();
      } else {
        addToast({ type: 'error', title: 'Update Failed', message: 'Could not update profile. Please try again.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err?.message || 'Something went wrong.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="edit-profile-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="edit-profile-modal craft-card"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="edit-profile-header">
            <div>
              <h3 className="edit-profile-title">Edit Profile Information</h3>
              <p className="edit-profile-sub">Update your personal details & preferences</p>
            </div>
            <button className="edit-profile-close" onClick={onClose} aria-label="Close modal" type="button">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="edit-profile-form">
            {/* Avatar section */}
            <div className="edit-profile-avatar-row">
              <div className="edit-profile-avatar-box">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={formData.name} className="edit-avatar-img" />
                ) : (
                  <Avatar name={formData.name || user.name} initials={user.initials} size="xl" />
                )}
                <button
                  type="button"
                  className="edit-avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                >
                  📷
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              <div className="edit-avatar-meta">
                <span className="edit-avatar-label">Profile Photo</span>
                <span className="edit-avatar-hint">JPG, PNG or WEBP. Max 2MB.</span>
                {avatarPreview && (
                  <button
                    type="button"
                    className="edit-avatar-remove-btn font-mono"
                    onClick={() => { setAvatarPreview(null); setFormData(p => ({ ...p, avatar: '' })); }}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Fields Grid */}
            <div className="edit-profile-grid">
              <div className="form-field-group">
                <label className="craft-label">Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
                <input
                  type="text"
                  className="craft-input"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="craft-input font-mono"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">Phone Number</label>
                <input
                  type="tel"
                  className="craft-input font-mono"
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="form-field-group">
                <label className="craft-label">College / Institution</label>
                <input
                  type="text"
                  className="craft-input"
                  value={formData.college}
                  onChange={e => setFormData(p => ({ ...p, college: e.target.value }))}
                  placeholder="e.g. SCT College of Engineering"
                />
              </div>

              {isParticipant ? (
                <>
                  <div className="form-field-group">
                    <label className="craft-label">Roll Number / Student ID</label>
                    <input
                      type="text"
                      className="craft-input font-mono"
                      value={formData.studentId}
                      onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))}
                      placeholder="e.g. 21CS001"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="craft-label">Year of Study</label>
                    <select
                      className="craft-input"
                      value={formData.year}
                      onChange={e => setFormData(p => ({ ...p, year: e.target.value }))}
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
                    value={formData.studentId}
                    onChange={e => setFormData(p => ({ ...p, studentId: e.target.value }))}
                    placeholder="e.g. Lead Organizer, Faculty Coordinator"
                  />
                </div>
              )}

              <div className="form-field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="craft-label">Department / Branch</label>
                <input
                  type="text"
                  className="craft-input"
                  value={formData.department}
                  onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                  placeholder="e.g. Computer Science & Engineering"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="edit-profile-actions">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
