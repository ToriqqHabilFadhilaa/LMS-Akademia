import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCourseOfferingById } from "../../services/course-offering.service";
import { getCourseMembers } from "../../services/course-member.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import type { CourseOffering, Exam } from "../../types/course";
import type { CourseMemberDetail } from "../../services/course-member.service";

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));

const getExamStatus = (exam: Exam): "live" | "upcoming" | "ended" => {
    const n = new Date();
    if (n >= new Date(exam.startAt) && n <= new Date(exam.endAt)) return "live";
    if (n < new Date(exam.startAt)) return "upcoming";
    return "ended";
};

const EXAM_STATUS_LABEL: Record<string, string> = {
    live: "Live",
    upcoming: "Upcoming",
    ended: "Ended",
};

const EXAM_STATUS_CLASS: Record<string, string> = {
    live: "exam-monitoring-status-live",
    upcoming: "exam-monitoring-status-upcoming",
    ended: "exam-monitoring-status-ended",
};

const LecturerCourseDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    const [offering, setOffering] = useState<CourseOffering | null>(null);
    const [members, setMembers] = useState<CourseMemberDetail[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        const load = async () => {
            try {
                const [offeringData, memberData, examData] = await Promise.all([
                    getCourseOfferingById(id),
                    getCourseMembers(id),
                    getExamsByCourseOfferingId(id),
                ]);

                if (cancelled) return;

                setOffering(offeringData);
                setMembers(memberData.filter((m) => m.role === "STUDENT"));
                setExams(examData);
            } catch {
                if (!cancelled) setError("Gagal mengambil detail course offering.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat detail course...</p>
                </div>
            </div>
        );
    }

    if (error || !offering) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <Link to="/lecturer/courses" className="exam-monitoring-detail-back">
                        ← Kembali
                    </Link>
                    <div className="admin-empty">{error || "Course offering tidak ditemukan."}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="exam-monitoring-detail-top">
                    <Link to="/lecturer/courses" className="exam-monitoring-detail-back">
                        ← My Courses
                    </Link>
                </div>

                <div className="exam-monitoring-detail-header">
                    <span className="exam-monitoring-detail-code">{offering.course.code}</span>
                    <h1>{offering.course.name}</h1>
                    <p>Section {offering.section} · {offering.term} · {offering.status}</p>
                </div>

                {/* Info */}
                <div className="admin-card">
                    <div className="section-header">
                        <h2>Informasi Course</h2>
                    </div>
                    <div className="exam-monitoring-detail-summary" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                        {[
                            { label: "Kode", value: offering.course.code },
                            { label: "Mata Kuliah", value: offering.course.name },
                            { label: "Term", value: offering.term },
                            { label: "Section", value: offering.section },
                            { label: "Status", value: offering.status },
                        ].map(({ label, value }) => (
                            <div key={label} className="admin-summary-card">
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Students */}
                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Mahasiswa Terdaftar</h2>
                            <p>{members.length} mahasiswa</p>
                        </div>
                        <Link
                            to={`/lecturer/students?offeringId=${offering.id}`}
                            className="exam-monitoring-view-button"
                        >
                            Lihat Semua
                        </Link>
                    </div>

                    {members.length === 0 ? (
                        <div className="admin-empty">Belum ada mahasiswa terdaftar.</div>
                    ) : (
                        <>
                            <table className="lecturer-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nama</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.slice(0, 5).map((member, idx) => (
                                        <tr key={member.id}>
                                            <td>{idx + 1}</td>
                                            <td>{member.user.name}</td>
                                            <td>{member.user.email}</td>
                                            <td>
                                                <span className={`admin-status ${member.user.status === "ACTIVE" ? "admin-status-active" : "admin-status-inactive"}`}>
                                                    {member.user.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {members.length > 5 && (
                                <p className="lecturer-table-more">
                                    +{members.length - 5} mahasiswa lainnya
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Exams */}
                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Exam</h2>
                            <p>{exams.length} exam</p>
                        </div>
                        <Link
                            to={`/lecturer/exams?offeringId=${offering.id}`}
                            className="exam-monitoring-view-button"
                        >
                            Kelola Exam
                        </Link>
                    </div>

                    {exams.length === 0 ? (
                        <div className="admin-empty">Belum ada exam pada course ini.</div>
                    ) : (
                        <div className="exam-monitoring-list">
                            {exams.map((exam) => {
                                const status = getExamStatus(exam);
                                return (
                                    <div key={exam.id} className="exam-monitoring-card">
                                        <div style={{ flex: 1 }}>
                                            <div className="exam-monitoring-card-header">
                                                <h3>{exam.title}</h3>
                                                <span className={`exam-monitoring-status ${EXAM_STATUS_CLASS[status]}`}>
                                                    {EXAM_STATUS_LABEL[status]}
                                                </span>
                                            </div>
                                            <div className="exam-monitoring-time">
                                                <span>Mulai: {formatDate(exam.startAt)}</span>
                                                <span>Berakhir: {formatDate(exam.endAt)}</span>
                                            </div>
                                            <div className="exam-monitoring-metrics">
                                                <span>Durasi: {exam.durationMinutes} menit</span>
                                                <span>Maks. attempt: {exam.maxAttempts}</span>
                                                <span>KKM: {exam.passingScore}</span>
                                            </div>
                                        </div>
                                        <div className="exam-monitoring-card-action">
                                            <Link
                                                to={`/lecturer/exam-monitoring/${exam.id}`}
                                                className="exam-monitoring-view-button"
                                            >
                                                Monitoring
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LecturerCourseDetailPage;
