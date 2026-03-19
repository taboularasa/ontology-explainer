"use client"

import { Scale, ClipboardList, User, ArrowRight } from "lucide-react"

interface Node {
  id: string
  label: string
  x: number
  y: number
}

interface Edge {
  from: string
  to: string
  label: string
  dashed?: boolean
}

interface DiagramFrameProps {
  title: string
  subtitle: string
  nodes: Node[]
  edges: Edge[]
  annotation: string
  colorScheme: "blue" | "green" | "violet" | "composite"
  icon?: React.ReactNode
}

const getNodeColors = (scheme: DiagramFrameProps["colorScheme"]) => {
  switch (scheme) {
    case "blue":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-900",
        edgeColor: "#3b82f6",
      }
    case "green":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-900",
        edgeColor: "#10b981",
      }
    case "violet":
      return {
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-900",
        edgeColor: "#8b5cf6",
      }
    case "composite":
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-900",
        edgeColor: "#475569",
      }
  }
}

function DiagramNode({
  node,
  colorScheme,
}: {
  node: Node
  colorScheme: DiagramFrameProps["colorScheme"]
}) {
  const colors = getNodeColors(colorScheme)
  return (
    <div
      className={`absolute ${colors.bg} ${colors.border} ${colors.text} border-2 px-3 py-2 rounded-2xl text-sm font-medium shadow-sm whitespace-nowrap`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {node.label}
    </div>
  )
}

function DiagramFrame({
  title,
  subtitle,
  nodes,
  edges,
  annotation,
  colorScheme,
  icon,
}: DiagramFrameProps) {
  const colors = getNodeColors(colorScheme)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="relative h-72 p-4">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id={`arrowhead-${colorScheme}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={colors.edgeColor} />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const fromNode = nodes.find((n) => n.id === edge.from)
            const toNode = nodes.find((n) => n.id === edge.to)
            if (!fromNode || !toNode) return null

            const midX = (fromNode.x + toNode.x) / 2
            const midY = (fromNode.y + toNode.y) / 2

            return (
              <g key={i}>
                <line
                  x1={`${fromNode.x}%`}
                  y1={`${fromNode.y}%`}
                  x2={`${toNode.x}%`}
                  y2={`${toNode.y}%`}
                  stroke={colors.edgeColor}
                  strokeWidth="1.5"
                  strokeDasharray={edge.dashed ? "4 4" : undefined}
                  markerEnd={`url(#arrowhead-${colorScheme})`}
                />
                <text
                  x={`${midX}%`}
                  y={`${midY}%`}
                  textAnchor="middle"
                  className="text-xs fill-slate-500"
                  dy="-6"
                >
                  {edge.label}
                </text>
              </g>
            )
          })}
        </svg>

        {nodes.map((node) => (
          <DiagramNode key={node.id} node={node} colorScheme={colorScheme} />
        ))}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <p className="text-sm text-slate-600 italic">{annotation}</p>
      </div>
    </div>
  )
}

function CompositeRegion({
  title,
  children,
  colorScheme,
}: {
  title: string
  children: React.ReactNode
  colorScheme: "blue" | "green" | "violet"
}) {
  const bgColors = {
    blue: "bg-blue-50/50 border-blue-200",
    green: "bg-emerald-50/50 border-emerald-200",
    violet: "bg-violet-50/50 border-violet-200",
  }

  return (
    <div className={`${bgColors[colorScheme]} border rounded-lg p-3`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CompositeNode({
  label,
  colorScheme,
}: {
  label: string
  colorScheme: "blue" | "green" | "violet" | "shared"
}) {
  const colors = {
    blue: "bg-blue-100 border-blue-300 text-blue-900",
    green: "bg-emerald-100 border-emerald-300 text-emerald-900",
    violet: "bg-violet-100 border-violet-300 text-violet-900",
    shared: "bg-amber-100 border-amber-300 text-amber-900",
  }

  return (
    <div
      className={`${colors[colorScheme]} border px-2 py-1 rounded-xl text-xs font-medium text-center`}
    >
      {label}
    </div>
  )
}

export function OntologyDiagram() {
  // Software Ontology data
  const softwareNodes: Node[] = [
    { id: "weighEvent", label: "WeighEvent", x: 20, y: 20 },
    { id: "scale", label: "Scale", x: 50, y: 20 },
    { id: "reading", label: "Reading", x: 80, y: 20 },
    { id: "posTare", label: "POS Tare Function", x: 35, y: 60 },
    { id: "netWeight", label: "NetWeight", x: 65, y: 80 },
  ]

  const softwareEdges: Edge[] = [
    { from: "weighEvent", to: "scale", label: "usesScale" },
    { from: "scale", to: "reading", label: "produces" },
    { from: "posTare", to: "netWeight", label: "subtracts container" },
    { from: "reading", to: "netWeight", label: "derived into" },
  ]

  // SOP Ontology data
  const sopNodes: Node[] = [
    { id: "sopWeigh", label: "SOP WeighBulk", x: 50, y: 15 },
    { id: "stepTare", label: "Step: TareContainer", x: 25, y: 45 },
    { id: "stepWeigh", label: "Step: WeighAndPrice", x: 75, y: 45 },
    { id: "reusable", label: "ReusableContainer", x: 25, y: 80 },
    { id: "correctPrice", label: "CorrectPrice", x: 75, y: 80 },
  ]

  const sopEdges: Edge[] = [
    { from: "sopWeigh", to: "stepTare", label: "hasStep" },
    { from: "stepTare", to: "stepWeigh", label: "precedes" },
    { from: "stepTare", to: "reusable", label: "appliesTo" },
    { from: "stepWeigh", to: "correctPrice", label: "ensures" },
    { from: "reusable", to: "stepTare", label: "requires tare" },
  ]

  // Training Ontology data
  const trainingNodes: Node[] = [
    { id: "training", label: "Training Module", x: 50, y: 15 },
    { id: "canTare", label: "CanTareScale", x: 25, y: 45 },
    { id: "canIdentify", label: "CanIdentifyContainer", x: 75, y: 45 },
    { id: "clerk", label: "Clerk", x: 25, y: 80 },
    { id: "correctNet", label: "CorrectNetWeight", x: 75, y: 80 },
  ]

  const trainingEdges: Edge[] = [
    { from: "training", to: "canTare", label: "teaches" },
    { from: "training", to: "canIdentify", label: "teaches" },
    { from: "clerk", to: "canTare", label: "has capability" },
    { from: "canTare", to: "correctNet", label: "enables" },
    { from: "canIdentify", to: "correctNet", label: "distinguishes" },
  ]

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Multi-Layer Ontology Diagram
          </h1>
          <p className="text-slate-600">
            Checkout Weighing Example — Cross-Layer Constraint Visualization
          </p>
        </div>

        {/* Grid of 3 ontology frames */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <DiagramFrame
            title="Software Ontology"
            subtitle="System Behavior"
            nodes={softwareNodes}
            edges={softwareEdges}
            annotation="Tare function must exist; net weight is derived from gross reading minus container weight."
            colorScheme="blue"
            icon={<Scale className="w-5 h-5" />}
          />

          <DiagramFrame
            title="SOP Ontology"
            subtitle="Prescribed Process"
            nodes={sopNodes}
            edges={sopEdges}
            annotation="If reusable container is used, tare must occur before weighing."
            colorScheme="green"
            icon={<ClipboardList className="w-5 h-5" />}
          />

          <DiagramFrame
            title="Training Ontology"
            subtitle="Capability Model"
            nodes={trainingNodes}
            edges={trainingEdges}
            annotation="Clerk must possess capability to perform required actions."
            colorScheme="violet"
            icon={<User className="w-5 h-5" />}
          />
        </div>

        {/* Composite Ontology */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-emerald-50 to-violet-50">
            <h3 className="font-semibold text-slate-900 text-lg">
              Composite Ontology
            </h3>
            <p className="text-sm text-slate-500">
              Cross-Layer Constraint Chain
            </p>
          </div>

          <div className="p-6">
            {/* Three regions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <CompositeRegion title="Software" colorScheme="blue">
                <CompositeNode label="POS Tare Function" colorScheme="blue" />
                <CompositeNode label="NetWeight" colorScheme="blue" />
              </CompositeRegion>

              <CompositeRegion title="SOP" colorScheme="green">
                <CompositeNode label="Step: TareContainer" colorScheme="green" />
                <CompositeNode label="Step: WeighAndPrice" colorScheme="green" />
              </CompositeRegion>

              <CompositeRegion title="Training" colorScheme="violet">
                <CompositeNode label="CanTareScale" colorScheme="violet" />
                <CompositeNode
                  label="CanIdentifyContainer"
                  colorScheme="violet"
                />
              </CompositeRegion>
            </div>

            {/* Cross-layer flow */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Cross-Layer Edges
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                    TareContainer
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    POS Tare Function
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    (implementedBy)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                    TareContainer
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="bg-violet-100 text-violet-800 px-2 py-0.5 rounded text-xs">
                    CanTareScale
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    (requiresCapability)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-violet-100 text-violet-800 px-2 py-0.5 rounded text-xs">
                    CanIdentifyContainer
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">
                    ReusableContainer
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    (detects type)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    NetWeight
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs">
                    CorrectPrice
                  </span>
                  <span className="text-slate-400 text-xs ml-2">(feeds)</span>
                </div>
              </div>
            </div>

            {/* Shared nodes */}
            <div className="flex justify-center gap-4 mb-6">
              <CompositeNode label="ReusableContainer" colorScheme="shared" />
              <CompositeNode label="CorrectPrice" colorScheme="shared" />
            </div>

            {/* Central highlight */}
            <div className="bg-slate-900 text-white rounded-lg p-4 text-center">
              <p className="text-sm font-medium leading-relaxed">
                If <span className="text-amber-300">ReusableContainer</span> is
                used,{" "}
                <span className="text-emerald-300">Step: TareContainer</span>{" "}
                must occur, implemented by{" "}
                <span className="text-blue-300">POS Tare Function</span>,
                performed by a clerk with{" "}
                <span className="text-violet-300">CanTareScale</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Legend
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
              <span className="text-slate-600">Software Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-slate-600">SOP Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-violet-100 border border-violet-300" />
              <span className="text-slate-600">Training Layer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
              <span className="text-slate-600">Shared Nodes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
