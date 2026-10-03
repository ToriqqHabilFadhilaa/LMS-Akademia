import {
    Navigate,
    Outlet,
} from "react-router-dom";

import { useAuth } from "../context/useAuth";

interface ProtectedRouteProps {
    allowedRoles?: Array<
        "ADMIN" | "LECTURER" | "STUDENT"
    >;
}

const ProtectedRoute = ({
    allowedRoles,
}: ProtectedRouteProps) => {
    const {
        user,
        loading,
        isAuthenticated,
    } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                Memuat sesi...
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Navigate to="/login" replace />
        );
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return (
            <Navigate to="/" replace />
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;