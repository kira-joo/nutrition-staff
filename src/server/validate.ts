import "reflect-metadata";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";

export class ValidationFailedError extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join(", "));
    this.name = "ValidationFailedError";
  }
}

export async function validateBody<T extends object>(DtoClass: ClassConstructor<T>, payload: unknown): Promise<T> {
  const dto = plainToInstance(DtoClass, payload);
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) => Object.values(error.constraints ?? {}));
    throw new ValidationFailedError(messages);
  }

  return dto;
}
