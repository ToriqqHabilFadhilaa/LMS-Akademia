import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAssignmentById } from "../../services/assignment.service";
import { createSubmission, getMySubmissions, updateSubmission } from "../../services/submission.service";
import type { Assignment } from "../../types/course";
import type { Submission } from "../../types/submission";
import StudentLayout from "../../components/StudentLayout";

const formatDate = (value: string): string => {
    return new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
};

const MetaItem = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => (
    <div>
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const StudentAssignmentDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [fileUrl, setFileUrl] = useState("");

    const [loading, setLoading] = useState(Boolean(id));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isGraded = submission?.status === "GRADED";
    const canUpdate = submission?.status === "SUBMITTED";

    useEffect(() => {
        if (!id) {
            return;
        }

        let cancelled = false;

        const loadData = async () => {
            try {
                const [assignmentData, submissionsData] = await Promise.all([
                    getAssignmentById(id),
                    getMySubmissions(),
                ]);

                if (cancelled) {
                    return;
                }

                const mySubmission = submissionsData.find((item) => item.assignmentId === id) ?? null;

                setAssignment(assignmentData);
                setSubmission(mySubmission);
                setFileUrl(mySubmission?.fileUrl ?? "");
                setError("");
            } catch {
                if (cancelled) {
                    return;
                }

                setAssignment(null);
                setSubmission(null);
                setError("Gagal mengambil detail tugas.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadData();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleSubmit = async () => {
        if (!id) {
            return;
        }

        if (submission && !canUpdate) {
            setError("Submission sudah dinilai dan tidak dapat diperbarui.");
            setSuccess("");
            return;
        }

        if (!fileUrl.trim()) {
            setError("URL file tugas wajib diisi.");
            setSuccess("");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            const result = submission
                ? await updateSubmission(submission.id, {
                    fileUrl: fileUrl.trim(),
                })
                : await createSubmission({
                    assignmentId: id,
                    fileUrl: fileUrl.trim(),
                });

            setSuccess(
                submission
                    ? "Submission berhasil diperbarui."
                    : "Tugas berhasil dikumpulkan."
            );

            setSubmission(result);
            setFileUrl(result.fileUrl ?? "");
        } catch {
            setError("Gagal mengirim submission.");
            setSuccess("");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="empty-state">Memuat tugas...</div>
            </StudentLayout>
        );
    }

    if (error && !assignment) {
        return (
            <StudentLayout>
                <div className="empty-state">{error}</div>
            </StudentLayout>
        );
    }

    if (!assignment) {
        return (
            <StudentLayout>
                <div className="empty-state">Tugas tidak ditemukan.</div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <Link to={`/student/courses/${assignment.courseOfferingId}`} className="back-link">
                ← Kembali ke Course
            </Link>

            <section className="assignment-detail-card">
                <span className="assignment-label">TUGAS</span>
                <h2>{assignment.title}</h2>

                {assignment.description && (
                    <p className="assignment-description">
                        {assignment.description}
                    </p>
                )}

                <div className="assignment-detail-meta">
                    <MetaItem label="Course" value={`${assignment.courseOffering.course.code} · ${assignment.courseOffering.course.name}`} />
                    <MetaItem label="Deadline" value={formatDate(assignment.deadline)} />
                    <MetaItem label="Nilai maksimal" value={String(assignment.maxScore)} />
                </div>
            </section>

            <section className="submission-detail-card">
                <div className="section-header">
                    <div>
                        <h3>Submission</h3>
                        <p>Kirim URL file tugas kamu.</p>
                    </div>

                    {submission && (
                        <span className="assignment-status">
                            {submission.status}
                        </span>
                    )}
                </div>

                {submission && submission.score !== null && (
                    <div className="submission-result">
                        <span>Nilai</span>
                        <strong>{submission.score}</strong>
                    </div>
                )}

                {submission?.feedback && (
                    <div className="submission-feedback">
                        <span>Feedback</span>
                        <p>{submission.feedback}</p>
                    </div>
                )}

                {isGraded ? (
                    <div className="graded-notice">
                        <strong>Submission sudah dinilai.</strong>
                        <p>
                            Submission tidak dapat diperbarui setelah dinilai.
                        </p>
                    </div>
                ) : (
                    <div className="submission-form">
                        <label htmlFor="fileUrl">URL File Tugas</label>
                        <input id="fileUrl" type="url" value={fileUrl} onChange={(event) => setFileUrl(event.target.value)} placeholder="https://..." disabled={submitting} />

                        {error && (
                            <div className="submission-error">{error}</div>
                        )}

                        {success && (
                            <div className="submission-success">{success}</div>
                        )}

                        <button type="button" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "Mengirim..." : canUpdate ? "Perbarui Submission" : "Kumpulkan Tugas"}
                        </button>
                    </div>
                )}

                {submission?.fileUrl && (
                    <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="material-link">
                        Buka File Submission
                    </a>
                )}
            </section>
        </StudentLayout>
    );
};

export default StudentAssignmentDetailPage;