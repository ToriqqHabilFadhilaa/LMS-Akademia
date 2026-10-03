import {
    useEffect,
    useState,
} from "react";
import type { ReactNode } from "react";

import {
    getMe,
    login as loginRequest,
} from "../services/auth.service";

import type {
    AuthUser,
    LoginInput,
} from "../types/auth";

import {
    AuthContext,
} from "./auth-context";

interface AuthProviderProps {
    children: ReactNode;
}

const AuthProvider = ({
    children,
}: AuthProviderProps) => {
    const [user, setUser] =
        useState<AuthUser | null>(null);

    const [token, setToken] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const restoreSession = async () => {
            const savedToken =
                localStorage.getItem("accessToken");

            if (!savedToken) {
                setLoading(false);
                return;
            }

            try {
                const currentUser =
                    await getMe();

                setToken(savedToken);
                setUser(currentUser);

                localStorage.setItem(
                    "user",
                    JSON.stringify(currentUser)
                );
            } catch {
                localStorage.removeItem(
                    "accessToken"
                );

                localStorage.removeItem("user");

                setToken(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        void restoreSession();
    }, []);

    const handleLogin = async (
        input: LoginInput
    ) => {
        const response =
            await loginRequest(input);

        const accessToken =
            response.data.token;

        const currentUser =
            response.data.user;

        localStorage.setItem(
            "accessToken",
            accessToken
        );

        localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
        );

        setToken(accessToken);
        setUser(currentUser);

        return currentUser;
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated:
            user !== null && token !== null,
        login: handleLogin,
        logout: handleLogout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;