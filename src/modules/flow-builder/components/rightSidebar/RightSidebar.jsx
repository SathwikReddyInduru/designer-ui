import { ChevronDown, ChevronUp, Plus, Power, PowerOff, Smartphone, Trash2 } from 'lucide-react'
import { saveToHistory, setEdges, updateNodeData } from '../../store/flowSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState, useRef } from 'react'
import styles from './RightSidebar.module.css'

const DEFAULT_API_URL = 'http://localhost:6215/api/billing/v1/available-plans'

const RightSidebar = () => {
    const dispatch = useDispatch()

    const { user } = useSelector((state) => state.auth)
    const { nodes, edges, selectedNode, selectedEdge } = useSelector((state) => state.flow)

    const currentNode = nodes.find(n => n.id === selectedNode)
    const currentEdge = edges.find(e => e.id === selectedEdge)

    const [localLabel, setLocalLabel] = useState(currentEdge?.label || '')
    const [splitByOpen, setSplitByOpen] = useState(false)
    const [passOnOpen, setPassOnOpen] = useState(false)
    const [shortcodeUrlsOpen, setShortcodeUrlsOpen] = useState(false)
    const [localSplitBy, setLocalSplitBy] = useState('')
    const [localPassOnValue, setLocalPassOnValue] = useState('')
    const [localApiCalls, setLocalApiCalls] = useState([])

    const prevNodeRef = useRef(null)

    const isAdmin = user?.role === 'admin'

    useEffect(() => {
        setLocalLabel(currentEdge?.label || '')
    }, [currentEdge?.id, currentEdge?.label])

    useEffect(() => {
        setShortcodeUrlsOpen(false)
        setPassOnOpen(false)
        setSplitByOpen(false)
    }, [selectedNode])

    useEffect(() => {
        if (currentNode) {
            const passOnValue = Array.isArray(currentNode.data?.passOnValue)
                ? currentNode.data.passOnValue
                : []
            setLocalPassOnValue(passOnValue.join(', '))

            const splitBy = currentNode.data?.splitBy || ''
            setLocalSplitBy(splitBy)

            const apiCalls = Array.isArray(currentNode.data?.apiCalls)
                ? currentNode.data.apiCalls
                : []
            setLocalApiCalls(apiCalls)
        }
    }, [selectedNode, currentNode?.data?.passOnValue, currentNode?.data?.splitBy, currentNode?.data?.apiCalls])

    useEffect(() => {
        const prevNodeId = prevNodeRef.current

        if (prevNodeId && prevNodeId !== selectedNode) {
            const prevNode = nodes.find(n => n.id === prevNodeId)

            if (prevNode) {
                const data = prevNode.data || {}
                let needsUpdate = false
                const updates = {}

                if (data.isShortCode) {
                    const apiCalls = Array.isArray(data.apiCalls) ? data.apiCalls : []
                    const cleanedApiCalls = apiCalls.filter(url => url && url.trim() !== '')

                    if (cleanedApiCalls.length !== apiCalls.length) {
                        updates.apiCalls = cleanedApiCalls
                        needsUpdate = true
                    }
                }

                const passOnValue = Array.isArray(data.passOnValue) ? data.passOnValue : []
                if (passOnValue.length === 0 || passOnValue.every(v => !v || v.trim() === '')) {
                    if (data.passOnValue && data.passOnValue.length > 0) {
                        updates.passOnValue = []
                        needsUpdate = true
                    }
                }

                const splitBy = data.splitBy || ''
                if (!splitBy || splitBy.trim() === '') {
                    if (data.splitBy) {
                        updates.splitBy = ''
                        needsUpdate = true
                    }
                }

                if (needsUpdate) {
                    dispatch(updateNodeData({
                        nodeId: prevNodeId,
                        updates
                    }))
                }
            }
        }

        prevNodeRef.current = selectedNode
    }, [selectedNode, nodes, dispatch, currentNode])

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
        const fallbackLabel = currentEdge?.label || '1'

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
                                    setLocalLabel(fallbackLabel);
                                    return;
                                }

                                if (!/^[0-9*#$]$/.test(trimmed)) {
                                    alert("Label must be a single digit (0-9), *, # or $");
                                    setLocalLabel(fallbackLabel);
                                    return;
                                }

                                const sourceEdges = edges.filter(e => e.source === currentEdge.source);
                                const hasDuplicate = sourceEdges.some(
                                    e => e.id !== selectedEdge && e.label === trimmed
                                );

                                if (hasDuplicate) {
                                    alert(`Label "${trimmed}" is already used on this node`);
                                    setLocalLabel(fallbackLabel);
                                    return;
                                }

                                const updated = edges.map(edge =>
                                    edge.id === selectedEdge ? { ...edge, label: trimmed } : edge
                                );
                                dispatch(setEdges(updated));
                                dispatch(saveToHistory());
                            }}
                            placeholder="1, 2, *, #, $"
                            maxLength={1}
                            disabled={isAdmin}
                            readOnly={isAdmin}
                        />
                    </div>
                    {!isAdmin && <p className={styles.hint}>Single character: 0–9, *, #, $</p>}
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

    const passOnValue = Array.isArray(data.passOnValue) ? data.passOnValue : []
    const splitBy = data.splitBy || ''

    // API URL handlers
    const handleAddApiCall = () => {
        if (isAdmin) return

        const newUrl = data.isAPI ? DEFAULT_API_URL : ''
        const updated = [...localApiCalls, newUrl]
        setLocalApiCalls(updated)
        updateField('apiCalls', updated)
        dispatch(saveToHistory())

        if (!shortcodeUrlsOpen) setShortcodeUrlsOpen(true)
    }

    const handleApiCallChange = (index, value) => {
        if (isAdmin) return
        const updated = localApiCalls.map((url, i) => i === index ? value : url)
        setLocalApiCalls(updated)
    }

    const handleApiCallBlur = () => {
        if (isAdmin) return
        updateField('apiCalls', localApiCalls)
        dispatch(saveToHistory())
    }

    const handleRemoveApiCall = (index) => {
        if (isAdmin) return
        const updated = localApiCalls.filter((_, i) => i !== index)
        setLocalApiCalls(updated)
        updateField('apiCalls', updated)

        if (updated.length === 0) {
            setShortcodeUrlsOpen(false)
        }
        dispatch(saveToHistory())
    }

    // Pass-on Value handlers
    const handleAddPassOn = () => {
        if (isAdmin) return
        setPassOnOpen(true)
    }

    const handlePassOnChange = (value) => {
        if (isAdmin) return
        setLocalPassOnValue(value)
    }

    const handlePassOnBlur = () => {
        if (isAdmin) return

        const arr = localPassOnValue
            .split(',')
            .map(v => v.trim())
            .filter(v => v !== '')

        updateField('passOnValue', arr)
        dispatch(saveToHistory())
    }

    const handleRemovePassOn = () => {
        if (isAdmin) return
        updateField('passOnValue', [])
        setLocalPassOnValue('')
        dispatch(saveToHistory())
        setPassOnOpen(false)
    }

    // SplitBy handlers
    const handleAddSplitBy = () => {
        if (isAdmin) return
        setSplitByOpen(true)
    }

    const handleSplitByChange = (value) => {
        if (isAdmin) return
        setLocalSplitBy(value)
    }

    const handleSplitByBlur = () => {
        if (isAdmin) return

        const trimmed = localSplitBy.trim()
        updateField('splitBy', trimmed)
        dispatch(saveToHistory())
    }

    const handleRemoveSplitBy = () => {
        if (isAdmin) return
        updateField('splitBy', '')
        setLocalSplitBy('')
        dispatch(saveToHistory())
        setSplitByOpen(false)
    }

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

                {/* Split By Section */}
                <div className={styles.apiUrlCard}>
                    <div className={styles.apiUrlCardHeader}>
                        <div className={styles.apiUrlCardTitle}>
                            <span className={styles.apiUrlDot} />
                            <span className={styles.apiUrlLabel}>
                                Split By
                                <span className={styles.optional}> (Optional)</span>
                            </span>
                        </div>

                        {!isAdmin && !splitBy && !splitByOpen && (
                            <button
                                className={styles.labelAddBtn}
                                onClick={handleAddSplitBy}
                                title="Add Split By"
                            >
                                <Plus size={12} />
                            </button>
                        )}
                    </div>

                    <div
                        className={styles.apiUrlCardBody}
                        style={{
                            maxHeight: splitByOpen || splitBy ? '500px' : '0px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease',
                        }}
                    >
                        {(splitByOpen || splitBy) && (
                            <div className={styles.apiCallRow}>
                                <input
                                    className={styles.input}
                                    value={localSplitBy}
                                    onChange={(e) => handleSplitByChange(e.target.value)}
                                    onBlur={handleSplitByBlur}
                                    placeholder="Ex: , | or -"
                                    disabled={isAdmin}
                                    readOnly={isAdmin}
                                    autoFocus={splitByOpen}
                                />

                                {!isAdmin && (
                                    <button
                                        className={styles.apiCallRemove}
                                        onClick={handleRemoveSplitBy}
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pass-on Values Section */}
                <div className={styles.apiUrlCard}>
                    <div className={styles.apiUrlCardHeader}>
                        <div className={styles.apiUrlCardTitle}>
                            <span className={styles.apiUrlDot} />
                            <span className={styles.apiUrlLabel}>
                                Pass-on Values
                                <span className={styles.optional}> (Optional)</span>
                            </span>
                        </div>

                        {!isAdmin && passOnValue.length === 0 && !passOnOpen && (
                            <button
                                className={styles.labelAddBtn}
                                onClick={handleAddPassOn}
                                title="Add Pass-on Values"
                            >
                                <Plus size={12} />
                            </button>
                        )}
                    </div>

                    <div
                        className={styles.apiUrlCardBody}
                        style={{
                            maxHeight: passOnOpen || passOnValue.length > 0 ? '500px' : '0px',
                            overflow: 'hidden',
                            transition: 'max-height 0.3s ease',
                        }}
                    >
                        {(passOnOpen || passOnValue.length > 0) && (
                            <div className={styles.apiCallRow}>
                                <input
                                    className={styles.input}
                                    value={localPassOnValue}
                                    onChange={(e) => handlePassOnChange(e.target.value)}
                                    onBlur={handlePassOnBlur}
                                    placeholder="Ex: msisdn, accountId, planId"
                                    disabled={isAdmin}
                                    readOnly={isAdmin}
                                    autoFocus={passOnOpen}
                                />

                                {!isAdmin && (
                                    <button
                                        className={styles.apiCallRemove}
                                        onClick={handleRemovePassOn}
                                        title="Remove"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* API URLs Section */}
                {(data.isShortCode || data.isAPI) && (
                    <div className={styles.apiUrlCard}>
                        <div
                            className={styles.apiUrlCardHeader}
                            onClick={isAdmin && localApiCalls.length > 1
                                ? () => setShortcodeUrlsOpen(prev => !prev)
                                : undefined}
                            style={{ cursor: isAdmin && localApiCalls.length > 1 ? 'pointer' : 'default' }}
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

                            {isAdmin && localApiCalls.length > 1 && (
                                <span className={styles.labelToggleBtn}>
                                    {shortcodeUrlsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </span>
                            )}
                        </div>

                        <div
                            className={styles.apiUrlCardBody}
                            style={{
                                maxHeight: (() => {
                                    if (!isAdmin) return localApiCalls.length > 0 ? '500px' : '0px'
                                    if (localApiCalls.length === 0) return '0px'
                                    if (localApiCalls.length === 1) return '500px'
                                    return shortcodeUrlsOpen ? '500px' : '0px'
                                })(),
                                overflow: 'hidden',
                                transition: 'max-height 0.3s ease',
                            }}
                        >
                            {localApiCalls.map((url, index) => (
                                <div key={index} className={styles.apiCallRow}>
                                    <input
                                        className={styles.input}
                                        value={url}
                                        onChange={(e) => handleApiCallChange(index, e.target.value)}
                                        onBlur={handleApiCallBlur}
                                        placeholder={
                                            data.isShortCode
                                                ? 'https://api.example.com/user-info'
                                                : 'https://api.example.com/plans'
                                        }
                                        disabled={isAdmin}
                                        readOnly={isAdmin}
                                    />

                                    {!isAdmin && (data.isShortCode || localApiCalls.length > 1) && (
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