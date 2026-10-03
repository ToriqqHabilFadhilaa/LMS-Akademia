import { createContext } from "react";

import type {
    AuthUser,
    LoginInput,
} from "../types/auth";

export interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (input: LoginInput) => Promise<AuthUser>;
    logout: () => void;
}

export const AuthContext =
    createContext<AuthContextValue | undefined>(
        undefined
    );