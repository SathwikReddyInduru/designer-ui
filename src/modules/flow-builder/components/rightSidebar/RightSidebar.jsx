import { ChevronDown, ChevronUp, Plus, Power, PowerOff, Smartphone, Trash2 } from 'lucide-react'
import { saveToHistory, setEdges, updateNodeData } from '../../store/flowSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import styles from './RightSidebar.module.css'

const DEFAULT_API_URL = 'http://localhost:6215/api/billing/v1/available-plans'

const RightSidebar = () => {
    const dispatch = useDispatch()

    const { user } = useSelector((state) => state.auth)
    const { nodes, edges, selectedNode, selectedEdge } = useSelector((state) => state.flow)

    const currentNode = nodes.find(n => n.id === selectedNode)
    const currentEdge = edges.find(e => e.id === selectedEdge)

    const [localLabel, setLocalLabel] = useState(currentEdge?.label || '')
    const [shortcodeUrlsOpen, setShortcodeUrlsOpen] = useState(false)

    const [pendingInputs, setPendingInputs] = useState([])

    const isAdmin = user?.role === 'admin'

    useEffect(() => {
        setLocalLabel(currentEdge?.label || '')
    }, [currentEdge?.id, currentEdge?.label])

    useEffect(() => {
        setShortcodeUrlsOpen(false)
        setPendingInputs([])
    }, [selectedNode])

    const getEmptyMessage = () => {
        if (isAdmin) {
            return nodes.length === 0
                ? "Sync the flow to View"
                : "Select a Node to View its Properties";
        }
        return nodes.length === 0
            ? "Add a Node to Start Building the Flow"
            : "Select a node or connection to edit";
    };

    // ── Edge editing ──
    if (currentEdge) {
        const commitLabel = () => {
            if (isAdmin) return

            if (localLabel && !/^[0-9*#]$/.test(localLabel)) {
                alert("⚠️ Edge label should be a single digit (0-9), *, or #")
                setLocalLabel(currentEdge.label || '')
                return
            }

            const updated = edges.map(edge =>
                edge.id === selectedEdge ? { ...edge, label: localLabel } : edge
            )
            dispatch(setEdges(updated))
            dispatch(saveToHistory())
        }

        return (
            <div className={styles.rightSidebar}>
                <div className={styles.container}>
                    <h3 className={styles.heading}>Link Settings</h3>
                    <label className={styles.label}>USER INPUT (Digit)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className={styles.input}
                            value={localLabel}
                            onChange={(e) => {
                                if (isAdmin) return;
                                const val = e.target.value.slice(-1);
                                setLocalLabel(val);

                                if (val && !/^[0-9*#$]/.test(val)) {
                                    e.target.style.borderColor = 'red';
                                } else {
                                    e.target.style.borderColor = '';
                                }
                            }}
                            onBlur={() => {
                                if (isAdmin) return;

                                const trimmed = localLabel.trim();

                                if (!trimmed) {
                                    alert("Edge label cannot be empty");
                                    setLocalLabel(currentEdge?.label || '1');
                                    return;
                                }

                                if (!/^[0-9*#$]$/.test(trimmed)) {
                                    alert("Label must be a single digit (0-9), *, # or $");
                                    setLocalLabel(currentEdge?.label || '');
                                    return;
                                }

                                const sourceEdges = edges.filter(e => e.source === currentEdge.source);
                                const hasDuplicate = sourceEdges.some(
                                    e => e.id !== selectedEdge && e.label === trimmed
                                );

                                if (hasDuplicate) {
                                    alert(`Label "${trimmed}" is already used on this node`);
                                    setLocalLabel(currentEdge?.label || '');
                                    return;
                                }

                                const updated = edges.map(edge =>
                                    edge.id === selectedEdge ? { ...edge, label: trimmed } : edge
                                );
                                dispatch(setEdges(updated));
                                dispatch(saveToHistory());
                            }}
                            placeholder="1, 2, *, #"
                            maxLength={1}
                            disabled={isAdmin}
                            readOnly={isAdmin}
                        />
                    </div>
                    {!isAdmin && <p className={styles.hint}>Single character: 0–9, *, #</p>}
                </div>
            </div>
        )
    }
    // ── Node editing ──
    if (!currentNode) {
        return (
            <div className={styles.rightSidebar}>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <p>{getEmptyMessage()}</p>
                    </div>
                </div>
            </div>
        )
    }

    const data = currentNode.data || {}

    const updateField = (key, value) => {
        if (isAdmin) return
        dispatch(updateNodeData({ nodeId: selectedNode, updates: { [key]: value } }))
    }

    const handleBlur = () => {
        if (isAdmin) return
        dispatch(saveToHistory())
    }

    const apiCalls = data.apiCalls || []

    const handleAddApiCall = () => {
        const id = Date.now()
        if (data.isAPI) {
            updateField('apiCalls', [...apiCalls, DEFAULT_API_URL])
            dispatch(saveToHistory())
        } else {
            setPendingInputs(prev => [...prev, { id, value: '' }])
        }
        if (!shortcodeUrlsOpen) setShortcodeUrlsOpen(true)
    }

    const handlePendingChange = (id, value) => {
        setPendingInputs(prev => prev.map(p => p.id === id ? { ...p, value } : p))
    }

    const handlePendingBlur = (id) => {
        const pending = pendingInputs.find(p => p.id === id)
        if (!pending) return

        if (pending.value.trim() !== '') {
            updateField('apiCalls', [...apiCalls, pending.value.trim()])
            dispatch(saveToHistory())
        }
        setPendingInputs(prev => prev.filter(p => p.id !== id))
    }

    const handleRemovePending = (id) => {
        setPendingInputs(prev => prev.filter(p => p.id !== id))
    }

    const handleRemoveApiCall = (index) => {
        const updated = apiCalls.filter((_, i) => i !== index)
        updateField('apiCalls', updated)
        if (updated.length === 0 && pendingInputs.length === 0) setShortcodeUrlsOpen(false)
        dispatch(saveToHistory())
    }

    const handleApiCallChange = (index, value) => {
        updateField('apiCalls', apiCalls.map((url, i) => i === index ? value : url))
    }

    const handleApiCallBlur = (index) => {
        const value = apiCalls[index]
        if (value.trim() === '') {
            const updated = apiCalls.filter((_, i) => i !== index)
            updateField('apiCalls', updated)
            if (updated.length === 0 && pendingInputs.length === 0) setShortcodeUrlsOpen(false)
        }
        dispatch(saveToHistory())
    }
    const totalVisible = apiCalls.length + pendingInputs.length
    const filledCalls = apiCalls

    return (
        <div className={styles.rightSidebar}>
            <div className={styles.container}>
                <h3 className={styles.heading}>
                    Configuration {data.label ? `(${data.label})` : '(Node)'}
                    {isAdmin && <span className={styles.adminBadge}>🔒 View Only</span>}
                </h3>

                {data.isShortCode && (
                    <div className={styles.section}>
                        <label className={styles.label}>SHORT CODE</label>
                        <input
                            className={styles.input}
                            value={data.label || ''}
                            onChange={(e) => updateField('label', e.target.value)}
                            onBlur={handleBlur}
                            placeholder="*123# or custom code"
                            disabled={isAdmin}
                            readOnly={isAdmin}
                        />
                    </div>
                )}

                <button
                    onClick={() => {
                        if (isAdmin) return
                        updateField('enabled', !data.enabled)
                        dispatch(saveToHistory())
                    }}
                    className={`${styles.statusBtn} ${data.enabled ? styles.active : styles.offline}`}
                    disabled={isAdmin}
                >
                    {data.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                    {data.enabled ? 'ACTIVE' : 'OFFLINE'}
                </button>

                {data.isAPI && (
                    <div className={styles.apiBox}>
                        <label className={styles.apiLabel}>Dynamic Menu Builder</label>
                        <div className={styles.apiRow}>
                            <span className={styles.apiText}>Build menu from API response?</span>
                            <button
                                onClick={() => {
                                    if (isAdmin) return
                                    updateField('isDynamicPlanNode', !data.isDynamicPlanNode)
                                    dispatch(saveToHistory())
                                }}
                                className={`${styles.toggleBtn} ${data.isDynamicPlanNode ? styles.toggleOn : styles.toggleOff}`}
                                disabled={isAdmin}
                            >
                                {data.isDynamicPlanNode ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.section}>
                    <label className={styles.label}>MESSAGE TEXT</label>
                    <textarea
                        className={styles.textarea}
                        value={data.text || ''}
                        onChange={(e) => updateField('text', e.target.value)}
                        onBlur={handleBlur}
                        placeholder="Welcome message or instructions..."
                        rows={4}
                        disabled={isAdmin}
                        readOnly={isAdmin}
                    />
                </div>

                {(data.isShortCode || data.isAPI) && (
                    <div className={styles.apiUrlCard}>
                        <div
                            className={styles.apiUrlCardHeader}
                            onClick={isAdmin && filledCalls.length > 1
                                ? () => setShortcodeUrlsOpen(prev => !prev)
                                : undefined}
                            style={{ cursor: isAdmin && filledCalls.length > 1 ? 'pointer' : 'default' }}
                        >
                            <div className={styles.apiUrlCardTitle}>
                                <span className={styles.apiUrlDot} />
                                <span className={styles.apiUrlLabel}>
                                    API URL
                                    {data.isShortCode && <span className={styles.optional}> (Optional)</span>}
                                </span>
                            </div>
                            {!isAdmin && (
                                <button
                                    className={styles.labelAddBtn}
                                    onClick={handleAddApiCall}
                                    title="Add API URL"
                                >
                                    <Plus size={12} />
                                </button>
                            )}
                            {isAdmin && filledCalls.length > 1 && (
                                <span className={styles.labelToggleBtn}>
                                    {shortcodeUrlsOpen
                                        ? <ChevronUp size={14} />
                                        : <ChevronDown size={14} />}
                                </span>
                            )}
                        </div>
                        <div
                            className={styles.apiUrlCardBody}
                            style={{
                                maxHeight: (() => {
                                    if (!isAdmin) return totalVisible > 0 ? '500px' : '0px'
                                    if (filledCalls.length === 0) return '0px'
                                    if (filledCalls.length === 1) return '500px'
                                    return shortcodeUrlsOpen ? '500px' : '0px'
                                })(),
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease',
                            }}
                        >
                            {isAdmin && filledCalls.map((url, index) => (
                                <div key={index} className={styles.apiCallRow}>
                                    <input
                                        className={styles.input}
                                        value={url}
                                        readOnly
                                        disabled
                                    />
                                </div>
                            ))}
                            {!isAdmin && apiCalls.map((url, index) => (
                                <div key={index} className={styles.apiCallRow}>
                                    <input
                                        className={styles.input}
                                        value={url}
                                        onChange={(e) => handleApiCallChange(index, e.target.value)}
                                        onBlur={() => handleApiCallBlur(index)}
                                        placeholder={
                                            data.isShortCode
                                                ? 'https://api.example.com/user-info'
                                                : 'https://api.example.com/plans'
                                        }
                                    />
                                    {(data.isShortCode || apiCalls.length > 1) && (
                                        <button
                                            className={styles.apiCallRemove}
                                            onClick={() => handleRemoveApiCall(index)}
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isAdmin && pendingInputs.map((p) => (
                                <div key={p.id} className={styles.apiCallRow}>
                                    <input
                                        className={styles.input}
                                        value={p.value}
                                        onChange={(e) => handlePendingChange(p.id, e.target.value)}
                                        onBlur={() => handlePendingBlur(p.id)}
                                        placeholder="https://api.example.com/user-info"
                                        autoFocus
                                    />
                                    <button
                                        className={styles.apiCallRemove}
                                        onClick={() => handleRemovePending(p.id)}
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.previewSection}>
                    <p className={styles.previewLabel}>
                        <Smartphone size={16} /> HANDSET PREVIEW
                    </p>
                    <div className={styles.phoneShell}>
                        <div className={styles.phoneScreen}>
                            {data.text || 'Preview of message shown to user'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RightSidebar