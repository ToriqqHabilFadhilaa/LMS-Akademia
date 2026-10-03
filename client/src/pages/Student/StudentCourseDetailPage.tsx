import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getMyCourseOfferingById } from "../../services/course-offering.service";
import { getMyMaterials } from "../../services/material.service";
import { getMyAssignments } from "../../services/assignment.service";
import { getMySubmissions } from "../../services/submission.service";
import { getMyExams } from "../../services/exam.service";

import type {
    Assignment,
    CourseOffering,
    Exam,
    Material,
} from "../../types/course";
import type { Submission } from "../../types/submission";
import StudentLayout from "../../components/StudentLayout";

type ExamStatus = "BELUM DIMULAI" | "SEDANG BERLANGSUNG" | "SUDAH BERAKHIR";

const EXAM_STATUS_CLASS: Record<ExamStatus, string> = {
    "SEDANG BERLANGSUNG": "exam-status-active",
    "SUDAH BERAKHIR": "exam-status-ended",
    "BELUM DIMULAI": "exam-status-upcoming",
};

// NOTE: cuma dua status ini yang saya lihat dipakai di halaman lain
// (StudentAssignmentDetailPage). Kalau backend punya status lain
// (mis. "LATE"), tambahkan mapping-nya di sini juga.
const ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
    SUBMITTED: "Sudah Dikumpulkan",
    GRADED: "Sudah Dinilai",
};

const ASSIGNMENT_STATUS_CLASS: Record<string, string> = {
    SUBMITTED: "assignment-status-submitted",
    GRADED: "assignment-status-graded",
};

const formatDate = (value: string): string => {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
};

const getExamStatus = (startAt: string, endAt: string): ExamStatus => {
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (now < start) return "BELUM DIMULAI";
    if (now >= end) return "SUDAH BERAKHIR";
    return "SEDANG BERLANGSUNG";
};

const SectionHeader = ({
    title,
    description,
}: {
    title: string;
    description: string;
}) => (
    <div className="section-header">
        <div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    </div>
);

const MaterialCard = ({ material }: { material: Material }) => (
    <article className="material-card">
        <div className="material-content">
            <h4>{material.title}</h4>
            {material.description && <p>{material.description}</p>}
        </div>

        {material.fileUrl && (
            <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="material-link"
            >
                Buka Materi
            </a>
        )}
    </article>
);

const AssignmentCard = ({
    assignment,
    submission,
}: {
    assignment: Assignment;
    submission: Submission | null;
}) => {
    const statusKey = submission?.status ?? "";
    const statusLabel = ASSIGNMENT_STATUS_LABEL[statusKey] ?? "Belum Dikerjakan";
    const statusClass =
        ASSIGNMENT_STATUS_CLASS[statusKey] ?? "assignment-status-pending";

    const hasScore = submission?.score !== null && submission?.score !== undefined;

    return (
        <Link
            to={`/student/assignments/${assignment.id}`}
            className="assignment-card"
        >
            <div>
                <span className="assignment-label">TUGAS</span>
                <h4>{assignment.title}</h4>

                {assignment.description && <p>{assignment.description}</p>}

                <div className="assignment-meta">
                    <span>Deadline: {formatDate(assignment.deadline)}</span>
                    <span>Nilai maksimal: {assignment.maxScore}</span>
                    {hasScore && <span>Nilai: {submission?.score}</span>}
                </div>
            </div>

            <span className={`assignment-status ${statusClass}`}>
                {statusLabel}
            </span>
        </Link>
    );
};

const ExamCard = ({ exam }: { exam: Exam }) => {
    const status = getExamStatus(exam.startAt, exam.endAt);

    return (
        <article className="exam-card">
            <div className="exam-content">
                <div className="exam-content-header">
                    <span className="exam-label">EXAM</span>
                    <span className={EXAM_STATUS_CLASS[status]}>{status}</span>
                </div>

                <h4>{exam.title}</h4>

                {exam.description && <p>{exam.description}</p>}

                <div className="exam-meta">
                    <span>Mulai: {formatDate(exam.startAt)}</span>
                    <span>Berakhir: {formatDate(exam.endAt)}</span>
                    <span>Durasi: {exam.durationMinutes} menit</span>
                    <span>Maks. attempt: {exam.maxAttempts}</span>
                </div>
            </div>

            <Link to={`/student/exams/${exam.id}`} className="exam-link">
                Lihat Exam
            </Link>
        </article>
    );
};

const StudentCourseDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    const [course, setCourse] = useState<CourseOffering | null>(null);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);

    const [loading, setLoading] = useState(Boolean(id));
    const [error, setError] = useState(id ? "" : "Course tidak ditemukan.");

    useEffect(() => {
        if (!id) {
            return;
        }

        let cancelled = false;

        const loadCourseDetail = async () => {
            try {
                const [
                    courseData,
                    materialData,
                    assignmentData,
                    submissionData,
                    examData,
                ] = await Promise.all([
                    getMyCourseOfferingById(id),
                    getMyMaterials(id),
                    getMyAssignments(id),
                    getMySubmissions(),
                    getMyExams(id),
                ]);

                if (cancelled) {
                    return;
                }

                setCourse(courseData);
                setMaterials(materialData);
                setAssignments(assignmentData);
                setSubmissions(submissionData);
                setExams(examData);
                setError("");
            } catch {
                if (cancelled) {
                    return;
                }

                setCourse(null);
                setMaterials([]);
                setAssignments([]);
                setSubmissions([]);
                setExams([]);
                setError("Gagal mengambil detail course.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadCourseDetail();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const getAssignmentSubmission = (
        assignmentId: string
    ): Submission | null => {
        return (
            submissions.find(
                (submission) => submission.assignmentId === assignmentId
            ) ?? null
        );
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="empty-state">Memuat detail course...</div>
            </StudentLayout>
        );
    }

    if (error || !course) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    {error || "Course tidak ditemukan."}
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Link to="/student" className="back-link">
                ← Kembali ke Dashboard
            </Link>

            <section className="course-detail-hero">
                <span className="course-code">{course.course.code}</span>
                <h2>{course.course.name}</h2>
                <p>
                    {course.term} · Section {course.section}
                </p>
                <span className="course-status">{course.status}</span>
            </section>

            <section className="course-info-grid">
                <div className="course-info-card">
                    <span>Dosen</span>
                    <strong>{course.lecturer.name}</strong>
                    <small>{course.lecturer.email}</small>
                </div>

                <div className="course-info-card">
                    <span>Semester</span>
                    <strong>{course.term}</strong>
                    <small>Section {course.section}</small>
                </div>
            </section>

            <section className="material-section">
                <SectionHeader title="Materi Pembelajaran" description="Materi yang tersedia pada course ini." />
                {materials.length === 0 ? (
                    <div className="empty-state">Belum ada materi.</div>
                ) : (
                    <div className="material-list">
                        {materials.map((material) => (
                            <MaterialCard key={material.id} material={material} />
                        ))}
                    </div>
                )}
            </section>

            <section className="assignment-section">
                <SectionHeader title="Tugas" description="Tugas yang tersedia pada course ini." />
                {assignments.length === 0 ? (
                    <div className="empty-state">Belum ada tugas.</div>
                ) : (
                    <div className="assignment-list">
                        {assignments.map((assignment) => (
                            <AssignmentCard key={assignment.id} assignment={assignment} submission={getAssignmentSubmission(assignment.id)} />
                        ))}
                    </div>
                )}
            </section>

            <section className="exam-section">
                <SectionHeader title="Exam" description="Exam yang tersedia pada course ini." />
                {exams.length === 0 ? (
                    <div className="empty-state">Belum ada exam.</div>
                ) : (
                    <div className="exam-list">
                        {exams.map((exam) => (
                            <ExamCard key={exam.id} exam={exam} />
                        ))}
                    </div>
                )}
            </section>
        </StudentLayout>
    );
};

export default StudentCourseDetailPage;