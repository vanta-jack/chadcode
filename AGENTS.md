# AGENTS.md — Repository Operating Directives

## 1. Information Sensitivity and Public Boundary
- **Public Visibility Enforcement**: This repository is public. Never commit, log, or document private network topologies, proprietary hostnames, machine node names, internal mesh addresses, private auth tokens, local proxy setups, or host-specific network tooling.
- **Generic Environment References Only**: Refer to environments strictly via neutral abstract terms (e.g., `local development server`, `production preview`, `client runtime`, `CI runner`).
- **Sanitization Check**: Inspect all diffs, commit messages, and documentation files prior to staging to verify that no infrastructure specifics, internal device identifiers, or environment fingerprints are present.

## 2. Documentation Architecture (Diátaxis Standard)
All repository documentation must strictly adhere to the [Diátaxis framework](https://diataxis.fr/) under `docs/`:
- **Tutorials** (`docs/tutorials/`): Learning-oriented step-by-step guides for onboarding.
- **How-To Guides** (`docs/how-to/`): Task-oriented recipes and procedural runbooks.
- **Reference** (`docs/reference/`): Information-oriented schemas, API specifications, and factual tables.
- **Explanations** (`docs/explanations/`): Understanding-oriented architecture discussions, trade-offs, and formal incident post-mortems formatted as `docs/explanations/YYYY-MM-DD-<incident-title>.md`.

## 3. Incident and Bug Documentation Protocol
Whenever an incident, defect, or unexpected runtime anomaly is diagnosed and resolved:
1. Conduct a rigorous root-cause analysis.
2. Produce an incident report in `docs/explanations/YYYY-MM-DD-<describe-the-incident>.md`.
3. Include structured sections:
   - **Summary & Timeline**: High-level impact and symptoms.
   - **Symptoms**: What was observed and reported.
   - **Root Cause Analysis (RCA)**: The underlying technical mechanisms and design conflicts.
   - **Resolution & Technical Changes**: Concrete implementation diffs that addressed the issue.
   - **Prevention & Verification**: Guardrails, regression tests, and architectural invariants to prevent recurrence.
4. Ensure the incident report remains strictly generic and free of private environment or network identifiers.

## 4. Engineering & Design Discipline
- Strictly maintain the design constraints and aesthetics specified in `DESIGN.md`.
- Preserve the 4-color palette boundary (`#000000`, `#F5F5F0`, `#E5A93C`, `#D9383A`).
- Preserve zero-asset Web Audio synthesis without introducing external media files.
- Keep the application 100% client-side with zero external API dependencies on Day 0.
