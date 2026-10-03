import { useEffect, useMemo, useState } from "react";

import { gradeAnswer } from "../../services/answer.service";
import { getLecturerExamResultSets } from "../../services/lecturer-exam-results.service";
import type { LecturerExamResultSet } from "../../services/lecturer-exam-results.service";

const formatDate = (value: string | null): string =>
    value
        ? new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "Belum dikumpulkan";

const isManualQuestion = (questionType: string): boolean =>
    questionType === "ESSAY" || questionType === "SHORT_ANSWER";

const LecturerGradingPage = () => {
    const [resultSets, setResultSets] = useState<LecturerExamResultSet[]>([]);
    const [selectedAttemptId, setSelectedAttemptId] = useState("");
    const [pointsByAnswer, setPointsByAnswer] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [savingAnswerId, setSavingAnswerId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadResults = async () => {
        const data = await getLecturerExamResultSets();
        setResultSets(data);
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError("");
                const data = await getLecturerExamResultSets();
                if (!cancelled) setResultSets(data);
            } catch (loadError) {
                console.error("Gagal mengambil antrian grading:", loadError);
                if (!cancelled) setError("Data grading gagal dimuat. Silakan coba lagi.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const pendingAttempts = useMemo(
        () =>
            resultSets.flatMap((resultSet) =>
                resultSet.attempts
                    .filter((attempt) => attempt.summary.pendingManualGrading > 0)
                    .map((attempt) => ({ resultSet, attempt }))
            ),
        [resultSets]
    );
    const readyAttempts = resultSets
        .flatMap((resultSet) => resultSet.attempts)
        .filter((attempt) => attempt.summary.pendingManualGrading === 0).length;
    const pendingQuestions = pendingAttempts.reduce(
        (total, item) => total + item.attempt.summary.pendingManualGrading,
        0
    );
    const selectedItem = pendingAttempts.find(
        (item) => item.attempt.attempt.id === selectedAttemptId
    );

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError("");
            await loadResults();
        } catch (refreshError) {
            console.error("Gagal memperbarui antrian grading:", refreshError);
            setError("Data grading gagal diperbarui.");
        } finally {
            setRefreshing(false);
        }
    };

    const handleGradeAnswer = async (
        answerId: string,
        maximumPoints: number
    ) => {
        const rawPoints = pointsByAnswer[answerId];
        const points = Number(rawPoints);

        if (
            rawPoints === undefined ||
            rawPoints.trim() === "" ||
            !Number.isFinite(points) ||
            points < 0 ||
            points > maximumPoints
        ) {
            setError(`Masukkan nilai antara 0 dan ${maximumPoints}.`);
            return;
        }

        try {
            setSavingAnswerId(answerId);
            setError("");
            setNotice("");
            await gradeAnswer(answerId, points);
            setPointsByAnswer((current) => {
                const next = { ...current };
                delete next[answerId];
                return next;
            });
            await loadResults();
            setNotice("Nilai jawaban berhasil disimpan.");
        } catch (saveError) {
            console.error("Gagal menyimpan nilai jawaban:", saveError);
            setError("Nilai gagal disimpan. Periksa koneksi lalu coba lagi.");
        } finally {
            setSavingAnswerId("");
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-container">
                <header className="admin-header">
                    <div>
                        <h1>Grading</h1>
                        <p>Periksa jawaban essay dan short answer dari attempt yang sudah dikumpulkan.</p>
                    </div>
                    <button
                        type="button"
                        className="admin-monitoring-button"
                        onClick={() => void handleRefresh()}
                        disabled={loading || refreshing}
                    >
                        {refreshing ? "Memuat…" : "Refresh"}
                    </button>
                </header>

                {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
                {notice && <div className="admin-alert student-info-alert" role="status">{notice}</div>}

                <section className="admin-summary">
                    <div className="admin-summary-card">
                        <span>Attempt Perlu Dinilai</span>
                        <strong>{loading ? "…" : pendingAttempts.length}</strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Jawaban Menunggu Nilai</span>
                        <strong>{loading ? "…" : pendingQuestions}</strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Attempt Selesai Dinilai</span>
                        <strong>{loading ? "…" : readyAttempts}</strong>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-section-header">
                        <div>
                            <h2>Antrian Penilaian</h2>
                            <p>Jumlah berdasarkan jawaban dan nilai yang tersimpan di backend.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-empty">Memuat data grading…</div>
                    ) : pendingAttempts.length === 0 ? (
                        <div className="admin-empty">Tidak ada jawaban manual yang menunggu penilaian.</div>
                    ) : (
                        <div className="student-activity-list">
                            {pendingAttempts.map(({ resultSet, attempt }) => (
                                <article className="student-activity-item" key={attempt.attempt.id}>
                                    <div className="student-activity-copy">
                                        <span className="student-profile-course-code">
                                            {resultSet.courseCode}
                                        </span>
                                        <h3>{resultSet.examTitle}</h3>
                                        <p>
                                            {attempt.student.name} · Attempt #{attempt.attempt.attemptNumber}
                                        </p>
                                        <small>
                                            {attempt.summary.pendingManualGrading} jawaban perlu dinilai
                                            {" · "}Dikumpulkan {formatDate(attempt.attempt.submittedAt)}
                                        </small>
                                    </div>
                                    <div className="student-activity-actions">
                                        <span className="admin-status admin-status-active">
                                            Perlu penilaian
                                        </span>
                                        <button
                                            type="button"
                                            className="admin-monitoring-button"
                                            onClick={() =>
                                                setSelectedAttemptId((current) =>
                                                    current === attempt.attempt.id
                                                        ? ""
                                                        : attempt.attempt.id
                                                )
                                            }
                                        >
                                            {selectedAttemptId === attempt.attempt.id
                                                ? "Tutup"
                                                : "Periksa jawaban"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                {selectedItem && (
                    <section className="admin-card">
                        <div className="admin-section-header">
                            <div>
                                <h2>{selectedItem.attempt.student.name}</h2>
                                <p>
                                    {selectedItem.resultSet.examTitle} · Attempt #
                                    {selectedItem.attempt.attempt.attemptNumber}
                                </p>
                            </div>
                        </div>

                        <div className="lecturer-grading-questions">
                            {selectedItem.attempt.questions
                                .filter(
                                    (question) =>
                                        isManualQuestion(question.question.questionType) &&
                                        question.answer !== null &&
                                        question.answer.points === null
                                )
                                .map((question) => (
                                    <article className="lecturer-grading-question" key={question.id}>
                                        <div className="lecturer-grading-question-heading">
                                            <strong>Soal {question.orderNumber}</strong>
                                            <span>Maks. {question.pointsSnapshot} poin</span>
                                        </div>
                                        <p className="lecturer-grading-prompt">
                                            {question.questionTextSnapshot}
                                        </p>
                                        <div className="lecturer-grading-response">
                                            {question.answer?.answer?.trim() || "Mahasiswa tidak memberikan jawaban."}
                                        </div>
                                        {question.answer && (
                                            <div className="lecturer-grading-controls">
                                                <label htmlFor={`points-${question.answer.id}`}>
                                                    Nilai (0–{question.pointsSnapshot})
                                                </label>
                                                <input
                                                    id={`points-${question.answer.id}`}
                                                    type="number"
                                                    min="0"
                                                    max={question.pointsSnapshot}
                                                    step="any"
                                                    value={pointsByAnswer[question.answer.id] ?? ""}
                                                    onChange={(event) =>
                                                        setPointsByAnswer((current) => ({
                                                            ...current,
                                                            [question.answer!.id]: event.target.value,
                                                        }))
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="admin-monitoring-button"
                                                    disabled={savingAnswerId === question.answer.id}
                                                    onClick={() =>
                                                        void handleGradeAnswer(
                                                            question.answer!.id,
                                                            question.pointsSnapshot
                                                        )
                                                    }
                                                >
                                                    {savingAnswerId === question.answer.id
                                                        ? "Menyimpan…"
                                                        : "Simpan nilai"}
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default LecturerGradingPage;
