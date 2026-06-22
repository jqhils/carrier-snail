import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  clearLocalCarrierState,
  loadLocalCarrierState,
  persistLocalCarrierState
} from "./localCarrierStateStorage";
import { createInitialCarrierState } from "../useCases/localCarrierState";

jest.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};

  return {
    __reset: () => {
      store = {};
    },
    getItem: jest.fn((key: string) =>
      Promise.resolve(key in store ? store[key] : null)
    ),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    })
  };
});

beforeEach(() => {
  (AsyncStorage as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
});

describe("localCarrierStateStorage", () => {
  it("returns null when nothing has been persisted", async () => {
    expect(await loadLocalCarrierState()).toBeNull();
  });

  it("round-trips a persisted CarrierState", async () => {
    const state = createInitialCarrierState();

    await persistLocalCarrierState(state);
    const loaded = await loadLocalCarrierState();

    expect(loaded).toEqual(state);
  });

  it("persists mutations across reloads", async () => {
    const state = createInitialCarrierState();
    state.softCurrency.slime = 42;

    await persistLocalCarrierState(state);

    expect((await loadLocalCarrierState())?.softCurrency.slime).toBe(42);
  });

  it("ignores a corrupt payload instead of throwing", async () => {
    await AsyncStorage.setItem("carrierSnail.carrierState.v1", "{not json");

    expect(await loadLocalCarrierState()).toBeNull();
  });

  it("rejects a structurally wrong payload", async () => {
    await AsyncStorage.setItem(
      "carrierSnail.carrierState.v1",
      JSON.stringify({ snails: "nope" })
    );

    expect(await loadLocalCarrierState()).toBeNull();
  });

  it("clears persisted state", async () => {
    await persistLocalCarrierState(createInitialCarrierState());
    await clearLocalCarrierState();

    expect(await loadLocalCarrierState()).toBeNull();
  });

  it("swallows write failures", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error("disk full")
    );

    await expect(
      persistLocalCarrierState(createInitialCarrierState())
    ).resolves.toBeUndefined();
  });
});
