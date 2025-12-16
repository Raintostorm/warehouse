import { useAuth } from '../contexts/useAuth';

/**
 * Hook để kiểm tra role của user
 * @returns {Object} Object chứa các functions để check role
 */
export const useRole = () => {
    const { hasRole, hasAnyRole, hasAllRoles, getUserRoles, isAuthenticated } = useAuth();

    return {
        hasRole,
        hasAnyRole,
        hasAllRoles,
        getUserRoles,
        isAuthenticated
    };
};

