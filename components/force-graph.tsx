'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import type { OntologyNode, Triple, Layer } from '@/lib/ontology-data'
import { layerColors } from '@/lib/ontology-data'

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  layer: Layer
  isNew?: boolean
  width?: number
  height?: number
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string
  predicate: string
  layer: Layer
  isNew?: boolean
}

interface ForceGraphProps {
  nodes: OntologyNode[]
  triples: Triple[]
  highlightTripleId: string | null
  width: number
  height: number
  onCenterRequest?: (centerFn: () => void) => void
}

export function ForceGraph({
  nodes,
  triples,
  highlightTripleId,
  width,
  height,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement | null>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const prevNodesRef = useRef<Set<string>>(new Set())
  const prevLinksRef = useRef<Set<string>>(new Set())
  const simNodesRef = useRef<SimNode[]>([])

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
    if (!svgRef.current || width === 0 || height === 0) return

    const svg = d3.select(svgRef.current)

    // Prepare simulation data
    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      isNew: !prevNodesRef.current.has(n.id),
    }))

    const simLinks: SimLink[] = triples.map((t) => ({
      id: t.id,
      source: t.subjectId,
      target: t.objectId,
      predicate: t.predicate,
      layer: t.layer,
      isNew: !prevLinksRef.current.has(t.id),
    }))

    // Update previous sets
    prevNodesRef.current = new Set(nodes.map((n) => n.id))
    prevLinksRef.current = new Set(triples.map((t) => t.id))

    // Create or update simulation
    if (!simulationRef.current) {
      simulationRef.current = d3
        .forceSimulation<SimNode>()
        .force(
          'link',
          d3
            .forceLink<SimNode, SimLink>()
            .id((d) => d.id)
            .distance(140)
            .strength(0.5)
        )
        .force('charge', d3.forceManyBody().strength(-500))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(60))
        .force(
          'x',
          d3
            .forceX<SimNode>()
            .x((d) => getLayerTargetX(d.layer))
            .strength(0.15)
        )
        .force(
          'y',
          d3
            .forceY<SimNode>()
            .y(height / 2)
            .strength(0.05)
        )
    }

    const simulation = simulationRef.current
    simulation.nodes(simNodes)
    ;(simulation.force('link') as d3.ForceLink<SimNode, SimLink>).links(simLinks)

    // Reheat simulation
    simulation.alpha(0.5).restart()

    // Store nodes ref for centering
    simNodesRef.current = simNodes

    // Clear existing elements except defs
    svg.selectAll('g').remove()

    // Add defs for arrow markers and filters (only once, outside zoomable group)
    let defs = svg.select<SVGDefsElement>('defs')
    if (defs.empty()) {
      defs = svg.append('defs')
      
      // Arrow markers for each layer
      const layers: Layer[] = ['sop', 'software', 'training']
      layers.forEach((layer) => {
        defs
          .append('marker')
          .attr('id', `arrow-${layer}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 10)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', layerColors[layer].stroke)

        // Highlighted version
        defs
          .append('marker')
          .attr('id', `arrow-${layer}-highlight`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 10)
          .attr('refY', 0)
          .attr('markerWidth', 8)
          .attr('markerHeight', 8)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', layerColors[layer].stroke)
      })

      // Glow filter for highlights - use filterUnits="userSpaceOnUse" to avoid clipping
      const filter = defs
        .append('filter')
        .attr('id', 'glow')
        .attr('filterUnits', 'userSpaceOnUse')
        .attr('x', '-100%')
        .attr('y', '-100%')
        .attr('width', '300%')
        .attr('height', '300%')

      filter
        .append('feGaussianBlur')
        .attr('stdDeviation', '4')
        .attr('result', 'coloredBlur')

      const feMerge = filter.append('feMerge')
      feMerge.append('feMergeNode').attr('in', 'coloredBlur')
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic')
    }

    // Create main group for zoom/pan
    const g = svg.append('g')
    gRef.current = g.node()

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)
    zoomRef.current = zoom

    // Create container groups inside the zoomable group
    const linkGroup = g.append('g').attr('class', 'links')
    const labelGroup = g.append('g').attr('class', 'labels')
    const nodeGroup = g.append('g').attr('class', 'nodes')

    // Draw links
    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => layerColors[d.layer].stroke)
      .attr('stroke-width', (d) => (d.id === highlightTripleId ? 3 : 1.5))
      .attr('stroke-opacity', (d) => (d.id === highlightTripleId ? 1 : 0.6))
      .attr('marker-end', (d) =>
        d.id === highlightTripleId
          ? `url(#arrow-${d.layer}-highlight)`
          : `url(#arrow-${d.layer})`
      )
      .attr('filter', (d) => (d.id === highlightTripleId ? 'url(#glow)' : null))

    // Draw edge labels
    const edgeLabel = labelGroup
      .selectAll('text')
      .data(simLinks)
      .join('text')
      .attr('font-size', (d) => (d.id === highlightTripleId ? 12 : 10))
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', (d) => layerColors[d.layer].text)
      .attr('text-anchor', 'middle')
      .attr('dy', -8)
      .attr('opacity', (d) => (d.id === highlightTripleId ? 1 : 0.7))
      .attr('font-weight', (d) => (d.id === highlightTripleId ? 600 : 400))
      .text((d) => d.predicate)

    // Draw nodes
    const node = nodeGroup
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'grab')
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Node rectangles
    node
      .append('rect')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => layerColors[d.layer].fill)
      .attr('stroke', (d) => layerColors[d.layer].stroke)
      .attr('stroke-width', (d) => {
        const triple = triples.find((t) => t.id === highlightTripleId)
        if (triple && (triple.subjectId === d.id || triple.objectId === d.id)) {
          return 3
        }
        return 1.5
      })
      .attr('filter', (d) => {
        const triple = triples.find((t) => t.id === highlightTripleId)
        if (triple && (triple.subjectId === d.id || triple.objectId === d.id)) {
          return 'url(#glow)'
        }
        return null
      })

    // Node labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', 11)
      .attr('font-family', 'var(--font-sans)')
      .attr('fill', (d) => layerColors[d.layer].text)
      .attr('font-weight', 500)
      .text((d) => d.label)

    // Size rectangles based on text and store dimensions on node data
    node.each(function (d) {
      const g = d3.select(this)
      const text = g.select('text')
      const bbox = (text.node() as SVGTextElement).getBBox()
      const nodeWidth = bbox.width + 24
      const nodeHeight = bbox.height + 16
      d.width = nodeWidth
      d.height = nodeHeight
      g.select('rect')
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
    })

    // Helper to find intersection of line with rectangle boundary
    const getNodeBoundaryPoint = (
      node: SimNode,
      otherX: number,
      otherY: number
    ): [number, number] => {
      const cx = node.x!
      const cy = node.y!
      const w = (node.width || 80) / 2 + 4 // half width + padding
      const h = (node.height || 32) / 2 + 4 // half height + padding

      const dx = otherX - cx
      const dy = otherY - cy

      if (dx === 0 && dy === 0) return [cx, cy]

      // Find intersection with rectangle
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      let scale: number
      if (absDx * h > absDy * w) {
        // Intersects left or right edge
        scale = w / absDx
      } else {
        // Intersects top or bottom edge
        scale = h / absDy
      }

      return [cx + dx * scale, cy + dy * scale]
    }

    // Animation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => {
          const source = d.source as SimNode
          const target = d.target as SimNode
          const [x] = getNodeBoundaryPoint(source, target.x!, target.y!)
          return x
        })
        .attr('y1', (d) => {
          const source = d.source as SimNode
          const target = d.target as SimNode
          const [, y] = getNodeBoundaryPoint(source, target.x!, target.y!)
          return y
        })
        .attr('x2', (d) => {
          const source = d.source as SimNode
          const target = d.target as SimNode
          const [x] = getNodeBoundaryPoint(target, source.x!, source.y!)
          return x
        })
        .attr('y2', (d) => {
          const source = d.source as SimNode
          const target = d.target as SimNode
          const [, y] = getNodeBoundaryPoint(target, source.x!, source.y!)
          return y
        })

      edgeLabel
        .attr('x', (d) => ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2)
        .attr('y', (d) => ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, triples, highlightTripleId, width, height, getLayerTargetX])

  // Center on highlighted edge when it changes
  useEffect(() => {
    if (!highlightTripleId || !svgRef.current || !zoomRef.current) return

    const triple = triples.find((t) => t.id === highlightTripleId)
    if (!triple) return

    // Wait for simulation to settle a bit
    const timer = setTimeout(() => {
      const sourceNode = simNodesRef.current.find((n) => n.id === triple.subjectId)
      const targetNode = simNodesRef.current.find((n) => n.id === triple.objectId)

      if (!sourceNode?.x || !targetNode?.x || !sourceNode?.y || !targetNode?.y) return

      // Calculate center of the edge
      const centerX = (sourceNode.x + targetNode.x) / 2
      const centerY = (sourceNode.y + targetNode.y) / 2

      // Calculate transform to center on this point
      const svg = d3.select(svgRef.current!)
      const zoom = zoomRef.current!
      
      const scale = 1.2 // Zoom in slightly when centering
      const transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(scale)
        .translate(-centerX, -centerY)

      svg.transition()
        .duration(500)
        .ease(d3.easeCubicOut)
        .call(zoom.transform, transform)
    }, 300)

    return () => clearTimeout(timer)
  }, [highlightTripleId, triples, width, height])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="cursor-grab bg-background active:cursor-grabbing"
    />
  )
}
