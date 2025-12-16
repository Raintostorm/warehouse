import { useState, useEffect } from 'react';
import { adminNotificationAPI } from '../../services/api';
import { useAuth } from '../contexts/useAuth';

const AdminNotificationPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendToAllStaff, setSendToAllStaff] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sendToAllStaff) {
      loadUsers();
    }
  }, [sendToAllStaff]);

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

    if (!sendToAllStaff && selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một người nhận');
      return;
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

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

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
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="radio"
              checked={sendToAllStaff}
              onChange={() => setSendToAllStaff(true)}
            />
            <span>Gửi cho tất cả nhân viên (Staff)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="radio"
              checked={!sendToAllStaff}
              onChange={() => setSendToAllStaff(false)}
            />
            <span>Gửi cho người dùng cụ thể</span>
          </label>
        </div>

        {/* User selection */}
        {!sendToAllStaff && (
          <div style={{
            marginBottom: '20px',
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '10px'
          }}>
            {users.map(user => (
              <label
                key={user.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  backgroundColor: selectedUsers.includes(user.id) ? '#e0f2fe' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUserSelection(user.id)}
                />
                <span>{user.fullname} ({user.email})</span>
              </label>
            ))}
            {selectedUsers.length > 0 && (
              <div style={{ marginTop: '10px', color: '#6b7280', fontSize: '14px' }}>
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
