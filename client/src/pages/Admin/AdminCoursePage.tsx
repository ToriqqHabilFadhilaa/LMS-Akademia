import { useEffect, useState, type FormEvent } from "react";
import { createCourse, getCourses, updateCourse, type CreateCourseInput, type UpdateCourseInput } from "../../services/course.service";
import type { Course } from "../../types/course";

type CourseForm = {
    code: string;
    name: string;
    description: string;
};

const emptyForm: CourseForm = {
    code: "",
    name: "",
    description: "",
};

const COURSE_DETAIL_FIELDS: {
    label: string;
    getValue: (course: Course) => string;
}[] = [
    { label: "Kode", getValue: (c) => c.code },
    { label: "Nama", getValue: (c) => c.name },
    { label: "Deskripsi", getValue: (c) => c.description || "Tidak ada deskripsi." },
    {
        label: "Dibuat",
        getValue: (c) => new Date(c.createdAt).toLocaleString("id-ID"),
    },
    {
        label: "Diperbarui",
        getValue: (c) => new Date(c.updatedAt).toLocaleString("id-ID"),
    },
];

const CourseCard = ({
    course,
    onViewDetail,
    onEdit,
}: {
    course: Course;
    onViewDetail: (course: Course) => void;
    onEdit: (course: Course) => void;
}) => (
    <div className="course-management-card">
        <div className="course-management-main">
            <span className="course-management-code">{course.code}</span>
            <h2>{course.name}</h2>
            <p>{course.description || "Tidak ada deskripsi."}</p>
        </div>

        <div className="course-management-actions">
            <button type="button" className="course-management-detail-button" onClick={() => onViewDetail(course)}>
                Detail
            </button>

            <button type="button" className="course-management-edit-button" onClick={() => onEdit(course)}>
                Edit
            </button>
        </div>
    </div>
);

const CourseFormModal = ({
    form,
    setForm,
    editingCourse,
    submitting,
    onSubmit,
    onClose,
}: {
    form: CourseForm;
    setForm: React.Dispatch<React.SetStateAction<CourseForm>>;
    editingCourse: Course | null;
    submitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) => (
    <div className="course-management-modal-backdrop">
        <div className="course-management-modal">
            <div className="course-management-modal-header">
                <div>
                    <h2>{editingCourse ? "Edit Course" : "Tambah Course"}</h2>
                    <p>Isi informasi mata kuliah.</p>
                </div>

                <button type="button" className="course-management-modal-close" onClick={onClose} disabled={submitting}>
                    ×
                </button>
            </div>

            <form className="course-management-form" onSubmit={onSubmit}>
                <label>
                    Kode Mata Kuliah
                    <input type="text" value={form.code} minLength={2} maxLength={20} placeholder="Contoh: IF101" onChange={(event) => setForm((current) => ({...current, code: event.target.value.toUpperCase(),}))} required />
                </label>

                <label>
                    Nama Mata Kuliah
                    <input type="text" value={form.name} minLength={2} maxLength={150} placeholder="Contoh: Sistem Informasi" onChange={(event) => setForm((current) => ({...current, name: event.target.value,}))} required />
                </label>

                <label>
                    Deskripsi
                    <textarea rows={5} maxLength={1000} value={form.description} placeholder="Deskripsi mata kuliah..." onChange={(event) => setForm((current) => ({...current, description: event.target.value,}))} />
                </label>

                <div className="course-management-form-actions">
                    <button type="button" className="course-management-cancel-button" onClick={onClose} disabled={submitting}>
                        Batal
                    </button>

                    <button type="submit" className="course-management-primary-button" disabled={submitting}>
                        {submitting ? "Menyimpan..." : editingCourse ? "Simpan Perubahan" : "Tambah Course"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const CourseDetailModal = ({
    course,
    onClose,
}: {
    course: Course;
    onClose: () => void;
}) => (
    <div className="course-management-modal-backdrop">
        <div className="course-management-detail-modal">
            <div className="course-management-modal-header">
                <div>
                    <h2>Detail Course</h2>
                    <p>Informasi lengkap mata kuliah.</p>
                </div>

                <button type="button" className="course-management-modal-close" onClick={onClose}>
                    ×
                </button>
            </div>

            <div className="course-management-detail-list">
                {COURSE_DETAIL_FIELDS.map((field) => (
                    <div key={field.label}>
                        <span>{field.label}</span>
                        <strong>{field.getValue(course)}</strong>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const AdminCoursePage = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [detailCourse, setDetailCourse] = useState<Course | null>(null);

    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const refreshData = async () => {
        try {
            setCourses(await getCourses());
        } catch (err) {
            console.error("Gagal memperbarui data course:", err);
            setMessage("Data course gagal diperbarui.");
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await getCourses();

                if (cancelled) {
                    return;
                }

                setCourses(data);
                setError("");
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil data course:", err);
                setError("Gagal mengambil daftar course.");
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
        setEditingCourse(null);
        setForm(emptyForm);
        setMessage("");
        setShowForm(true);
    };

    const openEditForm = (course: Course) => {
        setEditingCourse(course);
        setForm({
            code: course.code,
            name: course.name,
            description: course.description ?? "",
        });
        setMessage("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingCourse(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        const description = form.description.trim();

        if (code.length < 2 || code.length > 20) {
            setMessage("Kode mata kuliah harus 2-20 karakter.");
            return;
        }

        if (name.length < 2 || name.length > 150) {
            setMessage("Nama mata kuliah harus 2-150 karakter.");
            return;
        }

        if (description.length > 1000) {
            setMessage("Deskripsi maksimal 1000 karakter.");
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");

            if (editingCourse) {
                const input: UpdateCourseInput = { code, name, description };

                await updateCourse(editingCourse.id, input);
                setMessage("Course berhasil diperbarui.");
            } else {
                const input: CreateCourseInput = {
                    code,
                    name,
                    description: description || undefined,
                };

                await createCourse(input);
                setMessage("Course berhasil dibuat.");
            }

            setShowForm(false);
            setEditingCourse(null);
            setForm(emptyForm);

            await refreshData();
        } catch (err) {
            console.error("Gagal menyimpan course:", err);
            setMessage("Course gagal disimpan.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat course...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Course Management</h1>
                        <p>Kelola mata kuliah Akademia.</p>
                    </div>

                    <button type="button" className="course-management-primary-button" onClick={openCreateForm}>
                        + Tambah Course
                    </button>
                </div>

                {error && (
                    <div className="course-management-alert course-management-alert-error">
                        {error}
                    </div>
                )}

                {message && !showForm && (
                    <div className="course-management-alert course-management-alert-info">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                            Tutup
                        </button>
                    </div>
                )}

                <div className="course-management-summary">
                    <div className="admin-summary-card">
                        <span>Total Mata Kuliah</span>
                        <strong>{courses.length}</strong>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <div className="admin-empty">Belum ada course.</div>
                ) : (
                    <div className="course-management-list">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} onViewDetail={setDetailCourse} onEdit={openEditForm} />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <CourseFormModal form={form} setForm={setForm} editingCourse={editingCourse} submitting={submitting} onSubmit={handleSubmit} onClose={closeForm} />
            )}

            {detailCourse && (
                <CourseDetailModal course={detailCourse} onClose={() => setDetailCourse(null)} />
            )}
        </div>
    );
};

export default AdminCoursePage;