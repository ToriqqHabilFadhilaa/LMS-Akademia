import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExamAttemptById, submitExamAttempt } from "../../services/exam-attempt.service";
import { createAnswer, getAnswersByAttemptId, updateAnswer } from "../../services/answer.service";
import { createActivityLog, type ActivityEventType } from "../../services/activity-log.service";
import type { ExamAnswer } from "../../services/answer.service";
import type { ExamAttempt, ExamOption } from "../../services/exam-attempt.service";
import StudentLayout from "../../components/StudentLayout";

const isExamOption = (
    value: unknown
): value is ExamOption => {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    return (
        "label" in value &&
        "text" in value &&
        typeof value.label === "string" &&
        typeof value.text === "string"
    );
};

const getOptions = (
    value: unknown
): ExamOption[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isExamOption);
};

const formatTime = (
    totalSeconds: number
) => {
    const hours = Math.floor(
        totalSeconds / 3600
    );

    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );

    const seconds =
        totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds,
    ]
        .map((value) =>
            String(value).padStart(2, "0")
        )
        .join(":");
};

type PopupType =
    | "info"
    | "success"
    | "error"
    | "warning";

const StudentExamAttemptPage = () => {
    const navigate = useNavigate();
    const { attemptId } = useParams<{attemptId: string;}>();
    const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
    const [loading, setLoading] = useState(Boolean(attemptId));
    const [error, setError] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [savedAnswers, setSavedAnswers] = useState<Record<string, ExamAnswer>>({});
    const [violationCount, setViolationCount] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    const [isFullscreen, setIsFullscreen] =
        useState(
            () =>
                Boolean(
                    document.fullscreenElement
                )
        );

    const [popupMessage, setPopupMessage] =
        useState("");

    const [popupType, setPopupType] =
        useState<PopupType>("info");

    const [showSubmitConfirm, setShowSubmitConfirm] =
        useState(false);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const hasEnteredFullscreen =
        useRef(false);

    const isSubmittingRef =
        useRef(false);

    const lastFocusViolationAt =
        useRef(0);

    const showPopup = (
        message: string,
        type: PopupType = "info"
    ) => {
        setPopupType(type);
        setPopupMessage(message);
    };

    const closePopup = () => {
        setPopupMessage("");
    };

    useEffect(() => {
        if (!attemptId) {
            return;
        }

        let cancelled = false;

        const loadAttempt = async () => {
            try {
                const data =
                    await getExamAttemptById(
                        attemptId
                    );

                if (cancelled) {
                    return;
                }

                if (
                    data.status !==
                    "IN_PROGRESS"
                ) {
                    setError(
                        "Attempt exam sudah tidak aktif."
                    );

                    return;
                }

                setAttempt(data);

                const saved =
                    await getAnswersByAttemptId(
                        data.id
                    );

                const answerMap: Record<
                    string,
                    ExamAnswer
                > = {};

                const answerValues: Record<
                    string,
                    string
                > = {};

                saved.forEach((item) => {
                    answerMap[
                        item.attemptQuestionId
                    ] = item;

                    if (
                        item.answer !== null
                    ) {
                        answerValues[
                            item.attemptQuestionId
                        ] = item.answer;
                    }
                });

                setSavedAnswers(
                    answerMap
                );

                setAnswers(
                    answerValues
                );
            } catch (error) {
                console.error(
                    "Gagal mengambil attempt:",
                    error
                );

                if (!cancelled) {
                    setError(
                        "Gagal mengambil data exam."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadAttempt();

        return () => {
            cancelled = true;
        };
    }, [attemptId]);

    useEffect(() => {
        if (!attempt) {
            return;
        }

        const logActivity = async (
            eventType: ActivityEventType,
            eventData?: unknown
        ) => {
            try {
                const result =
                    await createActivityLog(
                        attempt.id,
                        eventType,
                        eventData
                    );

                setViolationCount(
                    result.violationCount
                );

                if (
                    result.warningLevel ===
                    "WARNING"
                ) {
                    showPopup(
                        result.message,
                        "warning"
                    );
                }

                if (
                    result.warningLevel ===
                    "FINAL_WARNING"
                ) {
                    showPopup(
                        result.message,
                        "warning"
                    );
                }

                if (result.blocked) {
                    setIsBlocked(true);
                    showPopup(result.message, "error");
                } else if (result.warningLevel === "REVIEW_REQUIRED") {
                    showPopup(
                        result.message,
                        "warning"
                    );
                }

                console.log(
                    `[PROCTORING] ${eventType}`,
                    result
                );
            } catch (error) {
                console.error(
                    `[PROCTORING] Gagal mencatat ${eventType}:`,
                    error
                );
                showPopup(
                    "Sinyal aktivitas gagal disimpan. Beri tahu pengawas ujian sebelum melanjutkan.",
                    "warning"
                );
            }
        };

        const handleVisibilityChange =
            () => {
                if (
                    document.visibilityState !==
                    "hidden"
                ) {
                    return;
                }

                if (
                    isSubmittingRef.current
                ) {
                    return;
                }

                const now =
                    Date.now();

                if (
                    now -
                    lastFocusViolationAt.current <
                    1000
                ) {
                    return;
                }

                lastFocusViolationAt.current =
                    now;

                void logActivity(
                    "TAB_SWITCH",
                    {
                        visibilityState:
                            document.visibilityState,
                    }
                );
            };

        const handleBlur = () => {
            if (
                isSubmittingRef.current
            ) {
                return;
            }

            const now =
                Date.now();

            if (
                now -
                lastFocusViolationAt.current <
                1000
            ) {
                return;
            }

            lastFocusViolationAt.current =
                now;

            void logActivity(
                "WINDOW_BLUR"
            );
        };

        const handleCopy = (
            event: ClipboardEvent
        ) => {
            event.preventDefault();

            void logActivity("COPY");
        };

        const handlePaste = (
            event: ClipboardEvent
        ) => {
            event.preventDefault();

            void logActivity("PASTE");
        };

        const handleFullscreenChange =
            () => {
                const fullscreen =
                    Boolean(
                        document.fullscreenElement
                    );

                setIsFullscreen(
                    fullscreen
                );

                if (fullscreen) {
                    hasEnteredFullscreen.current =
                        true;

                    return;
                }

                if (
                    hasEnteredFullscreen.current &&
                    !isSubmittingRef.current
                ) {
                    void logActivity(
                        "FULLSCREEN_EXIT"
                    );
                }
            };

        const handleOffline = () => {
            void logActivity(
                "CONNECTION_LOST"
            );
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        window.addEventListener(
            "blur",
            handleBlur
        );

        document.addEventListener(
            "copy",
            handleCopy
        );

        document.addEventListener(
            "paste",
            handlePaste
        );

        document.addEventListener(
            "fullscreenchange",
            handleFullscreenChange
        );

        window.addEventListener(
            "offline",
            handleOffline
        );

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            window.removeEventListener(
                "blur",
                handleBlur
            );

            document.removeEventListener(
                "copy",
                handleCopy
            );

            document.removeEventListener(
                "paste",
                handlePaste
            );

            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange
            );

            window.removeEventListener(
                "offline",
                handleOffline
            );
        };
    }, [attempt]);

    useEffect(() => {
        if (!attempt) {
            return;
        }

        const updateTimer = () => {
            const startedAt =
                new Date(
                    attempt.startedAt
                ).getTime();

            const duration =
                attempt.exam.durationMinutes *
                60 *
                1000;

            const durationEndAt =
                startedAt + duration;

            const examEndAt =
                new Date(
                    attempt.exam.endAt
                ).getTime();

            const endAt = Math.min(
                durationEndAt,
                examEndAt
            );

            const seconds = Math.max(
                0,
                Math.floor(
                    (endAt -
                        Date.now()) /
                    1000
                )
            );

            setTimeLeft(seconds);
        };

        updateTimer();

        const timer =
            window.setInterval(
                updateTimer,
                1000
            );

        return () => {
            window.clearInterval(
                timer
            );
        };
    }, [attempt]);

    const handleSelectAnswer = async (
        questionId: string,
        answer: string
    ) => {
        if (isBlocked) {
            return;
        }

        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));

        try {
            const existing =
                savedAnswers[questionId];

            const result = existing
                ? await updateAnswer(
                    existing.id,
                    answer
                )
                : await createAnswer(
                    questionId,
                    answer
                );

            setSavedAnswers(
                (prev) => ({
                    ...prev,
                    [questionId]:
                        result,
                })
            );

            console.log(
                "Jawaban berhasil disimpan:",
                answer
            );
        } catch (error) {
            console.error(
                "Gagal menyimpan jawaban:",
                error
            );
        }
    };

    const handleClearAnswer = async (
        questionId: string
    ) => {
        if (isBlocked) {
            return;
        }

        const existing =
            savedAnswers[questionId];

        if (!existing) {
            return;
        }

        setAnswers((prev) => {
            const next = {
                ...prev,
            };

            delete next[questionId];

            return next;
        });

        try {
            const result =
                await updateAnswer(
                    existing.id,
                    ""
                );

            setSavedAnswers(
                (prev) => ({
                    ...prev,
                    [questionId]:
                        result,
                })
            );
        } catch (error) {
            console.error(
                "Gagal menghapus jawaban:",
                error
            );

            setAnswers(
                (prev) => ({
                    ...prev,
                    [questionId]:
                        existing.answer ??
                        "",
                })
            );
        }
    };

    const answeredCount = attempt
        ? attempt.questions.filter(
            (item) =>
                Boolean(
                    answers[item.id]
                )
        ).length
        : 0;

    const unansweredCount = attempt
        ? attempt.questions.length -
        answeredCount
        : 0;

    const canSubmit =
        unansweredCount === 0 &&
        !isBlocked &&
        !isSubmitting;

    const handleSubmitExam = () => {
        if (!attempt) {
            return;
        }

        if (!canSubmit) {
            showPopup(
                `Masih ada ${unansweredCount} soal yang belum dijawab. Jawab semua soal terlebih dahulu.`,
                "warning"
            );

            return;
        }

        setShowSubmitConfirm(
            true
        );
    };

    const confirmSubmitExam =
        async () => {
            if (!attempt) {
                return;
            }

            setShowSubmitConfirm(
                false
            );

            setIsSubmitting(true);

            isSubmittingRef.current =
                true;

            try {
                await submitExamAttempt(
                    attempt.id
                );

                if (
                    document.fullscreenElement
                ) {
                    await document.exitFullscreen();
                }

                showPopup(
                    "Exam berhasil dikumpulkan.",
                    "success"
                );

                window.setTimeout(
                    () => {
                        window.location.href = `/student/exams/result/${attempt.id}`;
                    },
                    1200
                );
            } catch (error) {
                isSubmittingRef.current = false;
                setIsSubmitting(false);

                console.error(
                    "Gagal submit exam:",
                    error
                );

                showPopup(
                    "Gagal mengumpulkan exam. Silakan coba lagi.",
                    "error"
                );
            }
        };

    const handleEnterFullscreen =
        async () => {
            try {
                await document.documentElement.requestFullscreen();
                hasEnteredFullscreen.current = true;
                setIsFullscreen(true);
            } catch (error) {
                console.error(
                    "Gagal masuk fullscreen:",
                    error
                );

                showPopup(
                    "Fullscreen tidak dapat diaktifkan. Silakan izinkan fullscreen pada browser.",
                    "error"
                );
            }
        };

    if (loading) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    Memuat exam...
                </div>
            </StudentLayout>
        );
    }

    if (!attemptId) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    Attempt exam tidak
                    ditemukan.
                </div>
            </StudentLayout>
        );
    }

    if (
        error ||
        !attempt ||
        !attempt.questions.length
    ) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    {error || "Soal exam tidak ditemukan."}
                </div>
            </StudentLayout>
        );
    }

    const totalQuestions = attempt.questions.length;
    const question = attempt.questions[currentQuestion];

    if (!question) {
        return (
            <StudentLayout>
                <div className="empty-state">
                    Soal exam tidak
                    ditemukan.
                </div>
            </StudentLayout>
        );
    }

    const options = getOptions(question.shuffledOptions);
    const isLastQuestion = currentQuestion === totalQuestions - 1;

    return (
        <StudentLayout>
            {!isFullscreen && !isBlocked && !isSubmitting && !popupMessage && (
                <div className="exam-popup-overlay">
                    <div className="exam-popup exam-popup-info">
                        <div className="exam-popup-icon">
                            ⛶
                        </div>

                        <h3>
                            Mode Ujian
                        </h3>

                        <p>
                            Ujian hanya dapat
                            dikerjakan dalam
                            mode fullscreen.
                            Silakan masuk
                            fullscreen untuk
                            melanjutkan.
                        </p>

                        <button type="button" onClick={handleEnterFullscreen}>
                            Masuk Fullscreen
                        </button>
                    </div>
                </div>
            )}

            {popupMessage &&
                !isBlocked && (
                    <div className="exam-popup-overlay">
                        <div className={["exam-popup", `exam-popup-${popupType}`,].join(" ")}>
                            <div className="exam-popup-icon">
                                {popupType === "success" && "✓"}
                                {popupType === "error" && "!"}
                                {popupType === "warning" && "!"}
                                {popupType === "info" && "i"}
                            </div>

                            <h3>
                                {popupType === "success" ? "Berhasil" : popupType === "error" ? "Terjadi Kesalahan" : popupType === "warning" ? "Informasi Ujian" : "Informasi"}
                            </h3>

                            <p>
                                {
                                    popupMessage
                                }
                            </p>

                            {popupType === "warning" && (
                                <strong>
                                    Pelanggaran{" "}
                                    {
                                        violationCount
                                    }{" "}
                                    / 5
                                </strong>
                            )}

                            <button type="button" onClick={closePopup}>
                                Mengerti
                            </button>
                        </div>
                    </div>
                )}

            {showSubmitConfirm && (
                <div className="exam-popup-overlay">
                    <div className="exam-popup exam-popup-info">
                        <div className="exam-popup-icon">
                            ?
                        </div>

                        <h3>
                            Submit Exam?
                        </h3>

                        <p>
                            Yakin ingin
                            mengumpulkan exam?
                            Setelah dikumpulkan,
                            jawaban tidak dapat
                            diubah lagi.
                        </p>

                        <div className="exam-popup-actions">
                            <button type="button" className="popup-cancel-button" onClick={() => setShowSubmitConfirm(false)} disabled={isSubmitting}>
                                Batal
                            </button>

                            <button type="button" className="popup-confirm-button" onClick={confirmSubmitExam} disabled={isSubmitting}>
                                {isSubmitting ? "Mengumpulkan..." : "Ya, Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isBlocked && (
                <div className="exam-popup-overlay">
                    <div className="exam-popup exam-popup-error">
                        <div className="exam-popup-icon">
                            !
                        </div>

                        <h3>
                            Ujian Diblokir
                        </h3>

                        <p>
                            Batas maksimum 5
                            pelanggaran telah
                            tercapai.
                        </p>

                        <p>
                            Silakan hubungi Admin
                            untuk mengikuti ujian
                            kembali.
                        </p>

                        <strong>
                            Pelanggaran 5 / 5
                        </strong>

                        <button type="button" onClick={() => navigate(`/student/exams/${attempt.exam.id}`)}>
                            Kembali ke Exam
                        </button>
                    </div>
                </div>
            )}

            <div className="exam-attempt-page" aria-busy={isSubmitting}>
                <header className="exam-attempt-header">
                    <div>
                        <span className="exam-label">
                            EXAM
                        </span>

                        <h2>
                            {
                                attempt.exam.title
                            }
                        </h2>

                        <p>
                            Soal{" "}
                            {currentQuestion +
                                1}{" "}
                            dari{" "}
                            {totalQuestions}
                        </p>
                    </div>

                    <div className="exam-timer">
                        <span>
                            Sisa Waktu
                        </span>

                        <strong>
                            {formatTime(
                                timeLeft
                            )}
                        </strong>
                    </div>
                </header>

                <main className="exam-attempt-content">
                    <aside className="exam-question-nav">
                        <h3>
                            Daftar Soal
                        </h3>

                        <div>
                            {attempt.questions.map(
                                (
                                    item,
                                    index
                                ) => {
                                    const isActive = index === currentQuestion;
                                    const isAnswered = Boolean(answers[item.id]);

                                    return (
                                        <button key={item.id} type="button" disabled={isBlocked || isSubmitting} onClick={() => setCurrentQuestion(index)} className={[isActive ? "active" : "", isAnswered ? "answered" : "",].filter(Boolean).join(" ")} aria-label={`Soal ${index + 1}${isAnswered ? " (sudah dijawab)" : ""}`}>
                                            {index + 1}
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        <div className="exam-question-nav-legend">
                            <span className="legend-answered">
                                Sudah
                                dijawab
                            </span>

                            <span className="legend-unanswered">
                                Belum
                                dijawab
                            </span>
                        </div>
                    </aside>

                    <section className="exam-question-card">
                        <span>
                            Soal{" "}
                            {currentQuestion + 1}
                        </span>

                        <h3>
                            {
                                question.questionTextSnapshot
                            }
                        </h3>

                        {options.length > 0 ? (
                            <div className="exam-options">
                                {options.map((option) => (
                                    <label key={option.label} className="exam-option">
                                        <input type="radio" name={`question-${question.id}`} value={option.label} checked={answers[question.id] === option.label} disabled={isBlocked || isSubmitting} onChange={() => handleSelectAnswer(question.id, option.label)} />
                                        <span>
                                            {option.label}.{" "}
                                            {option.text}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <textarea className="exam-answer-textarea" value={answers[question.id] ?? ""} disabled={isBlocked || isSubmitting} onChange={(event) => handleSelectAnswer(question.id, event.target.value)} placeholder="Tulis jawaban kamu di sini..." rows={6} />
                        )}

                        <button type="button" className="clear-answer-button" disabled={!answers[question.id] || isBlocked || isSubmitting} onClick={() => handleClearAnswer(question.id)}>
                            Hapus Pilihan
                        </button>

                        <div className="exam-question-actions">
                            <button type="button" className="previous-button" disabled={currentQuestion === 0 || isBlocked || isSubmitting} onClick={() => setCurrentQuestion((v) => v - 1)}>
                                ← Sebelumnya
                            </button>

                            {!isLastQuestion && (
                                <button type="button" className="next-button" disabled={isBlocked || isSubmitting} onClick={() => setCurrentQuestion((v) => v + 1)}>
                                    Selanjutnya →
                                </button>
                            )}

                            <button type="button" className="submit-button" onClick={handleSubmitExam} disabled={!canSubmit} title={canSubmit ? undefined : `${unansweredCount} soal belum dijawab`}>
                                {isSubmitting ? "Mengumpulkan..." : "Submit Exam"}
                                {!canSubmit && !isSubmitting && ` (${unansweredCount} belum dijawab)`}
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        </StudentLayout>
    );
};

export default StudentExamAttemptPage;