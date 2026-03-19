import type { SourceContent } from './ontology-data'

export type ApplicationStepType = 'validation-sop' | 'validation-software' | 'documentation'

export interface ValidationResult {
  status: 'error' | 'warning' | 'success'
  axiom: string
  message: string
  affectedNodes: string[]
}

export interface ApplicationStep {
  id: string
  type: ApplicationStepType
  title: string
  description: string
  source: SourceContent
  output: SourceContent
  validationResults?: ValidationResult[]
}

// Scenario 1: SOP change that breaks constraints
const sopChangeBefore = `# SOP-101: Weighing Bulk Items

## Purpose
Ensure accurate pricing for bulk goods.

## Steps

### 1. Tare the Container
If customer uses a reusable container,
press TARE on the scale before adding product.

### 2. Weigh and Price
Place product on scale and print label.
Net weight determines final price.`

const sopChangeAfter = `# SOP-101: Weighing Bulk Items (REVISED)

## Purpose
Ensure accurate pricing for bulk goods.

## Steps

### 1. Weigh and Price
Place product on scale and print label.
Gross weight determines final price.

## Notes
- Tare step removed for efficiency
- Customers can request tare if needed`

// Scenario 2: Software change that breaks SOP
const softwareBefore = `# pos_scale.py

class Scale:
    def read(self) -> float:
        """Return current weight in kg"""
        return self._sensor.get_reading()

def tare(scale: Scale) -> float:
    """Store tare weight, return net"""
    tare_weight = scale.read()
    gross = scale.read()  # after product
    net_weight = gross - tare_weight
    return net_weight

def calculate_price(net_weight, price_per_kg):
    """Net weight feeds into pricing"""
    return net_weight * price_per_kg`

const softwareAfter = `# pos_scale.py (REFACTORED)

class Scale:
    def read(self) -> float:
        """Return current weight in kg"""
        return self._sensor.get_reading()

# tare() function removed during cleanup
# "nobody uses this anymore"

def calculate_price(gross_weight, price_per_kg):
    """Simplified: just use gross weight"""
    return gross_weight * price_per_kg`

// Reasoner output simulation
const reasonerOutputSOP = `=== HermiT Reasoner Output ===

Checking ontology consistency...

CONSTRAINT VIOLATION DETECTED

Axiom: ReusableContainer requires TareStep
  Status: UNSATISFIED
  
  Explanation:
  - ReusableContainer is defined in active inventory
  - TareStep was removed from SOP: WeighBulk
  - No alternative step satisfies 'appliesTo' relation
  
Axiom: TareStep precedes WeighAndPrice  
  Status: ORPHANED
  
  The temporal ordering constraint references
  a step that no longer exists.

Axiom: CorrectPrice requires NetWeight
  Status: UNSATISFIED
  
  - CorrectPrice outcome depends on NetWeight
  - NetWeight is produced by POS Tare Function
  - POS Tare Function implements TareStep
  - TareStep no longer exists in SOP
  
  Chain broken: SOP → Software → Outcome

RECOMMENDATION:
  Cannot remove TareStep while ReusableContainer
  exists in inventory. Either:
  1. Restore TareStep to SOP
  2. Remove ReusableContainer from inventory
  3. Create alternative step that satisfies constraint`

const reasonerOutputSoftware = `=== HermiT Reasoner Output ===

Checking ontology consistency...

CONSTRAINT VIOLATION DETECTED

Axiom: TareStep implementedBy POSTareFunction
  Status: BROKEN LINK
  
  Explanation:
  - SOP: WeighBulk contains TareStep
  - TareStep.implementedBy → POS Tare Function
  - POS Tare Function no longer exists in codebase
  
  The SOP references functionality that has
  been removed from the software.

Axiom: POSTareFunction produces NetWeight
  Status: ORPHANED
  
  - NetWeight has no producer
  - CorrectPrice depends on NetWeight
  - Pricing logic will receive undefined input

Cross-Layer Impact Analysis:
  
  SOP Layer:
    - TareStep has no implementation
    - Clerks cannot perform documented procedure
  
  Training Layer:  
    - CanTareScale capability has no software target
    - Training module teaches non-existent feature

RECOMMENDATION:
  Cannot remove tare() function while SOP-101
  references TareStep. Either:
  1. Restore tare() function
  2. Update SOP to remove TareStep
  3. Update training to remove CanTareScale`

// Generated documentation
const generatedDoc = `# POS Tare Function

## Overview

The \`tare()\` function handles container weight subtraction
during bulk item checkout.

## Business Context

**SOP Reference:** SOP-101: Weighing Bulk Items

This function implements **Step 1: Tare the Container** from
the bulk weighing procedure. It is triggered when a customer
presents a reusable container.

## Process Flow

\`\`\`
Customer presents container
        ↓
Clerk identifies container type
  (Training: CanIdentifyContainer)
        ↓
If reusable → Call tare()
  (Training: CanTareScale required)
        ↓
tare() stores container weight
        ↓
Product added to container
        ↓
Net weight calculated
        ↓
Price computed from net weight
\`\`\`

## Dependencies

### Upstream (inputs)
- **Scale.read()** - Hardware sensor reading
- **ReusableContainer** - Triggers tare requirement

### Downstream (outputs)  
- **NetWeight** - Fed to calculate_price()
- **CorrectPrice** - Business outcome

## Training Requirements

Personnel operating this function must complete:

- **Module:** Bulk Checkout Training
- **Capabilities:**
  - CanIdentifyContainer - Recognize reusable containers
  - CanTareScale - Operate tare button, verify application

## Related SOPs

- SOP-101: Weighing Bulk Items (primary)
- SOP-042: Container Return Policy
- SOP-108: Scale Calibration

## Change Advisory

This function is referenced by:
- 1 SOP step (TareStep)
- 2 training capabilities  
- 1 pricing outcome

**Impact Level: HIGH**

Modifications require review of all connected
SOP and training documentation.`

export const applicationSteps: ApplicationStep[] = [
  {
    id: 'validate-sop-intro',
    type: 'validation-sop',
    title: 'Validating SOP Changes',
    description: 'Imagine someone proposes removing the tare step from the SOP to "simplify" the process. We can use axioms encoded in the ontology to validate this change before it causes real-world problems.',
    source: {
      type: 'markdown',
      filename: 'SOP-101.md',
      content: sopChangeBefore,
      highlightLines: [8, 11],
    },
    output: {
      type: 'markdown',
      filename: 'proposed-change.md',
      content: sopChangeAfter,
      highlightLines: [14, 15],
    },
  },
  {
    id: 'validate-sop-result',
    type: 'validation-sop',
    title: 'Reasoner Catches the Problem',
    description: 'The HermiT reasoner traverses the ontology and finds constraint violations. The ReusableContainer still requires taring, but the step no longer exists. The cross-layer links to software and training are now broken.',
    source: {
      type: 'markdown',
      filename: 'proposed-change.md',
      content: sopChangeAfter,
      highlightLines: [8, 10],
    },
    output: {
      type: 'markdown',
      filename: 'reasoner-output.txt',
      content: reasonerOutputSOP,
      highlightLines: [5, 12],
    },
    validationResults: [
      {
        status: 'error',
        axiom: 'ReusableContainer requires TareStep',
        message: 'Constraint unsatisfied: container type still in inventory',
        affectedNodes: ['reusable-container', 'tare-step'],
      },
      {
        status: 'error',
        axiom: 'TareStep precedes WeighAndPrice',
        message: 'Temporal ordering references non-existent step',
        affectedNodes: ['tare-step', 'weigh-step'],
      },
      {
        status: 'warning',
        axiom: 'CorrectPrice requires NetWeight',
        message: 'Outcome dependency chain broken',
        affectedNodes: ['correct-price', 'net-weight', 'pos-tare'],
      },
    ],
  },
  {
    id: 'validate-software-intro',
    type: 'validation-software',
    title: 'Validating Software Changes',
    description: 'Now consider a developer who removes the tare() function during a refactor, thinking it\'s unused. The ontology captures the cross-layer dependencies that code analysis alone would miss.',
    source: {
      type: 'python',
      filename: 'pos_scale.py',
      content: softwareBefore,
      highlightLines: [9, 14],
    },
    output: {
      type: 'python',
      filename: 'pos_scale_refactored.py',
      content: softwareAfter,
      highlightLines: [8, 9],
    },
  },
  {
    id: 'validate-software-result',
    type: 'validation-software',
    title: 'Cross-Layer Impact Revealed',
    description: 'The reasoner shows that removing tare() breaks the SOP implementation link. Clerks would be trained on a feature that no longer exists. The ontology prevents silent breakage across organizational boundaries.',
    source: {
      type: 'python',
      filename: 'pos_scale_refactored.py',
      content: softwareAfter,
      highlightLines: [8, 9],
    },
    output: {
      type: 'markdown',
      filename: 'reasoner-output.txt',
      content: reasonerOutputSoftware,
      highlightLines: [5, 14],
    },
    validationResults: [
      {
        status: 'error',
        axiom: 'TareStep implementedBy POSTareFunction',
        message: 'SOP step references removed software function',
        affectedNodes: ['tare-step', 'pos-tare'],
      },
      {
        status: 'error',
        axiom: 'POSTareFunction produces NetWeight',
        message: 'NetWeight has no producer',
        affectedNodes: ['pos-tare', 'net-weight'],
      },
      {
        status: 'warning',
        axiom: 'TrainingModule teaches CanTareScale',
        message: 'Training references non-existent feature',
        affectedNodes: ['training-module', 'can-tare'],
      },
    ],
  },
  {
    id: 'documentation-intro',
    type: 'documentation',
    title: 'Generating Contextual Documentation',
    description: 'Beyond validation, we can traverse the ontology to generate documentation that contextualizes code within the broader organization. The tare() function isn\'t just code—it\'s connected to SOPs, training, and business outcomes.',
    source: {
      type: 'python',
      filename: 'pos_scale.py',
      content: softwareBefore,
      highlightLines: [9, 14],
    },
    output: {
      type: 'markdown',
      filename: 'generated-docs/tare-function.md',
      content: generatedDoc,
      highlightLines: [1, 10],
    },
  },
  {
    id: 'documentation-detail',
    type: 'documentation',
    title: 'Full Traceability',
    description: 'The generated documentation includes process flow, dependencies, training requirements, and change impact analysis—all derived automatically from the ontology relationships. Developers see the full context without manual documentation.',
    source: {
      type: 'python',
      filename: 'pos_scale.py',
      content: softwareBefore,
      highlightLines: [9, 14],
    },
    output: {
      type: 'markdown',
      filename: 'generated-docs/tare-function.md',
      content: generatedDoc,
      highlightLines: [40, 55],
    },
  },
]
