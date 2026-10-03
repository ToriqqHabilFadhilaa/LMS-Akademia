import { useEffect, useState, type FormEvent } from "react";
import { createQuestion, deleteQuestion, getQuestions, updateQuestion, type CreateQuestionInput, type Question, type UpdateQuestionInput } from "../../services/question.service";

type QuestionType =
    | "MULTIPLE_CHOICE"
    | "TRUE_FALSE"
    | "ESSAY"
    | "SHORT_ANSWER";

type QuestionOption = {
    label: string;
    text: string;
};

type QuestionForm = {
    questionType: QuestionType;
    questionText: string;
    options: QuestionOption[];
    correctAnswer: string;
    points: string;
    isActive: boolean;
};

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
    MULTIPLE_CHOICE: "Pilihan Ganda",
    TRUE_FALSE: "True / False",
    SHORT_ANSWER: "Short Answer",
    ESSAY: "Essay",
};

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABEL) as QuestionType[];

const TRUE_FALSE_OPTIONS: QuestionOption[] = [
    { label: "True", text: "True" },
    { label: "False", text: "False" },
];

const getOptionLabel = (index: number): string => {
    let value = index + 1;
    let label = "";

    while (value > 0) {
        value -= 1;
        label = String.fromCharCode(65 + (value % 26)) + label;
        value = Math.floor(value / 26);
    }

    return label;
};

const parseQuestionOptions = (value: unknown): QuestionOption[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((option, index) => {
        if (
            typeof option === "object" &&
            option !== null &&
            "label" in option &&
            "text" in option &&
            typeof option.label === "string" &&
            typeof option.text === "string"
        ) {
            return { label: option.label, text: option.text };
        }

        return {
            label: getOptionLabel(index),
            text: typeof option === "string" ? option : "",
        };
    });
};

const TYPES_REQUIRING_ANSWER: QuestionType[] = [
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "SHORT_ANSWER",
];

const emptyForm: QuestionForm = {
    questionType: "MULTIPLE_CHOICE",
    questionText: "",
    options: [
        { label: "A", text: "" },
        { label: "B", text: "" },
    ],
    correctAnswer: "",
    points: "10",
    isActive: true,
};

const QuestionCard = ({
    question,
    index,
    onEdit,
    onRequestDelete,
}: {
    question: Question;
    index: number;
    onEdit: (question: Question) => void;
    onRequestDelete: (question: Question) => void;
}) => (
    <div className="question-card">
        <div className="question-card-top">
            <div className="question-number">Soal {index + 1}</div>

            <span className="question-type-badge">
                {QUESTION_TYPE_LABEL[question.questionType as QuestionType]}
            </span>
        </div>

        <div className="question-text">{question.questionText}</div>

        <div className="question-meta">
            <span>Poin: {question.points}</span>
            <span>Dibuat oleh: {question.createdBy.name}</span>
            <span>Status: {question.isActive ? "Aktif" : "Nonaktif"}</span>
        </div>

        <div className="question-actions">
            <button type="button" className="question-edit-button" onClick={() => onEdit(question)}>
                Edit
            </button>

            <button type="button" className="question-delete-button" onClick={() => onRequestDelete(question)}>
                Hapus
            </button>
        </div>
    </div>
);

const QuestionFormModal = ({
    form,
    setForm,
    editingQuestion,
    submitting,
    onSubmit,
    onClose,
}: {
    form: QuestionForm;
    setForm: React.Dispatch<React.SetStateAction<QuestionForm>>;
    editingQuestion: Question | null;
    submitting: boolean;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) => (
    <div className="question-modal-backdrop">
        <div className="question-modal">
            <div className="question-modal-header">
                <div>
                    <h2>{editingQuestion ? "Edit Soal" : "Tambah Soal"}</h2>
                    <p>Isi data question sesuai tipe soal.</p>
                </div>

                <button type="button" className="question-modal-close" onClick={onClose} disabled={submitting}>
                    ×
                </button>
            </div>

            <form className="question-form" onSubmit={onSubmit}>
                <label>
                    Tipe Soal
                    <select value={form.questionType} onChange={(event) => setForm((current) => ({ ...current, questionType: event.target.value as QuestionType, }))}>
                        {QUESTION_TYPES.map((type) => (
                            <option key={type} value={type}>
                                {QUESTION_TYPE_LABEL[type]}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Pertanyaan
                    <textarea rows={5} value={form.questionText} onChange={(event) => setForm((current) => ({ ...current, questionText: event.target.value, }))} />
                </label>

                {form.questionType === "MULTIPLE_CHOICE" && (
                    <fieldset className="question-options-field">
                        <legend>Pilihan Jawaban</legend>
                        <p className="question-field-hint">Tambahkan pilihan dan tentukan satu jawaban yang benar.</p>
                        <div className="question-option-list">
                            {form.options.map((option, index) => (
                                <div className="question-option-row" key={`option-${index}`}>
                                    <span className="question-option-label">{option.label}</span>
                                    <input
                                        aria-label={`Teks pilihan ${option.label}`}
                                        type="text"
                                        value={option.text}
                                        placeholder={`Isi pilihan ${option.label}`}
                                        onChange={(event) => setForm((current) => ({
                                            ...current,
                                            options: current.options.map((currentOption, optionIndex) =>
                                                optionIndex === index
                                                    ? { ...currentOption, text: event.target.value }
                                                    : currentOption
                                            ),
                                        }))}
                                    />
                                    <button
                                        type="button"
                                        className="question-option-remove"
                                        aria-label={`Hapus pilihan ${option.label}`}
                                        disabled={form.options.length <= 2}
                                        onClick={() => setForm((current) => {
                                            const selectedIndex = current.options.findIndex(
                                                (currentOption) => currentOption.label === current.correctAnswer
                                            );
                                            const nextOptions = current.options
                                                .filter((_, optionIndex) => optionIndex !== index)
                                                .map((currentOption, optionIndex) => ({
                                                    ...currentOption,
                                                    label: getOptionLabel(optionIndex),
                                                }));
                                            const nextSelectedIndex =
                                                selectedIndex === index
                                                    ? -1
                                                    : selectedIndex > index
                                                        ? selectedIndex - 1
                                                        : selectedIndex;

                                            return {
                                                ...current,
                                                options: nextOptions,
                                                correctAnswer: nextSelectedIndex < 0
                                                    ? ""
                                                    : getOptionLabel(nextSelectedIndex),
                                            };
                                        })}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="question-add-option"
                            onClick={() => setForm((current) => ({
                                ...current,
                                options: [
                                    ...current.options,
                                    { label: getOptionLabel(current.options.length), text: "" },
                                ],
                            }))}
                        >
                            + Tambah pilihan
                        </button>
                    </fieldset>
                )}

                {form.questionType === "TRUE_FALSE" && (
                    <div className="question-type-note">
                        Pilihan jawaban untuk tipe ini sudah ditetapkan: True dan False.
                    </div>
                )}

                {TYPES_REQUIRING_ANSWER.includes(form.questionType) && (
                    <label>
                        {form.questionType === "MULTIPLE_CHOICE" ? "Jawaban Benar" : "Kunci Jawaban"}
                        {form.questionType === "MULTIPLE_CHOICE" || form.questionType === "TRUE_FALSE" ? (
                            <select
                                value={form.correctAnswer}
                                onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
                            >
                                <option value="">Pilih jawaban benar</option>
                                {(form.questionType === "TRUE_FALSE" ? TRUE_FALSE_OPTIONS : form.options)
                                    .filter((option) => form.questionType === "TRUE_FALSE" || option.text.trim())
                                    .map((option) => (
                                        <option key={option.label} value={option.label}>
                                            {form.questionType === "MULTIPLE_CHOICE"
                                                ? `${option.label}. ${option.text}`
                                                : option.text}
                                        </option>
                                    ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={form.correctAnswer}
                                placeholder="Masukkan jawaban yang dianggap benar"
                                onChange={(event) => setForm((current) => ({ ...current, correctAnswer: event.target.value }))}
                            />
                        )}
                    </label>
                )}

                {form.questionType === "ESSAY" && (
                    <div className="question-type-note">
                        Jawaban essay akan dinilai secara manual oleh dosen.
                    </div>
                )}

                <label>
                    Poin
                    <input type="number" min="1" max="1000" step="1" value={form.points} onChange={(event) => setForm((current) => ({ ...current, points: event.target.value, }))} />
                </label>

                <label className="question-checkbox">
                    <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked, }))} />
                    Soal aktif
                </label>

                <div className="question-form-actions">
                    <button type="button" className="question-cancel-button" onClick={onClose} disabled={submitting}>
                        Batal
                    </button>

                    <button type="submit" className="question-primary-button" disabled={submitting}>
                        {submitting ? "Menyimpan..." : editingQuestion ? "Simpan Perubahan" : "Simpan Soal"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const DeleteQuestionConfirmModal = ({
    question,
    deleting,
    onCancel,
    onConfirm,
}: {
    question: Question;
    deleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) => (
    <div className="question-modal-backdrop">
        <div className="question-confirm-modal">
            <h2>Hapus Question?</h2>
            <p>Question ini akan dihapus:</p>

            <div className="question-confirm-text">{question.questionText}</div>

            <div className="question-form-actions">
                <button type="button" className="question-cancel-button" onClick={onCancel} disabled={deleting}>
                    Batal
                </button>

                <button type="button" className="question-delete-button" onClick={onConfirm} disabled={deleting}>
                    {deleting ? "Menghapus..." : "Hapus"}
                </button>
            </div>
        </div>
    </div>
);

const QuestionBankPage = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [form, setForm] = useState<QuestionForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState<Question | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [infoMessage, setInfoMessage] = useState("");

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            setQuestions(await getQuestions());
        } catch (err) {
            console.error("Gagal mengambil question:", err);
            setError("Gagal mengambil daftar question.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        void getQuestions()
            .then((data) => {
                if (cancelled) {
                    return;
                }

                setQuestions(data);
            })
            .catch((err) => {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Gagal mengambil question:",
                    err
                );

                setError(
                    "Gagal mengambil daftar question."
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const resetForm = () => {
        setForm(emptyForm);
        setEditingQuestion(null);
    };

    const openCreateForm = () => {
        resetForm();
        setInfoMessage("");
        setShowForm(true);
    };

    const openEditForm = (question: Question) => {
        setEditingQuestion(question);

        const options = parseQuestionOptions(question.options);
        const storedAnswer = question.correctAnswer?.trim() ?? "";
        const matchingOption = options.find(
            (option) =>
                option.label.toLowerCase() === storedAnswer.toLowerCase() ||
                option.text.toLowerCase() === storedAnswer.toLowerCase()
        );
        const correctAnswer =
            question.questionType === "TRUE_FALSE"
                ? storedAnswer.toLowerCase() === "true"
                    ? "True"
                    : storedAnswer.toLowerCase() === "false"
                        ? "False"
                        : storedAnswer
                : matchingOption?.label ?? storedAnswer;

        setForm({
            questionType: question.questionType as QuestionType,
            questionText: question.questionText,
            options,
            correctAnswer,
            points: String(question.points),
            isActive: question.isActive,
        });

        setInfoMessage("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) {
            return;
        }

        setShowForm(false);
        resetForm();
    };

    const submitForm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.questionText.trim()) {
            setInfoMessage("Pertanyaan wajib diisi.");
            return;
        }

        const points = Number(form.points);

        if (!Number.isInteger(points) || points <= 0) {
            setInfoMessage("Poin harus berupa bilangan bulat lebih dari 0.");
            return;
        }

        let questionOptions: QuestionOption[] | null = null;

        if (form.questionType === "MULTIPLE_CHOICE") {
            questionOptions = form.options
                .map((option, index) => ({
                    label: getOptionLabel(index),
                    text: option.text.trim(),
                }));

            if (questionOptions.length < 2 || questionOptions.some((option) => !option.text)) {
                setInfoMessage("Isi minimal dua pilihan jawaban.");
                return;
            }

            if (!questionOptions.some((option) => option.label === form.correctAnswer)) {
                setInfoMessage("Pilih salah satu opsi sebagai jawaban benar.");
                return;
            }
        } else if (form.questionType === "TRUE_FALSE") {
            questionOptions = TRUE_FALSE_OPTIONS;
        }

        if (
            TYPES_REQUIRING_ANSWER.includes(form.questionType) &&
            !form.correctAnswer.trim()
        ) {
            setInfoMessage("Correct answer wajib diisi.");
            return;
        }

        try {
            setSubmitting(true);
            setInfoMessage("");

            if (editingQuestion) {
                const input: UpdateQuestionInput = {
                    questionType: form.questionType,
                    questionText: form.questionText.trim(),
                    options: questionOptions,
                    correctAnswer: TYPES_REQUIRING_ANSWER.includes(form.questionType)
                        ? form.correctAnswer.trim()
                        : "",
                    points,
                    isActive: form.isActive,
                };

                await updateQuestion(editingQuestion.id, input);
                setInfoMessage("Question berhasil diperbarui.");
            } else {
                const input: CreateQuestionInput = {
                    questionType: form.questionType,
                    questionText: form.questionText.trim(),
                    options: questionOptions,
                    correctAnswer: form.correctAnswer.trim() || undefined,
                    points,
                    isActive: form.isActive,
                };

                await createQuestion(input);
                setInfoMessage("Question berhasil dibuat.");
            }

            setShowForm(false);
            resetForm();
            await loadQuestions();
        } catch (err) {
            console.error("Gagal menyimpan question:", err);
            setInfoMessage("Question gagal disimpan.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) {
            return;
        }

        try {
            setDeleting(true);

            await deleteQuestion(confirmDelete.id);

            setConfirmDelete(null);
            setInfoMessage("Question berhasil dihapus.");

            await loadQuestions();
        } catch (err) {
            console.error("Gagal menghapus question:", err);
            setInfoMessage("Question gagal dihapus.");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat question bank...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="question-bank-header">
                    <div>
                        <h1>Question Bank</h1>
                        <p>Kelola soal yang digunakan dalam exam.</p>
                    </div>

                    <button type="button" className="question-primary-button" onClick={openCreateForm}>
                        + Tambah Soal
                    </button>
                </div>

                {error && <div className="question-error">{error}</div>}

                {infoMessage && !showForm && !confirmDelete && (
                    <div className="question-info">
                        {infoMessage}
                        <button type="button" onClick={() => setInfoMessage("")}>
                            Tutup
                        </button>
                    </div>
                )}

                <div className="question-summary">
                    <div className="admin-summary-card">
                        <span>Total Soal</span>
                        <strong>{questions.length}</strong>
                    </div>
                </div>

                <div className="question-list">
                    {questions.length === 0 ? (
                        <div className="admin-empty">Belum ada question.</div>
                    ) : (
                        questions.map((question, index) => (
                            <QuestionCard key={question.id} question={question} index={index} onEdit={openEditForm} onRequestDelete={setConfirmDelete} />
                        ))
                    )}
                </div>
            </div>

            {showForm && (
                <QuestionFormModal form={form} setForm={setForm} editingQuestion={editingQuestion} submitting={submitting} onSubmit={submitForm} onClose={closeForm} />
            )}

            {confirmDelete && (
                <DeleteQuestionConfirmModal question={confirmDelete} deleting={deleting} onCancel={() => setConfirmDelete(null)} onConfirm={() => void handleDelete()} />
            )}
        </div>
    );
};

export default QuestionBankPage;