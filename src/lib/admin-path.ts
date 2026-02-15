const ADMIN_PREFIX: string = process.env.NEXT_PUBLIC_ADMIN_PREFIX || 'admin';

export function adminPath(subpath: string = ''): string {
  return `/${ADMIN_PREFIX}${subpath}`;
}

export function getAdminPrefix(): string {
  return ADMIN_PREFIX;
}

export function isAdminPath(pathname: string): boolean {
  return pathname === `/${ADMIN_PREFIX}` || pathname.startsWith(`/${ADMIN_PREFIX}/`);
}
