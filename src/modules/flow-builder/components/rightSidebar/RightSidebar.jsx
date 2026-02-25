import { Power, PowerOff, Save, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { saveToHistory, setEdges, updateNodeData } from '../../store/flowSlice'
import styles from './RightSidebar.module.css'
import { publishApi } from '../../services/versionService'
import MobileSimulator from '../mobileSimulator/MobileSimulator'

const RightSidebar = () => {
    const dispatch = useDispatch()

    const { user } = useSelector((state) => state.auth)
    const { nodes, edges, selectedNode, selectedEdge } = useSelector((state) => state.flow)

    const currentNode = nodes.find(n => n.id === selectedNode)
    const currentEdge = edges.find(e => e.id === selectedEdge)

    const [localLabel, setLocalLabel] = useState(currentEdge?.label || '')
    const [testOpen, setTestOpen] = useState(false)

    useEffect(() => {
        setLocalLabel(currentEdge?.label || '')
    }, [currentEdge?.id, currentEdge?.label])

    // ── Edge editing ────────────────────────────────────────────────────
    if (currentEdge) {
        const commitLabel = () => {
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
                        onChange={(e) => setLocalLabel(e.target.value)}
                        onBlur={commitLabel}
                        placeholder="e.g. 1, 2, *, #"
                        maxLength={1}
                    />
                    <p className={styles.hint}>Enter a single digit (0-9), *, or #</p>
                </div>
            </div>
        )
    }

    // ── Node editing ────────────────────────────────────────────────────
    if (!currentNode) {
        return (
            <div className={styles.rightSidebar}>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        Select a node or connection to edit
                    </div>
                </div>
            </div>
        )
    }

    const data = currentNode.data || {}

    const updateField = (key, value) => {
        dispatch(updateNodeData({
            nodeId: selectedNode,
            updates: { [key]: value }
        }))
    }

    const handleBlur = () => {
        dispatch(saveToHistory())
    }

    const handlePublish = async () => {
        try {
            const response = await publishApi(nodes, edges)

            console.log("Publish response:", response.data.message)
            alert(response.data.message)

        } catch (error) {
            console.error(error)
            alert("❌ Failed to publish flow")
        }
    }

    return (
        <div className={styles.rightSidebar}>
            <div className={styles.container}>
                <h3 className={styles.heading}>
                    Configuration {data.label ? `(${data.label})` : '(Node)'}
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
                        />
                    </div>
                )}

                <button
                    onClick={() => {
                        updateField('enabled', !data.enabled)
                        dispatch(saveToHistory())
                    }}
                    className={`${styles.statusBtn} ${data.enabled ? styles.active : styles.offline}`}
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
                                    updateField('isDynamicPlanNode', !data.isDynamicPlanNode)
                                    dispatch(saveToHistory())
                                }}
                                className={`${styles.toggleBtn} ${data.isDynamicPlanNode ? styles.toggleOn : styles.toggleOff}`}
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
                    />
                </div>

                {data.isAPI && (
                    <div className={styles.section}>
                        <label className={styles.label}>API URL</label>
                        <input
                            className={styles.input}
                            value={data.apiUrl || ''}
                            onChange={(e) => updateField('apiUrl', e.target.value)}
                            onBlur={handleBlur}
                            placeholder="https://api.example.com/plans"
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

                <button onClick={() => setTestOpen(true)} className={styles.testBtn}>
                    📱 Test Flow
                </button>

                {user.role === 'admin' && (
                    <button className={styles.publishBtn} onClick={handlePublish}>
                        <Save size={18} />
                        Publish & Sync
                    </button>
                )}

                {testOpen && (
                    <div className={styles.modalOverlay} onClick={() => setTestOpen(false)}>
                        <div
                            className={styles.modalContent}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MobileSimulator onClose={() => setTestOpen(false)} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default RightSidebar