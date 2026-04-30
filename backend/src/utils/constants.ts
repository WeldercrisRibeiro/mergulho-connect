/**
 * Role ID mapping for Group Routines.
 * These should ideally be in the database or environment variables,
 * but centralizing them here is a step towards better maintainability.
 */
export const ROLE_IDS = {
  ADMIN: 'c1f324b3-45ed-453a-941c-d030e22d7721',
  ADMIN_CCM: 'c1f324b3-45ed-453a-941c-d030e22d7721',
  PASTOR: 'c1f324b3-45ed-453a-941c-d030e22d7721',
  LIDER: '3e4bce2a-7856-4801-b466-7b8e3d12a74b',
  MEMBRO: '071c2037-fa67-43ab-9d1b-4480fe15fd92',
};

export const ROLE_MAPPING: Record<string, string> = {
  admin: ROLE_IDS.ADMIN,
  admin_ccm: ROLE_IDS.ADMIN_CCM,
  pastor: ROLE_IDS.PASTOR,
  lider: ROLE_IDS.LIDER,
  membro: ROLE_IDS.MEMBRO,
};
