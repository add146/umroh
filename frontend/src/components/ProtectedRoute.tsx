import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles
}) => {
    const { isAuthenticated, user, accessToken } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            navigate('/login', { replace: true });
        } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, accessToken, user, allowedRoles, navigate]);

    if (!isAuthenticated || !accessToken) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
};
