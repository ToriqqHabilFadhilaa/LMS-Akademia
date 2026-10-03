import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import StudentLayout from "../../components/StudentLayout";
import { getMyExamActivity } from "../../services/student-exam-activity.service";
import type { StudentExamActivity } from "../../services/student-exam-activity.service";

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const StudentResultsPage = () => {
    const [activities, setActivities] = useState<StudentExamActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError("");
                const data = await getMyExamActivity();
                if (!cancelled) setActivities(data);
            } catch (loadError) {
                console.error("Gagal mengambil hasil ujian mahasiswa:", loadError);
                if (!cancelled) {
                    setError("Hasil ujian gagal dimuat. Silakan coba lagi.");
                    setActivities([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const scoredActivities = useMemo(
        () => activities.filter((activity) => activity.percentage !== null),
        [activities]
    );
    const pendingCount = activities.filter(
        (activity) =>
            activity.pendingManualGrading > 0 ||
            (activity.status === "SUBMITTED" && activity.percentage === null)
    ).length;
    const average = scoredActivities.length
        ? scoredActivities.reduce(
              (sum, activity) => sum + (activity.percentage ?? 0),
              0
          ) / scoredActivities.length
        : null;
    const passedCount = scoredActivities.filter(
        (activity) => (activity.percentage ?? 0) >= activity.passingScore
    ).length;

    return (
        <StudentLayout>
            <div className="admin-page student-workspace-page">
                <div className="admin-container">
                    <header className="admin-header">
                        <div>
                            <h1>Hasil Ujian</h1>
                            <p>Nilai dan status penilaian dari ujian yang telah Anda ikuti.</p>
                        </div>
                    </header>

                    {error && (
                        <div className="admin-alert admin-alert-error" role="alert">
                            {error}
                        </div>
                    )}

                    <section className="admin-summary" aria-label="Ringkasan hasil ujian">
                        <div className="admin-summary-card">
                            <span>Ujian Dinilai</span>
                            <strong>{loading ? "…" : scoredActivities.length}</strong>
                        </div>
                        <div className="admin-summary-card">
                            <span>Rata-rata Nilai</span>
                            <strong>{loading ? "…" : average === null ? "—" : `${average.toFixed(1)}%`}</strong>
                        </div>
                        <div className="admin-summary-card">
                            <span>Lulus</span>
                            <strong>{loading ? "…" : passedCount}</strong>
                        </div>
                        <div className="admin-summary-card">
                            <span>Menunggu Penilaian</span>
                            <strong>{loading ? "…" : pendingCount}</strong>
                        </div>
                    </section>

                    <section className="admin-card student-data-card">
                        <div className="student-section-heading">
                            <div>
                                <h2>Rincian Nilai</h2>
                                <p>Pilih hasil untuk melihat rincian jawaban dan perolehan poin.</p>
                            </div>
                            <Link to="/student/history" className="admin-monitoring-button">
                                Lihat riwayat
                            </Link>
                        </div>

                        {loading ? (
                            <div className="admin-empty">Memuat hasil ujian…</div>
                        ) : activities.length === 0 ? (
                            <div className="admin-empty">Belum ada attempt ujian pada course Anda.</div>
                        ) : (
                            <div className="admin-table-wrapper">
                                <table className="admin-table student-results-table">
                                    <thead>
                                        <tr>
                                            <th>Ujian</th>
                                            <th>Course</th>
                                            <th>Attempt</th>
                                            <th>Tanggal</th>
                                            <th>Nilai</th>
                                            <th>Status</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map((activity) => {
                                            const scored = activity.percentage !== null;
                                            const passed =
                                                scored &&
                                                activity.percentage! >= activity.passingScore;
                                            const statusLabel = scored
                                                ? passed
                                                    ? "Lulus"
                                                    : "Belum lulus"
                                                : activity.pendingManualGrading > 0
                                                  ? `Menunggu penilaian (${activity.pendingManualGrading})`
                                                  : activity.status === "SUBMITTED"
                                                  ? "Menunggu nilai"
                                                  : activity.status === "IN_PROGRESS"
                                                    ? "Berlangsung"
                                                    : activity.status;

                                            return (
                                                <tr key={activity.id}>
                                                    <td>
                                                        <strong>{activity.examTitle}</strong>
                                                    </td>
                                                    <td>
                                                        {activity.courseCode} — {activity.courseName}
                                                    </td>
                                                    <td>#{activity.attemptNumber}</td>
                                                    <td>{formatDate(activity.submittedAt ?? activity.startedAt)}</td>
                                                    <td>{scored ? `${activity.percentage!.toFixed(1)}%` : "—"}</td>
                                                    <td>
                                                        <span
                                                            className={`admin-status ${
                                                                scored
                                                                    ? passed
                                                                        ? "admin-status-success"
                                                                        : "admin-status-blocked"
                                                                    : "admin-status-active"
                                                            }`}
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {(activity.status === "SUBMITTED" ||
                                                            activity.status === "EXPIRED") && (
                                                            <Link
                                                                to={`/student/exams/result/${activity.id}`}
                                                                className="student-result-link"
                                                            >
                                                                Detail
                                                            </Link>
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
        </StudentLayout>
    );
};

export default StudentResultsPage;
