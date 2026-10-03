import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StudentLayout from "../../components/StudentLayout";
import { getMyExamActivity } from "../../services/student-exam-activity.service";
import type { StudentExamActivity } from "../../services/student-exam-activity.service";

const formatDate = (value: string): string =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const StudentExamHistoryPage = () => {
    const [activities, setActivities] = useState<StudentExamActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await getMyExamActivity();
                if (!cancelled) setActivities(data);
            } catch (loadError) {
                console.error("Gagal mengambil riwayat ujian:", loadError);
                if (!cancelled) {
                    setError("Riwayat ujian gagal dimuat. Silakan coba lagi.");
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

    const getStatus = (activity: StudentExamActivity): { label: string; className: string } => {
        if (activity.percentage !== null) {
            const passed = activity.percentage >= activity.passingScore;
            return {
                label: passed ? "Lulus" : "Belum lulus",
                className: passed ? "admin-status-success" : "admin-status-blocked",
            };
        }

        if (activity.pendingManualGrading > 0) {
            return {
                label: `Menunggu penilaian (${activity.pendingManualGrading})`,
                className: "admin-status-active",
            };
        }
        if (activity.status === "SUBMITTED") {
            return { label: "Menunggu nilai", className: "admin-status-active" };
        }
        if (activity.status === "IN_PROGRESS") {
            return { label: "Berlangsung", className: "admin-status-active" };
        }
        return { label: activity.status, className: "admin-status-expired" };
    };

    return (
        <StudentLayout>
            <div className="admin-page student-workspace-page">
                <div className="admin-container">
                    <header className="admin-header">
                        <div>
                            <h1>Riwayat Ujian</h1>
                            <p>Semua attempt ujian Anda, termasuk yang sedang berjalan dan menunggu nilai.</p>
                        </div>
                        <Link to="/student/results" className="admin-monitoring-button">
                            Lihat hasil
                        </Link>
                    </header>

                    {error && (
                        <div className="admin-alert admin-alert-error" role="alert">
                            {error}
                        </div>
                    )}

                    <section className="admin-card student-data-card">
                        {loading ? (
                            <div className="admin-empty">Memuat riwayat ujian…</div>
                        ) : activities.length === 0 ? (
                            <div className="admin-empty">Belum ada attempt ujian pada course Anda.</div>
                        ) : (
                            <div className="admin-table-wrapper">
                                <table className="admin-table student-history-table">
                                    <thead>
                                        <tr>
                                            <th>Ujian</th>
                                            <th>Course</th>
                                            <th>Mulai</th>
                                            <th>Dikumpulkan</th>
                                            <th>Attempt</th>
                                            <th>Nilai</th>
                                            <th>Status</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activities.map((activity) => {
                                            const status = getStatus(activity);
                                            return (
                                                <tr key={activity.id}>
                                                    <td><strong>{activity.examTitle}</strong></td>
                                                    <td>{activity.courseCode} — {activity.courseName}</td>
                                                    <td>{formatDate(activity.startedAt)}</td>
                                                    <td>{activity.submittedAt ? formatDate(activity.submittedAt) : "—"}</td>
                                                    <td>#{activity.attemptNumber}</td>
                                                    <td>{activity.percentage === null ? "—" : `${activity.percentage.toFixed(1)}%`}</td>
                                                    <td>
                                                        <span className={`admin-status ${status.className}`}>
                                                            {status.label}
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

export default StudentExamHistoryPage;
