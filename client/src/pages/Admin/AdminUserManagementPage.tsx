import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createUser, deleteUser, getUsers, updateUser, type CreateUserInput, type UpdateUserInput, type User } from "../../services/user.service";

type Role = User["role"];
type Status = User["status"];

type UserForm = {
    name: string;
    email: string;
    password: string;
    role: Role;
    status: Status;
};

const emptyForm: UserForm = {
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    status: "ACTIVE",
};

const ROLE_CONFIG: Record<Role, { label: string; className: string }> = {
    ADMIN: { label: "Admin", className: "user-role-admin" },
    LECTURER: { label: "Lecturer", className: "user-role-lecturer" },
    STUDENT: { label: "Student", className: "user-role-student" },
};

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
    ACTIVE: { label: "Aktif", className: "user-status-active" },
    SUSPENDED: { label: "Suspended", className: "user-status-suspended" },
    INACTIVE: { label: "Inactive", className: "user-status-inactive" },
};

const RoleBadge = ({ role }: { role: Role }) => {
    const config = ROLE_CONFIG[role];
    return (
        <span className={`user-role-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

const StatusBadge = ({ status }: { status: Status }) => {
    const config = STATUS_CONFIG[status];
    return (
        <span className={`user-status-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

const UserRow = ({
    user,
    submitting,
    onEdit,
    onRequestDeactivate,
}: {
    user: User;
    submitting: boolean;
    onEdit: (user: User) => void;
    onRequestDeactivate: (user: User) => void;
}) => (
    <tr>
        <td>
            <div className="user-management-user">
                <span className="user-management-user-name">{user.name}</span>
                <span className="user-management-user-email">{user.email}</span>
            </div>
        </td>

        <td>
            <RoleBadge role={user.role} />
        </td>

        <td>
            <StatusBadge status={user.status} />
        </td>

        <td>{new Date(user.createdAt).toLocaleDateString("id-ID")}</td>

        <td>
            <div className="user-management-row-actions">
                <button type="button" className="user-management-edit-button" onClick={() => onEdit(user)}>
                    Edit
                </button>

                <button type="button" className="user-management-deactivate-button" onClick={() => onRequestDeactivate(user)} disabled={submitting || user.status === "INACTIVE"}>
                    Nonaktifkan
                </button>
            </div>
        </td>
    </tr>
);

const UserFormModal = ({
    form,
    setForm,
    editingUser,
    submitting,
    message,
    onSubmit,
    onClose,
}: {
    form: UserForm;
    setForm: React.Dispatch<React.SetStateAction<UserForm>>;
    editingUser: User | null;
    submitting: boolean;
    message: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onClose: () => void;
}) => (
    <div className="user-management-modal-backdrop">
        <div className="user-management-modal">
            <div className="user-management-modal-header">
                <div>
                    <h2>{editingUser ? "Edit User" : "Tambah User"}</h2>
                    <p>Kelola informasi akun dan akses user.</p>
                </div>

                <button type="button" className="user-management-modal-close" onClick={onClose} disabled={submitting}>
                    ×
                </button>
            </div>

            {message && (
                <div className="user-management-alert user-management-alert-info">
                    {message}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="user-management-form-grid">
                    <div className="user-management-form-group">
                        <label htmlFor="user-name">Nama</label>
                        <input id="user-name" type="text" value={form.name} onChange={(event) => setForm((current) => ({...current, name: event.target.value,}))} required />
                    </div>

                    <div className="user-management-form-group">
                        <label htmlFor="user-email">Email</label>
                        <input id="user-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({...current, email: event.target.value,}))} required />
                    </div>

                    <div className="user-management-form-group user-management-form-full">
                        <label htmlFor="user-password">
                            {editingUser ? "Password Baru" : "Password"}
                        </label>
                        <input id="user-password" type="password" value={form.password} onChange={(event) => setForm((current) => ({...current, password: event.target.value,}))} placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"} required={!editingUser} />
                        {editingUser && (
                            <span className="user-management-help">
                                Kosongkan kalau password tidak ingin diubah.
                            </span>
                        )}
                    </div>

                    <div className="user-management-form-group">
                        <label htmlFor="user-role">Role</label>
                        <select id="user-role" value={form.role} onChange={(event) => setForm((current) => ({...current, role: event.target.value as Role,}))}>
                            <option value="ADMIN">Admin</option>
                            <option value="LECTURER">Lecturer</option>
                            <option value="STUDENT">Student</option>
                        </select>
                    </div>

                    {editingUser && (
                        <div className="user-management-form-group">
                            <label htmlFor="user-status">Status</label>
                            <select id="user-status" value={form.status} onChange={(event) => setForm((current) => ({...current, status: event.target.value as Status,}))}>
                                <option value="ACTIVE">Aktif</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="user-management-form-actions">
                    <button type="button" className="user-management-cancel-button" onClick={onClose} disabled={submitting}>
                        Batal
                    </button>

                    <button type="submit" className="user-management-primary-button" disabled={submitting}>
                        {submitting ? "Menyimpan..." : editingUser ? "Simpan Perubahan" : "Tambah User"}
                    </button>
                </div>
            </form>
        </div>
    </div>
);

const DeactivateConfirmModal = ({
    user,
    submitting,
    onCancel,
    onConfirm,
}: {
    user: User;
    submitting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) => (
    <div className="user-management-modal-backdrop">
        <div className="user-management-delete-modal">
            <div className="user-management-modal-header">
                <div>
                    <h2>Nonaktifkan User?</h2>
                </div>

                <button type="button" className="user-management-modal-close" onClick={onCancel} disabled={submitting}>
                    ×
                </button>
            </div>

            <p className="user-management-delete-text">
                User <strong>{user.name}</strong> akan dinonaktifkan.
            </p>

            <div className="user-management-form-actions">
                <button type="button" className="user-management-cancel-button" onClick={onCancel} disabled={submitting}>
                    Batal
                </button>

                <button type="button" className="user-management-confirm-deactivate-button" onClick={onConfirm} disabled={submitting}>
                    {submitting ? "Memproses..." : "Nonaktifkan"}
                </button>
            </div>
        </div>
    </div>
);

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");

    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(
        null
    );

    const [form, setForm] = useState<UserForm>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setError("");

                const userData = await getUsers();

                if (cancelled) {
                    return;
                }

                setUsers(userData);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Gagal mengambil user:", err);
                setError("Gagal mengambil data user.");
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

    const filteredUsers = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return users.filter((user) => {
            const matchSearch =
                !keyword ||
                user.name.toLowerCase().includes(keyword) ||
                user.email.toLowerCase().includes(keyword);

            const matchRole = roleFilter === "ALL" || user.role === roleFilter;
            const matchStatus =
                statusFilter === "ALL" || user.status === statusFilter;

            return matchSearch && matchRole && matchStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const openCreateForm = () => {
        setEditingUser(null);
        setForm(emptyForm);
        setMessage("");
        setError("");
        setShowForm(true);
    };

    const openEditForm = (user: User) => {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            status: user.status,
        });
        setMessage("");
        setError("");
        setShowForm(true);
    };

    const closeForm = () => {
        if (submitting) {
            return;
        }

        setShowForm(false);
        setEditingUser(null);
        setForm(emptyForm);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = form.name.trim();
        const email = form.email.trim().toLowerCase();
        const password = form.password.trim();

        if (name.length < 2) {
            setMessage("Nama minimal 2 karakter.");
            return;
        }

        if (!email) {
            setMessage("Email wajib diisi.");
            return;
        }

        if (!editingUser && password.length < 8) {
            setMessage("Password minimal 8 karakter.");
            return;
        }

        if (editingUser && password.length > 0 && password.length < 8) {
            setMessage("Password baru minimal 8 karakter.");
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");
            setError("");

            if (editingUser) {
                const input: UpdateUserInput = {
                    name,
                    email,
                    role: form.role,
                    status: form.status,
                };

                if (password) {
                    input.password = password;
                }

                await updateUser(editingUser.id, input);
                setMessage("User berhasil diperbarui.");
            } else {
                const input: CreateUserInput = {
                    name,
                    email,
                    password,
                    role: form.role,
                };

                await createUser(input);
                setMessage("User berhasil dibuat.");
            }

            setUsers(await getUsers());
            setShowForm(false);
            setEditingUser(null);
            setForm(emptyForm);
        } catch (err) {
            console.error("Gagal menyimpan user:", err);
            setMessage("User gagal disimpan.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteConfirm) {
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");
            setError("");

            await deleteUser(showDeleteConfirm.id);

            setUsers(await getUsers());
            setMessage("User berhasil dinonaktifkan.");
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error("Gagal menonaktifkan user:", err);
            setMessage("User gagal dinonaktifkan.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-container">
                    <p>Memuat user...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h1>User Management</h1>
                        <p>Kelola akun admin, lecturer, dan student.</p>
                    </div>

                    <button type="button" className="user-management-primary-button" onClick={openCreateForm}>
                        + Tambah User
                    </button>
                </div>

                {error && (
                    <div className="user-management-alert user-management-alert-error">
                        {error}
                    </div>
                )}

                {message && !showForm && !showDeleteConfirm && (
                    <div className="user-management-alert user-management-alert-info">
                        <span>{message}</span>
                        <button type="button" onClick={() => setMessage("")}>
                            Tutup
                        </button>
                    </div>
                )}

                <div className="admin-card">
                    <div className="user-management-toolbar">
                        <input type="search" className="user-management-search" placeholder="Cari nama atau email..." aria-label="Cari user" value={search} onChange={(event) => setSearch(event.target.value)} />
                        <select className="user-management-filter" aria-label="Filter role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "ALL" | Role)}>
                            <option value="ALL">Semua Role</option>
                            <option value="ADMIN">Admin</option>
                            <option value="LECTURER">Lecturer</option>
                            <option value="STUDENT">Student</option>
                        </select>

                        <select className="user-management-filter" aria-label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | Status)}>
                            <option value="ALL">Semua Status</option>
                            <option value="ACTIVE">Aktif</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="admin-summary-grid">
                    <div className="admin-summary-card">
                        <span>Total User</span>
                        <strong className="user-management-summary-number">
                            {users.length}
                        </strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>Admin</span>
                        <strong className="user-management-summary-number">
                            {users.filter((u) => u.role === "ADMIN").length}
                        </strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>Lecturer</span>
                        <strong className="user-management-summary-number">
                            {users.filter((u) => u.role === "LECTURER").length}
                        </strong>
                    </div>

                    <div className="admin-summary-card">
                        <span>Student</span>
                        <strong className="user-management-summary-number">
                            {users.filter((u) => u.role === "STUDENT").length}
                        </strong>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="section-header">
                        <div>
                            <h2>Daftar User</h2>
                            <p>
                                Menampilkan {filteredUsers.length} dari{" "}
                                {users.length} user.
                            </p>
                        </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="user-management-empty">
                            Tidak ada user yang sesuai filter.
                        </div>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Dibuat</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <UserRow key={user.id} user={user} submitting={submitting} onEdit={openEditForm} onRequestDeactivate={setShowDeleteConfirm} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <UserFormModal form={form} setForm={setForm} editingUser={editingUser} submitting={submitting} message={message} onSubmit={handleSubmit} onClose={closeForm} />
            )}

            {showDeleteConfirm && (
                <DeactivateConfirmModal user={showDeleteConfirm} submitting={submitting} onCancel={() => setShowDeleteConfirm(null)} onConfirm={() => void handleDelete()} />
            )}
        </div>
    );
};

export default AdminUserManagementPage;