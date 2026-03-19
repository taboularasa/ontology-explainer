export type Layer = 'sop' | 'software' | 'training'

export interface OntologyNode {
  id: string
  label: string
  layer: Layer
}

export interface Triple {
  id: string
  subjectId: string
  predicate: string
  objectId: string
  layer: Layer
}

export interface Step {
  tripleId: string
  title: string
  description: string
}

// All nodes in the ontology
export const nodes: OntologyNode[] = [
  // SOP Layer
  { id: 'weigh-bulk', label: 'SOP: WeighBulk', layer: 'sop' },
  { id: 'tare-step', label: 'Step: TareContainer', layer: 'sop' },
  { id: 'weigh-step', label: 'Step: WeighAndPrice', layer: 'sop' },
  { id: 'reusable-container', label: 'ReusableContainer', layer: 'sop' },
  { id: 'correct-price', label: 'CorrectPrice', layer: 'sop' },
  
  // Software Layer
  { id: 'pos-tare', label: 'POS Tare Function', layer: 'software' },
  { id: 'net-weight', label: 'NetWeight', layer: 'software' },
  { id: 'scale', label: 'Scale', layer: 'software' },
  { id: 'reading', label: 'Reading', layer: 'software' },
  
  // Training Layer
  { id: 'can-tare', label: 'CanTareScale', layer: 'training' },
  { id: 'training-module', label: 'Training Module', layer: 'training' },
  { id: 'can-identify', label: 'CanIdentifyContainer', layer: 'training' },
]

// All triples (edges) in the ontology
export const triples: Triple[] = [
  // Phase 1: SOP Foundation
  {
    id: 't1',
    subjectId: 'weigh-bulk',
    predicate: 'hasStep',
    objectId: 'tare-step',
    layer: 'sop',
  },
  {
    id: 't2',
    subjectId: 'tare-step',
    predicate: 'precedes',
    objectId: 'weigh-step',
    layer: 'sop',
  },
  {
    id: 't3',
    subjectId: 'tare-step',
    predicate: 'appliesTo',
    objectId: 'reusable-container',
    layer: 'sop',
  },
  {
    id: 't4',
    subjectId: 'weigh-step',
    predicate: 'ensures',
    objectId: 'correct-price',
    layer: 'sop',
  },
  {
    id: 't5',
    subjectId: 'reusable-container',
    predicate: 'requires',
    objectId: 'tare-step',
    layer: 'sop',
  },
  
  // Phase 2: Software Layer
  {
    id: 't6',
    subjectId: 'tare-step',
    predicate: 'implementedBy',
    objectId: 'pos-tare',
    layer: 'software',
  },
  {
    id: 't7',
    subjectId: 'pos-tare',
    predicate: 'produces',
    objectId: 'net-weight',
    layer: 'software',
  },
  {
    id: 't8',
    subjectId: 'scale',
    predicate: 'produces',
    objectId: 'reading',
    layer: 'software',
  },
  {
    id: 't9',
    subjectId: 'net-weight',
    predicate: 'feeds',
    objectId: 'correct-price',
    layer: 'software',
  },
  
  // Phase 3: Training Layer
  {
    id: 't10',
    subjectId: 'tare-step',
    predicate: 'requiresCapability',
    objectId: 'can-tare',
    layer: 'training',
  },
  {
    id: 't11',
    subjectId: 'training-module',
    predicate: 'teaches',
    objectId: 'can-tare',
    layer: 'training',
  },
  {
    id: 't12',
    subjectId: 'training-module',
    predicate: 'teaches',
    objectId: 'can-identify',
    layer: 'training',
  },
  {
    id: 't13',
    subjectId: 'can-identify',
    predicate: 'detects',
    objectId: 'reusable-container',
    layer: 'training',
  },
]

// Step sequence with explanations
export const steps: Step[] = [
  {
    tripleId: 't1',
    title: 'The Procedure Has Steps',
    description: 'Every bulk weighing procedure (SOP: WeighBulk) includes a tare step. This is the foundation of our process ontology.',
  },
  {
    tripleId: 't2',
    title: 'Order Matters',
    description: 'The tare step must happen before weighing and pricing. This temporal constraint ensures correct measurements.',
  },
  {
    tripleId: 't3',
    title: 'When to Tare',
    description: 'The tare step applies specifically when a reusable container is present. This is a conditional trigger.',
  },
  {
    tripleId: 't4',
    title: 'The Goal',
    description: 'Proper weighing ensures correct pricing. This is the outcome we\'re trying to guarantee.',
  },
  {
    tripleId: 't5',
    title: 'The Constraint',
    description: 'Reusable containers require taring. This bidirectional link creates a constraint: you can\'t skip taring with these containers.',
  },
  {
    tripleId: 't6',
    title: 'From Process to Software',
    description: 'Now we cross into the Software layer. The SOP tare step is implemented by a specific POS function.',
  },
  {
    tripleId: 't7',
    title: 'What Software Produces',
    description: 'The POS tare function calculates and produces a net weight value.',
  },
  {
    tripleId: 't8',
    title: 'Hardware Input',
    description: 'The physical scale produces a reading (gross weight). This is raw sensor data.',
  },
  {
    tripleId: 't9',
    title: 'Data Flow to Outcome',
    description: 'The calculated net weight feeds directly into correct pricing. Software connects measurement to business logic.',
  },
  {
    tripleId: 't10',
    title: 'Skills Required',
    description: 'Now the Training layer. Performing the tare step requires the capability to operate the scale\'s tare function.',
  },
  {
    tripleId: 't11',
    title: 'How Skills Are Acquired',
    description: 'A training module teaches the tare capability. This links formal training to required skills.',
  },
  {
    tripleId: 't12',
    title: 'Another Taught Skill',
    description: 'The same training module also teaches container identification. Multiple capabilities from one source.',
  },
  {
    tripleId: 't13',
    title: 'Capability Enables Detection',
    description: 'The ability to identify containers enables detecting reusable ones. This closes the loop back to the SOP layer.',
  },
]

// Layer colors for visualization
export const layerColors: Record<Layer, { fill: string; stroke: string; text: string }> = {
  sop: {
    fill: '#dcfce7',
    stroke: '#16a34a',
    text: '#15803d',
  },
  software: {
    fill: '#dbeafe',
    stroke: '#2563eb',
    text: '#1d4ed8',
  },
  training: {
    fill: '#f3e8ff',
    stroke: '#9333ea',
    text: '#7e22ce',
  },
}

export const layerLabels: Record<Layer, string> = {
  sop: 'SOP Layer',
  software: 'Software Layer',
  training: 'Training Layer',
}

// Helper to get visible nodes and edges at a given step
export function getVisibleData(stepIndex: number) {
  const visibleTripleIds = steps.slice(0, stepIndex + 1).map(s => s.tripleId)
  const visibleTriples = triples.filter(t => visibleTripleIds.includes(t.id))
  
  const visibleNodeIds = new Set<string>()
  visibleTriples.forEach(t => {
    visibleNodeIds.add(t.subjectId)
    visibleNodeIds.add(t.objectId)
  })
  
  const visibleNodes = nodes.filter(n => visibleNodeIds.has(n.id))
  const highlightTripleId = steps[stepIndex]?.tripleId
  
  return {
    nodes: visibleNodes,
    triples: visibleTriples,
    highlightTripleId,
  }
}
