'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, PanelRightOpen, PanelRightClose, Hammer, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ForceGraph } from './force-graph'
import { SourceDrawer } from './source-drawer'
import { OntologyApplication } from './ontology-application'
import {
  steps,
  triples,
  getVisibleData,
  layerColors,
  layerLabels,
  type Layer,
} from '@/lib/ontology-data'

type TabId = 'build' | 'apply'

export function OntologyExplainer() {
  const [activeTab, setActiveTab] = useState<TabId>('build')
  const [currentStep, setCurrentStep] = useState(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [drawerOpen, setDrawerOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalSteps = steps.length
  const { nodes, triples: visibleTriples, highlightTripleId } = getVisibleData(currentStep)
  const currentStepData = steps[currentStep]
  const highlightedTriple = triples.find((t) => t.id === highlightTripleId)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentStep((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrentStep(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrentStep(totalSteps - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [totalSteps])

  // Responsive dimensions - update when drawer state changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: rect.width,
          height: Math.max(rect.height, 300),
        })
      }
    }

    // Small delay to let CSS transitions complete
    const timer = setTimeout(updateDimensions, 50)
    window.addEventListener('resize', updateDimensions)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateDimensions)
    }
  }, [drawerOpen])

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(0)
  }, [])

  // Get visible layers for legend
  const visibleLayers = new Set(nodes.map((n) => n.layer))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Multi-Layer Ontology Explainer
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeTab === 'build' 
                ? 'Step through semantic triples to understand how SOPs, Software, and Training connect'
                : 'See how ontologies enable validation and documentation generation'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg border border-border bg-muted p-1">
            <button
              onClick={() => setActiveTab('build')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'build'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Hammer className="h-4 w-4" />
              Build Ontology
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === 'apply'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              Apply Ontology
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden px-4 py-4">
        {activeTab === 'apply' ? (
          <OntologyApplication />
        ) : (
        <div className="flex h-full gap-4">
          {/* Left: Graph and controls */}
          <div className={`flex flex-col transition-all duration-300 ${drawerOpen ? 'flex-1' : 'w-full'}`}>
            {/* Graph container */}
            <div
              ref={containerRef}
              className="relative flex-1 overflow-hidden rounded-lg border border-border bg-card"
            >
              {dimensions.width > 0 && (
                <ForceGraph
                  nodes={nodes}
                  triples={visibleTriples}
                  highlightTripleId={highlightTripleId}
                  width={dimensions.width}
                  height={dimensions.height}
                />
              )}

              {/* Layer legend */}
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {(['sop', 'software', 'training'] as Layer[]).map((layer) => (
                  <div
                    key={layer}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium transition-opacity ${
                      visibleLayers.has(layer) ? 'opacity-100' : 'opacity-30'
                    }`}
                    style={{
                      backgroundColor: layerColors[layer].fill,
                      color: layerColors[layer].text,
                      border: `1px solid ${layerColors[layer].stroke}`,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: layerColors[layer].stroke }}
                    />
                    {layerLabels[layer]}
                  </div>
                ))}
              </div>

              {/* Drawer toggle */}
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setDrawerOpen((prev) => !prev)}
                aria-label={drawerOpen ? 'Close source panel' : 'Open source panel'}
              >
                {drawerOpen ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Controls and explanation */}
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              {/* Progress bar */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {currentStep + 1} / {totalSteps}
                </span>
              </div>

              {/* Step info */}
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  {currentStepData.title}
                </h2>

                {highlightedTriple && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm">
                    <span
                      className="rounded px-2 py-1"
                      style={{
                        backgroundColor: layerColors[highlightedTriple.layer].fill,
                        color: layerColors[highlightedTriple.layer].text,
                        border: `1px solid ${layerColors[highlightedTriple.layer].stroke}`,
                      }}
                    >
                      {nodes.find((n) => n.id === highlightedTriple.subjectId)?.label}
                    </span>
                    <span className="text-muted-foreground">
                      {highlightedTriple.predicate}
                    </span>
                    <span
                      className="rounded px-2 py-1"
                      style={{
                        backgroundColor: layerColors[highlightedTriple.layer].fill,
                        color: layerColors[highlightedTriple.layer].text,
                        border: `1px solid ${layerColors[highlightedTriple.layer].stroke}`,
                      }}
                    >
                      {nodes.find((n) => n.id === highlightedTriple.objectId)?.label}
                    </span>
                  </div>
                )}

                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {currentStepData.description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  disabled={currentStep === 0}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goPrev}
                    disabled={currentStep === 0}
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Step dots */}
                  <div className="flex gap-1 px-2">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          index === currentStep
                            ? 'scale-125 bg-foreground'
                            : index < currentStep
                              ? 'bg-foreground/40'
                              : 'bg-muted-foreground/30'
                        }`}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goNext}
                    disabled={currentStep === totalSteps - 1}
                    aria-label="Next step"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Arrow keys to navigate
                </div>
              </div>
            </div>
          </div>

          {/* Right: Source drawer */}
          <div
            className={`shrink-0 transition-all duration-300 ${
              drawerOpen ? 'w-[28rem] opacity-100' : 'w-0 overflow-hidden opacity-0'
            }`}
          >
            {drawerOpen && currentStepData.source && (
              <SourceDrawer source={currentStepData.source} />
            )}
          </div>
        </div>
        )}
      </main>
    </div>
  )
}
