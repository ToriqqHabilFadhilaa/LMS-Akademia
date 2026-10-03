import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getExamAttemptsByExamId, grantExamRetake } from "../../services/exam-attempt.service";
import { getActivityLogsByAttemptId, type ActivityLog } from "../../services/activity-log.service";
import axios from "axios";
type MonitoringStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED" | "BLOCKED";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type MonitoringAttempt = {
    id: string;
    studentId: string;
    attemptNumber: number;
    startedAt: string;
    submittedAt: string | null;
    status: MonitoringStatus;
    retakeGrantedAt: string | null;
    retakeConsumedAt: string | null;

    student: {
        id: string;
        name: string;
        email: string;
    };

    riskScore: {
        score: number;
        riskLevel: RiskLevel;
        calculatedAt: string;
        updatedAt: string;
    } | null;
};

type MonitoringResponse = {
    exam: {
        id: string;
        title: string;

        courseOffering: {
            id: string;
            lecturerId: string;

            course: {
                id: string;
                code: string;
                name: string;
            };
        };
    };

    attempts: MonitoringAttempt[];
};

const STATUS_CONFIG: Record<MonitoringStatus, { label: string; className: string }> = {
    IN_PROGRESS: {
        label: "Sedang Mengerjakan",
        className: "exam-monitoring-detail-status-active",
    },
    SUBMITTED: {
        label: "Submitted",
        className: "exam-monitoring-detail-status-submitted",
    },
    EXPIRED: {
        label: "Expired",
        className: "exam-monitoring-detail-status-expired",
    },
    BLOCKED: {
        label: "Blocked",
        className: "exam-monitoring-detail-status-blocked",
    },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
    LOW: { label: "Low", className: "exam-monitoring-detail-risk-low" },
    MEDIUM: { label: "Medium", className: "exam-monitoring-detail-risk-medium" },
    HIGH: { label: "High", className: "exam-monitoring-detail-risk-high" },
};

const fetchMonitoringDetail = async (
    examId: string
): Promise<MonitoringResponse> => {
    return getExamAttemptsByExamId(examId);
};

const formatDate = (value: string | null): string => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const summarizeAttempts = (attempts: MonitoringAttempt[]) =>
    attempts.reduce(
        (summary, attempt) => {
            if (attempt.status === "IN_PROGRESS") summary.inProgress += 1;
            if (attempt.status === "SUBMITTED") summary.submitted += 1;
            if (attempt.status === "EXPIRED") summary.expired += 1;
            if (attempt.status === "BLOCKED") summary.blocked += 1;
            if (attempt.riskScore?.riskLevel === "HIGH") summary.highRisk += 1;

            return summary;
        },
        { inProgress: 0, submitted: 0, expired: 0, blocked: 0, highRisk: 0 }
    );

const SummaryCard = ({
    label,
    value,
}: {
    label: string;
    value: number;
}) => (
    <div className="admin-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const StatusBadge = ({ status }: { status: MonitoringStatus }) => {
    const config = STATUS_CONFIG[status];

    return (
        <span className={`exam-monitoring-detail-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

const RiskBadge = ({
    riskScore,
}: {
    riskScore: MonitoringAttempt["riskScore"];
}) => {
    if (!riskScore) {
        return <>-</>;
    }

    const config = RISK_CONFIG[riskScore.riskLevel];

    return (
        <span className={`exam-monitoring-detail-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

const ACTIVITY_LABELS: Record<string, string> = {
    TAB_SWITCH: "Pindah Tab",
    WINDOW_BLUR: "Keluar dari Fokus Ujian",
    FULLSCREEN_EXIT: "Keluar Fullscreen",
    COPY: "Menyalin Teks",
    PASTE: "Menempelkan Teks",
    REFRESH: "Refresh Halaman",
    MULTIPLE_SESSION: "Sesi Ganda",
    CONNECTION_LOST: "Koneksi Terputus",
};

const getActivityDescription = (
    activity: ActivityLog
): string => {
    switch (activity.eventType) {
        case "TAB_SWITCH":
            return "Student berpindah dari halaman ujian.";

        case "WINDOW_BLUR":
            return "Jendela ujian kehilangan fokus.";

        case "FULLSCREEN_EXIT":
            return "Student keluar dari mode fullscreen.";

        case "COPY":
            return "Student mencoba menyalin teks.";

        case "PASTE":
            return "Student mencoba menempelkan teks.";

        case "REFRESH":
            return "Halaman ujian dimuat ulang.";

        case "MULTIPLE_SESSION":
            return "Terdeteksi lebih dari satu sesi ujian.";

        case "CONNECTION_LOST":
            return "Koneksi ke server terputus.";

        default:
            return "Aktivitas ujian terdeteksi.";
    }
};

const AttemptRow = ({
    attempt,
    onGrantRetake,
    grantingRetakeId,
    onViewActivity,
    activityOpen,
}: {
    attempt: MonitoringAttempt;
    onGrantRetake: (
        attemptId: string
    ) => void;
    grantingRetakeId: string | null;
    onViewActivity: (
        attemptId: string
    ) => void;
    activityOpen: boolean;
}) => (
    <tr>
        <td>
            <div className="exam-monitoring-detail-student">
                <strong>{attempt.student.name}</strong>
                <span>{attempt.student.email}</span>
            </div>
        </td>

        <td>#{attempt.attemptNumber}</td>

        <td>{formatDate(attempt.startedAt)}</td>

        <td>{formatDate(attempt.submittedAt)}</td>

        <td>
            <StatusBadge status={attempt.status} />
        </td>

        <td>
            <RiskBadge riskScore={attempt.riskScore} />
        </td>

        <td>
            {attempt.riskScore?.score ?? "-"}
        </td>

        <td>
            <div className="exam-monitoring-detail-actions">
                {attempt.status === "BLOCKED" && (
                    <>
                        {attempt.retakeGrantedAt === null ? (
                            <button type="button" className="exam-monitoring-retake-button" onClick={() => onGrantRetake(attempt.id)} disabled={grantingRetakeId === attempt.id}>
                                {grantingRetakeId === attempt.id ? "Memproses..." : "Izinkan Ulang"}
                            </button>
                        ) : attempt.retakeConsumedAt === null ? (
                            <span className="exam-monitoring-retake-status">
                                Retake Diizinkan
                            </span>
                        ) : (
                            <span className="exam-monitoring-retake-status">
                                Retake Sudah Digunakan
                            </span>
                        )}
                    </>
                )}
                <button type="button" className="exam-monitoring-activity-button" onClick={() => onViewActivity(attempt.id)}>
                    {activityOpen ? "Tutup Aktivitas" : "Lihat Aktivitas"}
                </button>
            </div>
        </td>
    </tr>
);

const BackLink = () => (
    <Link to="/admin/exam-monitoring" className="exam-monitoring-detail-back">
        ← Kembali ke Monitoring
    </Link>
);

const AdminExamMonitoringDetailPage = () => {
    const { examId } = useParams<{ examId: string }>();

    const [data, setData] = useState<MonitoringResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [grantingRetakeId, setGrantingRetakeId] = useState<string | null>(null);
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    useEffect(() => {
        if (!examId) {
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                const result = await getExamAttemptsByExamId(examId);

                if (cancelled) {
                    return;
                }

                setData(result);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil detail monitoring:", err);
                setError("Gagal mengambil detail monitoring exam.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [examId]);

    const handleRefresh = async () => {
        if (!examId) {
            return;
        }

        try {
            setError("");
            setData(await getExamAttemptsByExamId(examId));
        } catch (err) {
            console.error("Gagal refresh monitoring:", err);
            setError("Data monitoring gagal diperbarui.");
        }
    };

    const handleGrantRetake = async (
        attemptId: string
    ) => {
        try {
            setGrantingRetakeId(attemptId);
            setError("");

            await grantExamRetake(attemptId);

            const result =
                await fetchMonitoringDetail(examId!);

            setData(result);
        } catch (err) {
            console.error(
                "Gagal memberikan retake:",
                err
            );

            if (axios.isAxiosError(err)) {
                console.error(
                    "Response backend:",
                    err.response?.data
                );

                setError(
                    err.response?.data?.message ??
                    "Retake gagal diberikan."
                );
            } else {
                setError("Retake gagal diberikan.");
            }
        }
    };

    const handleViewActivity = async (
        attemptId: string
    ) => {
        if (selectedAttemptId === attemptId) {
            setSelectedAttemptId(null);
            setActivityLogs([]);
            return;
        }

        try {
            setSelectedAttemptId(attemptId);
            setActivityLoading(true);
            setActivityLogs([]);

            const logs =
                await getActivityLogsByAttemptId(
                    attemptId
                );

            setActivityLogs(logs);
        } catch (err) {
            console.error(
                "Gagal mengambil activity log:",
                err
            );

            setError(
                "Activity log gagal diambil."
            );
        } finally {
            setActivityLoading(false);
        }
    };

    if (!examId) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <BackLink />
                    <div className="exam-monitoring-detail-alert">
                        Exam ID tidak ditemukan.
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat detail monitoring...</p>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <BackLink />
                    <div className="exam-monitoring-detail-alert">{error}</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const attempts = data.attempts;
    const summary = summarizeAttempts(attempts);

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="exam-monitoring-detail-top">
                    <BackLink />

                    <button type="button" className="exam-monitoring-detail-refresh" onClick={() => void handleRefresh()}>
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="exam-monitoring-detail-alert">{error}</div>
                )}

                <div className="exam-monitoring-detail-header">
                    <div>
                        <span className="exam-monitoring-detail-code">
                            {data.exam.courseOffering.course.code}
                        </span>

                        <h1>{data.exam.title}</h1>
                        <p>{data.exam.courseOffering.course.name}</p>
                    </div>
                </div>

                <div className="exam-monitoring-detail-summary">
                    <SummaryCard label="Total Attempt" value={attempts.length} />
                    <SummaryCard label="Sedang Mengerjakan" value={summary.inProgress} />
                    <SummaryCard label="Submitted" value={summary.submitted} />
                    <SummaryCard label="High Risk" value={summary.highRisk} />
                    <SummaryCard label="Blocked" value={summary.blocked} />
                </div>

                <div className="exam-monitoring-detail-secondary-summary">
                    <span>Expired: {summary.expired}</span>
                    <span>Total peserta attempt: {attempts.length}</span>
                </div>

                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Attempt Peserta</h2>
                            <p>Detail attempt dan sinyal proctoring dari browser peserta.</p>
                        </div>
                    </div>
                    <div className="admin-alert student-info-alert" role="note">
                        Sinyal browser dan risk score dapat dimanipulasi atau keliru; gunakan sebagai petunjuk
                        untuk review, bukan bukti tunggal atau dasar pemblokiran otomatis.
                    </div>

                    {attempts.length === 0 ? (
                        <div className="admin-empty">
                            Belum ada mahasiswa yang mengikuti exam.
                        </div>
                    ) : (
                        <div className="exam-monitoring-detail-table-wrapper">
                            <table className="exam-monitoring-detail-table">
                                <thead>
                                    <tr>
                                        <th>Mahasiswa</th>
                                        <th>Attempt</th>
                                        <th>Mulai</th>
                                        <th>Selesai</th>
                                        <th>Status</th>
                                        <th>Risk</th>
                                        <th>Risk Score</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {attempts.map((attempt) => (
                                        <AttemptRow key={attempt.id} attempt={attempt} onGrantRetake={handleGrantRetake} grantingRetakeId={grantingRetakeId} onViewActivity={handleViewActivity} activityOpen={selectedAttemptId === attempt.id} />
                                    ))}
                                </tbody>
                            </table>

                            {selectedAttemptId && (
                                <div className="exam-monitoring-activity-panel">
                                    <div className="exam-monitoring-activity-header">
                                        <div>
                                            <h3>
                                                Activity Log
                                            </h3>
                                            <p>
                                                Riwayat aktivitas
                                                proctoring attempt.
                                            </p>
                                        </div>
                                    </div>

                                    {activityLoading ? (
                                        <p>
                                            Memuat activity log...
                                        </p>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="admin-empty">
                                            Belum ada aktivitas
                                            tercatat.
                                        </div>
                                    ) : (
                                        <div className="exam-monitoring-activity-list">
                                            {activityLogs.map((activity) => (
                                                <div
                                                    key={activity.id}
                                                    className="exam-monitoring-activity-item"
                                                >
                                                    <div className="exam-monitoring-activity-main">
                                                        <div>
                                                            <strong>
                                                                {ACTIVITY_LABELS[
                                                                    activity.eventType
                                                                ] ??
                                                                    activity.eventType}
                                                            </strong>

                                                            <p>
                                                                {getActivityDescription(
                                                                    activity
                                                                )}
                                                            </p>
                                                        </div>

                                                        <span>
                                                            {new Date(
                                                                activity.occurredAt
                                                            ).toLocaleString(
                                                                "id-ID",
                                                                {
                                                                    dateStyle: "medium",
                                                                    timeStyle: "short",
                                                                }
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminExamMonitoringDetailPage;