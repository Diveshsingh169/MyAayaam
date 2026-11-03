# Shared UI components

Reusable presentation primitives for MyAayaam. Keep business logic and API calls in feature pages; keep these components focused on consistent presentation and accessible interaction.

## Available components

- **Button** — variants: `primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`. Supports native button attributes, disabled/loading states, and optional leading/trailing icons.
- **Badge** — tones: `neutral`, `success`, `warning`, `danger`, `accent`; optional status dot.
- **Card** — shared bordered surface with `none`, `sm`, `md`, or `lg` padding.
- **Input** — native input attributes plus optional label, hint, error, and leading icon. Generates an accessible id when one is not supplied.
- **Modal** — controlled dialog with title, optional description, size, backdrop dismissal, and Escape-key dismissal.

Import from `@/components/ui` or from the individual component file. The shared stylesheet is loaded once by `app/dashboard/layout.tsx`; do not import it in individual pages.

## Usage

```tsx
import { Badge, Button, Card, Input, Modal } from "@/components/ui";

<Card padding="md">
  <Input label="Department name" placeholder="e.g. Electronics" />
  <Badge tone="success" dot>Active</Badge>
  <Button variant="primary">Save changes</Button>
</Card>

<Modal
  open={isOpen}
  title="Create department"
  onClose={() => setIsOpen(false)}
>
  {/* Place the feature form here. */}
</Modal>
```

Use the existing global design tokens for spacing, colours, typography, borders and focus states. Avoid feature-specific styles in this folder.


## Additional shared components

- **SearchField** — controlled search input with accessible label and clear action.
- **DataTable** — typed, generic table foundation with column renderers, stable row keys, horizontal overflow handling and an empty-row fallback. Feature tables can provide a table class for their own layout details.
- **EmptyState**, **LoadingState**, and **ErrorState** — consistent feedback patterns. Error states can include a retry action.
- **ConfirmDialog** — confirmation dialog built on the shared Modal and Button components.
- **Workspace navigation configuration** — `getWorkspaceNavigation(role)` filters navigation items by role. Add future workspace links in `navigation.ts` rather than duplicating role checks in the sidebar.

Keep confirmation state and action execution in the feature page. Shared dialogs should not perform API requests themselves.
