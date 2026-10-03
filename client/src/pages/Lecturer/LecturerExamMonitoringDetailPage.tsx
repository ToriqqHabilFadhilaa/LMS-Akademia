import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getExamAttemptsByExamId } from "../../services/exam-attempt.service";
import { getActivityLogsByAttemptId, type ActivityLog } from "../../services/activity-log.service";

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
    student: { id: string; name: string; email: string };
    riskScore: { score: number; riskLevel: RiskLevel; calculatedAt: string; updatedAt: string } | null;
};

type MonitoringResponse = {
    exam: {
        id: string;
        title: string;
        courseOffering: {
            id: string;
            lecturerId: string;
            course: { id: string; code: string; name: string };
        };
    };
    attempts: MonitoringAttempt[];
};

const STATUS_CONFIG: Record<MonitoringStatus, { label: string; className: string }> = {
    IN_PROGRESS: { label: "Sedang Mengerjakan", className: "exam-monitoring-detail-status-active" },
    SUBMITTED: { label: "Submitted", className: "exam-monitoring-detail-status-submitted" },
    EXPIRED: { label: "Expired", className: "exam-monitoring-detail-status-expired" },
    BLOCKED: { label: "Blocked", className: "exam-monitoring-detail-status-blocked" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string; className: string }> = {
    LOW: { label: "Low", className: "exam-monitoring-detail-risk-low" },
    MEDIUM: { label: "Medium", className: "exam-monitoring-detail-risk-medium" },
    HIGH: { label: "High", className: "exam-monitoring-detail-risk-high" },
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

const ACTIVITY_DESC: Record<string, string> = {
    TAB_SWITCH: "Student berpindah dari halaman ujian.",
    WINDOW_BLUR: "Jendela ujian kehilangan fokus.",
    FULLSCREEN_EXIT: "Student keluar dari mode fullscreen.",
    COPY: "Student mencoba menyalin teks.",
    PASTE: "Student mencoba menempelkan teks.",
    REFRESH: "Halaman ujian dimuat ulang.",
    MULTIPLE_SESSION: "Terdeteksi lebih dari satu sesi ujian.",
    CONNECTION_LOST: "Koneksi ke server terputus.",
};

const formatDate = (value: string | null) =>
    value
        ? new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
        : "-";

const summarizeAttempts = (attempts: MonitoringAttempt[]) =>
    attempts.reduce(
        (s, a) => {
            if (a.status === "IN_PROGRESS") s.inProgress += 1;
            if (a.status === "SUBMITTED") s.submitted += 1;
            if (a.status === "EXPIRED") s.expired += 1;
            if (a.status === "BLOCKED") s.blocked += 1;
            if (a.riskScore?.riskLevel === "HIGH") s.highRisk += 1;
            return s;
        },
        { inProgress: 0, submitted: 0, expired: 0, blocked: 0, highRisk: 0 }
    );

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
    <div className="admin-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const BackLink = () => (
    <Link to="/lecturer/exam-monitoring" className="exam-monitoring-detail-back">
        ← Kembali ke Monitoring
    </Link>
);

const AttemptRow = ({
    attempt,
    onViewActivity,
    activityOpen,
}: {
    attempt: MonitoringAttempt;
    onViewActivity: (attemptId: string) => void;
    activityOpen: boolean;
}) => {
    const statusCfg = STATUS_CONFIG[attempt.status];
    const riskCfg = attempt.riskScore ? RISK_CONFIG[attempt.riskScore.riskLevel] : null;

    return (
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
                <span className={`exam-monitoring-detail-badge ${statusCfg.className}`}>
                    {statusCfg.label}
                </span>
            </td>
            <td>
                {riskCfg ? (
                    <span className={`exam-monitoring-detail-badge ${riskCfg.className}`}>
                        {riskCfg.label}
                    </span>
                ) : "-"}
            </td>
            <td>{attempt.riskScore?.score ?? "-"}</td>
            <td>
                <div className="exam-monitoring-detail-actions">
                    {/* Lecturer hanya bisa lihat status retake, tidak bisa grant */}
                    {attempt.status === "BLOCKED" && (
                        <span className="exam-monitoring-retake-status" style={{
                            background: attempt.retakeGrantedAt
                                ? attempt.retakeConsumedAt ? "#f3f4f6" : "#dcfce7"
                                : "#fee2e2",
                            color: attempt.retakeGrantedAt
                                ? attempt.retakeConsumedAt ? "#6b7280" : "#16a34a"
                                : "#b91c1c",
                        }}>
                            {attempt.retakeGrantedAt === null
                                ? "Blocked"
                                : attempt.retakeConsumedAt === null
                                    ? "Retake Diizinkan"
                                    : "Retake Digunakan"}
                        </span>
                    )}
                    <button
                        type="button"
                        className="exam-monitoring-activity-button"
                        onClick={() => onViewActivity(attempt.id)}
                        style={{ background: activityOpen ? "#f3f4f6" : "#eff6ff", color: activityOpen ? "#374151" : "#2563eb" }}
                    >
                        {activityOpen ? "Tutup Aktivitas" : "Lihat Aktivitas"}
                    </button>
                </div>
            </td>
        </tr>
    );
};

const LecturerExamMonitoringDetailPage = () => {
    const { examId } = useParams<{ examId: string }>();

    const [data, setData] = useState<MonitoringResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);

    useEffect(() => {
        if (!examId) return;
        let cancelled = false;

        const load = async () => {
            try {
                const result = await getExamAttemptsByExamId(examId);
                if (!cancelled) setData(result);
            } catch {
                if (!cancelled) setError("Gagal mengambil detail monitoring exam.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [examId]);

    const handleRefresh = async () => {
        if (!examId) return;
        try {
            setError("");
            setData(await getExamAttemptsByExamId(examId));
        } catch {
            setError("Data monitoring gagal diperbarui.");
        }
    };

    const handleViewActivity = async (attemptId: string) => {
        if (selectedAttemptId === attemptId) {
            setSelectedAttemptId(null);
            setActivityLogs([]);
            return;
        }
        try {
            setSelectedAttemptId(attemptId);
            setActivityLoading(true);
            setActivityLogs([]);
            setActivityLogs(await getActivityLogsByAttemptId(attemptId));
        } catch {
            setError("Activity log gagal diambil.");
        } finally {
            setActivityLoading(false);
        }
    };

    if (!examId) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <BackLink />
                    <div className="exam-monitoring-detail-alert">Exam ID tidak ditemukan.</div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container"><p>Memuat detail monitoring...</p></div>
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

    if (!data) return null;

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

                {error && <div className="exam-monitoring-detail-alert">{error}</div>}

                <div className="exam-monitoring-detail-header">
                    <span className="exam-monitoring-detail-code">
                        {data.exam.courseOffering.course.code}
                    </span>
                    <h1>{data.exam.title}</h1>
                    <p>{data.exam.courseOffering.course.name}</p>
                </div>

                <div className="exam-monitoring-detail-summary">
                    <SummaryCard label="Total Attempt" value={attempts.length} />
                    <SummaryCard label="Sedang Mengerjakan" value={summary.inProgress} />
                    <SummaryCard label="Submitted" value={summary.submitted} />
                    <SummaryCard label="High Risk" value={summary.highRisk} />
                    <SummaryCard label="Blocked" value={summary.blocked} />
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
                        <div className="admin-empty">Belum ada mahasiswa yang mengikuti exam.</div>
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
                                        <AttemptRow
                                            key={attempt.id}
                                            attempt={attempt}
                                            onViewActivity={handleViewActivity}
                                            activityOpen={selectedAttemptId === attempt.id}
                                        />
                                    ))}
                                </tbody>
                            </table>

                            {selectedAttemptId && (
                                <div className="exam-monitoring-activity-panel">
                                    <div className="exam-monitoring-activity-header">
                                        <h3>Activity Log</h3>
                                        <p>Riwayat aktivitas proctoring attempt.</p>
                                    </div>

                                    {activityLoading ? (
                                        <p>Memuat activity log...</p>
                                    ) : activityLogs.length === 0 ? (
                                        <div className="admin-empty">Belum ada aktivitas tercatat.</div>
                                    ) : (
                                        <div className="exam-monitoring-activity-list">
                                            {activityLogs.map((activity) => (
                                                <div key={activity.id} className="exam-monitoring-activity-item">
                                                    <div className="exam-monitoring-activity-main">
                                                        <div>
                                                            <strong>
                                                                {ACTIVITY_LABELS[activity.eventType] ?? activity.eventType}
                                                            </strong>
                                                            <p>{ACTIVITY_DESC[activity.eventType] ?? "Aktivitas ujian terdeteksi."}</p>
                                                        </div>
                                                        <span>
                                                            {new Date(activity.occurredAt).toLocaleString("id-ID", {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                            })}
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

export default LecturerExamMonitoringDetailPage;
