import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const DashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        if (user.role === "ADMIN") {
            navigate("/admin", { replace: true });
        } else if (user.role === "LECTURER") {
            navigate("/lecturer", { replace: true });
        } else if (user.role === "STUDENT") {
            navigate("/student", { replace: true });
        }
    }, [user, navigate]);

    return null;
};

export default DashboardPage;