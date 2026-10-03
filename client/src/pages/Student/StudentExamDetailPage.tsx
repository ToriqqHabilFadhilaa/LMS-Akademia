import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { startExamAttempt, getMyExamAttemptsByExamId } from "../../services/exam-attempt.service";
import type { MyExamAttempt } from "../../services/exam-attempt.service";
import { getMyExamById } from "../../services/exam.service";
import type { Exam } from "../../types/course";
import StudentLayout from "../../components/StudentLayout";

type ExamStatus =
    | "BELUM DIMULAI"
    | "SEDANG BERLANGSUNG"
    | "SUDAH BERAKHIR";

const STATUS_CLASS_MAP: Record<
    ExamStatus,
    string
> = {
    "SEDANG BERLANGSUNG":
        "exam-status-active",

    "SUDAH BERAKHIR":
        "exam-status-ended",

    "BELUM DIMULAI":
        "exam-status-upcoming",
};

const formatDate = (
    value: string
): string => {
    return new Intl.DateTimeFormat(
        "id-ID",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(new Date(value));
};

const ATTEMPT_STATUS_LABEL: Record<MyExamAttempt["status"], string> = {
    IN_PROGRESS: "Sedang dikerjakan",
    SUBMITTED: "Terkumpul",
    EXPIRED: "Waktu habis",
    BLOCKED: "Diblokir",
};

const ATTEMPT_STATUS_CLASS: Record<MyExamAttempt["status"], string> = {
    IN_PROGRESS: "admin-status-active",
    SUBMITTED: "admin-status-success",
    EXPIRED: "admin-status-expired",
    BLOCKED: "admin-status-blocked",
};

const getExamStatus = (
    startAt: string,
    endAt: string,
    now: Date
): ExamStatus => {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (now < start) {
        return "BELUM DIMULAI";
    }

    if (now >= end) {
        return "SUDAH BERAKHIR";
    }

    return "SEDANG BERLANGSUNG";
};

const StudentExamDetailPage = () => {
    const navigate = useNavigate();

    const { id } =
        useParams<{ id: string }>();

    const [exam, setExam] =
        useState<Exam | null>(null);

    const [loading, setLoading] =
        useState(Boolean(id));

    const [error, setError] =
        useState(
            id
                ? ""
                : "Exam tidak ditemukan."
        );

    const [starting, setStarting] =
        useState(false);

    const [startError, setStartError] =
        useState<string | null>(null);

    const [currentTime, setCurrentTime] =
        useState(new Date());

    const [
        attemptHistory,
        setAttemptHistory,
    ] = useState<MyExamAttempt[]>([]);

    const [bestScore, setBestScore] =
        useState<number | null>(null);

    useEffect(() => {
        const timer =
            window.setInterval(() => {
                setCurrentTime(
                    new Date()
                );
            }, 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        if (!id) {
            return;
        }

        let cancelled = false;

        const loadData = async () => {
            try {
                const [
                    examData,
                    attemptData,
                ] = await Promise.all([
                    getMyExamById(id),
                    getMyExamAttemptsByExamId(id),
                ]);

                if (cancelled) {
                    return;
                }

                setExam(examData);
                setError("");

                setAttemptHistory(
                    attemptData.attempts
                );

                setBestScore(
                    attemptData.bestScore
                );
            } catch (error) {
                console.error(
                    "Gagal mengambil detail exam:",
                    error
                );

                if (!cancelled) {
                    setExam(null);

                    setError(
                        "Gagal mengambil detail exam."
                    );
                }
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

    const handleStartExam = async () => {
        if (!exam) {
            return;
        }

        const activeAttempt =
            attemptHistory.find(
                (attempt) =>
                    attempt.status ===
                    "IN_PROGRESS"
            );

        if (activeAttempt) {
            navigate(
                `/student/exams/attempt/${activeAttempt.id}`
            );

            return;
        }

        try {
            setStarting(true);
            setStartError(null);

            const attempt =
                await startExamAttempt(
                    exam.id
                );

            navigate(
                `/student/exams/attempt/${attempt.id}`
            );
        } catch (error: unknown) {
            console.error(
                "Gagal memulai exam:",
                error
            );

            if (
                axios.isAxiosError(
                    error
                )
            ) {
                console.error(
                    "Response backend:",
                    error.response?.data
                );

                const message =
                    error.response?.data?.message;

                setStartError(
                    typeof message ===
                        "string"
                        ? message
                        : "Gagal memulai exam."
                );
            } else {
                setStartError(
                    "Gagal memulai exam."
                );
            }
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    Memuat detail exam...
                </div>
            </StudentLayout>
        );
    }

    if (error || !exam) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    {error || "Exam tidak ditemukan."}
                </div>
            </StudentLayout>
        );
    }

    const status =
        getExamStatus(
            exam.startAt,
            exam.endAt,
            currentTime
        );

    const isActive =
        status ===
        "SEDANG BERLANGSUNG";

    const hasPassed =
        bestScore !== null &&
        bestScore >= exam.passingScore;

    const attemptCount =
        attemptHistory.length;

    const hasAttempts =
        attemptCount > 0;

    const attemptsRemaining =
        Math.max(
            0,
            exam.maxAttempts -
            attemptCount
        );

    const activeAttempt =
        attemptHistory.find(
            (attempt) =>
                attempt.status ===
                "IN_PROGRESS"
        );

    const hasActiveAttempt =
        Boolean(activeAttempt);

    const blockedAttempt =
        attemptHistory.find(
            (attempt) =>
                attempt.status ===
                "BLOCKED"
        );

    const hasBlockedAttempt =
        Boolean(blockedAttempt);

    const hasRetakeGrant =
        attemptHistory.some(
            (attempt) =>
                attempt.status ===
                "BLOCKED" &&
                attempt.retakeGrantedAt !==
                null &&
                attempt.retakeConsumedAt ===
                null
        );

    const canStartExam =
        isActive &&
        !hasPassed &&
        !hasActiveAttempt &&
        (
            attemptsRemaining > 0 ||
            hasRetakeGrant
        ) &&
        (
            !hasBlockedAttempt ||
            hasRetakeGrant
        );

    const canResumeExam =
        isActive &&
        !hasPassed &&
        hasActiveAttempt;

    const canRetry =
        canResumeExam ||
        canStartExam;

    let startButtonLabel =
        "Start Exam";

    if (starting) {
        startButtonLabel =
            "Memulai...";
    } else if (hasActiveAttempt) {
        startButtonLabel =
            "Lanjutkan Exam";
    } else if (hasRetakeGrant) {
        startButtonLabel =
            "Mulai Ulang";
    } else if (
        status ===
        "BELUM DIMULAI"
    ) {
        startButtonLabel =
            "Belum Dimulai";
    } else if (
        status ===
        "SUDAH BERAKHIR"
    ) {
        startButtonLabel =
            "Exam Berakhir";
    } else if (hasPassed) {
        startButtonLabel =
            "Sudah Lulus";
    } else if (hasBlockedAttempt && attemptsRemaining > 0) {
        startButtonLabel =
            "Exam Diblokir";
    } else if (attemptsRemaining <= 0) {
        startButtonLabel =
            "Percobaan Habis";
    } else if (hasBlockedAttempt) {
        startButtonLabel =
            "Exam Diblokir";
    } else if (hasAttempts) {
        startButtonLabel =
            "Ulangi Exam";
    }

    return (
        <StudentLayout>
            <Link to={`/student/courses/${exam.courseOfferingId}`} className="back-link">
                ← Kembali ke Course
            </Link>

            <section className="exam-detail-card">
                <span className="exam-label">
                    EXAM
                </span>

                <h2>
                    {exam.title}
                </h2>

                {exam.description && (
                    <p className="exam-detail-description">
                        {exam.description}
                    </p>
                )}

                <div className="exam-detail-status">
                    <span className={STATUS_CLASS_MAP[status]}>
                        {status}
                    </span>
                </div>
            </section>

            <section className="exam-detail-info-grid">
                <div className="exam-info-card">
                    <span>
                        Course
                    </span>

                    <strong>
                        {
                            exam
                                .courseOffering
                                .course
                                .code
                        }
                    </strong>

                    <small>
                        {
                            exam
                                .courseOffering
                                .course
                                .name
                        }
                    </small>
                </div>

                <div className="exam-info-card">
                    <span>
                        Jadwal
                    </span>

                    <strong>
                        {formatDate(
                            exam.startAt
                        )}
                    </strong>

                    <small>
                        sampai{" "}
                        {formatDate(
                            exam.endAt
                        )}
                    </small>
                </div>

                <div className="exam-info-card">
                    <span>
                        Durasi
                    </span>

                    <strong>
                        {
                            exam.durationMinutes
                        }{" "}
                        menit
                    </strong>

                    <small>
                        Waktu pengerjaan
                    </small>
                </div>

                <div className="exam-info-card">
                    <span>
                        Maksimal Attempt
                    </span>

                    <strong>
                        {exam.maxAttempts}
                    </strong>

                    <small>
                        Sisa{" "}
                        {attemptsRemaining}{" "}
                        percobaan
                    </small>
                </div>
            </section>

            <section className="exam-action-card">
                <h3>
                    Ketentuan Exam
                </h3>

                <div className="exam-rules">
                    <p>
                        Soal dapat diacak:{" "}
                        <strong>
                            {
                                exam.shuffleQuestions
                                    ? "Ya"
                                    : "Tidak"
                            }
                        </strong>
                    </p>

                    <p>
                        Pilihan jawaban dapat
                        diacak:{" "}
                        <strong>
                            {
                                exam.shuffleAnswers
                                    ? "Ya"
                                    : "Tidak"
                            }
                        </strong>
                    </p>

                    <p>
                        KKM:{" "}
                        <strong>
                            {
                                exam.passingScore
                            }
                        </strong>
                    </p>

                    {bestScore !== null && (
                        <p>
                            Nilai Terbaik:{" "}
                            <strong>
                                {bestScore}
                            </strong>
                        </p>
                    )}

                    {hasPassed && (
                        <p className="exam-action-note">
                            Anda sudah mencapai
                            KKM. Exam tidak dapat
                            diulang lagi.
                        </p>
                    )}

                    {hasActiveAttempt && (
                        <p className="exam-action-note">
                            Anda memiliki attempt
                            yang masih berlangsung.
                            Silakan lanjutkan
                            pengerjaan exam.
                        </p>
                    )}

                    {hasRetakeGrant && (
                        <p className="exam-action-note">
                            Admin telah memberikan
                            izin retake. Anda dapat
                            mengikuti exam kembali.
                        </p>
                    )}

                    {hasBlockedAttempt && (
                        <p className="exam-action-note exam-blocked-note">
                            Ada attempt yang tercatat diblokir. Attempt berstatus ini tidak dapat dikumpulkan;
                            hubungi Admin untuk meminta izin retake.
                        </p>
                    )}

                    {!hasPassed &&
                        hasAttempts &&
                        attemptsRemaining > 0 &&
                        !hasRetakeGrant &&
                        !hasActiveAttempt && (
                            <p className="exam-action-note">
                                Nilai masih di bawah
                                KKM. Anda masih dapat
                                mengulang exam.
                            </p>
                        )}
                </div>

                <button type="button" className={`exam-start-button ${canRetry ? "exam-start-active" : "exam-start-disabled"}`} onClick={handleStartExam} disabled={starting || !canRetry}>
                    {startButtonLabel}
                </button>

                <p className="exam-action-note">
                    {startError ? startError : hasActiveAttempt ? "Klik Lanjutkan Exam untuk melanjutkan attempt yang sedang berlangsung." : hasRetakeGrant ? "Admin telah memberikan izin retake. Klik Mulai Ulang untuk mengikuti exam kembali." : hasBlockedAttempt && attemptsRemaining > 0 ? "Attempt yang diblokir tidak dapat dilanjutkan. Hubungi Admin untuk mendapatkan izin retake." : hasPassed ? "Exam sudah lulus." : !isActive ? "Exam tidak dapat dimulai saat ini." : attemptsRemaining <= 0 ? "Jumlah percobaan sudah habis." : hasBlockedAttempt ? "Ada attempt yang diblokir. Hubungi Admin jika Anda memerlukan izin retake." : hasAttempts ? "Nilai belum mencapai KKM, silakan ulangi exam." : "Klik Start Exam untuk memulai pengerjaan ujian."}
                </p>
            </section>

            {attemptHistory.length > 0 && (
                <section className="admin-card student-exam-attempt-history">
                    <div className="student-section-heading">
                        <div>
                            <h2>Riwayat Attempt</h2>
                            <p>Status setiap percobaan agar attempt yang diblokir tidak tertukar dengan yang sudah dikumpulkan.</p>
                        </div>
                    </div>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Attempt</th>
                                    <th>Mulai</th>
                                    <th>Dikumpulkan</th>
                                    <th>Status</th>
                                    <th>Nilai</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {attemptHistory.map((attempt) => (
                                    <tr key={attempt.id}>
                                        <td>#{attempt.attemptNumber}</td>
                                        <td>{formatDate(attempt.startedAt)}</td>
                                        <td>{attempt.submittedAt ? formatDate(attempt.submittedAt) : "—"}</td>
                                        <td>
                                            <span className={`admin-status ${ATTEMPT_STATUS_CLASS[attempt.status]}`}>
                                                {ATTEMPT_STATUS_LABEL[attempt.status]}
                                            </span>
                                        </td>
                                        <td>{attempt.percentage === null ? "—" : `${attempt.percentage.toFixed(2)}%`}</td>
                                        <td>
                                            {(attempt.status === "SUBMITTED" || attempt.status === "EXPIRED") && (
                                                <Link
                                                    to={`/student/exams/result/${attempt.id}`}
                                                    className="student-result-link"
                                                >
                                                    Lihat hasil
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </StudentLayout>
    );
};

export default StudentExamDetailPage;