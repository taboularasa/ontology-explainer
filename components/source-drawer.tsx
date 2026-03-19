'use client'

import { FileCode2, FileText } from 'lucide-react'
import type { SourceContent } from '@/lib/ontology-data'

interface SourceDrawerProps {
  source: SourceContent
}

export function SourceDrawer({ source }: SourceDrawerProps) {
  const lines = source.content.split('\n')
  const [highlightStart, highlightEnd] = source.highlightLines

  const Icon = source.type === 'python' ? FileCode2 : FileText
  const langLabel = source.type === 'python' ? 'Python' : 'Markdown'

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-medium text-foreground">
          {source.filename}
        </span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {langLabel}
        </span>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <pre className="p-0 text-sm">
          <code>
            {lines.map((line, index) => {
              const lineNumber = index + 1
              const isHighlighted =
                lineNumber >= highlightStart && lineNumber <= highlightEnd

              return (
                <div
                  key={index}
                  className={`flex transition-colors duration-300 ${
                    isHighlighted
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <span
                    className={`w-10 shrink-0 select-none px-2 py-0.5 text-right font-mono text-xs ${
                      isHighlighted
                        ? 'bg-amber-200/50 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {lineNumber}
                  </span>
                  <span
                    className={`flex-1 whitespace-pre px-3 py-0.5 font-mono ${
                      isHighlighted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {line || ' '}
                  </span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>

      {/* Footer hint */}
      <div className="border-t border-border bg-muted/30 px-4 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-300 dark:bg-amber-600" />
          <span className="ml-2">
            Highlighted lines show the source being modeled in this step
          </span>
        </p>
      </div>
    </div>
  )
}
