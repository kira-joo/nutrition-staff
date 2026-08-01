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
  /** Staff-only field — undefined on a lead/client User created without HR details. */
  salary?: number;
  /** Staff-only field ("date hired") — undefined on a lead/client User. */
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  roles?: string[];
  status: Status;
  salary?: number;
  joinedAt?: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;

export interface UserFormValues {
  name: string;
  email: string;
  roles: string[];
  status: Status;
  /** Native number input round-trips as a string until it's coerced on submit. */
  salary?: number;
  joinedAt?: string;
}
