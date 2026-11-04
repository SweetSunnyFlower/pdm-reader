import {useCallback, useEffect, useMemo, useRef} from 'react';
import {
    Background,
    Controls,
    // MiniMap,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from './TableNode';
import {buildGraph} from '../utils/pdmGraph';

const nodeTypes = {
    tableNode: TableNode,
};

function PDMCanvas({model, selectedTableId, nodePositions, onSelectTable, onSaveNodePositions}) {
    const flowRef = useRef(null);
    const previousSelectedIdRef = useRef('');
    const shouldCenterSelectedRef = useRef(true);
    const graph = useMemo(() => buildGraph(model, '', nodePositions), [model, nodePositions]);
    const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

    useEffect(() => {
        previousSelectedIdRef.current = '';
        setNodes(graph.nodes);
        setEdges(graph.edges);
    }, [graph.nodes, graph.edges, setNodes, setEdges]);

    useEffect(() => {
        const previousSelectedId = previousSelectedIdRef.current;
        if (previousSelectedId === selectedTableId) {
            return;
        }

        previousSelectedIdRef.current = selectedTableId;
        setNodes((currentNodes) => currentNodes.map((node) => {
            if (node.id !== previousSelectedId && node.id !== selectedTableId) {
                return node;
            }

            return {
                ...node,
                data: {
                    ...node.data,
                    selected: node.id === selectedTableId,
                },
            };
        }));
    }, [selectedTableId, setNodes]);

    useEffect(() => {
        const flow = flowRef.current;
        if (!flow || !selectedTableId) {
            return;
        }

        if (!shouldCenterSelectedRef.current) {
            shouldCenterSelectedRef.current = true;
            return;
        }

        const selectedNode = flow.getNode(selectedTableId);
        if (!selectedNode) {
            return;
        }

        const columnCount = selectedNode.data.table.columns?.length || 0;
        const width = selectedNode.measured?.width || selectedNode.width || 380;
        const height = selectedNode.measured?.height || selectedNode.height || 152 + columnCount * 50;

        requestAnimationFrame(() => {
            flow.setCenter(
                selectedNode.position.x + width / 2,
                selectedNode.position.y + height / 2,
                {zoom: Math.max(flow.getZoom(), 0.72), duration: 260}
            );
        });
    }, [selectedTableId]);

    const saveNodePositions = useCallback((nextNodes) => {
        onSaveNodePositions(Object.fromEntries(
            nextNodes.map((node) => [node.id, node.position])
        ));
    }, [onSaveNodePositions]);

    const handleNodeDragStop = useCallback((_, node) => {
        const nextNodes = nodes.map((currentNode) => (
            currentNode.id === node.id ? {...currentNode, position: node.position} : currentNode
        ));
        saveNodePositions(nextNodes);
    }, [nodes, saveNodePositions]);

    return (
        <div className="canvas-panel">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onInit={(flow) => { flowRef.current = flow; }}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={handleNodeDragStop}
                onNodeClick={(_, node) => {
                    shouldCenterSelectedRef.current = false;
                    onSelectTable(node.id);
                }}
                fitView
                fitViewOptions={{padding: 0.2}}
                minZoom={0.2}
                maxZoom={1.5}
            >
                <Background color="#c8d1df" gap={22}/>
                {/* <MiniMap pannable zoomable nodeStrokeWidth={3} maskColor="rgba(224, 229, 236, 0.72)"/> */}
                <Controls/>
            </ReactFlow>
        </div>
    );
}

export default PDMCanvas;
