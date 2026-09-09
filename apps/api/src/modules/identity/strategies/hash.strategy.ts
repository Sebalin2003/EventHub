export const HASH_STRATEGY = 'HASH_STRATEGY';

export interface HashStrategy {
  hashPassword(password: string): string;
  validPassword(password: string, stored: string): boolean;
}
