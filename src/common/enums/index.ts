export * from "./status.enum";
// UserRole is no longer used by the backend (UserSchema now uses a `roles`
// relation instead) — kept temporarily since the frontend Users UI
// (user-form.tsx, users/page.tsx) still imports it. Removed in Phase 5 once
// that UI is migrated to the Role relation.
export * from "./user.enum";
