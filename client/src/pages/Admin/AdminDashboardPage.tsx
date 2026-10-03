import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BarChart3,
    BookOpen,
    ClipboardCheck,
    ClipboardList,
    MonitorCheck,
    Users,
} from "lucide-react";
import { getCourseOfferings } from "../../services/course-offering.service";
import { getExamsByCourseOfferingId } from "../../services/exam.service";
import { getUsers } from "../../services/user.service";
import type { CourseOffering, Exam } from "../../types/course";

interface CourseOfferingWithExams {
    offering: CourseOffering;
    exams: Exam[];
}

const QUICK_ACTIONS = [
    {
        to: "/admin/users",
        title: "User Management",
        description: "Kelola akun user",
        Icon: Users,
    },
    {
        to: "/admin/courses",
        title: "Course Management",
        description: "Kelola mata kuliah",
        Icon: BookOpen,
    },
    {
        to: "/admin/course-offerings",
        title: "Course Offering",
        description: "Kelola kelas perkuliahan",
        Icon: ClipboardList,
    },
    {
        to: "/admin/exams",
        title: "Exam Management",
        description: "Kelola exam",
        Icon: ClipboardCheck,
    },
    {
        to: "/admin/exam-monitoring",
        title: "Exam Monitoring",
        description: "Pantau exam berlangsung",
        Icon: MonitorCheck,
    },
    {
        to: "/admin/reports",
        title: "Reports",
        description: "Lihat laporan exam",
        Icon: BarChart3,
    },
];

const SummaryCard = ({
    label,
    value,
}: {
    label: string;
    value: number;
}) => (
    <div className="admin-summary-card">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const ExamItem = ({ exam }: { exam: Exam }) => (
    <div className="admin-exam-item">
        <div>
            <h4>{exam.title}</h4>
            <p>Durasi: {exam.durationMinutes} menit</p>
            <p>Maks. attempt: {exam.maxAttempts}</p>
        </div>

        <Link
            to={`/admin/exam-monitoring/${exam.id}`}
            className="admin-monitoring-button"
        >
            Monitoring
        </Link>
    </div>
);

const OfferingCard = ({ offering, exams }: CourseOfferingWithExams) => {
    const isActive = offering.status === "ACTIVE";

    return (
        <div className="admin-offering-card">
            <div className="admin-offering-header">
                <div>
                    <h3>
                        {offering.course.code} - {offering.course.name}
                    </h3>
                    <p>
                        Section {offering.section} · {offering.term}
                    </p>
                    <p>Dosen: {offering.lecturer.name}</p>
                </div>

                <span
                    className={`admin-status ${
                        isActive ? "admin-status-active" : "admin-status-inactive"
                    }`}
                >
                    {offering.status}
                </span>
            </div>

            {exams.length === 0 ? (
                <div className="admin-empty">
                    Belum ada exam pada course offering ini.
                </div>
            ) : (
                <div className="admin-exam-list">
                    {exams.map((exam) => (
                        <ExamItem key={exam.id} exam={exam} />
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminDashboardPage = () => {
    const [data, setData] = useState<CourseOfferingWithExams[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const [offerings, users] = await Promise.all([
                    getCourseOfferings(),
                    getUsers(),
                ]);

                if (cancelled) {
                    return;
                }

                // NOTE: N+1 request (1 per course offering) untuk ambil exam.
                // Worth diganti endpoint agregat backend kalau offering banyak.
                const result = await Promise.all(
                    offerings.map(async (offering) => ({
                        offering,
                        exams: await getExamsByCourseOfferingId(offering.id),
                    }))
                );

                if (cancelled) {
                    return;
                }

                setData(result);
                setTotalUsers(users.length);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil data admin dashboard:", err);
                setError("Gagal mengambil data dashboard.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalOfferings = data.length;
    const activeOfferings = data.filter(
        (item) => item.offering.status === "ACTIVE"
    ).length;
    const totalExams = data.reduce(
        (total, item) => total + item.exams.length,
        0
    );

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
                        <h1>Admin Dashboard</h1>
                        <p>Ringkasan aktivitas dan data Akademia.</p>
                    </div>
                </div>

                {error && (
                    <div className="admin-alert admin-alert-error">{error}</div>
                )}

                <div className="admin-summary">
                    <SummaryCard label="Total User" value={totalUsers} />
                    <SummaryCard label="Course Offering" value={totalOfferings} />
                    <SummaryCard label="Offering Aktif" value={activeOfferings} />
                    <SummaryCard label="Total Exam" value={totalExams} />
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
                            <p>Ringkasan exam berdasarkan course offering.</p>
                        </div>

                        <Link to="/admin/exams" className="admin-monitoring-button">
                            Kelola Exam
                        </Link>
                    </div>

                    {data.length === 0 ? (
                        <div className="admin-empty">Belum ada course offering.</div>
                    ) : (
                        <div className="admin-offering-list">
                            {data.map(({ offering, exams }) => (
                                <OfferingCard key={offering.id} offering={offering} exams={exams} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;