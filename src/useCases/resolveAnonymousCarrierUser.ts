import type { Clock } from "./createReminderJourney";
import type { CarrierState } from "./localCarrierState";

export type AuthenticatedUser = {
  authUserId: string;
  isAnonymous: boolean;
};

export type CarrierUser = {
  authUserId: string;
  createdAtMs: number;
  id: string;
};

export interface AnonymousAuthProvider {
  currentUser(): Promise<AuthenticatedUser | null>;
  signInAnonymously(): Promise<AuthenticatedUser>;
}

export interface BackendCarrierRepository {
  ensureUser(authUser: AuthenticatedUser, nowMs: number): Promise<CarrierUser>;
  loadCarrierState(userId: string): Promise<CarrierState>;
  saveCarrierState(userId: string, state: CarrierState): Promise<void>;
}

export async function resolveAnonymousCarrierUser({
  authProvider,
  clock,
  repository
}: {
  authProvider: AnonymousAuthProvider;
  clock: Clock;
  repository: BackendCarrierRepository;
}): Promise<CarrierUser> {
  const authUser =
    (await authProvider.currentUser()) ?? (await authProvider.signInAnonymously());

  return repository.ensureUser(authUser, clock.now());
}
