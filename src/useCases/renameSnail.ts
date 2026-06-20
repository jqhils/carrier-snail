import type { CarrierRepository, Snail } from "./localCarrierState";

export const MAX_SNAIL_NAME_LENGTH = 24;

export class EmptySnailNameRejectedError extends Error {
  constructor() {
    super("Snail name is required.");
    this.name = "EmptySnailNameRejectedError";
  }
}

export class SnailNameTooLongError extends Error {
  constructor() {
    super(`Snail names must be ${MAX_SNAIL_NAME_LENGTH} characters or fewer.`);
    this.name = "SnailNameTooLongError";
  }
}

export class SnailNotFoundError extends Error {
  constructor() {
    super("That snail was not found.");
    this.name = "SnailNotFoundError";
  }
}

export function renameSnail(
  input: { name: string; snailId: string },
  { repository }: { repository: CarrierRepository }
): { snail: Snail } {
  const name = input.name.trim();

  if (name.length === 0) {
    throw new EmptySnailNameRejectedError();
  }

  if (name.length > MAX_SNAIL_NAME_LENGTH) {
    throw new SnailNameTooLongError();
  }

  const state = repository.snapshot();
  const snail = state.snails.find((candidate) => candidate.id === input.snailId);

  if (!snail) {
    throw new SnailNotFoundError();
  }

  const renamedSnail = {
    ...snail,
    name
  };

  repository.save({
    ...state,
    snails: state.snails.map((candidate) =>
      candidate.id === input.snailId ? renamedSnail : candidate
    )
  });

  return { snail: renamedSnail };
}
