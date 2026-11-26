import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { sendAccountDeletionOTP } from '../services/emailService';

const ProfilePage = () => {
  const { user, updateProfile, logout, deleteAccount } = useAuth();
  const { accent, setAccent, ACCENT_THEMES } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState('confirm'); // 'confirm' | 'otp'
  const [generatedDeleteOtp, setGeneratedDeleteOtp] = useState('');
  const [enteredDeleteOtp, setEnteredDeleteOtp] = useState('');
  const [deleteOtpExpiry, setDeleteOtpExpiry] = useState(0);
  const [deleteCooldown, setDeleteCooldown] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fileInputRef = useRef(null);
  const deleteOtpInputRef = useRef(null);
  const navigate = useNavigate();

  // Sync state if user loads after mount
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAge(user.age ? String(user.age) : '');
      setAvatar(user.avatar || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  // Resend cooldown timer for deletion OTP
  useEffect(() => {
    if (deleteCooldown <= 0) return;
    const interval = setInterval(() => {
      setDeleteCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [deleteCooldown]);

  // Auto focus OTP input when entering OTP step
  useEffect(() => {
    if (showDeleteModal && deleteStep === 'otp' && deleteOtpInputRef.current) {
      deleteOtpInputRef.current.focus();
    }
  }, [showDeleteModal, deleteStep]);

  // Handle image selection from PC
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size exceeds 5MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize and resize image using canvas to max 400x400
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(optimizedBase64);
        setAvatarPreview(optimizedBase64);
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAge = age ? Number(age) : null;
    if (age && (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      setError('Please provide a valid age between 1 and 120.');
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        name,
        email,
        age: parsedAge,
        avatar,
      });
      setToast({ message: 'Profile details updated successfully!', type: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Delete Account Modal Handlers
  const handleOpenDeleteModal = () => {
    setDeleteStep('confirm');
    setEnteredDeleteOtp('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleteLoading) return;
    setShowDeleteModal(false);
    setDeleteStep('confirm');
    setEnteredDeleteOtp('');
    setDeleteError('');
    setDeleteLoading(false);
  };

  const handleSendDeleteOtp = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      // Request server-generated, time-expiring OTP stored securely on User record
      const { data } = await API.post('/auth/request-delete-otp');
      const code = data.otpCode;
      setGeneratedDeleteOtp(code);
      setDeleteOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes

      await sendAccountDeletionOTP(user.email, user.name, code);

      setDeleteStep('otp');
      setDeleteCooldown(60);
      setToast({ message: `Deletion code sent to ${user.email}`, type: 'success' });
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResendDeleteOtp = async () => {
    if (deleteCooldown > 0 || deleteLoading) return;
    await handleSendDeleteOtp();
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');

    const cleanCode = enteredDeleteOtp.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setDeleteError('Please enter the full 6-digit verification code.');
      return;
    }

    if (Date.now() > deleteOtpExpiry) {
      setDeleteError('Verification code has expired. Please request a new code.');
      return;
    }

    setDeleteLoading(true);

    try {
      // Pass code to backend for server-side verification before deletion
      await deleteAccount(cleanCode);
      setShowDeleteModal(false);
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '30px auto', padding: '0 16px' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {/* Avatar with Interactive Edit Pencil Icon */}
          <div
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              margin: '0 auto 12px',
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name || 'User Profile'}
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent-primary)',
                  boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.35)',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), rgba(var(--accent-rgb), 0.4))',
                  color: '#fff',
                  fontSize: '2.2rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid rgba(var(--accent-rgb), 0.4)',
                  boxShadow: '0 4px 16px rgba(var(--accent-rgb), 0.25)',
                }}
              >
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            {/* Pencil Mark Button Overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                border: '2px solid #121824',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                transition: 'transform 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              title="Upload custom display picture"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
              onChange={handleImageSelect}
            />
          </div>

          {avatarPreview ? (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: '10px',
                textDecoration: 'underline',
              }}
            >
              Remove photo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: '10px',
                textDecoration: 'underline',
              }}
            >
              Upload custom photo
            </button>
          )}

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Account Profile</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage your personal credentials and preferences
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-control"
              min="1"
              max="120"
              placeholder="e.g. 21"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Used to filter age-appropriate movie recommendations (18+ restrictions apply under 18).
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>

        <hr style={{ borderColor: 'var(--border-color)', margin: '28px 0' }} />

        {/* Cinema Glow Accent Switcher Settings */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  boxShadow: 'var(--shadow-glow)',
                }}
              />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                Cinema Glow Accent
              </h2>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--accent-primary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Active: {ACCENT_THEMES.find((t) => t.id === accent)?.name || 'Cinema Crimson'}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.5, marginBottom: '14px' }}>
            Select your ambient neon glow theme. Buttons, glowing rings, badges, and scrollbars adapt immediately across CineVerse.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            {ACCENT_THEMES.map((theme) => {
              const isSelected = accent === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setAccent(theme.id);
                    setToast({
                      message: `Cinema Glow updated to ${theme.name}!`,
                      type: 'success',
                    });
                  }}
                  style={{
                    background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected
                      ? `2px solid ${theme.color}`
                      : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 16px rgba(${theme.rgb}, 0.35)` : 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = `rgba(${theme.rgb}, 0.45)`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: theme.color,
                      boxShadow: `0 0 12px ${theme.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#000000"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: isSelected ? theme.color : '#ffffff',
                      }}
                    >
                      {theme.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {theme.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '28px 0' }} />

        {/* Sign Out Option */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Sign Out</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Log out of CineVerse on this device
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Log Out
          </button>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '24px 0' }} />

        {/* Danger Zone: Delete Account Option */}
        <div
          style={{
            background: 'rgba(229, 9, 20, 0.05)',
            border: '1px solid rgba(229, 9, 20, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete Account
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.4 }}>
              Permanently delete your CineVerse account, watchlist, and scheduled reminders.
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenDeleteModal}
            className="btn"
            style={{
              background: '#e50914',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              fontSize: '0.88rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(229, 9, 20, 0.35)',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b80710')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#e50914')}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DELETE ACCOUNT CONFIRMATION & OTP MODAL                       */}
      {/* ============================================================ */}
      {showDeleteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 6, 12, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleteLoading) {
              handleCloseDeleteModal();
            }
          }}
        >
          <div
            style={{
              background: '#0f1522',
              border: '1px solid rgba(229, 9, 20, 0.5)',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '30px 26px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(229, 9, 20, 0.2)',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseDeleteModal}
              disabled={deleteLoading}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Cancel"
            >
              ✕
            </button>

            {/* Modal Step 1: Warning & Send OTP */}
            {deleteStep === 'confirm' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(229, 9, 20, 0.15)',
                      border: '2px solid #e50914',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      color: '#e50914',
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                    Delete CineVerse Account?
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    This action is <strong style={{ color: '#ff4d4d' }}>permanent and irreversible</strong>. All your watchlists, statuses, and reminder schedules will be deleted immediately.
                  </p>
                </div>

                {deleteError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{deleteError}</div>}

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '22px',
                    fontSize: '0.86rem',
                    color: '#cbd5e1',
                    lineHeight: 1.5,
                  }}
                >
                  To confirm it's really you, we will send a 6-digit verification code to:
                  <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '4px', wordBreak: 'break-all' }}>
                    {email || user?.email}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleCloseDeleteModal}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    className="btn btn-primary"
                    style={{ flex: 1.3, background: '#e50914', borderColor: '#e50914' }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Sending Code...' : 'Send Deletion Code'}
                  </button>
                </div>
              </>
            )}

            {/* Modal Step 2: Input OTP & Confirm Delete */}
            {deleteStep === 'otp' && (
              <form onSubmit={handleConfirmDelete}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      background: 'rgba(229, 9, 20, 0.15)',
                      border: '2px solid #e50914',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      color: '#e50914',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                    Verify Account Deletion
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                    Enter the 6-digit verification code sent to:
                  </p>
                  <div style={{ color: '#ffffff', fontWeight: 700, marginTop: '4px', fontSize: '0.9rem' }}>
                    {email || user?.email}
                  </div>
                </div>

                {deleteError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{deleteError}</div>}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <input
                    ref={deleteOtpInputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="form-control"
                    placeholder="••••••"
                    value={enteredDeleteOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEnteredDeleteOtp(val);
                      if (deleteError) setDeleteError('');
                    }}
                    style={{
                      letterSpacing: '10px',
                      fontSize: '1.8rem',
                      textAlign: 'center',
                      fontFamily: "'SFMono-Regular', Consolas, 'Courier New', monospace",
                      fontWeight: 800,
                      color: '#ffffff',
                      background: '#070a10',
                      border: '2px solid rgba(229, 9, 20, 0.6)',
                      padding: '14px',
                      borderRadius: '10px',
                    }}
                    required
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Valid for 5 minutes</span>
                    <button
                      type="button"
                      onClick={handleResendDeleteOtp}
                      disabled={deleteCooldown > 0 || deleteLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: deleteCooldown > 0 ? 'var(--text-dim)' : 'var(--accent-hover)',
                        fontSize: '0.82rem',
                        cursor: deleteCooldown > 0 ? 'default' : 'pointer',
                        padding: 0,
                        textDecoration: deleteCooldown > 0 ? 'none' : 'underline',
                      }}
                    >
                      {deleteCooldown > 0 ? `Resend code in ${deleteCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('confirm');
                      setDeleteError('');
                    }}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    disabled={deleteLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      flex: 1.5,
                      background: '#e50914',
                      color: '#ffffff',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 14px rgba(229, 9, 20, 0.4)',
                    }}
                    disabled={deleteLoading || enteredDeleteOtp.length !== 6}
                  >
                    {deleteLoading ? 'Deleting Account...' : 'Permanently Delete'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default ProfilePage;
