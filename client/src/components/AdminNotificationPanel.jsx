import { useState, useEffect, useRef } from 'react';
import { adminNotificationAPI } from '../../services/api';
import { useAuth } from '../contexts/useAuth';

const AdminNotificationPanel = () => {
  const { user: _user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUserObjects, setSelectedUserObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendToAllStaff, setSendToAllStaff] = useState(true);
  const [success, setSuccess] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!sendToAllStaff) {
      loadUsers();
    }
  }, [sendToAllStaff]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminNotificationAPI.getUsers();
      if (response.success) {
        setUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!subject || !message) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung');
      return;
    }

    // Only validate selectedUsers if sending to specific users (not all staff)
    if (sendToAllStaff === false) {
      if (!selectedUsers || selectedUsers.length === 0) {
        alert('Vui lòng chọn ít nhất một người nhận');
        return;
      }
    }

    setLoading(true);
    setSuccess(false);

    try {
      let response;
      if (sendToAllStaff) {
        response = await adminNotificationAPI.sendToStaff({
          subject,
          message
        });
      } else {
        response = await adminNotificationAPI.sendToUsers({
          userIds: selectedUsers,
          subject,
          message
        });
      }

      if (response.success) {
        setSuccess(true);
        setSubject('');
        setMessage('');
        setSelectedUsers([]);
        setSelectedUserObjects([]);
        setSearchTerm('');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Gửi thông báo thất bại: ' + response.message);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Lỗi khi gửi thông báo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (userObj) => {
    if (!selectedUsers.includes(userObj.id)) {
      setSelectedUsers(prev => [...prev, userObj.id]);
      setSelectedUserObjects(prev => [...prev, userObj]);
      setSearchTerm('');
      setShowDropdown(false);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
    setSelectedUserObjects(prev => prev.filter(u => u.id !== userId));
  };

  // Filter users based on search term
  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullname = (u.fullname || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const id = (u.id || '').toLowerCase();
    return fullname.includes(search) || email.includes(search) || id.includes(search);
  }).filter(u => !selectedUsers.includes(u.id)); // Exclude already selected users

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: '20px' }}>📧 Gửi Thông Báo Cho Nhân Viên</h2>

      {success && (
        <div style={{
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          ✅ Thông báo đã được gửi thành công!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Send to all staff or specific users */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}
            onClick={() => setSendToAllStaff(true)}
          >
            <input
              type="radio"
              name="sendToOption"
              checked={sendToAllStaff === true}
              onChange={() => setSendToAllStaff(true)}
            />
            <span>Gửi cho tất cả nhân viên (Staff)</span>
          </label>
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => setSendToAllStaff(false)}
          >
            <input
              type="radio"
              name="sendToOption"
              checked={sendToAllStaff === false}
              onChange={() => setSendToAllStaff(false)}
            />
            <span>Gửi cho người dùng cụ thể</span>
          </label>
        </div>

        {/* User selection with search */}
        {!sendToAllStaff && (
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Chọn người nhận:
            </label>

            {/* Selected users tags */}
            {selectedUserObjects.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                {selectedUserObjects.map(user => (
                  <div
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '14px'
                    }}
                  >
                    <span>{user.fullname || user.email || user.id}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        lineHeight: '1',
                        padding: 0
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.5)'}
                      onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search input */}
            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Tìm kiếm theo tên, email hoặc ID..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
              />

              {/* Dropdown with search results */}
              {showDropdown && users.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}
                >
                  {filteredUsers.length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {searchTerm ? 'Không tìm thấy người dùng' : 'Nhập để tìm kiếm...'}
                    </div>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ fontWeight: '500', color: '#1f2937' }}>
                          {user.fullname || 'N/A'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px' }}>
                          {user.email || 'N/A'} {user.id && `• ${user.id}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
                Đã chọn: {selectedUsers.length} người
              </div>
            )}
          </div>
        )}

        {/* Subject */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Tiêu đề:
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Nhập tiêu đề thông báo"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Message */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Nội dung:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập nội dung thông báo"
            required
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%'
          }}
        >
          {loading ? 'Đang gửi...' : '📧 Gửi Thông Báo'}
        </button>
      </form>
    </div>
  );
};

export default AdminNotificationPanel;
