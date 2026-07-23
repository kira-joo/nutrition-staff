import mongoose from "mongoose";
import { SortOrder, type PaginatedResponse } from "@kira-joo/frontend-toolkit-core";
import type { CreateUserDto, UpdateUserDto, User } from "../../../common/interfaces/user.interface";
import type { Status } from "../../../common/enums";
import { UserModel, type UserDocument } from "./user.schema";

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: Status;
  sortBy?: string;
  sortOrder?: SortOrder;
}

function toUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    status: doc.status,
    salary: doc.salary,
    joinedAt: doc.joinedAt,
    createdAt: doc.createdAt!.toISOString(),
    updatedAt: doc.updatedAt!.toISOString(),
  };
}

export async function listUsers(query: ListUsersQuery): Promise<PaginatedResponse<User>> {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 10;

  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { email: { $regex: query.search, $options: "i" } },
      { role: { $regex: query.search, $options: "i" } },
      { status: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  const sort: Record<string, 1 | -1> = query.sortBy
    ? { [query.sortBy]: query.sortOrder === SortOrder.DESC ? -1 : 1 }
    : { createdAt: -1 };

  const [docs, total] = await Promise.all([
    UserModel.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    UserModel.countDocuments(filter),
  ]);

  return {
    data: docs.map(toUser),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const doc = await UserModel.findById(id);
  return doc ? toUser(doc) : null;
}

export async function createUser(dto: CreateUserDto): Promise<User> {
  const doc = await UserModel.create(dto);
  return toUser(doc);
}

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const doc = await UserModel.findByIdAndUpdate(id, dto, { new: true });
  return doc ? toUser(doc) : null;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!mongoose.isValidObjectId(id)) return false;

  const result = await UserModel.findByIdAndDelete(id);
  return result !== null;
}
