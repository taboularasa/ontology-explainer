'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  Position,
  type EdgeProps,
  type InternalNode,
  MarkerType,
} from '@xyflow/react'
import { layerColors, type Layer } from '@/lib/ontology-data'

export interface OntologyEdgeData {
  predicate: string
  layer: Layer
  highlighted: boolean
  edgeIndex: number
  totalParallelEdges: number
  [key: string]: unknown
}

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width ?? 0) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height ?? 0) / 2,
  }
}

function getNodeIntersection(node: InternalNode, targetPoint: { x: number; y: number }) {
  const w = (node.measured?.width ?? 0) / 2
  const h = (node.measured?.height ?? 0) / 2
  const cx = node.internals.positionAbsolute.x + w
  const cy = node.internals.positionAbsolute.y + h

  const dx = targetPoint.x - cx
  const dy = targetPoint.y - cy

  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  // https://math.stackexchange.com/questions/1724792
  const xx1 = dx / (2 * w) - dy / (2 * h)
  const yy1 = dx / (2 * w) + dy / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  return {
    x: w * (xx3 + yy3) + cx,
    y: h * (-xx3 + yy3) + cy,
  }
}

function getEdgePosition(node: InternalNode, intersectionPoint: { x: number; y: number }): Position {
  const nx = Math.round(node.internals.positionAbsolute.x)
  const ny = Math.round(node.internals.positionAbsolute.y)
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1) return Position.Left
  if (px >= nx + (node.measured?.width ?? 0) - 1) return Position.Right
  if (py <= ny + 1) return Position.Top
  if (py >= ny + (node.measured?.height ?? 0) - 1) return Position.Bottom

  return Position.Top
}

function OntologyEdgeComponent({
  id,
  source,
  target,
  data,
  markerEnd,
}: EdgeProps) {
  const {
    predicate,
    layer,
    highlighted,
    edgeIndex,
    totalParallelEdges,
  } = data as OntologyEdgeData

  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const colors = layerColors[layer]

  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)

  // For parallel edges, offset the "aim point" perpendicularly so each edge
  // connects at a different spot on the node boundary
  const spacing = 50
  let offset = 0
  if (totalParallelEdges > 1) {
    const center = (totalParallelEdges - 1) / 2
    offset = (edgeIndex - center) * spacing
  }

  let sourceAim = targetCenter
  let targetAim = sourceCenter

  if (offset !== 0) {
    const dx = targetCenter.x - sourceCenter.x
    const dy = targetCenter.y - sourceCenter.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const mx = (sourceCenter.x + targetCenter.x) / 2 + nx * offset
    const my = (sourceCenter.y + targetCenter.y) / 2 + ny * offset
    sourceAim = { x: mx, y: my }
    targetAim = { x: mx, y: my }
  }

  const sourceIntersection = getNodeIntersection(sourceNode, sourceAim)
  const targetIntersection = getNodeIntersection(targetNode, targetAim)
  const sourcePos = getEdgePosition(sourceNode, sourceIntersection)
  const targetPos = getEdgePosition(targetNode, targetIntersection)

  const sx = sourceIntersection.x
  const sy = sourceIntersection.y
  const tx = targetIntersection.x
  const ty = targetIntersection.y

  let edgePath: string
  let labelX: number
  let labelY: number

  if (offset === 0) {
    edgePath = `M ${sx} ${sy} L ${tx} ${ty}`
    labelX = (sx + tx) / 2
    labelY = (sy + ty) / 2
  } else {
    const dx = targetCenter.x - sourceCenter.x
    const dy = targetCenter.y - sourceCenter.y
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const mx = (sourceCenter.x + targetCenter.x) / 2
    const my = (sourceCenter.y + targetCenter.y) / 2
    const cx = mx + nx * offset
    const cy = my + ny * offset

    edgePath = `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`
    labelX = 0.25 * sx + 0.5 * cx + 0.25 * tx
    labelY = 0.25 * sy + 0.5 * cy + 0.25 * ty
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: colors.stroke,
          strokeWidth: highlighted ? 2.5 : 1.5,
          strokeOpacity: highlighted ? 1 : 0.5,
          ...(highlighted
            ? {
                strokeDasharray: '6 3',
                animation: 'edgeDashFlow 1s linear infinite',
              }
            : {}),
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: highlighted ? 12 : 10,
            fontFamily: 'var(--font-mono)',
            color: colors.text,
            fontWeight: highlighted ? 600 : 400,
            opacity: highlighted ? 1 : 0.7,
            backgroundColor: 'var(--background)',
            padding: '1px 4px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {predicate}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const OntologyEdge = memo(OntologyEdgeComponent)

export const ONTOLOGY_EDGE_MARKER = (layer: Layer) => ({
  type: MarkerType.ArrowClosed,
  width: 16,
  height: 16,
  color: layerColors[layer].stroke,
})
