import { saveToHistory, setEdges, updateNodeData } from '../../store/flowSlice'
import { Power, PowerOff, Smartphone } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import styles from './RightSidebar.module.css'

const RightSidebar = () => {
    const dispatch = useDispatch()

    const { user } = useSelector((state) => state.auth)
    const { nodes, edges, selectedNode, selectedEdge } = useSelector((state) => state.flow)

    const currentNode = nodes.find(n => n.id === selectedNode)
    const currentEdge = edges.find(e => e.id === selectedEdge)

    const [localLabel, setLocalLabel] = useState(currentEdge?.label || '')

    const isAdmin = user?.role === 'admin'

    useEffect(() => {
        setLocalLabel(currentEdge?.label || '')
    }, [currentEdge?.id, currentEdge?.label])

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
                    <input
                        className={styles.input}
                        value={localLabel}
                        onChange={(e) => {
                            if (isAdmin) return
                            setLocalLabel(e.target.value)
                        }}
                        onBlur={commitLabel}
                        placeholder="e.g. 1, 2, *, #"
                        maxLength={1}
                        disabled={isAdmin}
                        readOnly={isAdmin}
                    />
                    {isAdmin && (
                        <p className={styles.adminHint}>
                            🔒 View-only mode (Admin)
                        </p>
                    )}
                    {!isAdmin && (
                        <p className={styles.hint}>Enter a single digit (0-9), *, or #</p>
                    )}
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

        dispatch(updateNodeData({
            nodeId: selectedNode,
            updates: { [key]: value }
        }))
    }

    const handleBlur = () => {
        if (isAdmin) return
        dispatch(saveToHistory())
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
                            <span className={styles.apiText}>
                                Build menu from API response?
                            </span>
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

                {(data.isAPI || data.isShortCode) && (
                    <div className={styles.section}>
                        <label className={styles.label}>
                            API URL
                            {data.isShortCode && <span className={styles.optional}> (Optional - for user data)</span>}
                        </label>
                        <input
                            className={styles.input}
                            value={data.apiUrl || ''}
                            onChange={(e) => updateField('apiUrl', e.target.value)}
                            onBlur={handleBlur}
                            placeholder={
                                data.isShortCode
                                    ? "https://api.example.com/user-info"
                                    : "https://api.example.com/plans"
                            }
                            disabled={isAdmin}
                            readOnly={isAdmin}
                        />
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