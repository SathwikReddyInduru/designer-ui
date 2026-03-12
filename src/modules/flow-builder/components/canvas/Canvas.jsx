import { deleteSelected, redo, saveToHistory, setEdges, setNodes, setSelectedEdge, setSelectedNode, undo } from '../../store/flowSlice'
import ReactFlow, { Background, Controls, addEdge, applyEdgeChanges, applyNodeChanges } from 'reactflow'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useReactFlow } from 'reactflow';
import styles from './Canvas.module.css'
import 'reactflow/dist/style.css'

const Canvas = ({ toggleLeft, toggleRight, leftOpen, rightOpen, closeMenu }) => {
    const dispatch = useDispatch()
    const nodes = useSelector((state) => state.flow.nodes)
    const edges = useSelector((state) => state.flow.edges)
    const hasSelection = useSelector((state) =>
        state.flow.selectedNode || state.flow.selectedEdge
    )
    const { user } = useSelector((state) => state.auth);
    const { fitView } = useReactFlow();
    const isDragging = useRef(false)

    const onNodesChange = useCallback((changes) => {
        const dragStart = changes.some(
            c => c.type === 'position' && c.dragging === true
        );

        if (dragStart && !isDragging.current) {
            isDragging.current = true;
            dispatch(saveToHistory());
        }

        const dragEnd = changes.some(
            c => c.type === 'position' && c.dragging === false
        );

        if (dragEnd) {
            isDragging.current = false;
        }

        dispatch(setNodes(applyNodeChanges(changes, nodes)));

    }, [dispatch, nodes]);

    const onEdgesChange = useCallback((changes) => {
        dispatch(setEdges(applyEdgeChanges(changes, edges)))
    }, [dispatch, edges])

    const onConnect = useCallback((connection) => {
        dispatch(saveToHistory());

        const outgoingEdges = edges.filter(
            (edge) => edge.source === connection.source
        );

        const usedLabels = outgoingEdges
            .map((edge) => edge.label)
            .filter((label) => label != null && label !== "");

        let nextNum = 1;
        while (usedLabels.includes(nextNum.toString())) {
            nextNum++;
        }

        const nextLabel = nextNum.toString();

        const styledEdge = {
            ...connection,
            type: 'default',
            animated: true,
            label: nextLabel,
            style: {
                strokeWidth: 1.4,
                stroke: '#444444'
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
                e.preventDefault();
                dispatch(undo());
            }

            if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                dispatch(redo());
            }

            if (e.key === "Delete" && hasSelection) {
                e.preventDefault();
                dispatch(deleteSelected({ isAdmin: user?.role === 'admin' }));
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [dispatch, hasSelection])

    useEffect(() => {
        if (nodes.length > 0) {
            const timer = setTimeout(() => {
                fitView({
                    padding: 0.2,
                    duration: 800,
                });
            }, 150);

            return () => clearTimeout(timer);
        }
    }, [fitView]);

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
                nodesDraggable={user?.role !== 'admin'}
                defaultViewport={{ x: 0, y: 0, zoom: 1.1 }}
                minZoom={0.3}
                maxZoom={1.5}
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    )
}

export default Canvas