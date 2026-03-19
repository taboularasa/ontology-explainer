'use client'

import '@xyflow/react/dist/style.css'

import { useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  ConnectionLineType,
} from '@xyflow/react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import type { OntologyNode as OntologyNodeType, Triple, Layer } from '@/lib/ontology-data'
import { OntologyNode, type OntologyNodeData } from './ontology-node'
import { OntologyEdge, ONTOLOGY_EDGE_MARKER, type OntologyEdgeData } from './ontology-edge'

interface ForceGraphProps {
  nodes: OntologyNodeType[]
  triples: Triple[]
  highlightTripleId: string | null
  width: number
  height: number
}

const nodeTypes: NodeTypes = {
  ontology: OntologyNode,
}

const edgeTypes: EdgeTypes = {
  ontology: OntologyEdge,
}

interface SimNode extends SimulationNodeDatum {
  id: string
  rfWidth: number
  rfHeight: number
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string
}

function computeParallelEdgeIndices(triples: Triple[]) {
  const pairCounts = new Map<string, number>()
  const pairIndices = new Map<string, number>()

  triples.forEach((t) => {
    const pairKey = [t.subjectId, t.objectId].sort().join('--')
    pairCounts.set(pairKey, (pairCounts.get(pairKey) || 0) + 1)
  })

  return triples.map((t) => {
    const pairKey = [t.subjectId, t.objectId].sort().join('--')
    const total = pairCounts.get(pairKey) || 1
    const idx = pairIndices.get(pairKey) || 0
    pairIndices.set(pairKey, idx + 1)
    return { edgeIndex: idx, totalParallelEdges: total }
  })
}

function toRFNodes(
  ontologyNodes: OntologyNodeType[],
  triples: Triple[],
  highlightTripleId: string | null,
  width: number,
  height: number
): Node[] {
  const highlightTriple = triples.find((t) => t.id === highlightTripleId)
  const highlightedNodeIds = highlightTriple
    ? new Set([highlightTriple.subjectId, highlightTriple.objectId])
    : new Set<string>()

  return ontologyNodes.map((n) => ({
    id: n.id,
    type: 'ontology',
    position: {
      x: Math.random() * width * 0.5 + width * 0.25,
      y: Math.random() * height * 0.5 + height * 0.25,
    },
    data: {
      label: n.label,
      layer: n.layer,
      highlighted: highlightedNodeIds.has(n.id),
    } satisfies OntologyNodeData,
  }))
}

function toRFEdges(
  triples: Triple[],
  highlightTripleId: string | null,
  parallelInfo: { edgeIndex: number; totalParallelEdges: number }[]
): Edge[] {
  return triples.map((t, i) => ({
    id: t.id,
    source: t.subjectId,
    target: t.objectId,
    type: 'ontology',
    markerEnd: ONTOLOGY_EDGE_MARKER(t.layer),
    data: {
      predicate: t.predicate,
      layer: t.layer,
      highlighted: t.id === highlightTripleId,
      edgeIndex: parallelInfo[i].edgeIndex,
      totalParallelEdges: parallelInfo[i].totalParallelEdges,
    } satisfies OntologyEdgeData,
  }))
}

function FlowInner({
  nodes: ontologyNodes,
  triples,
  highlightTripleId,
  width,
  height,
}: ForceGraphProps) {
  const { fitView, getNodes: getRFNodes } = useReactFlow()
  const initialized = useNodesInitialized()
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const animRef = useRef<number | null>(null)
  const prevNodeKeyRef = useRef<string>('')

  const parallelInfo = useMemo(
    () => computeParallelEdgeIndices(triples),
    [triples]
  )

  const initialNodes = useMemo(
    () => toRFNodes(ontologyNodes, triples, highlightTripleId, width, height),
    [ontologyNodes, triples, highlightTripleId, width, height]
  )

  const initialEdges = useMemo(
    () => toRFEdges(triples, highlightTripleId, parallelInfo),
    [triples, highlightTripleId, parallelInfo]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync external data -> internal RF state when ontology data changes
  const nodeKey = ontologyNodes.map((n) => n.id).sort().join(',')
  const tripleKey = triples.map((t) => t.id).join(',')
  const dataKey = `${nodeKey}|${tripleKey}|${highlightTripleId}`
  const prevDataKeyRef = useRef(dataKey)

  useEffect(() => {
    if (dataKey === prevDataKeyRef.current) return
    prevDataKeyRef.current = dataKey

    setEdges(toRFEdges(triples, highlightTripleId, parallelInfo))

    // For nodes: preserve positions of existing nodes, add new ones
    const currentNodes = getRFNodes()
    const positionMap = new Map<string, { x: number; y: number }>()
    currentNodes.forEach((n) => positionMap.set(n.id, n.position))

    const highlightTriple = triples.find((t) => t.id === highlightTripleId)
    const highlightedNodeIds = highlightTriple
      ? new Set([highlightTriple.subjectId, highlightTriple.objectId])
      : new Set<string>()

    const updatedNodes = ontologyNodes.map((n) => ({
      id: n.id,
      type: 'ontology' as const,
      position: positionMap.get(n.id) ?? {
        x: Math.random() * width * 0.5 + width * 0.25,
        y: Math.random() * height * 0.5 + height * 0.25,
      },
      data: {
        label: n.label,
        layer: n.layer,
        highlighted: highlightedNodeIds.has(n.id),
      } satisfies OntologyNodeData,
    }))

    setNodes(updatedNodes)
  }, [
    dataKey,
    ontologyNodes,
    triples,
    highlightTripleId,
    parallelInfo,
    width,
    height,
    setNodes,
    setEdges,
    getRFNodes,
  ])

  // Run force simulation when nodes are initialized or change
  const getLayerTargetX = useCallback(
    (layer: Layer) => {
      switch (layer) {
        case 'software':
          return width * 0.2
        case 'sop':
          return width * 0.5
        case 'training':
          return width * 0.8
        default:
          return width * 0.5
      }
    },
    [width]
  )

  useEffect(() => {
    if (!initialized) return

    const rfNodes = getRFNodes()
    if (rfNodes.length === 0) return

    // Stop any existing simulation
    if (simRef.current) simRef.current.stop()
    if (animRef.current) cancelAnimationFrame(animRef.current)

    const layerMap = new Map<string, Layer>()
    ontologyNodes.forEach((n) => layerMap.set(n.id, n.layer))

    const simNodes: SimNode[] = rfNodes.map((node) => ({
      id: node.id,
      x: node.position.x + (node.measured?.width ?? 120) / 2,
      y: node.position.y + (node.measured?.height ?? 40) / 2,
      rfWidth: node.measured?.width ?? 120,
      rfHeight: node.measured?.height ?? 40,
    }))

    const nodeIdSet = new Set(rfNodes.map((n) => n.id))
    const simLinks: SimLink[] = triples
      .filter((t) => nodeIdSet.has(t.subjectId) && nodeIdSet.has(t.objectId))
      .map((t) => ({
        id: t.id,
        source: t.subjectId,
        target: t.objectId,
      }))

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(140)
          .strength(0.5)
      )
      .force('charge', forceManyBody().strength(-500))
      .force(
        'collide',
        forceCollide<SimNode>().radius(
          (d) => Math.max(d.rfWidth, d.rfHeight) / 2 + 20
        )
      )
      .force(
        'x',
        forceX<SimNode>()
          .x((d) => getLayerTargetX(layerMap.get(d.id) ?? 'sop'))
          .strength(0.15)
      )
      .force(
        'y',
        forceY<SimNode>().y(height / 2).strength(0.05)
      )
      .stop()

    simRef.current = sim

    const isNewGraph = nodeKey !== prevNodeKeyRef.current
    prevNodeKeyRef.current = nodeKey

    sim.alpha(isNewGraph ? 0.8 : 0.3)

    let running = true
    const tick = () => {
      if (!running) return
      sim.tick()

      const simNodesNow = sim.nodes()
      setNodes((prev) =>
        prev.map((node, i) => {
          const sn = simNodesNow[i]
          if (!sn) return node
          return {
            ...node,
            position: {
              x: (sn.x ?? 0) - (node.measured?.width ?? 120) / 2,
              y: (sn.y ?? 0) - (node.measured?.height ?? 40) / 2,
            },
          }
        })
      )

      if (sim.alpha() > sim.alphaMin()) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        running = false
        fitView({ duration: 300, padding: 0.2 })
      }
    }

    animRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
      sim.stop()
    }
  }, [
    initialized,
    nodeKey,
    tripleKey,
    ontologyNodes,
    triples,
    width,
    height,
    getLayerTargetX,
    getRFNodes,
    setNodes,
    fitView,
  ])

  // Center on highlighted edge
  useEffect(() => {
    if (!highlightTripleId) return
    const triple = triples.find((t) => t.id === highlightTripleId)
    if (!triple) return
    const timer = setTimeout(() => {
      const rfNodes = getRFNodes()
      const src = rfNodes.find((n) => n.id === triple.subjectId)
      const tgt = rfNodes.find((n) => n.id === triple.objectId)
      if (src && tgt) {
        fitView({ duration: 400, padding: 0.3, nodes: [src, tgt] })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [highlightTripleId, triples, getRFNodes, fitView])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      proOptions={{ hideAttribution: true }}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll={true}
      minZoom={0.3}
      maxZoom={3}
      className="bg-background"
    />
  )
}

export function ForceGraph(props: ForceGraphProps) {
  return (
    <div style={{ width: props.width, height: props.height }}>
      <ReactFlowProvider>
        <FlowInner {...props} />
      </ReactFlowProvider>
    </div>
  )
}
