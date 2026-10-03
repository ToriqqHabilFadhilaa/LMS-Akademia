import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenCheck, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import logo from "../../assets/Logo.png";
import loginBg from "../../assets/Background.png";

const BRAND_FEATURES = [
    {
        title: "Untuk mahasiswa",
        description: "Akses materi, tugas, dan nilai dalam satu tempat.",
    },
    {
        title: "Untuk dosen",
        description: "Kelola kelas dan pantau perkembangan mahasiswa.",
    },
    {
        title: "Untuk admin",
        description: "Atur pengguna dan data akademik dengan mudah.",
    },
] as const;

const ROLE_REDIRECT: Record<string, string> = {
    ADMIN: "/admin",
    LECTURER: "/lecturer",
    STUDENT: "/student",
};

const getErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== "object") {
        return "Login gagal. Silakan coba lagi.";
    }

    const candidate = error as {
        response?: { data?: { message?: unknown } };
    };

    const message = candidate.response?.data?.message;

    return typeof message === "string" ? message : "Login gagal. Silakan coba lagi.";
};

const LogoMark = () => (
    <img className="logo-mark" src={logo} alt="" width={512} height={469} decoding="async" />
);

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Email dan password wajib diisi.");
            return;
        }

        try {
            setLoading(true);

            const user = await login({ email: email.trim(), password });

            navigate(ROLE_REDIRECT[user.role] ?? "/student", { replace: true });
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <aside className="login-brand">
                <img className="login-brand-art" src={logo} alt="" aria-hidden="true" decoding="async" />
                <LogoMark />
                <ul className="login-features">
                    {BRAND_FEATURES.map((feature, index) => {
                        const FeatureIcon = [GraduationCap, BookOpenCheck, ShieldCheck][index];

                        return (
                        <li key={feature.title}>
                            <span className="login-feature-icon"><FeatureIcon size={19} strokeWidth={1.8} /></span>
                            <span className="login-feature-copy">
                            <strong>{feature.title}</strong>
                            <span>{feature.description}</span>
                            </span>
                        </li>
                        );
                    })}
                </ul>

                <div className="login-brand-text">
                    <p className="login-brand-name">Akademia</p>
                    <p className="login-brand-tagline">
                        Learn, teach, grow together.
                    </p>
                    <p className="login-brand-copy">
                        &copy; {new Date().getFullYear()} Akademia
                    </p>
                </div>
            </aside>

            <main className="login-main" style={{ "--login-bg": `url(${loginBg})` } as CSSProperties}>
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-header-logo">
                            <LogoMark />
                        </div>
                        <h1>Akademia</h1>
                        <p>Login ke sistem pembelajaran</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <div className="login-input-wrap">
                                <Mail className="login-input-icon" size={18} aria-hidden="true" />
                                <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Masukkan email" autoComplete="email" disabled={loading} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="login-input-wrap">
                                <LockKeyhole className="login-input-icon" size={18} aria-hidden="true" />
                                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" autoComplete="current-password" disabled={loading} />
                                <button
                                    type="button"
                                    className="login-password-toggle"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                                    aria-pressed={showPassword}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button className="login-submit-button" type="submit" disabled={loading}>
                            {loading ? "Memproses..." : "Login"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;