import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getLecturerCourseOfferings } from "../../services/course-offering.service";
import {
    createExam,
    deleteExam,
    getExamsByCourseOfferingId,
    updateExam,
    type CreateExamInput,
    type UpdateExamInput,
} from "../../services/exam.service";
import type { CourseOffering, Exam } from "../../types/course";

type ExamForm = {
    courseOfferingId: string;
    title: string;
    description: string;
    durationMinutes: string;
    startAt: string;
    endAt: string;
    maxAttempts: string;
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
};

type ExamStatusKey = "UPCOMING" | "ONGOING" | "ENDED";

const emptyForm: ExamForm = {
    courseOfferingId: "",
    title: "",
    description: "",
    durationMinutes: "60",
    startAt: "",
    endAt: "",
    maxAttempts: "1",
    shuffleQuestions: false,
    shuffleAnswers: false,
};

const EXAM_STATUS_CONFIG: Record<ExamStatusKey, { label: string; className: string }> = {
    UPCOMING: { label: "Akan Datang", className: "exam-status-upcoming" },
    ONGOING: { label: "Berlangsung", className: "exam-status-active" },
    ENDED: { label: "Selesai", className: "exam-status-ended" },
};

const toDateTimeLocal = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const getExamStatusKey = (exam: Exam): ExamStatusKey => {
    const now = Date.now();
    const start = new Date(exam.startAt).getTime();
    const end = new Date(exam.endAt).getTime();
    if (now < start) return "UPCOMING";
    if (now > end) return "ENDED";
    return "ONGOING";
};

const formatOfferingLabel = (o: CourseOffering) =>
    `${o.course.code} - ${o.course.name} · Section ${o.section} · ${o.term}`;

const ExamCard = ({
    exam,
    onEdit,
    onRequestDelete,
}: {
    exam: Exam;
    onEdit: (exam: Exam) => void;
    onRequestDelete: (exam: Exam) => void;
}) => {
    const status = EXAM_STATUS_CONFIG[getExamStatusKey(exam)];
    return (
        <div className="admin-exam-management-card">
            <div className="admin-exam-management-main">
                <div className="admin-exam-management-title">
                    <div>
                        <span className="admin-exam-code">{exam.courseOffering.course.code}</span>
                        <h2>{exam.title}</h2>
                    </div>
                    <span className={`admin-exam-status ${status.className}`}>{status.label}</span>
                </div>
                <p className="admin-exam-description">{exam.description || "Tidak ada deskripsi."}</p>
                <div className="admin-exam-meta">
                    <span>Durasi: {exam.durationMinutes} menit</span>
                    <span>Attempt: {exam.maxAttempts}</span>
                    <span>KKM: {exam.passingScore}</span>
                    <span>Mulai: {formatDate(exam.startAt)}</span>
                    <span>Selesai: {formatDate(exam.endAt)}</span>
                </div>
                <div className="admin-exam-course-info">
                    {exam.courseOffering.course.name} · Section {exam.courseOffering.section} · {exam.courseOffering.term}
                </div>
            </div>
            <div className="admin-exam-actions">
                <Link
                    to={`/lecturer/exam-monitoring/${exam.id}`}
                    className="admin-monitoring-button"
                >
                    Monitoring
                </Link>
                <button type="button" className="admin-exam-management-edit-button" onClick={() => onEdit(exam)}>
                    Edit
                </button>
                <button type="button" className="admin-exam-management-delete-button" onClick={() => onRequestDelete(exam)}>
                    Hapus
                </button>
            </div>
        </div>
    );
};

const ExamFormModal = ({
    form,
    setForm,
    offerings,
    editingExam,
    submitting,
    onSubmit,
    onClose,
}: {
    form: ExamForm;
    setForm: React.Dispatch<React.SetStateAction<ExamForm>>;
    offerings: CourseOffering[];
    editingExam: Exam | null;
    submitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) => (
    <div className="admin-exam-management-modal-backdrop">
        <div className="admin-exam-management-modal">
            <div className="admin-exam-management-modal-header">
                <div>
                    <h2>{editingExam ? "Edit Exam" : "Buat Exam"}</h2>
                    <p>Isi informasi exam.</p>
                </div>
                <button type="button" className="admin-exam-management-modal-close" onClick={onClose} disabled={submitting}>
                    ×
                </button>
            </div>

            <form className="admin-exam-management-form" onSubmit={onSubmit}>
                <label>
                    Course Offering
                    <select
                        value={form.courseOfferingId}
                        onChange={(e) => setForm((c) => ({ ...c, courseOfferingId: e.target.value }))}
                        disabled={Boolean(editingExam)}
                        required
                    >
                        <option value="">Pilih course offering</option>
                        {offerings.map((o) => (
                            <option key={o.id} value={o.id}>{formatOfferingLabel(o)}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Judul Exam
                    <input type="text" value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} required minLength={2} maxLength={200} />
                </label>

                <label>
                    Deskripsi
                    <textarea rows={4} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} maxLength={5000} />
                </label>

                <label>
                    Durasi (menit)
                    <input type="number" min="1" max="1440" step="1" value={form.durationMinutes} onChange={(e) => setForm((c) => ({ ...c, durationMinutes: e.target.value }))} required />
                </label>

                <label>
                    Mulai
                    <input type="datetime-local" value={form.startAt} onChange={(e) => setForm((c) => ({ ...c, startAt: e.target.value }))} required />
                </label>

                <label>
                    Selesai
                    <input type="datetime-local" value={form.endAt} onChange={(e) => setForm((c) => ({ ...c, endAt: e.target.value }))} required />
                </label>

                <label>
                    Maksimal Attempt
                    <input type="number" min="1" max="10" step="1" value={form.maxAttempts} onChange={(e) => setForm((c) => ({ ...c, maxAttempts: e.target.value }))} required />
                </label>

                <label className="admin-exam-management-checkbox">
                    <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm((c) => ({ ...c, shuffleQuestions: e.target.checked }))} />
                    Acak urutan soal
                </label>

                <label className="admin-exam-management-checkbox">
                    <input type="checkbox" checked={form.shuffleAnswers} onChange={(e) => setForm((c) => ({ ...c, shuffleAnswers: e.target.checked }))} />
                    Acak jawaban
                </label>

                <div className="admin-exam-management-form-actions">
                    <button type="button" className="admin-exam-management-cancel-button" onClick={onClose} disabled={submitting}>
                        Batal
                    </button>
                    <button type="submit" className="admin-exam-management-primary-button" disabled={submitting}>
                        {submitting ? "Menyimpan..." : editingExam ? "Simpan Perubahan" : "Buat Exam"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const DeleteExamConfirmModal = ({
    exam,
    deleting,
    onCancel,
    onConfirm,
}: {
    exam: Exam;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) => (
    <div className="admin-exam-management-modal-backdrop">
        <div className="admin-exam-management-confirm-modal">
            <h2>Hapus Exam?</h2>
            <p>Exam berikut akan dihapus:</p>
            <div className="admin-exam-management-confirm-text">{exam.title}</div>
            <div className="admin-exam-management-form-actions">
                <button type="button" className="admin-exam-management-cancel-button" onClick={onCancel} disabled={deleting}>
                    Batal
                </button>
                <button type="button" className="admin-exam-management-delete-button" onClick={onConfirm} disabled={deleting}>
                    {deleting ? "Menghapus..." : "Hapus"}
                </button>
            </div>
        </div>
    </div>
);

const LecturerExamPage = () => {
    const [searchParams] = useSearchParams();
    const preselectedOfferingId = searchParams.get("offeringId") ?? "ALL";

    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedOfferingId, setSelectedOfferingId] = useState(preselectedOfferingId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingExam, setEditingExam] = useState<Exam | null>(null);
    const [form, setForm] = useState<ExamForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const offeringData = await getLecturerCourseOfferings();
            const examGroups = await Promise.all(
                offeringData.map((o) => getExamsByCourseOfferingId(o.id))
            );

            setOfferings(offeringData);
            setExams(examGroups.flat());
        } catch {
            setError("Gagal mengambil data exam.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const offeringData = await getLecturerCourseOfferings();
                const examGroups = await Promise.all(
                    offeringData.map((o) => getExamsByCourseOfferingId(o.id))
                );

                if (cancelled) return;

                setOfferings(offeringData);
                setExams(examGroups.flat());
            } catch {
                if (!cancelled) setError("Gagal mengambil data exam.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, []);

    const visibleExams =
        selectedOfferingId === "ALL"
            ? exams
            : exams.filter((e) => e.courseOfferingId === selectedOfferingId);

    const openCreateForm = () => {
        setEditingExam(null);
        setForm({
            ...emptyForm,
            courseOfferingId: selectedOfferingId !== "ALL" ? selectedOfferingId : "",
        });
        setMessage("");
        setShowForm(true);
    };

    const openEditForm = (exam: Exam) => {
        setEditingExam(exam);
        setForm({
            courseOfferingId: exam.courseOfferingId,
            title: exam.title,
            description: exam.description ?? "",
            durationMinutes: String(exam.durationMinutes),
            startAt: toDateTimeLocal(exam.startAt),
            endAt: toDateTimeLocal(exam.endAt),
            maxAttempts: String(exam.maxAttempts),
            shuffleQuestions: exam.shuffleQuestions,
            shuffleAnswers: exam.shuffleAnswers,
        });
        setMessage("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) return;
        setShowForm(false);
        setEditingExam(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const duration = Number(form.durationMinutes);
        const maxAttempts = Number(form.maxAttempts);

        if (!form.courseOfferingId) { setMessage("Course offering wajib dipilih."); return; }
        if (!Number.isInteger(duration) || duration <= 0 || duration > 1440) { setMessage("Durasi harus 1-1440 menit."); return; }
        if (!Number.isInteger(maxAttempts) || maxAttempts <= 0 || maxAttempts > 10) { setMessage("Maksimal attempt harus 1-10."); return; }
        if (!form.startAt || !form.endAt) { setMessage("Waktu mulai dan selesai wajib diisi."); return; }

        const startDate = new Date(form.startAt);
        const endDate = new Date(form.endAt);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) { setMessage("Format waktu tidak valid."); return; }
        if (endDate <= startDate) { setMessage("Waktu selesai harus lebih besar dari waktu mulai."); return; }

        try {
            setSubmitting(true);
            setMessage("");

            if (editingExam) {
                const input: UpdateExamInput = {
                    title: form.title.trim(),
                    description: form.description.trim(),
                    durationMinutes: duration,
                    startAt: startDate.toISOString(),
                    endAt: endDate.toISOString(),
                    maxAttempts,
                    shuffleQuestions: form.shuffleQuestions,
                    shuffleAnswers: form.shuffleAnswers,
                };
                await updateExam(editingExam.id, input);
                setMessage("Exam berhasil diperbarui.");
            } else {
                const input: CreateExamInput = {
                    courseOfferingId: form.courseOfferingId,
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    durationMinutes: duration,
                    startAt: startDate.toISOString(),
                    endAt: endDate.toISOString(),
                    maxAttempts,
                    shuffleQuestions: form.shuffleQuestions,
                    shuffleAnswers: form.shuffleAnswers,
                };
                await createExam(input);
                setMessage("Exam berhasil dibuat.");
            }

            setShowForm(false);
            setEditingExam(null);
            setForm(emptyForm);
            await loadData();
        } catch {
            setMessage("Exam gagal disimpan.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            await deleteExam(deleteTarget.id);
            setDeleteTarget(null);
            setMessage("Exam berhasil dihapus.");
            await loadData();
        } catch {
            setMessage("Exam gagal dihapus.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat exam...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>Exam Management</h1>
                        <p>Kelola exam untuk course offering Anda.</p>
                    </div>
                    <button type="button" className="admin-exam-management-primary-button" onClick={openCreateForm}>
                        + Buat Exam
                    </button>
                </div>

                {error && (
                    <div className="admin-exam-management-alert admin-exam-management-alert-error">{error}</div>
                )}

                {message && !showForm && !deleteTarget && (
                    <div className="admin-exam-management-alert admin-exam-management-alert-info">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>Tutup</button>
                    </div>
                )}

                <div className="admin-exam-toolbar">
                    <div>
                        <label htmlFor="offering-filter">Course Offering</label>
                        <select
                            id="offering-filter"
                            value={selectedOfferingId}
                            onChange={(e) => setSelectedOfferingId(e.target.value)}
                        >
                            <option value="ALL">Semua Offering</option>
                            {offerings.map((o) => (
                                <option key={o.id} value={o.id}>{formatOfferingLabel(o)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="admin-exam-count">{visibleExams.length} exam</div>
                </div>

                {visibleExams.length === 0 ? (
                    <div className="admin-empty">Belum ada exam pada filter yang dipilih.</div>
                ) : (
                    <div className="admin-exam-management-list">
                        {visibleExams.map((exam) => (
                            <ExamCard key={exam.id} exam={exam} onEdit={openEditForm} onRequestDelete={setDeleteTarget} />
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <ExamFormModal
                    form={form}
                    setForm={setForm}
                    offerings={offerings}
                    editingExam={editingExam}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                    onClose={closeForm}
                />
            )}

            {deleteTarget && (
                <DeleteExamConfirmModal
                    exam={deleteTarget}
                    deleting={deleting}
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => void handleDelete()}
                />
            )}
        </div>
    );
};

export default LecturerExamPage;
