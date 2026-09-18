# Repository agent instructions

Before changing the frontend or reviewing its UI, read and follow [`clinova-ui-guidelines.md`](clinova-portal/docs/clinova-ui-guidelines.md). It records the current synced baseline, the design decisions introduced by the latest frontend updates, reusable implementation patterns, and the required validation checklist.

Before creating a new frontend UI component, check whether an equivalent shadcn/ui component exists. Reuse the component from `clinova-portal/src/components/ui/` when it is already present; otherwise, install it with the project's configured shadcn CLI before implementing the feature. Create a custom UI primitive only when shadcn/ui has no suitable equivalent, and do not overwrite an existing customized component without reviewing and preserving its project-specific behavior.
