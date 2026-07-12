# Architecture Decision Records

ADRs separate concrete technical choices from product outcomes in the canonical PRD.

| ADR                                                      | Decision                                        | Status                                             |
| -------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| [0001](./0001-select-nextjs-full-stack-framework.md)     | Next.js full-stack framework                    | Proposed; framework/deployment proof required      |
| [0002](./0002-runtime-language-and-quality-toolchain.md) | Reversible runtime and tooling batches          | Partially superseded by ADR-0003 and ADR-0006      |
| [0003](./0003-structured-content-and-postgresql.md)      | Structured content, Tiptap, PostgreSQL, Drizzle | Proposed; editor/migration/recovery proof required |
| [0004](./0004-platform-services-and-deployment.md)       | Managed services behind portable adapters       | Proposed; persistence/deployment proof required    |
| [0005](./0005-app-local-design-system.md)                | App-local owned shadcn/Base UI design system    | Proposed; component/workspace audit required       |
| [0006](./0006-typescript-quality-tooling-foundation.md)  | TypeScript 6 and unified quality tooling        | Accepted; Task 39 delivery gates pending           |

An ADR becomes accepted only after its acceptance gates pass and link to committed evidence. A failed spike updates the ADR to rejected or superseded; it does not silently change the decision.
