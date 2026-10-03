import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ClipboardList, FileText } from "lucide-react";

import { useAuth } from "../../context/useAuth";
import { getMyCourses } from "../../services/course-member.service";
import { getMyAssignments } from "../../services/assignment.service";
import { getMyExams } from "../../services/exam.service";
import { getMySubmissions } from "../../services/submission.service";
import StudentLayout from "../../components/StudentLayout";

import type { CourseMember, Assignment, Exam } from "../../types/course";
import type { Submission } from "../../types/submission";

type UpcomingItem = {
    id: string;
    type: "assignment" | "exam";
    title: string;
    courseCode: string;
    href: string;
    sortDate: Date;
    statusLabel: string;
};

const getGreeting = (): string => {
    const hour = new Date().getHours();

    if (hour < 10) return "Selamat pagi";
    if (hour < 15) return "Selamat siang";
    if (hour < 18) return "Selamat sore";
    return "Selamat malam";
};

const formatRelativeDate = (date: Date): string => {
    const diffMs = date.getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) return "Sudah lewat";
    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Besok";
    return `${diffDays} hari lagi`;
};

const StudentDashboardPage = () => {
    const { user } = useAuth();

    const [courses, setCourses] = useState<CourseMember[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState(0);
    const [upcomingExamCount, setUpcomingExamCount] = useState(0);
    const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const courseData = await getMyCourses();
                setCourses(courseData);

                if (courseData.length === 0) {
                    setPendingAssignments(0);
                    setUpcomingExamCount(0);
                    setUpcomingItems([]);
                    return;
                }

                // NOTE: N+1 request per course (assignment + exam tiap course).
                // Kalau jumlah course siswa banyak, ini worth diganti endpoint
                // agregat di backend (mis. GET /me/dashboard-summary).
                const [assignmentLists, examLists, submissions] = await Promise.all([
                    Promise.all(
                        courseData.map((c) => getMyAssignments(c.courseOfferingId))
                    ),
                    Promise.all(
                        courseData.map((c) => getMyExams(c.courseOfferingId))
                    ),
                    getMySubmissions(),
                ]);

                const assignments: Assignment[] = assignmentLists.flat();
                const exams: Exam[] = examLists.flat();

                buildDashboardSummary(assignments, exams, submissions);
            } catch {
                setError("Gagal mengambil data dashboard.");
            } finally {
                setLoading(false);
            }
        };

        const buildDashboardSummary = (
            assignments: Assignment[],
            exams: Exam[],
            submissions: Submission[]
        ) => {
            const now = new Date();
            const submittedAssignmentIds = new Set(
                submissions.map((s) => s.assignmentId)
            );

            const pendingAssignmentList = assignments.filter(
                (a) =>
                    !submittedAssignmentIds.has(a.id) &&
                    new Date(a.deadline) >= now
            );

            const activeExams = exams.filter((e) => new Date(e.endAt) >= now);

            setPendingAssignments(pendingAssignmentList.length);
            setUpcomingExamCount(activeExams.length);

            const assignmentItems: UpcomingItem[] = pendingAssignmentList.map(
                (a) => ({
                    id: `assignment-${a.id}`,
                    type: "assignment",
                    title: a.title,
                    courseCode: a.courseOffering.course.code,
                    href: `/student/assignments/${a.id}`,
                    sortDate: new Date(a.deadline),
                    statusLabel: `Deadline ${formatRelativeDate(
                        new Date(a.deadline)
                    )}`,
                })
            );

            const examItems: UpcomingItem[] = activeExams.map((e) => {
                const startAt = new Date(e.startAt);
                const isOngoing = startAt <= now;

                return {
                    id: `exam-${e.id}`,
                    type: "exam",
                    title: e.title,
                    courseCode: e.courseOffering.course.code,
                    href: `/student/exams/${e.id}`,
                    sortDate: isOngoing ? new Date(e.endAt) : startAt,
                    statusLabel: isOngoing
                        ? "Sedang berlangsung"
                        : `Mulai ${formatRelativeDate(startAt)}`,
                };
            });

            const merged = [...assignmentItems, ...examItems]
                .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
                .slice(0, 5);

            setUpcomingItems(merged);
        };

        void loadDashboard();
    }, []);

    if (!user) {
        return null;
    }

    return (
        <StudentLayout>
            <section className="dashboard-hero">
                <p className="dashboard-label">STUDENT DASHBOARD</p>
                <h2>
                    {getGreeting()}, {user.name}
                </h2>
                <p>
                    Kelola pembelajaran, tugas, dan ujian kamu melalui
                    Akademia.
                </p>
            </section>

            <section className="dashboard-grid">
                <div className="dashboard-stat">
                    <span className="dashboard-stat-icon"><BookOpen size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                    <span>Course</span>
                    <strong>{loading ? "..." : courses.length}</strong>
                    <small>Course yang diikuti</small>
                </div>

                <div className="dashboard-stat">
                    <span className="dashboard-stat-icon"><FileText size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                    <span>Tugas</span>
                    <strong>{loading ? "..." : pendingAssignments}</strong>
                    <small>Belum dikerjakan</small>
                </div>

                <div className="dashboard-stat">
                    <span className="dashboard-stat-icon"><ClipboardList size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                    <span>Exam</span>
                    <strong>{loading ? "..." : upcomingExamCount}</strong>
                    <small>Masih tersedia</small>
                </div>
            </section>

            <section className="upcoming-section">
                <div className="section-header">
                    <div>
                        <h3>Aktivitas Mendatang</h3>
                        <p>Tugas dan exam yang perlu segera kamu selesaikan.</p>
                    </div>
                </div>

                {loading && (
                    <div className="empty-state">Memuat aktivitas...</div>
                )}

                {!loading && upcomingItems.length === 0 && (
                    <div className="empty-state">
                        Tidak ada tugas atau exam yang mendekati deadline.
                    </div>
                )}

                {!loading && upcomingItems.length > 0 && (
                    <div className="upcoming-list">
                        {upcomingItems.map((item) => (
                            <Link key={item.id} to={item.href} className="upcoming-item">
                                <span className={`upcoming-type upcoming-type-${item.type}`}>
                                    {item.type === "assignment" ? "Tugas" : "Exam"}
                                </span>

                                <div className="upcoming-item-content">
                                    <strong>{item.title}</strong>
                                    <small>{item.courseCode}</small>
                                </div>

                                <span className="upcoming-status">
                                    {item.statusLabel}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="course-section">
                <div className="section-header">
                    <div>
                        <h3>Course Saya</h3>
                        <p>Course yang terdaftar pada akun kamu.</p>
                    </div>
                </div>

                {loading && (
                    <div className="empty-state">Memuat course...</div>
                )}

                {!loading && error && (
                    <div className="empty-state">{error}</div>
                )}

                {!loading && !error && courses.length === 0 && (
                    <div className="empty-state">
                        Belum ada course yang diikuti.
                    </div>
                )}

                {!loading && !error && courses.length > 0 && (
                    <div className="course-grid">
                        {courses.map((member) => (
                            <Link to={`/student/courses/${member.courseOfferingId}`} className="course-card" key={member.id}>
                                <span className="course-code">
                                    {member.courseOffering.course.code}
                                </span>

                                <h4>{member.courseOffering.course.name}</h4>

                                <p>
                                    {member.courseOffering.term} · Section{" "}
                                    {member.courseOffering.section}
                                </p>

                                <span className="course-status">
                                    {member.courseOffering.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </StudentLayout>
    );
};

export default StudentDashboardPage;