import { getLecturerCourseOfferings } from "./course-offering.service";
import {
    getExamReportByExamId,
    getExamResultForStaff,
} from "./exam-result.service";
import { getExamsByCourseOfferingId } from "./exam.service";
import type { StaffExamResult } from "./exam-result.service";

export interface LecturerExamAttempt extends StaffExamResult {
    passingScore: number;
}

export interface LecturerExamResultSet {
    examId: string;
    examTitle: string;
    courseCode: string;
    courseName: string;
    passingScore: number;
    attempts: LecturerExamAttempt[];
}

export const getLecturerExamResultSets = async (): Promise<
    LecturerExamResultSet[]
> => {
    const offerings = await getLecturerCourseOfferings();
    const examGroups = await Promise.all(
        offerings.map(async (offering) => ({
            offering,
            exams: await getExamsByCourseOfferingId(offering.id),
        }))
    );

    const resultSets = await Promise.all(
        examGroups.flatMap(({ offering, exams }) =>
            exams.map(async (exam) => {
                const report = await getExamReportByExamId(exam.id);
                const completedAttempts = report.attempts.filter(
                    (attempt) =>
                        attempt.status === "SUBMITTED" ||
                        attempt.status === "EXPIRED"
                );
                const attempts = await Promise.all(
                    completedAttempts.map((attempt) =>
                        getExamResultForStaff(attempt.id)
                    )
                );

                return {
                    examId: exam.id,
                    examTitle: exam.title,
                    courseCode: offering.course.code,
                    courseName: offering.course.name,
                    passingScore: exam.passingScore,
                    attempts: attempts.map((attempt) => ({
                        ...attempt,
                        passingScore: exam.passingScore,
                    })),
                };
            })
        )
    );

    return resultSets;
};
