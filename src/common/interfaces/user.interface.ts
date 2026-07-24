import { Status } from "../enums";
import type { Role } from "./role.interface";

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  status: Status;
  salary: number;
  joinedAt: string;
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
