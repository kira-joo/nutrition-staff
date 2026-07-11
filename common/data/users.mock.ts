import { UserRole, Status } from "../enums";
import type {
  CreateUserDto,
  UpdateUserDto,
  User,
} from "../interfaces/user.interface";

export const usersMock: User[] = [
  {
    id: "1",
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    role: UserRole.ADMIN,
    status: Status.ACTIVE,
    salary: 95000,
    joinedAt: "2021-03-15",
    createdAt: "2021-03-15T09:00:00.000Z",
    updatedAt: "2021-03-15T09:00:00.000Z",
  },
  {
    id: "2",
    name: "Liam Chen",
    email: "liam.chen@example.com",
    role: UserRole.MANAGER,
    status: Status.ACTIVE,
    salary: 78000,
    joinedAt: "2022-01-10",
    createdAt: "2022-01-10T09:00:00.000Z",
    updatedAt: "2022-01-10T09:00:00.000Z",
  },
  {
    id: "3",
    name: "Sofia Martinez",
    email: "sofia.martinez@example.com",
    role: UserRole.EMPLOYEE,
    status: Status.ACTIVE,
    salary: 54000,
    joinedAt: "2022-08-22",
    createdAt: "2022-08-22T09:00:00.000Z",
    updatedAt: "2022-08-22T09:00:00.000Z",
  },
  {
    id: "4",
    name: "Noah Williams",
    email: "noah.williams@example.com",
    role: UserRole.HR,
    status: Status.INACTIVE,
    salary: 61000,
    joinedAt: "2020-11-05",
    createdAt: "2020-11-05T09:00:00.000Z",
    updatedAt: "2023-05-18T09:00:00.000Z",
  },
  {
    id: "5",
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    role: UserRole.EMPLOYEE,
    status: Status.ACTIVE,
    salary: 58000,
    joinedAt: "2023-02-01",
    createdAt: "2023-02-01T09:00:00.000Z",
    updatedAt: "2023-02-01T09:00:00.000Z",
  },
];

// Module-level store so create/update/delete simulated from one route
// (e.g. /users/create) are still visible after navigating back to /users —
// there's no real backend, so this in-memory array is the source of truth.
let usersStore: User[] = usersMock.map((user) => ({ ...user }));
let nextId = usersStore.length + 1;

export function getUsers(): User[] {
  return usersStore;
}

export function findUserById(id: string): User | undefined {
  return usersStore.find((user) => user.id === id);
}

export function createUser(dto: CreateUserDto): User {
  const now = new Date().toISOString();
  const user: User = {
    id: String(nextId++),
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    salary: dto.salary ?? 0,
    joinedAt: dto.joinedAt ?? now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
  usersStore = [...usersStore, user];
  return user;
}

export function updateUser(id: string, dto: UpdateUserDto): User | undefined {
  const existing = findUserById(id);
  if (!existing) return undefined;

  const updated: User = {
    ...existing,
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  usersStore = usersStore.map((user) => (user.id === id ? updated : user));
  return updated;
}

export function deleteUser(id: string): void {
  usersStore = usersStore.filter((user) => user.id !== id);
}
