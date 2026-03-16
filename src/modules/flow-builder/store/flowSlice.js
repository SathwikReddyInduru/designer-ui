import { createSlice } from '@reduxjs/toolkit'

const DEFAULT_API_URL = 'http://localhost:6215/api/billing/v1/available-plans'

const initialState = {
    nodes: [],
    edges: [],
    selectedNode: null,
    selectedEdge: null,
    history: [],
    future: []
}

const saveHistory = (state) => {
    state.history.push({
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)),
    })
    state.future = []

    if (state.history.length > 75) {
        state.history.shift()
    }
}

const flowSlice = createSlice({
    name: 'flow',
    initialState,
    reducers: {
        addNode: {
            reducer: (state, action) => {
                saveHistory(state)
                const { node } = action.payload
                state.nodes.push(node)
            },

            prepare: ({ type, position }) => {
                const id = `node_${Math.random().toString(36).substr(2, 5)}`

                const isAPI = type === 'api'
                const isShortCode = type === 'shortcode'

                const nodeTypes = {
                    shortcode: {
                        label: '*123#',
                        type: 'shortcode',
                        text: 'Welcome to USSD',
                        borderColor: '#3dd68c',
                        bgColor: '#f0fdf4'
                    },
                    api: {
                        label: 'API Node',
                        type: 'api',
                        text: 'Dynamic Plans:',
                        borderColor: '#a855f7',
                        bgColor: '#faf5ff'
                    },
                    submenu: {
                        label: 'Sub-Menu',
                        type: 'submenu',
                        text: 'New Menu Text...',
                        borderColor: '#3b82f6',
                        bgColor: '#fff'
                    }
                }

                const nodeData = nodeTypes[type] || nodeTypes.submenu

                return {
                    payload: {
                        node: {
                            id,
                            type: 'default',
                            position,
                            data: {
                                label: nodeData.label,
                                text: nodeData.text,
                                type: nodeData.type,
                                enabled: true,
                                isAPI,
                                isDynamicPlanNode: false,
                                isShortCode,
                                ...(isShortCode && { apiCalls: [] }),
                                ...(isAPI && { apiCalls: [DEFAULT_API_URL] }),
                                passOnValue: [],
                                splitBy: '',
                            },
                            style: {
                                background: nodeData.bgColor,
                                border: `2px solid ${nodeData.borderColor}`,
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '16px',
                                fontWeight: '500',
                                minWidth: '180px',
                                textAlign: 'center'
                            }
                        }
                    }
                }
            }
        },

        updateNodeData: (state, action) => {
            const { nodeId, updates } = action.payload
            const node = state.nodes.find(n => n.id === nodeId)
            if (node) {
                node.data = { ...node.data, ...updates }
            }
        },

        setNodes: (state, action) => {
            state.nodes = action.payload
        },

        setEdges: (state, action) => {
            state.edges = action.payload
        },

        setSelectedNode: (state, action) => {
            state.selectedNode = action.payload
        },

        setSelectedEdge: (state, action) => {
            state.selectedEdge = action.payload
        },

        saveToHistory: (state) => {
            saveHistory(state)
        },

        deleteSelected: (state, action) => {
            const isAdmin = action.payload?.isAdmin ?? false;

            if (isAdmin) {
                console.warn("[Admin] Delete action blocked");
                return;
            }

            if (!state.selectedNode && !state.selectedEdge) return;

            saveHistory(state);

            if (state.selectedNode) {
                state.nodes = state.nodes.filter(n => n.id !== state.selectedNode);
                state.edges = state.edges.filter(
                    e => e.source !== state.selectedNode && e.target !== state.selectedNode
                );
                state.selectedNode = null;
            }

            if (state.selectedEdge) {
                state.edges = state.edges.filter(e => e.id !== state.selectedEdge);
                state.selectedEdge = null;
            }
        },

        clearCanvas: (state) => {
            state.nodes = []
            state.edges = []
            state.selectedNode = null
            state.selectedEdge = null
            state.history = []
            state.future = []
        },

        undo: (state) => {
            if (state.history.length === 0) return

            state.future.push({
                nodes: JSON.parse(JSON.stringify(state.nodes)),
                edges: JSON.parse(JSON.stringify(state.edges)),
            })

            const previous = state.history.pop()

            state.nodes = previous.nodes.map((node) => ({
                ...node,
                position: { ...node.position },
                data: { ...node.data },
                selected: false,
                dragging: false,
            }))

            state.edges = previous.edges.map((edge) => ({ ...edge }))

            state.selectedNode = null
            state.selectedEdge = null
        },

        redo: (state) => {
            if (state.future.length === 0) return

            state.history.push({
                nodes: JSON.parse(JSON.stringify(state.nodes)),
                edges: JSON.parse(JSON.stringify(state.edges)),
            })

            const next = state.future.pop()

            state.nodes = next.nodes.map((node) => ({
                ...node,
                position: { ...node.position },
                data: { ...node.data },
                selected: false,
                dragging: false,
            }))

            state.edges = next.edges.map((edge) => ({ ...edge }))

            state.selectedNode = null
            state.selectedEdge = null
        },

        loadFlowState: (state, action) => {
            const { nodes, edges } = action.payload
            state.nodes = nodes || []
            state.edges = edges || []
            state.selectedNode = null
            state.selectedEdge = null
            state.history = []
            state.future = []
        },

        updateNodePosition: (state, action) => {
            const { nodeId, position } = action.payload
            const node = state.nodes.find(n => n.id === nodeId)
            if (node) {
                node.position = position
            }
        }
    }
})

export const {
    addNode,
    updateNodeData,
    setNodes,
    setEdges,
    setSelectedNode,
    setSelectedEdge,
    saveToHistory,
    deleteSelected,
    clearCanvas,
    undo,
    redo,
    loadFlowState,
    updateNodePosition
} = flowSlice.actions

export default flowSlice.reducer