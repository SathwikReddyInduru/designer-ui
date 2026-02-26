import { Database, Eraser, History, LayoutGrid, List, RotateCcw, RotateCw, Save, SaveAll, Trash2, X, Zap } from 'lucide-react'
import { addNode, clearCanvas, deleteSelected, loadFlowState, redo, undo } from '../../store/flowSlice'
import { saveVersionApi, getVersionsApi, loadVersionApi } from "../../services/versionService"
import { publishApi } from '../../services/versionService'
import { useDispatch, useSelector } from 'react-redux'
import { useState } from 'react'
import styles from './LeftSidebar.module.css'

const LeftSidebar = () => {
    const [showModal, setShowModal] = useState(false)
    const [versions, setVersions] = useState([])

    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.auth)
    const { nodes, edges } = useSelector((state) => state.flow)
    const flow = useSelector((state) => state.flow)
    const selectedNode = useSelector((state) => state.flow.selectedNode)
    const selectedEdge = useSelector((state) => state.flow.selectedEdge)
    const canUndo = useSelector((state) => state.flow.history.length > 0)
    const canRedo = useSelector((state) => state.flow.future.length > 0)

    const handleSaveVersion = async () => {
        const versionName = window.prompt("Enter version name:")
        if (!versionName?.trim()) return

        try {
            await saveVersionApi(versionName, flow.nodes, flow.edges)
            alert(`✅ Version "${versionName}" saved successfully`)
        } catch (error) {
            console.error(error)
            alert("❌ Failed to save version")
        }
    }

    const handleOpenModal = async () => {
        try {
            const response = await getVersionsApi()

            setVersions(response.data.versions)

            setShowModal(true)
        } catch (error) {
            console.error(error)
            alert("❌ Failed to fetch versions")
        }
    }

    const handleLoadVersion = async (versionName) => {
        try {
            const formatted = await loadVersionApi(versionName)

            dispatch(loadFlowState(formatted))
            setShowModal(false)

        } catch (error) {
            console.error(error)
            alert("❌ Failed to load version")
        }
    }

    const handleClearCanvas = () => {
        if (window.confirm('⚠️ Clear entire canvas? This action cannot be undone.')) {
            dispatch(clearCanvas())
            // alert('✅ Canvas cleared')
        }
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
        <div className={styles.sidebar}>
            <h2 className={styles.sidebarh2}>
                <Zap size={20} /> Design USSD
            </h2>

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

            {user.role === 'admin' && (
                <button
                    className={styles.publishBtn}
                    onClick={handlePublish}
                    disabled={nodes.length === 0}>
                    <Save size={18} />
                    Publish & Sync
                </button>
            )}

            <button
                onClick={() => dispatch(addNode('shortcode'))}
                disabled={user.role == 'admin'}>
                <LayoutGrid size={16} /> New Short Code
            </button>

            <button
                onClick={() => dispatch(addNode('submenu'))}
                disabled={user.role == 'admin'}>
                <List size={16} /> Add Sub-Menu
            </button>

            <button
                onClick={() => dispatch(addNode('api'))}
                disabled={user.role == 'admin'}>
                <Database size={16} /> Add API Node
            </button>

            <hr />

            <button
                onClick={handleSaveVersion}
                disabled={user.role == 'admin' || nodes.length === 0}>
                <Save size={16} /> Save Version
            </button>

            <button onClick={handleOpenModal}>
                <History size={16} /> Sync Version...
            </button>

            <button
                onClick={handleClearCanvas}
                disabled={nodes.length === 0}>
                <Eraser size={16} /> Clear Canvas
            </button>

            {user.role !== 'admin' && (
                (selectedNode || selectedEdge) && (
                    <button
                        className={styles.delete}
                        onClick={() => dispatch(deleteSelected())}
                        disabled={user.role == 'admin'}
                        title="Delete (Delete key)"
                    >
                        <Trash2 size={16} /> Delete Selected
                    </button>
                )
            )}

            {/* Version Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3><SaveAll size={16} /> Saved Versions</h3>
                            <X
                                onClick={() => setShowModal(false)}
                                className={styles.closeButton}
                                size={20}
                            />
                        </div>

                        <div className={styles.versionList}>
                            {versions.length === 0 ? (
                                <p className={styles.emptyMessage}>No versions available</p>
                            ) : (
                                versions.map((version) => (
                                    <div
                                        key={version}
                                        className={styles.versionItem}
                                        onClick={() => handleLoadVersion(version)}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <span className={styles.versionName}>📄 {version}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {versions.length > 0 && (
                            <div className={styles.modalFooter}>
                                <p className={styles.hint}>Click on a version to load it</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeftSidebar