import { useEffect, useState } from "react";
import { getCourseOfferings } from "../../services/course-offering.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import { getExamReportByExamId, type ExamReport } from "../../services/exam-result.service";
import type { Exam } from "../../types/course";

type ReportAttempt = ExamReport["attempts"][number];

const ATTEMPT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    IN_PROGRESS: { label: "Sedang Mengerjakan", className: "admin-status-active" },
    SUBMITTED: { label: "Selesai", className: "admin-status-success" },
    EXPIRED: { label: "Expired", className: "admin-status-expired" },
    BLOCKED: { label: "Diblokir", className: "admin-status-blocked" },
};

const RISK_CLASS: Record<string, string> = {
    LOW: "admin-risk-low",
    MEDIUM: "admin-risk-medium",
    HIGH: "admin-risk-high",
};

const formatDate = (value: string | null): string => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString("id-ID");
};

const formatScore = (value: number | null): string => {
    if (value === null) {
        return "-";
    }

    return value.toFixed(2);
};

const SummaryCard = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div className="admin-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const AttemptStatusBadge = ({ status }: { status: string }) => {
    const config = ATTEMPT_STATUS_CONFIG[status];

    return (
        <span className={`admin-status ${config?.className ?? ""}`}>
            {config?.label ?? status}
        </span>
    );
};

const RiskCell = ({ riskScore }: { riskScore: ReportAttempt["riskScore"] }) => {
    if (!riskScore) {
        return <>-</>;
    }

    return (
        <div className="admin-risk-cell">
            <strong>{riskScore.score}</strong>
            <span className={`admin-risk ${RISK_CLASS[riskScore.riskLevel] ?? ""}`}>
                {riskScore.riskLevel}
            </span>
        </div>
    );
};

const AttemptRow = ({ attempt }: { attempt: ReportAttempt }) => (
    <tr>
        <td>
            <div className="admin-reports-student">
                <span className="admin-reports-student-name">
                    {attempt.student.name}
                </span>
                <span className="admin-reports-student-email">
                    {attempt.student.email}
                </span>
            </div>
        </td>

        <td>#{attempt.attemptNumber}</td>
        <td>{formatDate(attempt.startedAt)}</td>
        <td>{formatDate(attempt.submittedAt)}</td>

        <td>
            <AttemptStatusBadge status={attempt.status} />
        </td>

        <td>{formatScore(attempt.score)}</td>

        <td>
            <RiskCell riskScore={attempt.riskScore} />
        </td>
    </tr>
);

const AdminReportsPage = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExamId, setSelectedExamId] = useState("");
    const [report, setReport] = useState<ExamReport | null>(null);

    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError("");

                const offerings = await getCourseOfferings();
                const examResults = await Promise.all(
                    offerings.map((offering) =>
                        getExamsByCourseOfferingId(offering.id)
                    )
                );

                if (cancelled) {
                    return;
                }

                setExams(examResults.flat());
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil data reports:", err);
                setError("Gagal mengambil daftar exam.");
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

    const handleExamChange = async (examId: string) => {
        setSelectedExamId(examId);
        setReport(null);

        if (!examId) {
            return;
        }

        try {
            setReportLoading(true);
            setError("");

            setReport(await getExamReportByExamId(examId));
        } catch (err) {
            console.error("Gagal mengambil report exam:", err);
            setError("Gagal mengambil report exam.");
        } finally {
            setReportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat data reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Reports</h1>
                        <p>
                            Rekap hasil exam, nilai, status attempt, dan risiko
                            proctoring.
                        </p>
                    </div>
                </div>

                {error && <div className="admin-reports-alert-error">{error}</div>}

                <div className="admin-card">
                    <div className="admin-reports-filter">
                        <label htmlFor="report-exam">Pilih Exam</label>

                        <select id="report-exam" value={selectedExamId} onChange={(event) => void handleExamChange(event.target.value)}>
                            <option value="">Pilih Exam</option>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {reportLoading && (
                    <div className="admin-empty">Memuat report exam...</div>
                )}

                {report && !reportLoading && (
                    <>
                        <div className="admin-card">
                            <h2 className="admin-reports-title">{report.exam.title}</h2>

                            <p className="admin-reports-subtitle">
                                {report.exam.courseOffering.course.code} -{" "}
                                {report.exam.courseOffering.course.name}
                            </p>

                            <p className="admin-reports-subtitle">
                                Term {report.exam.courseOffering.term} • Section{" "}
                                {report.exam.courseOffering.section}
                            </p>
                        </div>

                        <div className="admin-summary-grid admin-reports-summary">
                            <SummaryCard label="Total Attempt" value={report.summary.totalAttempts} />
                            <SummaryCard label="Submitted" value={report.summary.submitted} />
                            <SummaryCard label="Rata-rata Nilai" value={formatScore(report.summary.averageScore)} />
                            <SummaryCard label="Lulus" value={report.summary.passed} />
                            <SummaryCard label="Tidak Lulus" value={report.summary.failed} />
                            <SummaryCard label="Blocked" value={report.summary.blocked} />
                        </div>

                        <div className="admin-card">
                            <h2 className="admin-reports-title">Risk Proctoring</h2>
                            <p className="admin-reports-subtitle">
                                Skor berasal dari sinyal browser yang dilaporkan client; ini petunjuk untuk review,
                                bukan bukti pelanggaran yang terverifikasi.
                            </p>

                            <div className="admin-summary-grid admin-reports-risk-summary">
                                <SummaryCard label="Low" value={report.risk.low} />
                                <SummaryCard label="Medium" value={report.risk.medium} />
                                <SummaryCard label="High" value={report.risk.high} />
                            </div>
                        </div>

                        <div className="admin-card">
                            <h2 className="admin-reports-title">Detail Student</h2>

                            {report.attempts.length === 0 ? (
                                <div className="admin-empty">
                                    Belum ada attempt untuk exam ini.
                                </div>
                            ) : (
                                <div className="admin-table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Attempt</th>
                                                <th>Mulai</th>
                                                <th>Submit</th>
                                                <th>Status</th>
                                                <th>Nilai</th>
                                                <th>Risk</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {report.attempts.map((attempt) => (
                                                <AttemptRow key={attempt.id} attempt={attempt} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminReportsPage;