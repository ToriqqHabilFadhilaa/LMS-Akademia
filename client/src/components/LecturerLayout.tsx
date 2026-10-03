import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    BarChart3,
    BookOpen,
    ClipboardCheck,
    FileQuestion,
    LayoutDashboard,
    LogOut,
    MonitorCheck,
    PanelLeftClose,
    PanelLeftOpen,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "../context/useAuth";

type NavItem = {
    to: string;
    label: string;
    end?: boolean;
};

type NavSection = {
    title?: string;
    items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
    {
        items: [{ to: "/lecturer", label: "Dashboard", end: true }],
    },
    {
        title: "Pengajaran",
        items: [
            { to: "/lecturer/courses", label: "My Courses" },
            { to: "/lecturer/students", label: "Students" },
            { to: "/lecturer/questions", label: "Question Bank" },
        ],
    },
    {
        title: "Exam",
        items: [
            { to: "/lecturer/exams", label: "Exam Management" },
            { to: "/lecturer/exam-monitoring", label: "Exam Monitoring" },
            { to: "/lecturer/grading", label: "Grading" },
        ],
    },
    {
        title: "Laporan",
        items: [
            { to: "/lecturer/results", label: "Results" },
            { to: "/lecturer/reports", label: "Reports" },
        ],
    },
];

const NAV_ICONS: Record<string, LucideIcon> = {
    Dashboard: LayoutDashboard,
    "My Courses": BookOpen,
    Students: Users,
    "Question Bank": FileQuestion,
    "Exam Management": ClipboardCheck,
    "Exam Monitoring": MonitorCheck,
    Grading: ClipboardCheck,
    Results: BarChart3,
    Reports: BarChart3,
};

const getNavItemClass = ({ isActive }: { isActive: boolean }): string =>
    `admin-nav-item ${isActive ? "admin-nav-item-active" : ""}`;

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const LecturerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    if (!user) {
        return null;
    }

    return (
        <div className="admin-layout">
            {isSidebarOpen && (
                <div className="admin-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />
            )}

            <aside className={`admin-sidebar ${!isSidebarOpen ? "admin-sidebar-collapsed" : ""}`}>
                <div className="admin-sidebar-inner">
                    <div className="admin-brand">
                        <div className="admin-brand-logo">A</div>
                        <div>
                            <h2>Akademia</h2>
                            <span>Lecturer Panel</span>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        {NAV_SECTIONS.map((section) => (
                            <div key={section.title ?? "default"}>
                                {section.title && (
                                    <div className="admin-nav-title">{section.title}</div>
                                )}
                                {section.items.map((item) => {
                                    const Icon = NAV_ICONS[item.label];

                                    return (
                                        <NavLink key={item.to} to={item.to} end={item.end} className={getNavItemClass}>
                                            <span className="admin-nav-item-main">
                                                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                                                <span>{item.label}</span>
                                            </span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    <div className="admin-sidebar-footer">
                        <span>Lecturer</span>
                        <small>Akademia LMS</small>
                    </div>
                </div>
            </aside>

            <main className="admin-main">
                <div className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button
                            type="button"
                            className="admin-sidebar-toggle"
                            onClick={() => setIsSidebarOpen((prev) => !prev)}
                            aria-label={isSidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
                            aria-expanded={isSidebarOpen}
                        >
                            {isSidebarOpen
                                ? <PanelLeftClose size={19} strokeWidth={1.8} aria-hidden="true" />
                                : <PanelLeftOpen size={19} strokeWidth={1.8} aria-hidden="true" />}
                        </button>
                        <span className="admin-topbar-label">Lecturer</span>
                    </div>

                    <div className="admin-topbar-profile">
                        <div className="admin-topbar-avatar" aria-hidden="true">
                            {getInitials(user.name)}
                        </div>
                        <div className="admin-topbar-profile-text">
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                        </div>
                        <button type="button" className="admin-topbar-logout-button" onClick={handleLogout}>
                            <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default LecturerLayout;
