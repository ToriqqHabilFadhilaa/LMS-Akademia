import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLecturerCourseOfferings } from "../../services/course-offering.service";
import { getCourseMembers } from "../../services/course-member.service";
import type { CourseOffering } from "../../types/course";
interface StudentRow {
    memberId: string;
    userId: string;
    name: string;
    email: string;
    status: string;
    offeringId: string;
    offeringLabel: string;
}

const LecturerStudentsPage = () => {
    const [searchParams] = useSearchParams();
    const preselectedOfferingId = searchParams.get("offeringId") ?? "ALL";

    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [allMembers, setAllMembers] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [offeringFilter, setOfferingFilter] = useState(preselectedOfferingId);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const offeringData = await getLecturerCourseOfferings();

                if (cancelled) return;

                setOfferings(offeringData);

                const memberResults = await Promise.all(
                    offeringData.map((o) =>
                        getCourseMembers(o.id).then((members) =>
                            members
                                .filter((m) => m.role === "STUDENT")
                                .map(
                                    (m): StudentRow => ({
                                        memberId: m.id,
                                        userId: m.user.id,
                                        name: m.user.name,
                                        email: m.user.email,
                                        status: m.user.status,
                                        offeringId: o.id,
                                        offeringLabel: `${o.course.code} — ${o.course.name} (${o.term} / ${o.section})`,
                                    })
                                )
                        )
                    )
                );

                if (cancelled) return;

                // deduplicate by userId + offeringId
                const seen = new Set<string>();
                const flat: StudentRow[] = [];
                for (const rows of memberResults) {
                    for (const row of rows) {
                        const key = `${row.userId}-${row.offeringId}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            flat.push(row);
                        }
                    }
                }

                setAllMembers(flat);
            } catch {
                if (!cancelled) setError("Gagal mengambil data mahasiswa.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return allMembers.filter((s) => {
            const matchOffering =
                offeringFilter === "ALL" || s.offeringId === offeringFilter;
            const matchSearch =
                !keyword ||
                s.name.toLowerCase().includes(keyword) ||
                s.email.toLowerCase().includes(keyword);
            return matchOffering && matchSearch;
        });
    }, [allMembers, search, offeringFilter]);

    const uniqueStudents = useMemo(() => {
        const ids = new Set(allMembers.map((s) => s.userId));
        return ids.size;
    }, [allMembers]);

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat data mahasiswa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Students</h1>
                        <p>Daftar mahasiswa yang terdaftar di course offering Anda.</p>
                    </div>
                </div>

                {error && (
                    <div className="admin-alert admin-alert-error">{error}</div>
                )}

                {/* Summary */}
                <div className="admin-summary">
                    <div className="admin-summary-card">
                        <span>Total Mahasiswa</span>
                        <strong>{uniqueStudents}</strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Total Enrollment</span>
                        <strong>{allMembers.length}</strong>
                    </div>
                    <div className="admin-summary-card">
                        <span>Course Offering</span>
                        <strong>{offerings.length}</strong>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="admin-card">
                    <div className="user-management-toolbar">
                        <input
                            type="search"
                            className="user-management-search"
                            placeholder="Cari nama atau email..."
                            aria-label="Cari mahasiswa"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="user-management-filter"
                            aria-label="Filter course offering"
                            value={offeringFilter}
                            onChange={(e) => setOfferingFilter(e.target.value)}
                        >
                            <option value="ALL">Semua Course Offering</option>
                            {offerings.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.course.code} — {o.course.name} ({o.term} / {o.section})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Daftar Mahasiswa</h2>
                            <p>Menampilkan {filtered.length} dari {allMembers.length} enrollment.</p>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="admin-empty">Tidak ada mahasiswa yang sesuai filter.</div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="lecturer-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nama</th>
                                        <th>Email</th>
                                        <th>Course Offering</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((student, idx) => (
                                        <tr key={student.memberId}>
                                            <td>{idx + 1}</td>
                                            <td>{student.name}</td>
                                            <td>{student.email}</td>
                                            <td>
                                                <span className="exam-monitoring-course-code" style={{ fontSize: "0.75rem" }}>
                                                    {student.offeringLabel}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`admin-status ${student.status === "ACTIVE" ? "admin-status-active" : "admin-status-inactive"}`}>
                                                    {student.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LecturerStudentsPage;
