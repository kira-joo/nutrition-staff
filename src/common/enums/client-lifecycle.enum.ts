/** A client's CRM lifecycle stage. Independent of `User.roles` (authorization) and of any future subscription/billing state. */
export enum ClientLifecycle {
  LEAD = "lead",
  PROSPECT = "prospect",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
  LOST = "lost",
}
