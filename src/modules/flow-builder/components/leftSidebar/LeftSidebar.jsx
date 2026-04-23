import { getVersionsApi, loadVersionApi, publishApi, saveVersionApi } from "@/modules/flow-builder/services/versionService"
import { addNode, clearCanvas, deleteSelected, loadFlowState, redo, undo } from '@/modules/flow-builder/store/flowSlice'
import { Database, Eraser, Eye, GitBranch, History, LayoutGrid, List, Loader2, RotateCcw, RotateCw, Save, SaveAll, Shield, Trash2, Upload, Users, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useReactFlow } from 'reactflow'
import styles from './LeftSidebar.module.css'

const ADMIN_CAPABILITIES = [
    {
        icon: Users,
        title: 'Manage users',
        desc: 'Control roles and access via the top-right menu.'
    },
    {
        icon: GitBranch,
        title: 'Load any version',
        desc: 'Browse and restore any saved version.'
    },
    {
        icon: Eye,
        title: 'View-only canvas',
        desc: 'Inspect the full flow without making edits.'
    },
    {
        icon: Upload,
        title: 'Publish & sync',
        desc: 'Push the current flow live to production.'
    },
]

const LeftSidebar = () => {
    const reactFlowInstance = useReactFlow()
    const [showModal, setShowModal] = useState(false)
    const [versions, setVersions] = useState([])
    const [loadingVersions, setLoadingVersions] = useState(false)
    const [loadingVersion, setLoadingVersion] = useState(null)
    const [loadingPublish, setLoadingPublish] = useState(false)
    const [loadingSave, setLoadingSave] = useState(false)

    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.auth)
    const { nodes, edges } = useSelector((state) => state.flow)
    const flow = useSelector((state) => state.flow)
    const selectedNode = useSelector((state) => state.flow.selectedNode)
    const selectedEdge = useSelector((state) => state.flow.selectedEdge)
    const canUndo = useSelector((state) => state.flow.history.length > 0)
    const canRedo = useSelector((state) => state.flow.future.length > 0)

    const isAdmin = user?.role === 'admin'

    const isOverlapping = (pos, nodes, width, height) => {
        return nodes.some((node) => {
            const nodeWidth = 200
            const nodeHeight = 100
            return !(
                pos.x + width < node.position.x ||
                pos.x > node.position.x + nodeWidth ||
                pos.y + height < node.position.y ||
                pos.y > node.position.y + nodeHeight
            )
        })
    }

    const handleAddNode = (type) => {
        const { getViewport, getNodes } = reactFlowInstance
        const viewport = getViewport()
        const wrapper = document.querySelector('.react-flow')
        const bounds = wrapper.getBoundingClientRect()
        const padding = 40
        const minX = (-viewport.x) / viewport.zoom
        const minY = (-viewport.y) / viewport.zoom
        const maxX = minX + bounds.width / viewport.zoom
        const maxY = minY + bounds.height / viewport.zoom
        const nodes = getNodes()
        const nodeWidth = 200
        const nodeHeight = 100
        let position
        let tries = 0
        const maxTries = 100
        do {
            position = {
                x: minX + padding + Math.random() * (maxX - minX - nodeWidth - padding * 2),
                y: minY + padding + Math.random() * (maxY - minY - nodeHeight - padding * 2),
            }
            tries++
        } while (isOverlapping(position, nodes, nodeWidth, nodeHeight) && tries < maxTries)
        dispatch(addNode({ type, position }))
    }

    const handleSaveVersion = async () => {
        const versionName = window.prompt("Enter version name:")
        if (!versionName?.trim()) return
        setLoadingSave(true)
        try {
            await saveVersionApi(versionName, flow.nodes, flow.edges)
            alert(`✅ Version "${versionName}" saved successfully`)
        } catch (error) {
            console.error(error)
            alert("❌ Failed to save version")
        } finally {
            setLoadingSave(false)
        }
    }

    const handleOpenModal = async () => {
        setVersions([])
        setShowModal(true)
        setLoadingVersions(true)
        try {
            const response = await getVersionsApi()
            const fetched = response?.data?.versions
            if (!Array.isArray(fetched)) {
                setVersions(null)
                return
            }
            setVersions(fetched)
        } catch (error) {
            console.error(error)
            setVersions(null)
        } finally {
            setLoadingVersions(false)
        }
    }

    const handleLoadVersion = async (versionName) => {
        if (loadingVersion) return
        setLoadingVersion(versionName)
        try {
            const formatted = await loadVersionApi(versionName)
            dispatch(loadFlowState(formatted))
            setShowModal(false)
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2, duration: 800 })
            }, 100)
        } catch (error) {
            console.error(error)
            alert("❌ Failed to load version")
        } finally {
            setLoadingVersion(null)
        }
    }

    const handleClearCanvas = () => {
        if (window.confirm('⚠️ Clear entire canvas? This action cannot be undone.')) {
            dispatch(clearCanvas())
        }
    }

    const handlePublish = async () => {
        setLoadingPublish(true)
        try {
            const response = await publishApi(nodes, edges)
            alert(response.data.message)
        } catch (error) {
            console.error(error)
            alert("❌ Failed to publish flow")
        } finally {
            setLoadingPublish(false)
        }
    }

    return (
        <div className={styles.sidebar}>

            {/* ── Title ── */}
            <h2 className={styles.sidebarh2}>
                <Zap size={20} />
                {isAdmin ? 'Admin Panel' : 'Design USSD'}
            </h2>

            {/* ══════════════ ADMIN VIEW ══════════════ */}
            {isAdmin ? (
                <>
                    <button
                        className={styles.publishBtn}
                        onClick={handlePublish}
                        disabled={nodes.length === 0 || loadingPublish}
                    >
                        {loadingPublish
                            ? <><Loader2 size={14} className={styles.spin} /> Publishing…</>
                            : <><Save size={16} /> Publish & Sync</>
                        }
                    </button>

                    <button onClick={handleOpenModal}>
                        <History size={16} /> Sync Version...
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        disabled={nodes.length === 0}
                    >
                        <Eraser size={16} /> Clear Canvas
                    </button>

                    <div className={styles.capabilitiesPanel}>
                        <div className={styles.capabilitiesHeader}>
                            <Shield size={13} />
                            <span>Admin capabilities</span>
                        </div>
                        <ul className={styles.capabilitiesList}>
                            {ADMIN_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                                <li key={title} className={styles.capabilityItem}>
                                    <div className={styles.capabilityIcon}>
                                        <Icon size={13} />
                                    </div>
                                    <div className={styles.capabilityText}>
                                        <span className={styles.capabilityTitle}>{title}</span>
                                        <span className={styles.capabilityDesc}>{desc}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            ) : (

                /* ══════════════ USER VIEW ══════════════ */
                <>
                    <div className={styles.row}>
                        <button
                            onClick={() => dispatch(undo())}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                        >
                            <RotateCcw size={14} /> Undo
                        </button>
                        <button
                            onClick={() => dispatch(redo())}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y)"
                        >
                            <RotateCw size={14} /> Redo
                        </button>
                    </div>

                    <button onClick={() => handleAddNode('shortcode')}>
                        <LayoutGrid size={16} /> New Short Code
                    </button>

                    <button onClick={() => handleAddNode('submenu')}>
                        <List size={16} /> Add Sub-Menu
                    </button>

                    <button onClick={() => handleAddNode('api')}>
                        <Database size={16} /> Add API Node
                    </button>

                    <hr />

                    <button
                        onClick={handleSaveVersion}
                        disabled={nodes.length === 0 || loadingSave}
                    >
                        {loadingSave
                            ? <><Loader2 size={14} className={styles.spin} /> Saving…</>
                            : <><Save size={16} /> Save Version</>
                        }
                    </button>

                    <button onClick={handleOpenModal}>
                        <History size={16} /> Sync Version...
                    </button>

                    <button
                        onClick={handleClearCanvas}
                        disabled={nodes.length === 0}
                    >
                        <Eraser size={16} /> Clear Canvas
                    </button>

                    {(selectedNode || selectedEdge) && (
                        <button
                            className={styles.delete}
                            onClick={() => dispatch(deleteSelected())}
                            title="Delete (Delete key)"
                        >
                            <Trash2 size={16} /> Delete Selected
                        </button>
                    )}
                </>
            )}

            {/* ── Version Modal (shared) ── */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => !loadingVersion && setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>
                                <span className={styles.modalHeaderIcon}>
                                    <SaveAll size={15} />
                                </span>
                                Saved Versions
                            </h3>
                            <X
                                onClick={() => !loadingVersion && setShowModal(false)}
                                className={styles.closeButton}
                                size={16}
                            />
                        </div>
                        <div className={styles.versionList}>
                            {loadingVersions ? (
                                <div className={styles.versionLoading}>
                                    <Loader2 size={18} className={styles.spin} />
                                    <span>Fetching versions…</span>
                                </div>
                            ) : versions === null ? (
                                <div className={styles.versionError}>
                                    <span>Failed to fetch versions</span>
                                    <button className={styles.retryBtn} onClick={handleOpenModal}>
                                        Retry
                                    </button>
                                </div>
                            ) : versions.length === 0 ? (
                                <p className={styles.emptyMessage}>No versions available</p>
                            ) : (
                                versions.map((version) => {
                                    const isLoadingThis = loadingVersion === version
                                    const isLoadingOther = loadingVersion && loadingVersion !== version
                                    return (
                                        <div
                                            key={version}
                                            className={`${styles.versionItem} ${isLoadingOther ? styles.versionItemDimmed : ''}`}
                                            onClick={() => !loadingVersion && handleLoadVersion(version)}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <span className={styles.versionName}>📄 {version}</span>
                                            </div>
                                            {isLoadingThis && (
                                                <Loader2 size={14} className={styles.spin} style={{ color: '#3dd68c' }} />
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        {Array.isArray(versions) && versions.length > 0 && (
                            <div className={styles.modalFooter}>
                                <p className={styles.hint}>
                                    {loadingVersion ? 'Loading version…' : 'Click on a version to load it'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeftSidebar