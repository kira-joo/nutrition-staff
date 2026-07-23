import { NextRequest, NextResponse } from "next/server";
import { SortOrder } from "@kira-joo/frontend-toolkit-core";
import { connectToDatabase } from "../../../server/db/connect";
import { createUser, listUsers } from "../../../server/users/users.repository";
import { CreateUserDto } from "../../../server/users/dto/create-user.dto";
import { validateBody, ValidationFailedError } from "../../../server/validate";
import { Status } from "../../../../common/enums";

export async function GET(request: NextRequest) {
  await connectToDatabase();

  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page")) || undefined;
  const limit = Number(searchParams.get("limit")) || undefined;
  const search = searchParams.get("search") ?? undefined;
  const statusParam = searchParams.get("status");
  const status = statusParam && Object.values(Status).includes(statusParam as Status) ? (statusParam as Status) : undefined;
  const sortBy = searchParams.get("sortBy") ?? undefined;
  const sortOrderParam = searchParams.get("sortOrder");
  const sortOrder = sortOrderParam === SortOrder.DESC ? SortOrder.DESC : undefined;

  const result = await listUsers({ page, limit, search, status, sortBy, sortOrder });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  await connectToDatabase();

  try {
    const body = await request.json();
    const dto = await validateBody(CreateUserDto, body);
    const user = await createUser(dto);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationFailedError) {
      return NextResponse.json({ message: error.messages.join(", ") }, { status: 400 });
    }

    if (isDuplicateKeyError(error)) {
      return NextResponse.json({ message: "A user with this email already exists" }, { status: 409 });
    }

    throw error;
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
