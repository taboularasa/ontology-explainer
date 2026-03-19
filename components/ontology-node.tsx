'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { layerColors, type Layer } from '@/lib/ontology-data'

export interface OntologyNodeData {
  label: string
  layer: Layer
  highlighted: boolean
  [key: string]: unknown
}

function OntologyNodeComponent({ data }: NodeProps) {
  const { label, layer, highlighted } = data as OntologyNodeData
  const colors = layerColors[layer]

  return (
    <div
      className="px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200"
      style={{
        backgroundColor: colors.fill,
        color: colors.text,
        border: `${highlighted ? 2.5 : 1.5}px solid ${colors.stroke}`,
        boxShadow: highlighted ? `0 0 0 3px ${colors.stroke}20` : 'none',
      }}
    >
      {label}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0! w-1! h-1! min-w-0! min-h-0! border-0!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0! w-1! h-1! min-w-0! min-h-0! border-0!"
      />
    </div>
  )
}

export const OntologyNode = memo(OntologyNodeComponent)
