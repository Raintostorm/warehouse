import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { authAPI, userAPI } from '../../services/api';
import { AuthContext } from './AuthContext';
import logger from '../utils/logger';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const inactivityTimeoutRef = useRef(null);
    const tokenRefreshIntervalRef = useRef(null);

    // Kiểm tra token có hết hạn không
    const isTokenExpired = useCallback((tokenToCheck) => {
        if (!tokenToCheck) return true;
        try {
            const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
            if (payload.exp) {
                const expirationTime = payload.exp * 1000; // Convert to milliseconds
                return Date.now() >= expirationTime;
            }
            return false; // Nếu không có exp, giả sử token không hết hạn
        } catch (e) {
            logger.error('Error checking token expiration:', e);
            return true; // Nếu không decode được, coi như hết hạn
        }
    }, []);

    // Lấy thời gian hết hạn của token (milliseconds)
    const getTokenExpirationTime = useCallback((tokenToCheck) => {
        if (!tokenToCheck) return null;
        try {
            const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
            if (payload.exp) {
                return payload.exp * 1000; // Convert to milliseconds
            }
            return null;
        } catch (e) {
            logger.error('Error getting token expiration:', e);
            return null;
        }
    }, []);

    // Kiểm tra token có sắp hết hạn không (trong vòng X phút)
    const isTokenExpiringSoon = useCallback((tokenToCheck, minutesBeforeExpiration = 5) => {
        if (!tokenToCheck) return true;
        try {
            const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
            if (payload.exp) {
                const expirationTime = payload.exp * 1000;
                const timeUntilExpiration = expirationTime - Date.now();
                const minutesUntilExpiration = timeUntilExpiration / (1000 * 60);
                return minutesUntilExpiration <= minutesBeforeExpiration;
            }
            return false;
        } catch (e) {
            logger.error('Error checking token expiration soon:', e);
            return true;
        }
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Logout function - defined early so verifyToken can use it
    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setError(null);
        setLastActivity(Date.now());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('roles');
        localStorage.removeItem('rememberMe');

        // Clear intervals
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }
        if (tokenRefreshIntervalRef.current) {
            clearInterval(tokenRefreshIntervalRef.current);
            tokenRefreshIntervalRef.current = null;
        }
    }, []);

    // Verify token với server
    const verifyToken = useCallback(async () => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            return false;
        }

        // Only check expiration, don't fail if expired (let server decide)
        // Removed debug log to reduce console spam

        try {
            const response = await authAPI.verify();
            if (response.data?.success && response.data?.data) {
                const { user: userData, token: newToken } = response.data.data;
                if (userData && newToken) {
                    setUser(userData);
                    setToken(newToken);
                    localStorage.setItem('token', newToken);
                    localStorage.setItem('user', JSON.stringify(userData));

                    // Update roles if available
                    if (response.data.data.roleNames) {
                        localStorage.setItem('roles', JSON.stringify(response.data.data.roleNames));
                    }
                    return true;
                }
            }
            // If verification fails but we have token, don't logout immediately
            // Might be temporary server issue
            logger.warn('Token verification returned false, but keeping token');
            return false;
        } catch (error) {
            logger.error('Token verification failed:', error);
            // Only logout on 401 (unauthorized), not on network errors
            if (error.response?.status === 401) {
                logout();
            }
            return false;
        }
    }, [isTokenExpired, logout]);

    useEffect(() => {
        // Check if user is already logged in
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Check if storedUser is a valid JSON string (not "undefined" or "null")
                    if (storedUser === 'undefined' || storedUser === 'null') {
                        // Clear invalid data
                        logout();
                    } else {
                        const parsedUser = JSON.parse(storedUser);

                        // Set state immediately from localStorage (optimistic update)
                        setToken(storedToken);
                        setUser(parsedUser);

                        // Kiểm tra token có hết hạn không
                        if (isTokenExpired(storedToken)) {
                            // Thử verify với server để refresh token
                            const verified = await verifyToken();
                            if (!verified) {
                                // Only logout if verify fails, don't clear on network errors
                                logger.warn('Token expired and verification failed');
                                logout();
                            }
                        } else {
                            // Token not expired, verify in background (don't block)
                            verifyToken().catch(err => {
                                // If verify fails, don't logout immediately - might be network issue
                                logger.warn('Background token verification failed:', err.message);
                            });
                        }
                    }
                } catch (error) {
                    // If JSON parse fails, clear invalid data
                    logger.error('Error parsing user data from localStorage:', error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper function để xử lý login response (dùng chung cho login và Google login)
    const handleLoginResponse = useCallback(async (loginData, rememberMe = false) => {
        console.log('[AuthContext] handleLoginResponse called', {
            hasUser: !!loginData.user,
            hasToken: !!loginData.token,
            loginDataKeys: Object.keys(loginData)
        });

        const { user: userData, token: newToken, roles } = loginData;

        if (!userData || !newToken) {
            console.error('[AuthContext] Missing user or token', {
                hasUser: !!userData,
                hasToken: !!newToken
            });
            throw new Error('Invalid response from server');
        }

        console.log('[AuthContext] Setting state and localStorage', {
            userId: userData.id || userData.Id,
            tokenLength: newToken.length
        });

        setUser(userData);
        setToken(newToken);
        setLastActivity(Date.now());
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        console.log('[AuthContext] localStorage set, verifying...', {
            tokenInStorage: !!localStorage.getItem('token'),
            userInStorage: !!localStorage.getItem('user')
        });

        // Lưu remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberMe');
        }

        // Lưu role names vào localStorage
        let roleNames = [];
        if (loginData.roleNames && Array.isArray(loginData.roleNames)) {
            roleNames = loginData.roleNames;
        } else if (newToken) {
            try {
                const payload = JSON.parse(atob(newToken.split('.')[1]));
                roleNames = payload.roleNames || [];
            } catch (e) {
                logger.error('Error decoding token for roles:', e);
            }
        }

        // Nếu không có roles, thử gán role Admin tự động (chỉ khi email là admin@example.com)
        if (roleNames.length === 0 && loginData.user && (loginData.user.email === 'admin@example.com' || loginData.user.Email === 'admin@example.com')) {
            try {
                const { authAPI } = await import('../../services/api');
                const fixResult = await authAPI.fixAdminRole();
                if (fixResult.success) {
                    roleNames = ['Admin'];
                }
            } catch (error) {
                logger.error('Failed to assign Admin role:', error);
            }
        }

        if (roleNames.length > 0) {
            localStorage.setItem('roles', JSON.stringify(roleNames));
        } else if (roles) {
            localStorage.setItem('roles', JSON.stringify(roles));
        }

        // Force a small delay to ensure state updates propagate
        await new Promise(resolve => setTimeout(resolve, 200));

        // Double-check that localStorage was updated (this is the source of truth)
        const currentToken = localStorage.getItem('token');
        const currentUser = localStorage.getItem('user');

        if (!currentToken || !currentUser) {
            logger.error('Login state not properly saved to localStorage', {
                hasToken: !!currentToken,
                hasUser: !!currentUser,
                tokenLength: currentToken?.length,
                userLength: currentUser?.length
            });
            throw new Error('Failed to save login state');
        }

        // State might not be updated yet, but localStorage is the source of truth
        // The component will re-render and check localStorage
        // Removed debug log to reduce console spam

        return { success: true };
    }, []);

    const login = useCallback(async (email, password, rememberMe = false) => {
        try {
            setError(null);
            // Removed debug logs to reduce console spam

            const response = await authAPI.login(email, password);

            // Removed debug logs to reduce console spam

            // Response structure: response.data.data contains { user, token, roles }
            const loginData = response.data.data || response.data;

            if (!loginData) {
                logger.error('Invalid login response', { response: response.data });
                throw new Error('Invalid response from server');
            }

            if (!loginData.token || !loginData.user) {
                logger.error('Login data missing token or user', {
                    hasToken: !!loginData.token,
                    hasUser: !!loginData.user,
                    loginData
                });
                throw new Error('Invalid login data: missing token or user');
            }

            // Removed debug log to reduce console spam

            return await handleLoginResponse(loginData, rememberMe);
        } catch (error) {
            logger.error('Login error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Login failed';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, [handleLoginResponse]);

    const isAuthenticated = useCallback(() => {
        // Check both state and localStorage for reliability
        const hasToken = !!(token || localStorage.getItem('token'));
        const hasUser = !!(user || localStorage.getItem('user'));
        const isAuth = hasToken && hasUser;

        // Removed verbose debug logging to reduce console spam
        // Only log errors or important state changes if needed

        return isAuth;
    }, [token, user]);

    // Lấy roles từ localStorage hoặc từ token
    const getUserRoles = useCallback(() => {
        try {
            const storedRoles = localStorage.getItem('roles');
            if (storedRoles) {
                const parsed = JSON.parse(storedRoles);
                // Nếu là array of role names, return luôn
                if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                    return parsed;
                }
            }
            // Nếu không có trong localStorage, decode từ token
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const roleNames = payload.roleNames || [];
                    return roleNames;
                } catch (e) {
                    logger.error('Error decoding token:', e);
                }
            }
            return [];
        } catch (error) {
            logger.error('Error getting user roles:', error);
            return [];
        }
    }, [token]);

    // Kiểm tra user có role cụ thể không (case-insensitive)
    const hasRole = useCallback((roleName) => {
        const roles = getUserRoles();
        const normalizedRoleName = roleName?.toLowerCase();
        return roles.some(role => role?.toLowerCase() === normalizedRoleName);
    }, [getUserRoles]);

    // Kiểm tra user có một trong các roles không (case-insensitive)
    const hasAnyRole = useCallback((roleNames) => {
        const roles = getUserRoles();
        const rolesArray = Array.isArray(roleNames) ? roleNames : [roleNames];
        const normalizedRoles = new Set(roles.map(r => r?.toLowerCase()));
        return rolesArray.some(role => normalizedRoles.has(role?.toLowerCase()));
    }, [getUserRoles]);

    // Kiểm tra user có tất cả các roles không (case-insensitive)
    const hasAllRoles = useCallback((roleNames) => {
        const roles = getUserRoles();
        const rolesArray = Array.isArray(roleNames) ? roleNames : [roleNames];
        const normalizedRoles = new Set(roles.map(r => r?.toLowerCase()));
        return rolesArray.every(role => normalizedRoles.has(role?.toLowerCase()));
    }, [getUserRoles]);

    const updateUser = useCallback((updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
    }, []);

    // Refresh user data từ server
    const refreshUser = useCallback(async () => {
        if (!user?.id) {
            return { success: false, error: 'No user ID available' };
        }

        try {
            const response = await userAPI.getUserById(user.id);
            if (response.data) {
                const userData = response.data.data || response.data;
                updateUser(userData);
                return { success: true, user: userData };
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (error) {
            logger.error('Error refreshing user data:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message || 'Failed to refresh user data'
            };
        }
    }, [user, updateUser]);

    // Cập nhật profile
    const updateProfile = useCallback(async (profileData) => {
        try {
            const response = await userAPI.updateProfile(profileData);
            if (response.data) {
                const updatedUser = response.data.data || response.data;
                updateUser(updatedUser);
                setError(null);
                return { success: true, user: updatedUser };
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (error) {
            logger.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update profile';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, [updateUser]);

    // Đổi mật khẩu
    const changePassword = useCallback(async (oldPassword, newPassword) => {
        try {
            const response = await userAPI.changePassword(oldPassword, newPassword);
            if (response.data?.success) {
                setError(null);
                return { success: true, message: response.data.message || 'Đổi mật khẩu thành công' };
            }
            return { success: false, error: response.data?.error || 'Đổi mật khẩu thất bại' };
        } catch (error) {
            logger.error('Error changing password:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Đổi mật khẩu thất bại';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, []);

    // Google OAuth Login
    const loginWithGoogle = useCallback(async (googleToken, rememberMe = false) => {
        try {
            setError(null);
            const response = await authAPI.googleLogin(googleToken);

            // Response structure: response.data.data contains { user, token, roles }
            const loginData = response.data.data || response.data;

            if (!loginData) {
                throw new Error('Invalid response from server');
            }

            // Removed debug log to reduce console spam

            return await handleLoginResponse(loginData, rememberMe);
        } catch (error) {
            logger.error('Google login error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Google login failed';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, [handleLoginResponse]);

    // Google OAuth Register
    const registerWithGoogle = useCallback(async (googleToken, additionalData = {}, rememberMe = false) => {
        try {
            setError(null);
            const response = await authAPI.googleRegister(googleToken, additionalData);

            // Response structure: response.data.data contains { user, token, roles }
            const loginData = response.data.data || response.data;

            if (!loginData) {
                throw new Error('Invalid response from server');
            }


            return await handleLoginResponse(loginData, rememberMe);
        } catch (error) {
            logger.error('Google register error:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Đăng ký bằng Google thất bại';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    }, [handleLoginResponse]);

    // Reset inactivity timeout (defined first so updateActivity can use it)
    const resetInactivityTimeout = useCallback((timeoutMinutes = 30) => {
        // Clear existing timeout
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
            inactivityTimeoutRef.current = null;
        }

        // Only setup if user is authenticated
        if (!token || !user) {
            return;
        }

        const timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds

        // Setup timeout
        inactivityTimeoutRef.current = setTimeout(() => {
            logout();
        }, timeoutMs);
    }, [token, user, logout]);

    // Update last activity time and reset inactivity timeout
    const updateActivity = useCallback(() => {
        setLastActivity(Date.now());
        // Reset inactivity timeout when user is active
        if (token && user) {
            resetInactivityTimeout(30);
        }
    }, [token, user, resetInactivityTimeout]);

    // Setup auto-logout on inactivity (backward compatibility)
    const setupInactivityTimeout = useCallback((timeoutMinutes = 30) => {
        resetInactivityTimeout(timeoutMinutes);
    }, [resetInactivityTimeout]);

    // Setup token refresh interval
    const setupTokenRefresh = useCallback((intervalMinutes = 10) => {
        // Clear existing interval
        if (tokenRefreshIntervalRef.current) {
            clearInterval(tokenRefreshIntervalRef.current);
            tokenRefreshIntervalRef.current = null;
        }

        // Only setup if user is authenticated
        if (!token || !user) {
            return;
        }

        const intervalMs = intervalMinutes * 60 * 1000; // Convert to milliseconds

        // Setup interval to refresh token
        tokenRefreshIntervalRef.current = setInterval(async () => {
            const currentToken = localStorage.getItem('token');
            if (currentToken && isTokenExpiringSoon(currentToken, 15)) { // Refresh if expiring in 15 minutes
                await verifyToken();
            }
        }, intervalMs);
    }, [token, user, isTokenExpiringSoon, verifyToken]);

    // Activity tracking effect
    useEffect(() => {
        if (!token || !user) {
            // Clear timeouts if not authenticated
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
                inactivityTimeoutRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
                clearInterval(tokenRefreshIntervalRef.current);
                tokenRefreshIntervalRef.current = null;
            }
            return;
        }

        // Track user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        const handleActivity = () => {
            updateActivity();
        };

        // Add event listeners
        for (const event of events) {
            globalThis.addEventListener(event, handleActivity, { passive: true });
        }

        // Setup inactivity timeout (30 minutes default)
        resetInactivityTimeout(30);

        // Setup token refresh (check every 10 minutes)
        setupTokenRefresh(10);

        // Cleanup
        return () => {
            for (const event of events) {
                globalThis.removeEventListener(event, handleActivity);
            }
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
                inactivityTimeoutRef.current = null;
            }
            if (tokenRefreshIntervalRef.current) {
                clearInterval(tokenRefreshIntervalRef.current);
                tokenRefreshIntervalRef.current = null;
            }
        };
    }, [token, user, updateActivity, resetInactivityTimeout, setupTokenRefresh]);

    const value = useMemo(() => ({
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading,
        error,
        lastActivity,
        getUserRoles,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        updateUser,
        refreshUser,
        updateProfile,
        changePassword,
        verifyToken,
        isTokenExpired,
        isTokenExpiringSoon,
        getTokenExpirationTime,
        clearError,
        updateActivity,
        setupInactivityTimeout,
        resetInactivityTimeout,
        setupTokenRefresh,
        loginWithGoogle,
        registerWithGoogle
    }), [
        user,
        token,
        login,
        logout,
        isAuthenticated,
        loading,
        error,
        lastActivity,
        getUserRoles,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        updateUser,
        refreshUser,
        updateProfile,
        changePassword,
        verifyToken,
        isTokenExpired,
        isTokenExpiringSoon,
        getTokenExpirationTime,
        clearError,
        updateActivity,
        setupInactivityTimeout,
        resetInactivityTimeout,
        setupTokenRefresh,
        loginWithGoogle,
        registerWithGoogle
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

