import { Status } from "../enums";
import type { RoleSummary } from "./role.interface";

export interface User {
  _id: string;
  name: string;
  /** Optional at the schema level (a lead/client User may have none) — still required by the staff-facing CreateUserDto/UserForm. */
  email?: string;
  phone?: string;
  roles: RoleSummary[];
  status: Status;
  /**
   * Derived (not stored) — whether this identity has a linked `ClientProfile`/
   * `StaffProfile`. Only present on responses from `GET /api/users`, which
   * computes them per page; absent elsewhere.
   */
  hasClientProfile?: boolean;
  hasStaffProfile?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  roles?: string[];
  status: Status;
}

export type UpdateUserDto = Partial<CreateUserDto>;

export interface UserFormValues {
  name: string;
  email: string;
  roles: string[];
  status: Status;
}
