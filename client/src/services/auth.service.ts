import api from "./api";

import type {
    AuthUser,
    LoginInput,
    LoginResponse,
    MeResponse,
} from "../types/auth";

export const login = async (
    input: LoginInput
): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
        "/auth/login",
        input
    );

    return response.data;
};

export const getMe = async (): Promise<AuthUser> => {
    const response = await api.get<MeResponse>(
        "/auth/me"
    );

    return response.data.data;
};