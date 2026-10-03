import { getMyExamAttemptsByExamId } from "./exam-attempt.service";
import type { MyExamAttempt } from "./exam-attempt.service";
import { getMyExams } from "./exam.service";
import { getMyCourses } from "./course-member.service";
import { getExamResult } from "./exam-result.service";

export interface StudentExamActivity {
    id: string;
    examId: string;
    examTitle: string;
    courseCode: string;
    courseName: string;
    passingScore: number;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;
    status: MyExamAttempt["status"];
    percentage: number | null;
    pendingManualGrading: number;
}

export const getMyExamActivity = async (): Promise<StudentExamActivity[]> => {
    const courses = await getMyCourses();

    const examGroups = await Promise.all(
        courses.map(async (course) => ({
            course,
            exams: await getMyExams(course.courseOfferingId),
        }))
    );

    const activities = await Promise.all(
        examGroups.flatMap(({ course, exams }) =>
            exams.map(async (exam) => {
                const { attempts } = await getMyExamAttemptsByExamId(exam.id);

                return Promise.all(
                    attempts.map(async (attempt) => {
                        let percentage: number | null = null;
                        let pendingManualGrading = 0;

                        if (
                            attempt.status === "SUBMITTED" ||
                            attempt.status === "EXPIRED"
                        ) {
                            const result = await getExamResult(attempt.id);
                            pendingManualGrading =
                                result.summary.pendingManualGrading;
                            percentage =
                                pendingManualGrading > 0
                                    ? null
                                    : result.summary.percentage;
                        }

                        return {
                            id: attempt.id,
                            examId: exam.id,
                            examTitle: exam.title,
                            courseCode: course.courseOffering.course.code,
                            courseName: course.courseOffering.course.name,
                            passingScore: exam.passingScore,
                            attemptNumber: attempt.attemptNumber,
                            startedAt: attempt.startedAt,
                            submittedAt: attempt.submittedAt,
                            status: attempt.status,
                            percentage,
                            pendingManualGrading,
                        };
                    })
                );
            })
        )
    );

    return activities
        .flat()
        .sort(
            (first, second) =>
                new Date(second.startedAt).getTime() -
                new Date(first.startedAt).getTime()
        );
};
