import { useEffect, useState } from "react";

import StudentLayout from "../../components/StudentLayout";
import { useAuth } from "../../context/useAuth";
import { getMyCourses } from "../../services/course-member.service";
import type { CourseMember } from "../../types/course";

const StudentProfilePage = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseMember[]>([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [courseError, setCourseError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadCourses = async () => {
            try {
                const data = await getMyCourses();
                if (!cancelled) setCourses(data);
            } catch (error) {
                console.error("Gagal mengambil course profile mahasiswa:", error);
                if (!cancelled) setCourseError("Informasi mata kuliah gagal dimuat.");
            } finally {
                if (!cancelled) setLoadingCourses(false);
            }
        };

        void loadCourses();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <StudentLayout>
            <div className="admin-page student-workspace-page">
                <div className="admin-container">
                    <header className="admin-header">
                        <div>
                            <h1>Profil Mahasiswa</h1>
                            <p>Informasi akun dan mata kuliah yang terdaftar.</p>
                        </div>
                    </header>

                    <section className="admin-card student-profile-card">
                        <div className="student-profile-avatar" aria-hidden="true">
                            {user?.name
                                .trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((part) => part.charAt(0).toUpperCase())
                                .join("")}
                        </div>
                        <div className="student-profile-heading">
                            <h2>{user?.name}</h2>
                            <p>{user?.email}</p>
                        </div>
                        <span className="admin-status admin-status-success">{user?.status}</span>
                    </section>

                    <section className="student-profile-grid">
                        <article className="admin-card student-data-card">
                            <h2>Informasi Akun</h2>
                            <dl className="student-profile-details">
                                <div>
                                    <dt>Nama</dt>
                                    <dd>{user?.name ?? "—"}</dd>
                                </div>
                                <div>
                                    <dt>Email</dt>
                                    <dd>{user?.email ?? "—"}</dd>
                                </div>
                                <div>
                                    <dt>Role</dt>
                                    <dd>{user?.role ?? "—"}</dd>
                                </div>
                                <div>
                                    <dt>Terdaftar</dt>
                                    <dd>
                                        {user?.createdAt
                                            ? new Intl.DateTimeFormat("id-ID", {
                                                  dateStyle: "long",
                                              }).format(new Date(user.createdAt))
                                            : "—"}
                                    </dd>
                                </div>
                            </dl>
                        </article>

                        <article className="admin-card student-data-card">
                            <div className="student-section-heading">
                                <div>
                                    <h2>Mata Kuliah Terdaftar</h2>
                                    <p>{loadingCourses ? "Memuat…" : `${courses.length} course`}</p>
                                </div>
                            </div>
                            {courseError ? (
                                <div className="admin-alert admin-alert-error" role="alert">
                                    {courseError}
                                </div>
                            ) : loadingCourses ? (
                                <div className="admin-empty">Memuat mata kuliah…</div>
                            ) : courses.length === 0 ? (
                                <div className="admin-empty">Belum ada mata kuliah terdaftar.</div>
                            ) : (
                                <ul className="student-profile-course-list">
                                    {courses.map((course) => (
                                        <li key={course.id}>
                                            <span className="student-profile-course-code">
                                                {course.courseOffering.course.code}
                                            </span>
                                            <span>{course.courseOffering.course.name}</span>
                                            <small>
                                                {course.courseOffering.term} · Section {course.courseOffering.section}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    </section>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentProfilePage;
