import { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import VideoCall from './VideoCall';
import { useAuth } from '../contexts/useAuth';

const VideoCallList = ({ joinFromLink = null }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(joinFromLink);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle join from email link
  useEffect(() => {
    if (joinFromLink) {
      setSelectedUser({
        id: joinFromLink.targetUserId,
        name: joinFromLink.targetUserName || 'User',
        roomId: joinFromLink.roomId,
        fromUserId: joinFromLink.fromUserId,
        autoJoin: true
      });
    }
  }, [joinFromLink]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAllUsers();
      if (response.success) {
        // Filter out current user
        const otherUsers = (response.data || []).filter(u =>
          (u.id || u.Id) !== (user?.id || user?.Id)
        );
        setUsers(otherUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const startVideoCall = (targetUser) => {
    setSelectedUser({
      id: targetUser.id || targetUser.Id,
      name: targetUser.fullname || targetUser.Fullname || targetUser.email || targetUser.Email
    });
  };

  const closeVideoCall = () => {
    setSelectedUser(null);
  };

  if (selectedUser) {
    return (
      <VideoCall
        targetUserId={selectedUser.id}
        targetUserName={selectedUser.name}
        onClose={closeVideoCall}
        roomId={selectedUser.roomId}
        fromUserId={selectedUser.fromUserId}
        autoJoin={selectedUser.autoJoin || false}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📹 Video Call</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Chọn người dùng để bắt đầu cuộc gọi video
      </p>

      {/* Test instructions for local development */}
      {window.location.hostname === 'localhost' && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>💡 Hướng dẫn test trên cùng 1 máy:</strong>
          <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li>Mở cửa sổ trình duyệt thứ 2 (hoặc Incognito mode)</li>
            <li>Đăng nhập với tài khoản khác</li>
            <li>Bắt đầu cuộc gọi từ cửa sổ này</li>
            <li>Email sẽ được gửi và cửa sổ kia sẽ nhận thông báo</li>
          </ol>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {users.map(userItem => (
            <div
              key={userItem.id || userItem.Id}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>
                  {userItem.fullname || userItem.Fullname || 'No Name'}
                </h3>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                  {userItem.email || userItem.Email}
                </p>
              </div>
              <button
                onClick={() => startVideoCall(userItem)}
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                📹 Bắt đầu Video Call
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6b7280'
            }}>
              Không có người dùng nào khác
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoCallList;
