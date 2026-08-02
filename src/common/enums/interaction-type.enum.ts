/** `LIFECYCLE_CHANGE` is auto-logged by the system (see updateClient) — never created directly by a staff member. */
export enum InteractionType {
  CALL = "call",
  WHATSAPP = "whatsapp",
  MESSAGE = "message",
  EMAIL = "email",
  MEETING = "meeting",
  NOTE = "note",
  LIFECYCLE_CHANGE = "lifecycle_change",
  OTHER = "other",
}
