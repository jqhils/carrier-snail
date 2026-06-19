import {
  type AnonymousAuthProvider,
  type AuthenticatedUser,
  type BackendCarrierRepository,
  resolveAnonymousCarrierUser
} from "./resolveAnonymousCarrierUser";
import type { CarrierState } from "./localCarrierState";

class FakeAnonymousAuthProvider implements AnonymousAuthProvider {
  readonly signIns: AuthenticatedUser[] = [];

  constructor(
    private readonly current: AuthenticatedUser | null,
    private readonly next: AuthenticatedUser
  ) {}

  async currentUser(): Promise<AuthenticatedUser | null> {
    return this.current;
  }

  async signInAnonymously(): Promise<AuthenticatedUser> {
    this.signIns.push(this.next);

    return this.next;
  }
}

class FakeBackendCarrierRepository implements BackendCarrierRepository {
  readonly ensuredUsers: { authUser: AuthenticatedUser; nowMs: number }[] = [];

  async ensureUser(
    authUser: AuthenticatedUser,
    nowMs: number
  ): Promise<{ id: string; authUserId: string; createdAtMs: number }> {
    this.ensuredUsers.push({ authUser, nowMs });

    return {
      authUserId: authUser.authUserId,
      createdAtMs: nowMs,
      id: "carrier-user-1"
    };
  }

  async loadCarrierState(): Promise<CarrierState> {
    throw new Error("Not needed for this test.");
  }

  async saveCarrierState(): Promise<void> {
    throw new Error("Not needed for this test.");
  }
}

describe("resolveAnonymousCarrierUser", () => {
  it("reuses an existing anonymous auth session and ensures a Carrier user", async () => {
    const authUser = {
      authUserId: "auth-existing",
      isAnonymous: true
    };
    const authProvider = new FakeAnonymousAuthProvider(authUser, {
      authUserId: "auth-created",
      isAnonymous: true
    });
    const repository = new FakeBackendCarrierRepository();

    const user = await resolveAnonymousCarrierUser({
      authProvider,
      clock: { now: () => 12345 },
      repository
    });

    expect(authProvider.signIns).toEqual([]);
    expect(repository.ensuredUsers).toEqual([{ authUser, nowMs: 12345 }]);
    expect(user).toEqual({
      authUserId: "auth-existing",
      createdAtMs: 12345,
      id: "carrier-user-1"
    });
  });

  it("signs in anonymously when no auth session exists", async () => {
    const createdAuthUser = {
      authUserId: "auth-created",
      isAnonymous: true
    };
    const authProvider = new FakeAnonymousAuthProvider(null, createdAuthUser);
    const repository = new FakeBackendCarrierRepository();

    const user = await resolveAnonymousCarrierUser({
      authProvider,
      clock: { now: () => 67890 },
      repository
    });

    expect(authProvider.signIns).toEqual([createdAuthUser]);
    expect(repository.ensuredUsers).toEqual([
      { authUser: createdAuthUser, nowMs: 67890 }
    ]);
    expect(user.authUserId).toBe("auth-created");
  });
});
