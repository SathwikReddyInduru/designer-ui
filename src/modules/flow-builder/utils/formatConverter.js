export const nodesToObject = (nodesArray) => {
    const nodesObj = {}

    nodesArray.forEach(node => {
        const { id, ...nodeData } = node
        nodesObj[id] = {
            id: node.id,
            ...nodeData
        }
    })

    return nodesObj
}

export const edgesToObject = (edgesArray) => {
    const edgesObj = {}

    edgesArray.forEach((edge, index) => {
        const edgeId = edge.id || `edge_${index + 1}`
        const { id, ...edgeData } = edge
        edgesObj[edgeId] = {
            id: edgeId,
            ...edgeData
        }
    })

    return edgesObj
}

export const objectToNodes = (nodesObj) => {
    return Object.entries(nodesObj).map(([id, nodeData]) => ({
        id,
        ...nodeData
    }))
}

export const objectToEdges = (edgesObj) => {
    return Object.entries(edgesObj).map(([id, edgeData]) => ({
        id,
        ...edgeData
    }))
}

export const formatForBackend = (nodes, edges) => {
    return {
        nodes: nodesToObject(nodes),
        edges: edgesToObject(edges),
    }
}

export const formatForFrontend = (backendData) => {
    return {
        nodes: objectToNodes(backendData.nodes),
        edges: objectToEdges(backendData.edges)
    }
}