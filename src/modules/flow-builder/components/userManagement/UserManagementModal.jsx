import { AlertCircle, Loader2, Save, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './UserManagementModal.module.css';

// ─── Mock data (swap out for real API imports once backend is ready) ───────────
const MOCK_USERS = [
    { _id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 1 },
    { _id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 1 },
    { _id: '3', name: 'Carol White', email: 'carol@example.com', role: 'user', status: 0 },
    { _id: '4', name: 'David Brown', email: 'david@example.com', role: 'user', status: 1 },
    { _id: '5', name: 'Eva Martinez', email: 'eva@example.com', role: 'admin', status: 0 },
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const getUsersApi = async () => { await delay(600); return { data: [...MOCK_USERS] }; };
const updateUserApi = async (id, payload) => { await delay(500); return { data: { _id: id, ...payload } }; };
const deleteUserApi = async (id) => { await delay(400); return { data: { _id: id } }; };
// ─────────────────────────────────────────────────────────────────────────────

const UserManagementModal = ({ onClose }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [changes, setChanges] = useState({});   // { [userId]: { role?, status? } }
    const [saving, setSaving] = useState({});      // { [userId]: true }
    const [deleting, setDeleting] = useState({}); // { [userId]: true }
    const overlayRef = useRef();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUsersApi();
            setUsers(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    // Returns the current effective value (local change takes priority over server value)
    const getVal = (user, field) =>
        changes[user._id]?.[field] !== undefined
            ? changes[user._id][field]
            : user[field];

    const hasChanges = (userId) =>
        changes[userId] && Object.keys(changes[userId]).length > 0;

    const handleChange = (userId, field, value) => {
        setChanges(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: value }
        }));
    };

    const handleSave = async (user) => {
        if (!hasChanges(user._id)) return;
        setSaving(prev => ({ ...prev, [user._id]: true }));
        try {
            await updateUserApi(user._id, changes[user._id]);
            setUsers(prev =>
                prev.map(u => u._id === user._id ? { ...u, ...changes[user._id] } : u)
            );
            setChanges(prev => {
                const next = { ...prev };
                delete next[user._id];
                return next;
            });
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(prev => ({ ...prev, [user._id]: false }));
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Delete this user? This action cannot be undone.')) return;
        setDeleting(prev => ({ ...prev, [userId]: true }));
        try {
            await deleteUserApi(userId);
            setUsers(prev => prev.filter(u => u._id !== userId));
            setChanges(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete user.');
        } finally {
            setDeleting(prev => ({ ...prev, [userId]: false }));
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
                    <button className={styles.closeBtn} onClick={onClose} title="Close">
                        <X size={16} />
                    </button>
                </div>

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
                                    <th className={styles.colName}>Username</th>
                                    <th className={styles.colRole}>Role</th>
                                    <th className={styles.colStatus}>Status</th>
                                    <th className={styles.colAction}></th>
                                    <th className={styles.colAction}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const role = getVal(user, 'role');
                                    const status = getVal(user, 'status');
                                    const dirty = hasChanges(user._id);
                                    const isSaving = !!saving[user._id];
                                    const isDeleting = !!deleting[user._id];

                                    return (
                                        <tr
                                            key={user._id}
                                            className={`${styles.row} ${dirty ? styles.rowDirty : ''}`}
                                        >
                                            {/* Username */}
                                            <td className={styles.nameCell}>
                                                <div className={styles.avatar}>
                                                    {(user.name || user.username || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className={styles.nameInfo}>
                                                    <span className={styles.userName}>{user.name || user.username}</span>
                                                    {user.email && (
                                                        <span className={styles.userEmail}>{user.email}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Role dropdown */}
                                            <td>
                                                <select
                                                    className={styles.roleSelect}
                                                    value={role}
                                                    onChange={e => handleChange(user._id, 'role', e.target.value)}
                                                    disabled={isSaving || isDeleting}
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>

                                            {/* Status toggle */}
                                            <td>
                                                <label className={styles.toggleWrap}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles.toggleInput}
                                                        checked={status === 1}
                                                        disabled={isSaving || isDeleting}
                                                        onChange={e =>
                                                            handleChange(user._id, 'status', e.target.checked ? 1 : 0)
                                                        }
                                                    />
                                                    <span className={styles.toggleTrack}>
                                                        <span className={styles.toggleThumb} />
                                                    </span>
                                                    <span className={`${styles.toggleLabel} ${status === 1 ? styles.labelActive : styles.labelInactive}`}>
                                                        {status === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                </label>
                                            </td>

                                            {/* Save button */}
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

                                            {/* Delete button */}
                                            <td>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(user._id)}
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