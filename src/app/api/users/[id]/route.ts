import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../server/db/connect";
import { deleteUser, getUserById, updateUser } from "../../../../server/users/users.repository";
import { UpdateUserDto } from "../../../../server/users/dto/update-user.dto";
import { validateBody, ValidationFailedError } from "../../../../server/validate";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  await connectToDatabase();

  const user = await getUserById(params.id);
  if (!user) {
    return NextResponse.json({ message: `No user exists with id "${params.id}"` }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  await connectToDatabase();

  try {
    const body = await request.json();
    const dto = await validateBody(UpdateUserDto, body);
    const user = await updateUser(params.id, dto);

    if (!user) {
      return NextResponse.json({ message: `No user exists with id "${params.id}"` }, { status: 404 });
    }

    return NextResponse.json(user);
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  await connectToDatabase();

  const deleted = await deleteUser(params.id);
  if (!deleted) {
    return NextResponse.json({ message: `No user exists with id "${params.id}"` }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
