export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Permintaan tidak valid") {
        super(message, 400);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Tidak terautentikasi") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Akses ditolak") {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Data tidak ditemukan") {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message = "Data sudah ada") {
        super(message, 409);
    }
}