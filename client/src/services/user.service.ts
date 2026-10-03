import api from "./api";

export interface Lecturer {
    id: string;
    name: string;
    email: string;
    role: "LECTURER";
    status: string;
    createdAt: string;
}

interface LecturersResponse {
    success: boolean;
    message: string;
    data: Lecturer[];
}

export const getActiveLecturers = async (): Promise<Lecturer[]> => {
    const response = await api.get<LecturersResponse>("/users/lecturers");
    return response.data.data;
};

export interface User {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "LECTURER" | "STUDENT";
    status:
        | "ACTIVE"
        | "SUSPENDED"
        | "INACTIVE";
    createdAt: string;
    updatedAt: string;
}

interface UsersResponse {
    success: boolean;
    message: string;
    data: User[];
}

interface UserResponse {
    success: boolean;
    message: string;
    data: User;
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "LECTURER" | "STUDENT";
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    role?: "ADMIN" | "LECTURER" | "STUDENT";
    status?:
        | "ACTIVE"
        | "SUSPENDED"
        | "INACTIVE";
}

export const getUsers = async (): Promise<User[]> => {
    const response =
        await api.get<UsersResponse>("/users");

    return response.data.data;
};

export const getUserById = async (
    id: string
): Promise<User> => {
    const response =
        await api.get<UserResponse>(
            `/users/${id}`
        );

    return response.data.data;
};

export const createUser = async (
    input: CreateUserInput
): Promise<User> => {
    const response =
        await api.post<UserResponse>(
            "/users",
            input
        );

    return response.data.data;
};

export const updateUser = async (
    id: string,
    input: UpdateUserInput
): Promise<User> => {
    const response =
        await api.patch<UserResponse>(
            `/users/${id}`,
            input
        );

    return response.data.data;
};

export const deleteUser = async (
    id: string
): Promise<User> => {
    const response =
        await api.delete<UserResponse>(
            `/users/${id}`
        );

    return response.data.data;
};