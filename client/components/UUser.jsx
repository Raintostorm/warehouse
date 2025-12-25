import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UUser = ({ userId, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        id: '',
        fullname: '',
        email: '',
        number: '',
        address: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [loadingUser, setLoadingUser] = useState(false);

    // Load user data khi userId thay đổi
    useEffect(() => {
        if (userId) {
            loadUserData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Load dữ liệu user hiện tại
    const loadUserData = async () => {
        try {
            setLoadingUser(true);
            setError(null);
            const response = await userAPI.getUserById(userId);

            if (response.success) {
                const user = response.data;
                setFormData({
                    id: user.id || '',
                    fullname: user.fullname || '',
                    email: user.email || '',
                    number: user.number || '',
                    address: user.address || '',
                    password: '' // Không load password
                });
            } else {
                setError(response.message || 'Failed to load user');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to load user');
        } finally {
            setLoadingUser(false);
        }
    };

    // Xử lý thay đổi input
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Xử lý submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Chỉ gửi các field có giá trị (trừ password nếu rỗng)
            const updateData = { ...formData };
            if (!updateData.password) {
                delete updateData.password; // Không update password nếu không nhập
            }

            const response = await userAPI.updateUser(userId, updateData);

            if (response.success) {
                setSuccess(true);
                // Gọi callback để refresh danh sách
                if (onUserUpdated) {
                    onUserUpdated();
                }
            } else {
                setError(response.message || 'Failed to update user');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị loading khi đang load user
    if (loadingUser) {
        return (
            <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
                <div>Đang tải thông tin user...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px 0' }}>
            <h2>Update User</h2>

            {error && (
                <div style={{ color: 'red', marginBottom: '10px' }}>
                    Error: {error}
                </div>
            )}

            {success && (
                <div style={{ color: 'green', marginBottom: '10px' }}>
                    User updated successfully!
                </div>
            )}

            {!userId && (
                <div style={{ color: 'orange', marginBottom: '10px' }}>
                    Please select a user to update
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>ID: </label>
                    <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        disabled
                        style={{ marginLeft: '10px', padding: '5px', backgroundColor: '#f0f0f0' }}
                    />
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                        (ID cannot be changed)
                    </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Fullname: </label>
                    <input
                        type="text"
                        name="fullname"
                        value={formData.fullname}
                        onChange={handleChange}
                        required
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Email: </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Number: </label>
                    <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Address: </label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <label>Password: </label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                        style={{ marginLeft: '10px', padding: '5px' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !userId}
                    style={{ padding: '10px 20px' }}
                >
                    {loading ? 'Updating...' : 'Update User'}
                </button>
            </form>
        </div>
    );
};

export default UUser;
