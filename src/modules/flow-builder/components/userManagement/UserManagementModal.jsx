import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Save, Users, AlertCircle, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import styles from './UserManagementModal.module.css';

// ─── Mock data — remove this block and uncomment the import below when API is ready
// import { getUsersApi, updateUserApi, deleteUserApi, createUserApi } from '@/modules/flow-builder/services/userService';

const MOCK_USERS = [
    { id: 1, username: 'alice_admin', role: 'admin', is_active: true, created_at: '2026-04-22T16:02:21.037643', updated_at: '2026-04-22T16:02:21.037643' },
    { id: 2, username: 'bob_user', role: 'user', is_active: true, created_at: '2026-04-20T10:30:00.000000', updated_at: '2026-04-21T14:15:00.000000' },
    { id: 3, username: 'carol_user', role: 'user', is_active: false, created_at: '2026-04-18T09:15:00.000000', updated_at: '2026-04-19T11:00:00.000000' },
    { id: 4, username: 'david_user', role: 'user', is_active: true, created_at: '2026-04-15T11:45:00.000000', updated_at: '2026-04-15T11:45:00.000000' },
    { id: 5, username: 'eva_admin', role: 'admin', is_active: false, created_at: '2026-04-10T14:00:00.000000', updated_at: '2026-04-22T08:30:00.000000' },
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const getUsersApi = async () => { await delay(600); return { data: [...MOCK_USERS] }; };
const updateUserApi = async (id, payload) => { await delay(500); return { data: { id, ...payload } }; };
const deleteUserApi = async (id) => { await delay(400); return {}; };
const createUserApi = async (payload) => {
    await delay(600);
    return { data: { id: Date.now(), ...payload, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } };
};
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${date}, ${time}`;
};

const EMPTY_FORM = { username: '', password: '', role: 'user' };

const UserManagementModal = ({ onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [changes, setChanges] = useState({});
    const [saving, setSaving] = useState({});
    const [deleting, setDeleting] = useState({});

    // Add user form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showPwd, setShowPwd] = useState(false);
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState('');

    const overlayRef = useRef();

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUsersApi();
            setUsers(res.data);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const getVal = (user, field) =>
        changes[user.id]?.[field] !== undefined ? changes[user.id][field] : user[field];

    const hasChanges = (userId) =>
        !!changes[userId] && Object.keys(changes[userId]).length > 0;

    const handleChange = (userId, field, value) => {
        setChanges(prev => {
            const original = users.find(u => u.id === userId);
            const currentUserChanges = { ...prev[userId], [field]: value };

            Object.keys(currentUserChanges).forEach(k => {
                if (currentUserChanges[k] === original[k]) delete currentUserChanges[k];
            });

            if (Object.keys(currentUserChanges).length === 0) {
                const next = { ...prev };
                delete next[userId];
                return next;
            }
            return { ...prev, [userId]: currentUserChanges };
        });
    };

    const handleSave = async (user) => {
        if (!hasChanges(user.id)) return;
        setSaving(prev => ({ ...prev, [user.id]: true }));
        try {
            await updateUserApi(user.id, changes[user.id]);
            const now = new Date().toISOString();
            setUsers(prev =>
                prev.map(u => u.id === user.id ? { ...u, ...changes[user.id], updated_at: now } : u)
            );
            setChanges(prev => { const next = { ...prev }; delete next[user.id]; return next; });
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to save. Please try again.');
        } finally {
            setSaving(prev => ({ ...prev, [user.id]: false }));
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        setDeleting(prev => ({ ...prev, [userId]: true }));
        try {
            await deleteUserApi(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setChanges(prev => { const next = { ...prev }; delete next[userId]; return next; });
        } catch (err) {
            alert(err?.response?.data?.error || 'Failed to delete user.');
            setDeleting(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAddUser = async () => {
        setFormError('');
        if (!form.username.trim()) return setFormError('Username is required.');
        if (!form.password.trim()) return setFormError('Password is required.');

        setAdding(true);
        try {
            const res = await createUserApi({
                username: form.username.trim(),
                password: form.password,
                role: form.role,
            });
            setUsers(prev => [...prev, res.data]);
            setForm(EMPTY_FORM);
            setShowForm(false);
            setShowPwd(false);
        } catch (err) {
            setFormError(err?.response?.data?.error || 'Failed to create user.');
        } finally {
            setAdding(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <Users size={17} strokeWidth={2} />
                        <span>User Management</span>
                    </div>
                    <div className={styles.headerRight}>
                        <button
                            className={styles.addUserBtn}
                            onClick={() => { setShowForm(f => !f); setFormError(''); }}
                            title="Add new user"
                        >
                            <UserPlus size={14} />
                            <span>Add User</span>
                        </button>
                        <button className={styles.closeBtn} onClick={onClose} title="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Add User Form */}
                {showForm && (
                    <div className={styles.addForm}>
                        <div className={styles.addFormFields}>
                            <input
                                className={styles.addInput}
                                placeholder="Username"
                                value={form.username}
                                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                disabled={adding}
                            />
                            <div className={styles.pwdWrap}>
                                <input
                                    className={styles.addInput}
                                    type={showPwd ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                    disabled={adding}
                                />
                                <button
                                    className={styles.pwdToggle}
                                    onClick={() => setShowPwd(p => !p)}
                                    type="button"
                                    tabIndex={-1}
                                >
                                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                            </div>
                            <select
                                className={styles.addSelect}
                                value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                disabled={adding}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                className={styles.addSubmitBtn}
                                onClick={handleAddUser}
                                disabled={adding}
                            >
                                {adding ? <Loader2 size={13} className={styles.spin} /> : <UserPlus size={13} />}
                                <span>{adding ? 'Adding…' : 'Add'}</span>
                            </button>
                        </div>
                        {formError && <p className={styles.formError}>{formError}</p>}
                    </div>
                )}

                {/* Body */}
                <div className={styles.body}>
                    {loading && (
                        <div className={styles.centerState}>
                            <Loader2 size={22} className={styles.spin} />
                            <span>Loading users…</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className={styles.centerState}>
                            <AlertCircle size={20} className={styles.errorIcon} />
                            <span className={styles.errorText}>{error}</span>
                            <button className={styles.retryBtn} onClick={fetchUsers}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && users.length === 0 && (
                        <div className={styles.centerState}>
                            <span className={styles.emptyText}>No users found.</span>
                        </div>
                    )}

                    {!loading && !error && users.length > 0 && (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.colSerial}>#</th>
                                    <th className={styles.colName}>Username</th>
                                    <th className={styles.colRole}>Role</th>
                                    <th className={styles.colStatus}>Status</th>
                                    <th className={styles.colModified}>Last Modified</th>
                                    <th className={styles.colSave}>Save</th>
                                    <th className={styles.colDelete}>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => {
                                    const role = getVal(user, 'role');
                                    const is_active = getVal(user, 'is_active');
                                    const dirty = hasChanges(user.id);
                                    const isSaving = !!saving[user.id];
                                    const isDeleting = !!deleting[user.id];

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`${styles.row} ${dirty ? styles.rowDirty : ''}`}
                                        >
                                            <td className={styles.serialCell}>{index + 1}</td>

                                            <td className={styles.nameCell}>
                                                <span className={styles.userName}>{user.username}</span>
                                            </td>

                                            <td>
                                                <select
                                                    className={styles.roleSelect}
                                                    value={role}
                                                    onChange={e => handleChange(user.id, 'role', e.target.value)}
                                                    disabled={isSaving || isDeleting}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>

                                            <td className={styles.toggleCell}>
                                                <label className={styles.toggleWrap}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.toggleInput}
                                                        checked={!!is_active}
                                                        disabled={isSaving || isDeleting}
                                                        onChange={e =>
                                                            handleChange(user.id, 'is_active', e.target.checked)
                                                        }
                                                    />
                                                    <span className={styles.toggleTrack}>
                                                        <span className={styles.toggleThumb} />
                                                    </span>
                                                </label>
                                                <span className={`${styles.toggleLabel} ${is_active ? styles.labelActive : styles.labelInactive}`}>
                                                    {is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className={styles.modifiedCell}>
                                                {formatDate(user.updated_at)}
                                            </td>

                                            <td>
                                                <button
                                                    className={`${styles.saveBtn} ${!dirty ? styles.saveBtnDisabled : ''}`}
                                                    onClick={() => handleSave(user)}
                                                    disabled={!dirty || isSaving || isDeleting}
                                                    title={dirty ? 'Save changes' : 'No unsaved changes'}
                                                >
                                                    {isSaving
                                                        ? <Loader2 size={13} className={styles.spin} />
                                                        : <Save size={13} />
                                                    }
                                                    <span>{isSaving ? 'Saving…' : 'Save'}</span>
                                                </button>
                                            </td>

                                            <td>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={isSaving || isDeleting}
                                                    title="Delete user"
                                                >
                                                    {isDeleting
                                                        ? <Loader2 size={14} className={styles.spin} />
                                                        : <Trash2 size={14} />
                                                    }
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {!loading && !error && users.length > 0 && (
                    <div className={styles.footer}>
                        <span>{users.length} user{users.length !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>Changes are saved per row</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagementModal;