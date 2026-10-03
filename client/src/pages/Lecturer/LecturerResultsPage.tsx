import { useEffect, useMemo, useState } from "react";

import { getLecturerExamResultSets } from "../../services/lecturer-exam-results.service";
import type { LecturerExamResultSet } from "../../services/lecturer-exam-results.service";

const formatDate = (value: string | null): string =>
    value
        ? new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "—";

const LecturerResultsPage = () => {
    const [resultSets, setResultSets] = useState<LecturerExamResultSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

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
                console.error("Gagal mengambil hasil ujian lecturer:", loadError);
                if (!cancelled) setError("Data hasil ujian gagal dimuat. Silakan coba lagi.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const attempts = resultSets.flatMap((resultSet) =>
        resultSet.attempts.map((attempt) => ({ resultSet, attempt }))
    );

    const stats = useMemo(() => {
        const finalAttempts = attempts.filter(
            ({ attempt }) => attempt.summary.pendingManualGrading === 0
        );
        const average =
            finalAttempts.length > 0
                ? finalAttempts.reduce(
                      (total, { attempt }) => total + attempt.summary.percentage,
                      0
                  ) / finalAttempts.length
                : null;

        return {
            attemptCount: attempts.length,
            pendingQuestions: attempts.reduce(
                (total, { attempt }) =>
                    total + attempt.summary.pendingManualGrading,
                0
            ),
            average,
            passed: finalAttempts.filter(
                ({ resultSet, attempt }) =>
                    attempt.summary.percentage >= resultSet.passingScore
            ).length,
        };
    }, [attempts]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError("");
            await loadResults();
        } catch (refreshError) {
            console.error("Gagal memperbarui hasil ujian lecturer:", refreshError);
            setError("Data hasil ujian gagal diperbarui.");
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-container">
                <header className="admin-header">
                    <div>
                        <h1>Results</h1>
                        <p>Nilai attempt ujian dari mahasiswa di course offering Anda.</p>
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

                <section className="admin-summary">
                    <div className="admin-summary-card">
                        <span>Attempt Dinilai</span>
                        <strong>
                            {loading
                                ? "…"
                                : attempts.filter(
                                      ({ attempt }) =>
                                          attempt.summary.pendingManualGrading === 0
                                  ).length}
                        </strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Rata-rata Nilai Final</span>
                        <strong>
                            {loading
                                ? "…"
                                : stats.average === null
                                  ? "—"
                                  : `${stats.average.toFixed(1)}%`}
                        </strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Lulus</span>
                        <strong>{loading ? "…" : stats.passed}</strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Jawaban Menunggu Nilai</span>
                        <strong>{loading ? "…" : stats.pendingQuestions}</strong>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-section-header">
                        <div>
                            <h2>Hasil Attempt</h2>
                            <p>
                                Nilai final baru dihitung setelah seluruh jawaban manual selesai dinilai.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-empty">Memuat hasil ujian…</div>
                    ) : attempts.length === 0 ? (
                        <div className="admin-empty">Belum ada attempt ujian yang selesai.</div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mahasiswa</th>
                                        <th>Course</th>
                                        <th>Ujian</th>
                                        <th>Attempt</th>
                                        <th>Dikumpulkan</th>
                                        <th>Nilai</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attempts.map(({ resultSet, attempt }) => {
                                        const isFinal =
                                            attempt.summary.pendingManualGrading === 0;
                                        const passed =
                                            isFinal &&
                                            attempt.summary.percentage >= resultSet.passingScore;
                                        const status = !isFinal
                                            ? `${attempt.summary.pendingManualGrading} menunggu penilaian`
                                            : passed
                                              ? "Lulus"
                                              : "Belum lulus";

                                        return (
                                            <tr key={attempt.attempt.id}>
                                                <td>
                                                    <strong>{attempt.student.name}</strong>
                                                    <br />
                                                    <small>{attempt.student.email}</small>
                                                </td>
                                                <td>
                                                    {resultSet.courseCode} — {resultSet.courseName}
                                                </td>
                                                <td>{resultSet.examTitle}</td>
                                                <td>#{attempt.attempt.attemptNumber}</td>
                                                <td>{formatDate(attempt.attempt.submittedAt)}</td>
                                                <td>
                                                    {isFinal
                                                        ? `${attempt.summary.percentage.toFixed(2)}%`
                                                        : "Belum final"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`admin-status ${
                                                            !isFinal
                                                                ? "admin-status-active"
                                                                : passed
                                                                  ? "admin-status-success"
                                                                  : "admin-status-blocked"
                                                        }`}
                                                    >
                                                        {status}
                                                    </span>
                                                    {isFinal && (
                                                        <small className="result-passing-score">
                                                            KKM: {resultSet.passingScore}%
                                                        </small>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default LecturerResultsPage;
