import type { User } from '@supabase/supabase-js'

/** Usuário com app_metadata.role = 'admin' no Supabase Auth. */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user) return false
  return user.app_metadata?.role === 'admin'
}

export class UnauthorizedError extends Error {
  constructor(message = 'Não autorizado') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}
