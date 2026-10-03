import { useEffect, useState } from "react";
import { useNavigate, useParams, } from "react-router-dom";
import { getExamResult } from "../../services/exam-result.service";
import type { ExamResult } from "../../services/exam-result.service";
import StudentLayout from "../../components/StudentLayout";

type SummaryItemProps = {
    label: string;
    value: string | number;
};

const SummaryItem = ({ label, value }: SummaryItemProps) => (
    <div>
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const StudentExamResultPage = () => {
    const navigate = useNavigate();
    const { attemptId } = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(Boolean(attemptId));
    const [error, setError] = useState("");

    useEffect(() => {
        if (!attemptId) {
            return;
        }

        let cancelled = false;

        const loadResult = async () => {
            try {
                const data = await getExamResult(attemptId);

                if (cancelled) {
                    return;
                }

                setResult(data);
            } catch (error) {
                console.error("Gagal mengambil hasil exam:", error);

                if (!cancelled) {
                    setError("Hasil exam belum tersedia.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadResult();

        return () => {
            cancelled = true;
        };
    }, [attemptId]);

    if (loading) {
        return (
            <StudentLayout>
                <div className="empty-state">Memuat hasil exam...</div>
            </StudentLayout>
        );
    }

    if (!attemptId) {
        return (
            <StudentLayout>
                <div className="empty-state">Attempt exam tidak ditemukan.</div>
            </StudentLayout>
        );
    }

    if (error || !result) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    {error || "Hasil exam tidak ditemukan."}
                </div>
            </StudentLayout>
        );
    }

    const { summary } = result;

    return (
        <StudentLayout>
            <div className="exam-result-page">
                <header>
                    <span className="exam-result-label">HASIL EXAM</span>
                    <h2>{result.exam.title}</h2>
                    <p>Attempt ke-{result.attempt.attemptNumber}</p>
                </header>

                <section className="exam-result-score">
                    <span className="exam-result-score-label">
                        {summary.pendingManualGrading > 0
                            ? "Nilai sementara"
                            : "Nilai"}
                    </span>
                    <strong>{summary.percentage.toFixed(2)}</strong>
                    <span className="exam-result-score-max">/ 100</span>
                </section>

                <section className="exam-result-summary">
                    <SummaryItem label="Total Soal" value={summary.totalQuestions} />
                    <SummaryItem label="Terjawab" value={summary.answeredQuestions} />
                    <SummaryItem label="Tidak Dijawab" value={summary.unansweredQuestions} />
                    <SummaryItem label="Poin" value={`${summary.earnedPoints} / ${summary.maximumPoints}`}/>
                </section>

                <button type="button" className="mx-auto block" onClick={() => navigate(`/student/exams/${result.exam.id}`)}>
                    Kembali ke Exam
                </button>

                {summary.pendingManualGrading > 0 && (
                    <div className="exam-result-notice">
                        {summary.pendingManualGrading} soal masih menunggu
                        penilaian manual.
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentExamResultPage;