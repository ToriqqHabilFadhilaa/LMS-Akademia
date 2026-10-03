export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "LECTURER" | "STUDENT";
    status: string;
    createdAt: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: AuthUser;
        token: string;
    };
}

export interface MeResponse {
    success: boolean;
    message: string;
    data: AuthUser;
}