import { createClient } from '@/lib/supabase/server'
import { isAdminUser, UnauthorizedError } from '@/lib/auth/admin'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user || !isAdminUser(user)) {
    throw new UnauthorizedError()
  }

  return { supabase, user }
}

/** Para server actions que retornam ActionResult em vez de lançar exceção. */
export async function requireAdminOrNull() {
  try {
    return await requireAdmin()
  } catch {
    return null
  }
}
