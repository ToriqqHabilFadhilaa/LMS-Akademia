import type { Request, Response } from "express";

import {
    createCourseMember as createCourseMemberService,
    getCourseMembers as getCourseMembersService,
    getCourseMemberById as getCourseMemberByIdService,
    updateCourseMember as updateCourseMemberService,
    deleteCourseMember as deleteCourseMemberService,
    getMyCourseMembers as getMyCourseMembersService,
} from "../services/course-member.service.js";

import type {
    CreateCourseMemberInput,
    UpdateCourseMemberInput,
} from "../validators/course-member.validator.js";

export const createCourseMember = async (
    req: Request<unknown, unknown, CreateCourseMemberInput>,
    res: Response
) => {
    const member = await createCourseMemberService(req.body);

    return res.status(201).json({
        success: true,
        message: "Member berhasil ditambahkan",
        data: member,
    });
};

export const getCourseMembers = async (
    req: Request<{ courseOfferingId: string }>,
    res: Response
) => {
    const members = await getCourseMembersService(
        req.params.courseOfferingId,
        req.user!.id,
        req.user!.role as "ADMIN" | "LECTURER" | "STUDENT"
    );

    return res.status(200).json({
        success: true,
        message: "Daftar member berhasil diambil",
        data: members,
    });
};

export const getCourseMemberById = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const member = await getCourseMemberByIdService(
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Member berhasil diambil",
        data: member,
    });
};

export const updateCourseMember = async (
    req: Request<{ id: string }, unknown, UpdateCourseMemberInput>,
    res: Response
) => {
    const member = await updateCourseMemberService(
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Member berhasil diperbarui",
        data: member,
    });
};

export const deleteCourseMember = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    await deleteCourseMemberService(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Member berhasil dihapus",
    });
};

export const getMyCourseMembers = async (
    req: Request,
    res: Response
) => {
    const members =
        await getMyCourseMembersService(
            req.user!.id
        );

    return res.status(200).json({
        success: true,
        message: "Course student berhasil diambil",
        data: members,
    });
};