import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ReactFlow, {
    Background,
    Controls,
    addEdge,
    applyEdgeChanges,
    applyNodeChanges
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
    deleteSelected,
    redo,
    saveToHistory,
    setEdges,
    setNodes,
    setSelectedEdge,
    setSelectedNode,
    undo
} from '../../store/flowSlice'
import styles from './Canvas.module.css'

const Canvas = ({ toggleLeft, toggleRight, leftOpen, rightOpen, closeMenu }) => {
    const dispatch = useDispatch()
    const nodes = useSelector((state) => state.flow.nodes)
    const edges = useSelector((state) => state.flow.edges)
    const hasSelection = useSelector((state) =>
        state.flow.selectedNode || state.flow.selectedEdge
    )

    const isDragging = useRef(false)

    const onNodesChange = useCallback((changes) => {
        const dragStart = changes.some(c => c.type === 'position' && c.dragging === true)
        const dragEnd = changes.some(c => c.type === 'position' && c.dragging === false)

        if (dragStart) {
            isDragging.current = true
        }

        dispatch(setNodes(applyNodeChanges(changes, nodes)))

        if (dragEnd && isDragging.current) {
            isDragging.current = false
            dispatch(saveToHistory())
        }
    }, [dispatch, nodes])

    const onEdgesChange = useCallback((changes) => {
        dispatch(setEdges(applyEdgeChanges(changes, edges)))
    }, [dispatch, edges])

    const onConnect = useCallback((connection) => {
        dispatch(saveToHistory())

        const outgoingEdges = edges.filter(
            (edge) => edge.source === connection.source
        )

        const nextLabel = (outgoingEdges.length + 1).toString()

        const styledEdge = {
            ...connection,
            type: 'default',
            animated: true,
            label: nextLabel,
            style: {
                strokeWidth: 1.2
            },
            labelStyle: {
                fontSize: 14,
                fontWeight: 600,
                fill: '#111'
            },
            markerEnd: {
                type: 'arrowclosed'
            }
        }

        dispatch(setEdges(addEdge(styledEdge, edges)))
    }, [dispatch, edges])

    const onNodeClick = useCallback((_, node) => {
        dispatch(setSelectedNode(node.id))
        dispatch(setSelectedEdge(null))
    }, [dispatch])

    const onEdgeClick = useCallback((_, edge) => {
        dispatch(setSelectedEdge(edge.id))
        dispatch(setSelectedNode(null))
    }, [dispatch])

    const onPaneClick = useCallback(() => {
        dispatch(setSelectedNode(null))
        dispatch(setSelectedEdge(null))
    }, [dispatch])

    useEffect(() => {
        const handleKeyDown = (e) => {

            if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault()
                dispatch(undo())
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault()
                dispatch(redo())
            }

            if ((e.key === "Delete") && hasSelection) {
                e.preventDefault()
                dispatch(deleteSelected())
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [dispatch, hasSelection])

    return (
        <div style={{ flex: 1, position: 'relative' }} onClick={() => closeMenu()}>
            <button
                onClick={toggleLeft}
                className={styles.toggleStyleButton}
                style={{ left: 10 }}
                title={leftOpen ? "Hide left sidebar" : "Show left sidebar"}
            >
                {leftOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>

            <button
                onClick={toggleRight}
                className={styles.toggleStyleButton}
                style={{ right: 10 }}
                title={rightOpen ? "Hide right panel" : "Show right panel"}
            >
                {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onEdgeClick={onEdgeClick}
                defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
                minZoom={0.5}
                maxZoom={1.5}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}

export default Canvas