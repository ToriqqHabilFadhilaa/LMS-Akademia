import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3,
    BookOpen,
    ClipboardCheck,
    FileQuestion,
    MonitorCheck,
} from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { getLecturerCourseOfferings } from "../../services/course-offering.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import type { CourseOffering, Exam } from "../../types/course";

interface OfferingWithExams {
    offering: CourseOffering;
    exams: Exam[];
}

const now = () => new Date();

const getExamStatus = (exam: Exam): "live" | "upcoming" | "ended" => {
    const n = now();
    if (n >= new Date(exam.startAt) && n <= new Date(exam.endAt)) return "live";
    if (n < new Date(exam.startAt)) return "upcoming";
    return "ended";
};

const STATUS_LABEL: Record<string, string> = {
    live: "Live",
    upcoming: "Upcoming",
    ended: "Ended",
};

const STATUS_CLASS: Record<string, string> = {
    live: "exam-monitoring-status-live",
    upcoming: "exam-monitoring-status-upcoming",
    ended: "exam-monitoring-status-ended",
};

const SummaryCard = ({ label, value }: { label: string; value: number }) => (
    <div className="admin-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const QUICK_ACTIONS = [
    { to: "/lecturer/courses", title: "My Courses", description: "Lihat course & offering Anda", Icon: BookOpen },
    { to: "/lecturer/questions", title: "Question Bank", description: "Kelola soal ujian", Icon: FileQuestion },
    { to: "/lecturer/exams", title: "Exam Management", description: "Buat & kelola exam", Icon: ClipboardCheck },
    { to: "/lecturer/exam-monitoring", title: "Exam Monitoring", description: "Pantau exam berlangsung", Icon: MonitorCheck },
    { to: "/lecturer/grading", title: "Grading", description: "Nilai jawaban mahasiswa", Icon: ClipboardCheck },
    { to: "/lecturer/reports", title: "Reports", description: "Lihat laporan exam", Icon: BarChart3 },
];

const LecturerDashboardPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState<OfferingWithExams[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError("");

                const offerings = await getLecturerCourseOfferings();

                if (cancelled) return;

                const result = await Promise.all(
                    offerings.map(async (offering) => ({
                        offering,
                        exams: await getExamsByCourseOfferingId(offering.id),
                    }))
                );

                if (cancelled) return;

                setData(result);
            } catch {
                if (!cancelled) setError("Gagal mengambil data dashboard.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, []);

    const allExams = data.flatMap((d) => d.exams);
    const activeOfferings = data.filter((d) => d.offering.status === "ACTIVE").length;
    const liveExams = allExams.filter((e) => getExamStatus(e) === "live").length;
    const upcomingExams = allExams.filter((e) => getExamStatus(e) === "upcoming").length;

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Selamat datang, {user?.name}</h1>
                        <p>Ringkasan aktivitas pengajaran Anda.</p>
                    </div>
                </div>

                {error && (
                    <div className="admin-alert admin-alert-error">{error}</div>
                )}

                <div className="admin-summary">
                    <SummaryCard label="Course Offering" value={data.length} />
                    <SummaryCard label="Offering Aktif" value={activeOfferings} />
                    <SummaryCard label="Total Exam" value={allExams.length} />
                    <SummaryCard label="Exam Live" value={liveExams} />
                    <SummaryCard label="Exam Upcoming" value={upcomingExams} />
                </div>

                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>Akses Cepat</h2>
                    </div>
                    <div className="admin-quick-actions">
                        {QUICK_ACTIONS.map((action) => (
                            <Link key={action.to} to={action.to} className="admin-quick-action">
                                <span className="admin-quick-action-icon"><action.Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                                <strong>{action.title}</strong>
                                <span>{action.description}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="admin-section">
                    <div className="admin-section-header">
                        <div>
                            <h2>Exam Overview</h2>
                            <p>Ringkasan exam berdasarkan course offering Anda.</p>
                        </div>
                        <Link to="/lecturer/exams" className="admin-monitoring-button">
                            Kelola Exam
                        </Link>
                    </div>

                    {data.length === 0 ? (
                        <div className="admin-empty">Anda belum memiliki course offering.</div>
                    ) : (
                        <div className="admin-offering-list">
                            {data.map(({ offering, exams }) => (
                                <div key={offering.id} className="admin-offering-card">
                                    <div className="admin-offering-header">
                                        <div>
                                            <h3>
                                                {offering.course.code} — {offering.course.name}
                                            </h3>
                                            <p>Section {offering.section} · {offering.term}</p>
                                        </div>
                                        <span className={`admin-status ${offering.status === "ACTIVE" ? "admin-status-active" : "admin-status-inactive"}`}>
                                            {offering.status}
                                        </span>
                                    </div>

                                    {exams.length === 0 ? (
                                        <div className="admin-empty">Belum ada exam.</div>
                                    ) : (
                                        <div className="admin-exam-list">
                                            {exams.map((exam) => {
                                                const status = getExamStatus(exam);
                                                return (
                                                    <div key={exam.id} className="admin-exam-item">
                                                        <div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                                                <h4 style={{ margin: 0 }}>{exam.title}</h4>
                                                                <span className={`exam-monitoring-status ${STATUS_CLASS[status]}`}>
                                                                    {STATUS_LABEL[status]}
                                                                </span>
                                                            </div>
                                                            <p>Durasi: {exam.durationMinutes} menit · Maks. attempt: {exam.maxAttempts}</p>
                                                        </div>
                                                        <Link
                                                            to={`/lecturer/exam-monitoring/${exam.id}`}
                                                            className="admin-monitoring-button"
                                                        >
                                                            Monitoring
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LecturerDashboardPage;
