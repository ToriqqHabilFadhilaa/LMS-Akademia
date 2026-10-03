import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCourseOfferings } from "../../services/course-offering.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import { getExamAttemptsByExamId } from "../../services/exam-attempt.service";

type MonitoringStatus = "UPCOMING" | "LIVE" | "ENDED";

type MonitoringExam = {
    id: string;
    title: string;
    courseName: string;
    courseCode: string;
    term: string;
    section: string;
    startAt: string;
    endAt: string;
    status: MonitoringStatus;
    totalAttempts: number;
    inProgress: number;
    submitted: number;
    expired: number;
    blocked: number;
    highRisk: number;
};

const MONITORING_STATUS_CONFIG: Record<
    MonitoringStatus,
    { label: string; className: string }
> = {
    LIVE: { label: "Sedang Berlangsung", className: "exam-monitoring-status-live" },
    UPCOMING: { label: "Akan Datang", className: "exam-monitoring-status-upcoming" },
    ENDED: { label: "Selesai", className: "exam-monitoring-status-ended" },
};

const getMonitoringStatus = (
    startAt: string,
    endAt: string
): MonitoringStatus => {
    const now = Date.now();
    const start = new Date(startAt).getTime();
    const end = new Date(endAt).getTime();

    if (now < start) return "UPCOMING";
    if (now > end) return "ENDED";
    return "LIVE";
};

const formatDate = (value: string): string => {
    return new Date(value).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const loadMonitoringData = async (): Promise<MonitoringExam[]> => {
    const offerings = await getCourseOfferings();

    const examGroups = await Promise.all(
        offerings.map(async (offering) => {
            const offeringExams = await getExamsByCourseOfferingId(offering.id);
            return offeringExams.map((exam) => ({ exam, offering }));
        })
    );

    const examItems = examGroups.flat();

    return Promise.all(
        examItems.map(async ({ exam, offering }) => {
            const monitoring = await getExamAttemptsByExamId(exam.id);
            const attempts = monitoring.attempts;

            return {
                id: exam.id,
                title: exam.title,
                courseName: offering.course.name,
                courseCode: offering.course.code,
                term: offering.term,
                section: offering.section,
                startAt: exam.startAt,
                endAt: exam.endAt,
                status: getMonitoringStatus(exam.startAt, exam.endAt),
                totalAttempts: attempts.length,
                inProgress: attempts.filter((a) => a.status === "IN_PROGRESS").length,
                submitted: attempts.filter((a) => a.status === "SUBMITTED").length,
                expired: attempts.filter((a) => a.status === "EXPIRED").length,
                blocked: attempts.filter((a) => a.status === "BLOCKED").length,
                highRisk: attempts.filter((a) => a.riskScore?.riskLevel === "HIGH")
                    .length,
            };
        })
    );
};

const ExamMonitoringCard = ({ exam }: { exam: MonitoringExam }) => {
    const status = MONITORING_STATUS_CONFIG[exam.status];

    return (
        <div className="exam-monitoring-card">
            <div>
                <div className="exam-monitoring-card-header">
                    <div>
                        <span className="exam-monitoring-course-code">
                            {exam.courseCode}
                        </span>
                        <h3>{exam.title}</h3>
                    </div>

                    <span className={`exam-monitoring-status ${status.className}`}>
                        {status.label}
                    </span>
                </div>

                <p className="exam-monitoring-course">
                    {exam.courseName} • {exam.term} • Section {exam.section}
                </p>

                <div className="exam-monitoring-time">
                    <span>Mulai: {formatDate(exam.startAt)}</span>
                    <span>Selesai: {formatDate(exam.endAt)}</span>
                </div>

                <div className="exam-monitoring-metrics">
                    <span>{exam.totalAttempts} Attempt</span>
                    <span>{exam.inProgress} Aktif</span>
                    <span>{exam.submitted} Submitted</span>
                    <span>{exam.blocked} Blocked</span>
                    <span>{exam.highRisk} High Risk</span>
                </div>
            </div>

            <div className="exam-monitoring-card-action">
                <Link to={`/admin/exam-monitoring/${exam.id}`} className="exam-monitoring-view-button">
                    Lihat Monitoring
                </Link>
            </div>
        </div>
    );
};

const AdminExamMonitoringOverviewPage = () => {
    const [exams, setExams] = useState<MonitoringExam[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError("");

                const data = await loadMonitoringData();

                if (cancelled) {
                    return;
                }

                setExams(data);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil monitoring exam:", err);
                setError("Gagal mengambil data monitoring exam.");
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
    }, []);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError("");

            setExams(await loadMonitoringData());
        } catch (err) {
            console.error("Gagal refresh monitoring:", err);
            setError("Data monitoring gagal diperbarui.");
        } finally {
            setRefreshing(false);
        }
    };

    const summary = useMemo(
        () => ({
            live: exams.filter((exam) => exam.status === "LIVE").length,
            inProgress: exams.reduce((total, exam) => total + exam.inProgress, 0),
            highRisk: exams.reduce((total, exam) => total + exam.highRisk, 0),
            blocked: exams.reduce((total, exam) => total + exam.blocked, 0),
        }),
        [exams]
    );

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat exam monitoring...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Exam Monitoring</h1>
                        <p>
                            Pantau pelaksanaan exam, attempt student, dan risiko
                            proctoring.
                        </p>
                    </div>

                    <button type="button" className="exam-monitoring-primary-button" onClick={() => void handleRefresh()} disabled={refreshing}>
                        {refreshing ? "Memperbarui..." : "Refresh"}
                    </button>
                </div>

                {error && (
                    <div className="exam-monitoring-alert-error">{error}</div>
                )}

                <div className="exam-monitoring-summary">
                    <div className="admin-summary-card">
                        <span>Exam Aktif</span>
                        <strong>{summary.live}</strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>Sedang Mengerjakan</span>
                        <strong>{summary.inProgress}</strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>High Risk</span>
                        <strong>{summary.highRisk}</strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>Blocked</span>
                        <strong>{summary.blocked}</strong>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Daftar Exam</h2>
                            <p>Monitoring seluruh exam yang tersedia.</p>
                        </div>
                    </div>

                    {exams.length === 0 ? (
                        <div className="admin-empty">Belum ada exam.</div>
                    ) : (
                        <div className="exam-monitoring-list">
                            {exams.map((exam) => (
                                <ExamMonitoringCard key={exam.id} exam={exam} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminExamMonitoringOverviewPage;