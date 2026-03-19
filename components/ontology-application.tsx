'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourceDrawer } from './source-drawer'
import { applicationSteps, type ValidationResult } from '@/lib/application-data'

function ValidationBadge({ result }: { result: ValidationResult }) {
  const icons = {
    error: XCircle,
    warning: AlertTriangle,
    success: CheckCircle,
  }
  const colors = {
    error: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    warning: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    success: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  }
  const Icon = icons[result.status]

  return (
    <div className={`rounded-lg border p-3 ${colors[result.status]}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-xs font-medium">{result.axiom}</div>
          <div className="mt-1 text-sm opacity-80">{result.message}</div>
        </div>
      </div>
    </div>
  )
}

export function OntologyApplication() {
  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = applicationSteps.length
  const currentStepData = applicationSteps[currentStep]

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

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1))
  }, [totalSteps])

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(0)
  }, [])

  // Get step type label and color
  const stepTypeConfig = {
    'validation-sop': { label: 'SOP Validation', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    'validation-software': { label: 'Software Validation', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    'documentation': { label: 'Documentation', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  }

  const typeConfig = stepTypeConfig[currentStepData.type]

  return (
    <div className="flex h-full flex-col">
      {/* Main content area - flex to fill available space */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel: Source / Before */}
        <div className="flex w-1/2 flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {currentStepData.type === 'documentation' ? 'Source Code' : 'Before / Source'}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <SourceDrawer source={currentStepData.source} />
          </div>
        </div>

        {/* Right panel: Output / After */}
        <div className="flex w-1/2 flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {currentStepData.type === 'documentation' ? 'Generated Documentation' : 'After / Output'}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <SourceDrawer source={currentStepData.output} />
          </div>
        </div>
      </div>

      {/* Controls and explanation - sticky to bottom */}
      <div className="shrink-0 rounded-lg border border-border bg-card p-4 mt-4">
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
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.color}`}>
              {typeConfig.label}
            </span>
            <h2 className="text-base font-semibold text-foreground">
              {currentStepData.title}
            </h2>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {currentStepData.description}
          </p>

          {/* Validation results */}
          {currentStepData.validationResults && currentStepData.validationResults.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {currentStepData.validationResults.map((result, index) => (
                <ValidationBadge key={index} result={result} />
              ))}
            </div>
          )}
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
              {applicationSteps.map((_, index) => (
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
  )
}
