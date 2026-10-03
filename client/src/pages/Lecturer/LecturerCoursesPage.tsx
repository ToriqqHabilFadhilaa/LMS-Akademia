import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLecturerCourseOfferings } from "../../services/course-offering.service";
import type { CourseOffering } from "../../types/course";

const STATUS_CLASS: Record<string, string> = {
    ACTIVE: "admin-status-active",
    DRAFT: "admin-status-inactive",
    COMPLETED: "admin-status-inactive",
    ARCHIVED: "admin-status-inactive",
};

const LecturerCoursesPage = () => {
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await getLecturerCourseOfferings();
                if (!cancelled) setOfferings(data);
            } catch {
                if (!cancelled) setError("Gagal mengambil data course offering.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat course offering...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>My Courses</h1>
                        <p>Daftar course offering yang Anda ampu.</p>
                    </div>
                </div>

                {error && (
                    <div className="admin-alert admin-alert-error">{error}</div>
                )}

                {offerings.length === 0 && !error ? (
                    <div className="admin-empty">Anda belum memiliki course offering.</div>
                ) : (
                    <div className="course-offering-list">
                        {offerings.map((offering) => (
                            <div key={offering.id} className="course-offering-card">
                                <div className="course-offering-main">
                                    <div className="course-offering-title-row">
                                        <div>
                                            <span className="course-offering-code">
                                                {offering.course.code}
                                            </span>
                                            <h2>{offering.course.name}</h2>
                                        </div>
                                        <span className={`admin-status ${STATUS_CLASS[offering.status] ?? "admin-status-inactive"}`}>
                                            {offering.status}
                                        </span>
                                    </div>

                                    <div className="course-offering-meta">
                                        <span>Term: {offering.term}</span>
                                        <span>Section: {offering.section}</span>
                                    </div>
                                </div>

                                <div className="course-offering-actions">
                                    <Link
                                        to={`/lecturer/courses/${offering.id}`}
                                        className="course-offering-detail-button"
                                    >
                                        Detail
                                    </Link>
                                    <Link
                                        to={`/lecturer/exams?offeringId=${offering.id}`}
                                        className="course-offering-edit-button"
                                    >
                                        Exam
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LecturerCoursesPage;
