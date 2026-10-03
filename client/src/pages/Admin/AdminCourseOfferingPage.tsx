import { useEffect, useState, type FormEvent } from "react";
import { getCourses } from "../../services/course.service";
import { getActiveLecturers, type Lecturer } from "../../services/user.service";
import type { Course, CourseOffering } from "../../types/course";
import { createCourseOffering, getCourseOfferings, updateCourseOffering, type CreateCourseOfferingInput, type UpdateCourseOfferingInput } from "../../services/course-offering.service";

type OfferingForm = {
    courseId: string;
    lecturerId: string;
    term: string;
    section: string;
};

type OfferingData = {
    offeringData: CourseOffering[];
    courseData: Course[];
    lecturerData: Lecturer[];
};

const emptyForm: OfferingForm = {
    courseId: "",
    lecturerId: "",
    term: "",
    section: "",
};

const fetchOfferingData = async (): Promise<OfferingData> => {
    const [offeringData, courseData, lecturerData] = await Promise.all([
        getCourseOfferings(),
        getCourses(),
        getActiveLecturers(),
    ]);

    return { offeringData, courseData, lecturerData };
};

const OfferingCard = ({
    offering,
    onViewDetail,
    onEdit,
}: {
    offering: CourseOffering;
    onViewDetail: (offering: CourseOffering) => void;
    onEdit: (offering: CourseOffering) => void;
}) => (
    <div className="course-offering-card">
        <div className="course-offering-main">
            <div className="course-offering-title-row">
                <div>
                    <span className="course-offering-code">
                        {offering.course.code}
                    </span>
                    <h2>{offering.course.name}</h2>
                </div>

                <span className="course-offering-status">{offering.status}</span>
            </div>

            <div className="course-offering-meta">
                <span>Term: {offering.term}</span>
                <span>Section: {offering.section}</span>
            </div>

            <div className="course-offering-lecturer">
                Lecturer: <strong>{offering.lecturer.name}</strong>
                <span>{offering.lecturer.email}</span>
            </div>
        </div>

        <div className="course-offering-actions">
            <button type="button" className="course-offering-detail-button" onClick={() => onViewDetail(offering)}>
                Detail
            </button>

            <button type="button" className="course-offering-edit-button" onClick={() => onEdit(offering)}>
                Edit
            </button>
        </div>
    </div>
);

const OfferingFormModal = ({
    form,
    setForm,
    courses,
    lecturers,
    editingOffering,
    submitting,
    onSubmit,
    onClose,
}: {
    form: OfferingForm;
    setForm: React.Dispatch<React.SetStateAction<OfferingForm>>;
    courses: Course[];
    lecturers: Lecturer[];
    editingOffering: CourseOffering | null;
    submitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) => (
    <div className="course-offering-modal-backdrop">
        <div className="course-offering-modal">
            <div className="course-offering-modal-header">
                <div>
                    <h2>
                        {editingOffering ? "Edit Course Offering" : "Tambah Course Offering"}
                    </h2>
                    <p>Tentukan mata kuliah dan lecturer untuk kelas ini.</p>
                </div>

                <button type="button" className="course-offering-modal-close" onClick={onClose} disabled={submitting}>
                    ×
                </button>
            </div>

            <form className="course-offering-form" onSubmit={onSubmit}>
                <label>
                    Mata Kuliah
                    <select value={form.courseId} onChange={(event) => setForm((current) => ({...current, courseId: event.target.value,}))} required>
                        <option value="">Pilih mata kuliah</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.code} - {course.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Lecturer
                    <select value={form.lecturerId} onChange={(event) => setForm((current) => ({...current, lecturerId: event.target.value,}))} required>
                        <option value="">Pilih lecturer</option>
                        {lecturers.map((lecturer) => (
                            <option key={lecturer.id} value={lecturer.id}>
                                {lecturer.name} - {lecturer.email}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Term
                    <input type="text" value={form.term} placeholder="Contoh: 2026-GANJIL" minLength={3} maxLength={50} onChange={(event) => setForm((current) => ({...current, term: event.target.value,}))} required />
                </label>

                <label>
                    Section
                    <input type="text" value={form.section} placeholder="Contoh: A" minLength={1} maxLength={10} onChange={(event) => setForm((current) => ({...current, section: event.target.value.toUpperCase(),}))} required />
                </label>

                <div className="course-offering-form-actions">
                    <button type="button" className="course-offering-cancel-button" onClick={onClose} disabled={submitting}>
                        Batal
                    </button>

                    <button type="submit" className="course-offering-primary-button" disabled={submitting}>
                        {submitting ? "Menyimpan..." : editingOffering ? "Simpan Perubahan" : "Tambah Offering"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const OFFERING_DETAIL_FIELDS: {
    label: string;
    getValue: (offering: CourseOffering) => string;
}[] = [
    { label: "Kode", getValue: (o) => o.course.code },
    { label: "Mata Kuliah", getValue: (o) => o.course.name },
    { label: "Term", getValue: (o) => o.term },
    { label: "Section", getValue: (o) => o.section },
    { label: "Status", getValue: (o) => o.status },
    { label: "Lecturer", getValue: (o) => o.lecturer.name },
    { label: "Email Lecturer", getValue: (o) => o.lecturer.email },
];

const OfferingDetailModal = ({
    offering,
    onClose,
}: {
    offering: CourseOffering;
    onClose: () => void;
}) => (
    <div className="course-offering-modal-backdrop">
        <div className="course-offering-detail-modal">
            <div className="course-offering-modal-header">
                <div>
                    <h2>Detail Course Offering</h2>
                    <p>Informasi lengkap course offering.</p>
                </div>

                <button type="button" className="course-offering-modal-close" onClick={onClose}>
                    ×
                </button>
            </div>

            <div className="course-offering-detail-list">
                {OFFERING_DETAIL_FIELDS.map((field) => (
                    <div key={field.label}>
                        <span>{field.label}</span>
                        <strong>{field.getValue(offering)}</strong>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AdminCourseOfferingPage = () => {
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingOffering, setEditingOffering] = useState<CourseOffering | null>(
        null
    );
    const [detailOffering, setDetailOffering] = useState<CourseOffering | null>(
        null
    );

    const [form, setForm] = useState<OfferingForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const refreshData = async () => {
        try {
            const { offeringData, courseData, lecturerData } =
                await fetchOfferingData();

            setOfferings(offeringData);
            setCourses(courseData);
            setLecturers(lecturerData);
        } catch (err) {
            console.error("Gagal memperbarui data:", err);
            setMessage("Data gagal diperbarui.");
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const { offeringData, courseData, lecturerData } =
                    await fetchOfferingData();

                if (cancelled) {
                    return;
                }

                setOfferings(offeringData);
                setCourses(courseData);
                setLecturers(lecturerData);
                setError("");
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil data course offering:", err);
                setError("Gagal mengambil data course offering.");
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, []);

    const openCreateForm = () => {
        setEditingOffering(null);
        setForm(emptyForm);
        setMessage("");
        setShowForm(true);
    };

    const openEditForm = (offering: CourseOffering) => {
        setEditingOffering(offering);
        setForm({
            courseId: offering.courseId,
            lecturerId: offering.lecturerId,
            term: offering.term,
            section: offering.section,
        });
        setMessage("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingOffering(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const courseId = form.courseId.trim();
        const lecturerId = form.lecturerId.trim();
        const term = form.term.trim();
        const section = form.section.trim().toUpperCase();

        if (!courseId) {
            setMessage("Mata kuliah wajib dipilih.");
            return;
        }

        if (!lecturerId) {
            setMessage("Lecturer wajib dipilih.");
            return;
        }

        if (term.length < 3 || term.length > 50) {
            setMessage("Term harus 3-50 karakter.");
            return;
        }

        if (section.length < 1 || section.length > 10) {
            setMessage("Section harus 1-10 karakter.");
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");

            if (editingOffering) {
                const input: UpdateCourseOfferingInput = {
                    courseId,
                    lecturerId,
                    term,
                    section,
                };

                await updateCourseOffering(editingOffering.id, input);
                setMessage("Course offering berhasil diperbarui.");
            } else {
                const input: CreateCourseOfferingInput = {
                    courseId,
                    lecturerId,
                    term,
                    section,
                };

                await createCourseOffering(input);
                setMessage("Course offering berhasil dibuat.");
            }

            setShowForm(false);
            setEditingOffering(null);
            setForm(emptyForm);

            await refreshData();
        } catch (err) {
            console.error("Gagal menyimpan course offering:", err);
            setMessage("Course offering gagal disimpan.");
        } finally {
            setSubmitting(false);
        }
    };

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
                        <h1>Course Offering</h1>
                        <p>
                            Kelola kelas mata kuliah, term, section, dan
                            lecturer.
                        </p>
                    </div>

                    <button type="button" className="course-offering-primary-button" onClick={openCreateForm}>
                        + Tambah Offering
                    </button>
                </div>

                {error && (
                    <div className="course-offering-alert course-offering-alert-error">
                        {error}
                    </div>
                )}

                {message && !showForm && (
                    <div className="course-offering-alert course-offering-alert-info">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                            Tutup
                        </button>
                    </div>
                )}

                {offerings.length === 0 ? (
                    <div className="admin-empty">Belum ada course offering.</div>
                ) : (
                    <div className="course-offering-list">
                        {offerings.map((offering) => (
                            <OfferingCard key={offering.id} offering={offering} onViewDetail={setDetailOffering} onEdit={openEditForm} />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <OfferingFormModal form={form} setForm={setForm} courses={courses} lecturers={lecturers} editingOffering={editingOffering} submitting={submitting} onSubmit={handleSubmit} onClose={closeForm} />
            )}

            {detailOffering && (
                <OfferingDetailModal offering={detailOffering} onClose={() => setDetailOffering(null)} />
            )}
        </div>
    );
};

export default AdminCourseOfferingPage;