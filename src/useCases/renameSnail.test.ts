import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  listStableSnails
} from "./localCarrierState";
import {
  EmptySnailNameRejectedError,
  MAX_SNAIL_NAME_LENGTH,
  renameSnail,
  SnailNameTooLongError,
  SnailNotFoundError
} from "./renameSnail";

describe("renameSnail", () => {
  it("trims and persists a custom snail name without changing species identity", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    const result = renameSnail(
      { name: "  Lettuce Courier  ", snailId: "garden-1" },
      { repository }
    );
    const state = repository.snapshot();

    expect(result.snail).toMatchObject({
      id: "garden-1",
      name: "Lettuce Courier",
      speciesId: "garden"
    });
    expect(state.snails[0]).toMatchObject({
      name: "Lettuce Courier",
      speciesId: "garden"
    });
    expect(listStableSnails(state).snails[0]).toMatchObject({
      name: "Lettuce Courier",
      speciesName: "Garden Snail"
    });
  });

  it("rejects blank snail names", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    expect(() =>
      renameSnail({ name: "   ", snailId: "garden-1" }, { repository })
    ).toThrow(EmptySnailNameRejectedError);
    expect(repository.snapshot().snails[0].name).toBe("Garden Snail");
  });

  it("rejects over-long snail names", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const name = "s".repeat(MAX_SNAIL_NAME_LENGTH + 1);

    expect(() =>
      renameSnail({ name, snailId: "garden-1" }, { repository })
    ).toThrow(SnailNameTooLongError);
    expect(repository.snapshot().snails[0].name).toBe("Garden Snail");
  });

  it("rejects missing snails", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    expect(() =>
      renameSnail({ name: "Leaf", snailId: "missing" }, { repository })
    ).toThrow(SnailNotFoundError);
  });
});
