You are continuing inside the existing `nutrition-workspace`.

Do **not** start implementing features yet.

Your job in this phase is to deeply audit the current codebase and design a strong implementation roadmap for evolving the existing `nutrition-staff` application from its current nutrition-clinic CRM/CMS state into a reusable **Medical Clinic / Medical Center Management Platform**, while preserving Nutrition as one supported specialty/vertical rather than making Nutrition the core domain.

This product is not being built specifically for the current nutrition doctor. The long-term goal is to make it sellable to private clinics, multi-doctor practices, and small/medium medical centers, with room to expand toward more advanced healthcare/hospital capabilities later.

## 1. Read the workspace context first

Before planning anything, fully inspect the workspace instructions and relevant documentation.

At minimum, read and understand:

* root `CLAUDE.md`
* root `.claude/settings.json`
* relevant workspace skills
* `nutrition-staff/CLAUDE.md`
* `nutrition-client/CLAUDE.md` where relevant
* the current `nutrition-staff` architecture and source tree
* existing documentation/plans/handoff files
* all shared frontend/backend toolkit repositories used by the project

Do not assume the current structure is correct just because it exists.

This is still early enough that structural changes, renames, module extraction, data-model changes, and architectural cleanup are acceptable if they produce a materially better long-term system.

---

# 2. Existing repos and ownership

The initial implementation target is the existing:

`nutrition-staff`

Do **not** create a new healthcare repo during this planning phase unless your audit finds a very strong architectural reason and documents it as a recommendation rather than silently doing it.

`nutrition-client` remains the current public/client application and should not be unnecessarily disturbed. Future patient-facing capabilities such as patient portal or booking can be considered architecturally, but they are not automatically part of the first implementation scope.

The goal is to determine how much of `nutrition-staff` can be evolved cleanly versus refactored/extracted.

---

# 3. Toolkit-first is mandatory

The shared packages are foundational infrastructure, not frozen third-party dependencies.

Audit all relevant shared packages before introducing app-local abstractions:

* frontend toolkit packages
* backend toolkit packages
* toolkit-common
* any other workspace package currently used by the apps

If a generic capability needed by this product does not exist, prefer improving/extending the appropriate shared package and publishing/adopting the new version rather than adding a duplicate local mechanism.

Examples of areas that may belong in packages if generic enough:

* richer permissions / authorization primitives
* scoped access control
* audit/event helpers
* reusable timeline primitives
* advanced table/filter/search primitives
* dialogs/drawers
* command/search interfaces
* resource scheduling primitives
* generic cards, layouts, sections, skeletons
* route-safe links
* accessibility helpers
* shared API/repository mechanisms

Do not over-generalize.

Healthcare-specific components such as a Patient Clinical Banner, diagnosis UI, or medical workflow must remain local unless there is a genuinely generic abstraction beneath them.

For every major planned feature, identify:

1. reuse existing toolkit as-is,
2. extend shared toolkit,
3. build locally.

---

# 4. Product scope for the first sellable version

Do **not** plan a full hospital ERP as the first implementation.

The target is a strong:

**Medical Clinic / Medical Center Management Platform**

that can later expand toward hospital functionality.

The first major product scope should primarily cover:

### Platform foundation

* clinic/organization settings
* branches/facilities where appropriate
* users/staff
* doctors
* roles and permissions
* audit/activity
* files/documents
* notifications/settings
* search and navigation

### Patients

* patient identity/profile
* medical/patient number
* contact information
* emergency contacts where useful
* tags/source/status
* assigned doctor/staff
* medical alerts/basic clinical summary
* files
* notes
* appointments
* visits/encounters
* billing
* follow-up
* unified timeline

### Appointments / scheduling

* calendar
* doctor availability
* appointment types
* duration
* branch/room/resource where justified
* booking
* rescheduling
* cancellation
* walk-in
* no-show
* check-in
* waiting status
* daily/weekly views
* multi-doctor usability

### Medical encounters / records

Do not treat an appointment as the medical encounter itself.

Plan a proper but initially manageable Encounter model supporting:

* visit reason / complaint
* vitals
* clinical notes
* diagnosis
* prescription/basic medication instructions
* attachments
* follow-up instructions/date
* configurable specialty forms/templates where appropriate

The architecture should allow Nutrition, Dentistry, Dermatology, Physiotherapy, Pediatrics, etc. to extend the clinical workflow without hardcoding every specialty into the platform core.

### CRM / follow-up

This should remain a strong differentiator:

* next follow-up
* overdue follow-ups
* contact attempts
* notes
* tasks
* source/referral
* lifecycle/status
* missed-appointment recovery
* communication history
* retention/reactivation concepts where appropriate

### Billing / payments

Keep the first version practical rather than accounting-heavy:

* service catalog
* prices
* invoices/receipts
* payments
* discounts
* outstanding balances
* payment methods
* packages/subscriptions/sessions if justified

Do not build full financial accounting or insurance claims in the first implementation.

### Dashboard / reporting

Role-relevant and actionable:

* today’s appointments
* waiting/check-in
* follow-ups due
* unpaid balances
* new patients
* recent activity
* revenue summaries
* doctor workload
* useful operational KPIs

Avoid meaningless decorative dashboards.

---

# 5. Nutrition must become a vertical, not the platform core

Audit the current Nutrition-specific functionality carefully.

Examples may include:

* nutrition assessments
* measurements
* body calculations
* nutrition plans
* food/meal-specific workflows
* nutrition follow-up logic

Determine what is:

* generic healthcare functionality,
* reusable platform functionality,
* Nutrition-specific functionality.

Propose how the architecture should separate these concerns cleanly.

Do **not** destroy existing Nutrition capabilities merely to make things generic.

The desired direction is conceptually similar to:

```text
medical platform core
  patients
  appointments
  encounters
  staff
  billing
  crm
  reporting
  settings

verticals
  nutrition
    assessments
    measurements
    calculations
    nutrition-specific workflows
```

This example is directional, not a required filesystem structure. Audit the actual repository and choose the most appropriate architecture.

---

# 6. Future expansion: design for it, do not build it now

The architecture should leave reasonable room for later additions such as:

* hospital admissions
* wards / beds
* nursing
* emergency department
* laboratory
* radiology
* pharmacy
* inventory/procurement
* operating theatre
* insurance
* advanced billing/accounting integrations

These belong in a future roadmap, not the first implementation scope.

Do not build speculative complexity solely for hypothetical modules, but identify any foundational decisions today that would otherwise make those extensions unnecessarily difficult later.

---

# 7. UX/UI quality is a first-class product requirement

Do not design this as a generic admin dashboard composed of:

sidebar + tables + forms everywhere.

The user wants a premium, modern, highly usable product with strong visual design, thoughtful interaction, and polished motion.

The previously established design direction across the workspace should be respected:

* premium art direction
* excellent UX before visual gimmicks
* contextual interactions
* responsive/mobile/tablet-aware behavior
* thoughtful motion
* polished transitions
* high-quality visual hierarchy
* accessibility
* reduced-motion support
* reusable design systems

Motion should serve clarity and state, especially in medical operational interfaces.

Examples worth exploring:

* patient timeline
* doctor/reception worklists
* appointment calendar/resource views
* waiting/check-in board
* contextual drawers rather than unnecessary page navigation
* command/search interface
* role-based home screens
* smooth state changes
* excellent empty/loading/error states
* persistent Patient Context while navigating the patient record

Do not turn operational medical screens into cinematic marketing pages.

For operational workflows, prioritize:

speed,
clarity,
safety,
context,
keyboard efficiency,
low cognitive load.

The public-facing/marketing side can use substantially richer cinematic motion later.

---

# 8. Role-driven UX

Audit and plan for different workspaces where useful rather than one dashboard for everyone.

Potential actors include:

* clinic owner/admin
* doctor
* receptionist
* assistant
* other staff roles

Determine what each role needs to see and do.

Authorization should eventually be more granular than simple ADMIN/USER role checks.

If the current shared authorization architecture needs improvement, plan the appropriate package changes.

---

# 9. Audit before deciding architecture

Perform a real code audit.

Specifically answer:

### Existing functionality

* what modules/features already exist?
* which are production-quality?
* which are partial?
* which are dead/legacy?
* what is strongly coupled to Nutrition?
* what is already generic?

### Data/domain

* what are the current core entities?
* is the current `User`/client model suitable for becoming a Patient model?
* should it be renamed/refactored/replaced?
* what migrations would be required?
* what current assumptions will become problematic?

### Frontend

* what page/layout/component patterns already exist?
* what should be reused?
* what needs redesign?
* what generic UI can be promoted into packages?

### Backend

* current route/repository/DTO conventions
* toolkit usage
* validation
* authorization
* relationships
* caching/revalidation
* files/uploads
* existing domain coupling

### Architecture

Determine whether the current repository should:

* be incrementally evolved,
* undergo a focused internal restructuring,
* introduce explicit feature/domain modules,
* separate Nutrition vertically,
* or eventually be extracted into a new healthcare product repo.

Do not make a large repo split only for cleanliness if there is no concrete benefit.

---

# 10. Planning deliverables

After the audit, create a dedicated planning directory inside the correct repository.

Choose a sensible location such as:

`nutrition-staff/docs/plans/medical-platform/`

or an equivalent consistent with existing project conventions.

Do not put everything in one giant PLAN.md.

Create a master roadmap plus focused MD files.

The exact file list must be based on your audit, but it should cover concepts similar to:

* product scope and goals
* audit/current-state findings
* target architecture
* domain model
* migration/refactor strategy
* platform foundation
* patients
* appointments/scheduling
* encounters/medical records
* CRM/follow-up
* billing/payments
* staff/roles/permissions
* dashboard/reporting
* UX/design system/motion
* toolkit/package changes
* tests/QA
* migrations/seeding
* future expansion
* implementation roadmap

Do not mechanically create files just to match this list. Use the structure that best fits the repository and dependencies.

---

# 11. Every implementation MD must be actionable

Each relevant plan should include, where applicable:

* purpose
* current state
* target state
* scope
* explicitly out of scope
* domain concepts/entities
* relationships
* states/status transitions
* user roles
* permissions
* workflows
* screens/routes
* APIs
* validation/business rules
* search/filter/sort requirements
* files/media behavior
* notifications/events
* audit requirements
* toolkit/package dependencies
* local vs shared decisions
* migrations
* backward compatibility
* edge cases
* error states
* accessibility
* responsive UX
* motion/interaction requirements
* testing strategy
* acceptance criteria
* prerequisites
* downstream dependencies
* implementation steps

The plans must be detailed enough that a fresh agent can implement a phase without inventing missing product decisions.

---

# 12. Master roadmap

Create a single master/index MD linking all planning files.

It must show:

* overall vision
* final first-release scope
* architecture summary
* implementation phases
* dependency graph/order
* what may run in parallel
* toolkit releases required before app work
* migrations/refactors required before feature work
* checkpoints
* acceptance gates
* status tracking
* future modules deliberately deferred

Prefer small, verifiable implementation phases over one massive rewrite.

---

# 13. Parallel-agent rule

Use parallel agents for genuinely independent audit/planning workstreams where beneficial, while keeping one orchestrator responsible for consistency.

Examples:

* backend/domain audit
* frontend/UX audit
* toolkit audit
* current Nutrition coupling audit

Do not parallelize tightly coupled architecture decisions and then merge incompatible plans blindly.

---

# 14. Important constraints

Do not:

* start feature implementation yet
* rewrite the application blindly
* remove working Nutrition behavior without migration reasoning
* duplicate toolkit functionality locally
* over-engineer hospital functionality into the first release
* assume existing naming/data modeling is correct
* reduce UX planning to wireframe-level generic admin screens
* treat animation as a final cosmetic pass
* make architecture decisions without inspecting actual code

You are allowed to recommend substantial changes where justified because this product is still early enough to change direction.

---

# 15. End-of-phase report

When all audit and planning work is complete, report:

1. What you found in the existing app.
2. Your recommended product/architecture direction.
3. What stays, what changes, what moves, what is newly built.
4. How Nutrition is separated from the medical-platform core.
5. Shared-package changes required.
6. The planning MD structure created.
7. Recommended implementation order.
8. Major risks/open decisions.
9. What is explicitly deferred to future Hospital ERP expansion.
10. Confirmation that no implementation work was started.

Do not ask the user to manually decide technical details that can be resolved by inspecting the repository.

Where multiple legitimate product choices exist and materially affect scope or UX, document the alternatives and recommendation clearly.
