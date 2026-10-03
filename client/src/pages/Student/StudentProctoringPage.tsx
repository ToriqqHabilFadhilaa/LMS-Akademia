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

const StudentProctoringPage = () => {
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
                console.error("Gagal mengambil aktivitas exam proctoring:", loadError);
                if (!cancelled) {
                    setError("Aktivitas ujian gagal dimuat. Silakan coba lagi.");
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

    const inProgress = activities.filter((item) => item.status === "IN_PROGRESS").length;
    const submitted = activities.filter((item) => item.status === "SUBMITTED").length;

    return (
        <StudentLayout>
            <div className="admin-page student-workspace-page">
                <div className="admin-container">
                    <header className="admin-header">
                        <div>
                            <h1>Proctoring</h1>
                            <p>Status attempt ujian yang tercatat pada akun Anda.</p>
                        </div>
                    </header>

                    <div className="admin-alert student-info-alert" role="note">
                        Backend saat ini belum menyediakan endpoint log atau skor risiko proctoring untuk mahasiswa.
                        Halaman ini menampilkan data attempt ujian nyata, bukan hasil deteksi proctoring.
                    </div>

                    {error && (
                        <div className="admin-alert admin-alert-error" role="alert">
                            {error}
                        </div>
                    )}

                    <section className="admin-summary">
                        <div className="admin-summary-card">
                            <span>Total Attempt</span>
                            <strong>{loading ? "…" : activities.length}</strong>
                        </div>
                        <div className="admin-summary-card">
                            <span>Sedang Berlangsung</span>
                            <strong>{loading ? "…" : inProgress}</strong>
                        </div>
                        <div className="admin-summary-card">
                            <span>Sudah Dikumpulkan</span>
                            <strong>{loading ? "…" : submitted}</strong>
                        </div>
                    </section>

                    <section className="admin-card student-data-card">
                        <div className="student-section-heading">
                            <div>
                                <h2>Aktivitas Ujian</h2>
                                <p>Attempt terbaru ditampilkan terlebih dahulu.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="admin-empty">Memuat aktivitas ujian…</div>
                        ) : activities.length === 0 ? (
                            <div className="admin-empty">Belum ada aktivitas ujian yang tercatat.</div>
                        ) : (
                            <div className="student-activity-list">
                                {activities.map((activity) => (
                                    <article className="student-activity-item" key={activity.id}>
                                        <div className="student-activity-copy">
                                            <span className="student-profile-course-code">
                                                {activity.courseCode}
                                            </span>
                                            <h3>{activity.examTitle}</h3>
                                            <p>
                                                {activity.courseName} · Attempt #{activity.attemptNumber}
                                            </p>
                                            <small>
                                                Dimulai {formatDate(activity.startedAt)}
                                                {activity.submittedAt
                                                    ? ` · Dikumpulkan ${formatDate(activity.submittedAt)}`
                                                    : ""}
                                            </small>
                                        </div>
                                        <div className="student-activity-actions">
                                            <span
                                                className={`admin-status ${
                                                    activity.status === "IN_PROGRESS"
                                                        ? "admin-status-active"
                                                        : activity.status === "SUBMITTED"
                                                          ? "admin-status-success"
                                                          : activity.status === "BLOCKED"
                                                            ? "admin-status-blocked"
                                                            : "admin-status-expired"
                                                }`}
                                            >
                                                {activity.status.replaceAll("_", " ")}
                                            </span>
                                            {activity.percentage !== null && (
                                                <Link
                                                    to={`/student/exams/result/${activity.id}`}
                                                    className="student-result-link"
                                                >
                                                    Lihat hasil
                                                </Link>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentProctoringPage;
