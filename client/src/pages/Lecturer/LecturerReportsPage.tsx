import { useEffect, useState } from "react";

import { getLecturerCourseOfferings } from "../../services/course-offering.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import { getExamReportByExamId } from "../../services/exam-result.service";
import type { Exam } from "../../types/course";
import type { ExamReport } from "../../services/exam-result.service";

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
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID");
};

const formatScore = (value: number | null): string => {
    if (value === null) return "-";
    return value.toFixed(2);
};

const LecturerReportsPage = () => {
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
                setLoading(true);
                setError("");

                const offerings = await getLecturerCourseOfferings();
                if (cancelled) return;

                const examCollections = await Promise.all(
                    offerings.map((offering) => getExamsByCourseOfferingId(offering.id))
                );

                if (cancelled) return;

                const allExams = examCollections.flat();
                setExams(allExams);

                if (allExams[0]) {
                    setSelectedExamId(allExams[0].id);
                    setReport(await getExamReportByExamId(allExams[0].id));
                }
            } catch {
                if (!cancelled) {
                    setError("Gagal mengambil data report lecturer.");
                }
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

        if (!examId) return;

        try {
            setReportLoading(true);
            setError("");
            setReport(await getExamReportByExamId(examId));
        } catch {
            setError("Gagal mengambil detail report exam.");
        } finally {
            setReportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat reports lecturer...</p>
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
                        <p>Rekap hasil ujian, status attempt, serta tingkat risiko proctoring.</p>
                    </div>
                </div>

                {error && <div className="admin-reports-alert-error">{error}</div>}

                <div className="admin-card">
                    <div className="admin-reports-filter">
                        <label htmlFor="lecturer-report-exam">Pilih Exam</label>
                        <select
                            id="lecturer-report-exam"
                            value={selectedExamId}
                            onChange={(event) => void handleExamChange(event.target.value)}
                        >
                            <option value="">Pilih Exam</option>
                            {exams.map((exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {reportLoading && <div className="admin-empty">Memuat report exam...</div>}

                {report && !reportLoading && (
                    <>
                        <div className="admin-section">
                            <div className="admin-section-header">
                                <div>
                                    <h2>{report.exam.title}</h2>
                                    <p>
                                        {report.exam.courseOffering.course.code} • {report.exam.courseOffering.course.name}
                                    </p>
                                </div>
                            </div>

                            <div className="admin-summary" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                                <div className="admin-summary-card">
                                    <span>Total Attempt</span>
                                    <strong>{report.summary.totalAttempts}</strong>
                                </div>
                                <div className="admin-summary-card">
                                    <span>Submitted</span>
                                    <strong>{report.summary.submitted}</strong>
                                </div>
                                <div className="admin-summary-card">
                                    <span>Average</span>
                                    <strong>{report.summary.averageScore.toFixed(1)}</strong>
                                </div>
                                <div className="admin-summary-card">
                                    <span>Passed</span>
                                    <strong>{report.summary.passed}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="admin-section">
                            <div className="admin-section-header">
                                <div>
                                    <h2>Risk Proctoring</h2>
                                    <p>
                                        Skor berasal dari sinyal browser yang dilaporkan client; gunakan sebagai petunjuk
                                        review, bukan bukti pelanggaran terverifikasi.
                                    </p>
                                </div>
                            </div>
                            <div className="admin-summary" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                                <div className="admin-summary-card">
                                    <span>Low</span>
                                    <strong>{report.risk.low}</strong>
                                </div>
                                <div className="admin-summary-card">
                                    <span>Medium</span>
                                    <strong>{report.risk.medium}</strong>
                                </div>
                                <div className="admin-summary-card">
                                    <span>High</span>
                                    <strong>{report.risk.high}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="admin-section">
                            <div className="admin-section-header">
                                <h2>Detail Student</h2>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: "12px", overflow: "hidden" }}>
                                    <thead>
                                        <tr style={{ background: "#f3f4f6" }}>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Mahasiswa</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Attempt</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Mulai</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Submit</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Status</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Nilai</th>
                                            <th style={{ padding: "0.75rem 0.8rem", textAlign: "left", color: "#374151" }}>Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.attempts.map((attempt) => (
                                            <tr key={attempt.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                                        <strong>{attempt.student.name}</strong>
                                                        <small style={{ color: "#6b7280" }}>{attempt.student.email}</small>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>#{attempt.attemptNumber}</td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>{formatDate(attempt.startedAt)}</td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>{formatDate(attempt.submittedAt)}</td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>
                                                    <span className={`admin-status ${ATTEMPT_STATUS_CONFIG[attempt.status]?.className ?? "admin-status-active"}`}>
                                                        {ATTEMPT_STATUS_CONFIG[attempt.status]?.label ?? attempt.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>{formatScore(attempt.score)}</td>
                                                <td style={{ padding: "0.85rem 0.8rem" }}>
                                                    {attempt.riskScore ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                            <strong>{attempt.riskScore.score}</strong>
                                                            <span className={`admin-risk ${RISK_CLASS[attempt.riskScore.riskLevel] ?? ""}`}>
                                                                {attempt.riskScore.riskLevel}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LecturerReportsPage;
