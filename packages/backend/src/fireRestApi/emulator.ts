export const FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;

export function emulatorHost(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return FIREBASE_AUTH_EMULATOR_HOST;
}

export function useEmulator(): boolean {
  return !!emulatorHost();
}
