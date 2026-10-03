import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/config/database.js";

const BCRYPT_COST = 12;

const adminName = process.env.ADMIN_NAME;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

const lecturerName = process.env.LECTURER_NAME;
const lecturerEmail = process.env.LECTURER_EMAIL;
const lecturerPassword = process.env.LECTURER_PASSWORD;

if (
    !adminName ||
    !adminEmail ||
    !adminPassword ||
    !lecturerName ||
    !lecturerEmail ||
    !lecturerPassword
) {
    throw new Error(
        "ADMIN dan LECTURER credentials wajib diisi di .env"
    );
}

const adminPasswordHash = await bcrypt.hash(
    adminPassword,
    BCRYPT_COST
);

const lecturerPasswordHash = await bcrypt.hash(
    lecturerPassword,
    BCRYPT_COST
);

const admin = await prisma.user.upsert({
    where: {
        email: adminEmail,
    },
    update: {
        name: adminName,
        password: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
        deletedAt: null,
    },
    create: {
        name: adminName,
        email: adminEmail,
        password: adminPasswordHash,
        role: "ADMIN",
        status: "ACTIVE",
    },
    select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
    },
});

const lecturer = await prisma.user.upsert({
    where: {
        email: lecturerEmail,
    },
    update: {
        name: lecturerName,
        password: lecturerPasswordHash,
        role: "LECTURER",
        status: "ACTIVE",
        deletedAt: null,
    },
    create: {
        name: lecturerName,
        email: lecturerEmail,
        password: lecturerPasswordHash,
        role: "LECTURER",
        status: "ACTIVE",
    },
    select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
    },
});

console.log("Admin:");
console.log(admin);

console.log("Lecturer:");
console.log(lecturer);

await prisma.$disconnect();