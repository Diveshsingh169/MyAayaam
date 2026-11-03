# Frontend feature architecture

Business modules live under `src/features/<feature-name>/`. Keep route files in `src/app/` focused on routing, page composition, and page-level orchestration.

A feature may contain:

- `components/` — UI components used by that feature only.
- `services/` — API communication and feature-specific data operations.
- `types/` — TypeScript types and feature constants.
- `hooks/` — feature-specific React hooks when shared state/behavior warrants one.

Use `src/components/ui/` for generic components that can be reused across unrelated features. Use `src/components/layout/` for application-wide layout. Do not move a component into the global library unless it is genuinely reusable.

## Departments example

```text
src/
├── app/
│   └── dashboard/
│       └── departments/
│           ├── layout.tsx
│           └── page.tsx
├── components/
│   ├── layout/
│   └── ui/
└── features/
    └── departments/
        ├── components/
        │   ├── department-form-modal.tsx
        │   ├── department-stats.tsx
        │   └── department-table.tsx
        ├── services/
        │   └── department-service.ts
        └── types/
            └── department.ts
```

The page owns view state and coordinates actions. The service owns HTTP requests. Feature components own presentation. Shared UI primitives own cross-feature styling and interaction patterns.
