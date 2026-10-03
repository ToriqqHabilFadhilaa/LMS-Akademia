import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
    BadgeCheck,
    ClipboardList,
    LayoutDashboard,
    LogOut,
    Menu,
    ShieldCheck,
    UserRound,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "../context/useAuth";

interface StudentLayoutProps {
    children?: ReactNode;
}

type NavItem = {
    label: string;
    to: string;
    end?: boolean;
};

// NOTE: sesuaikan path ini dengan route index yang sebenarnya kalau berbeda.
const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", to: "/student", end: true },
    { label: "Exam History", to: "/student/history" },
    { label: "Results", to: "/student/results" },
    { label: "Proctoring", to: "/student/proctoring" },
    { label: "Profile", to: "/student/profile" },
];

const NAV_ICONS: Record<string, LucideIcon> = {
    Dashboard: LayoutDashboard,
    "Exam History": ClipboardList,
    Results: BadgeCheck,
    Proctoring: ShieldCheck,
    Profile: UserRound,
};

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
};

const StudentLayout = ({ children }: StudentLayoutProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    if (!user) {
        return null;
    }

    return (
        <div className="student-layout">
            <header className="student-header">
                <div className="student-header-bar">
                    <div className="student-brand">
                        <span className="student-brand-mark">A</span>
                        <div>
                            <span className="student-brand-name">Akademia</span>
                            <span className="student-brand-tagline">
                                Sistem Pembelajaran
                            </span>
                        </div>
                    </div>

                    <nav className="student-nav">
                        {NAV_ITEMS.map((item) => {
                            const Icon = NAV_ICONS[item.label];

                            return (
                                <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? "active" : ""}>
                                    <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                                    {item.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="student-profile">
                        <div className="student-avatar" aria-hidden="true">
                            {getInitials(user.name)}
                        </div>

                        <div className="student-profile-text">
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                        </div>

                        <button type="button" className="student-logout-button" onClick={handleLogout}>
                            <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span>Logout</span>
                        </button>

                        <button type="button" className="student-menu-toggle" onClick={() => setIsMenuOpen((prev) => !prev)} aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={isMenuOpen}>
                            {isMenuOpen
                                ? <X size={20} strokeWidth={1.8} aria-hidden="true" />
                                : <Menu size={20} strokeWidth={1.8} aria-hidden="true" />}
                        </button>
                    </div>
                </div>

                {isMenuOpen && (
                    <div className="student-mobile-menu">
                        <nav>
                            {NAV_ITEMS.map((item) => {
                                const Icon = NAV_ICONS[item.label];

                                return (
                                    <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? "active" : ""} onClick={() => setIsMenuOpen(false)}>
                                        <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </nav>

                        <div className="student-mobile-profile">
                            <div className="student-avatar" aria-hidden="true">
                                {getInitials(user.name)}
                            </div>

                            <div className="student-profile-text">
                                <strong>{user.name}</strong>
                                <small>{user.email}</small>
                            </div>
                        </div>

                        <button type="button" className="student-logout-button" onClick={handleLogout}>
                            <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
                            <span>Logout</span>
                        </button>
                    </div>
                )}
            </header>

            <main className="student-content">{children ?? <Outlet />}</main>
        </div>
    );
};

export default StudentLayout;