/**
 * Tipos gerados automaticamente pelo Supabase CLI.
 * 
 * Execute no terminal (na raiz do projeto Supabase):
 *   supabase gen types --pg --schema public --out packages/shared/supabaseTypes.ts
 * 
 * Isso substituirá este arquivo pelos tipos exatos das tabelas do seu banco.
 * 
 * ATUALIZAÇÃO MANUAL: Se você criar tabelas manualmente no Dashboard do Supabase,
 * re-execute o comando acima para regenerar estes tipos.
 */

// ---------------------------------------------------------------------------
// TIPOS DA TABELA: users
// ---------------------------------------------------------------------------

type PublicUser = {
  id: string
  email: string | null
  encrypted_password: string | null
  app_metadata: any
  user_metadata: any
  email_confirmed_at: string | null
  invited_at: string | null
  confirmation_sent_at: string | null
  confirmation_code: string | null
  recovered_at: string | null
  last_sign_in_at: string | null
  banned_at: string | null
  created_at: string
  updated_at: string
  phone: string | null
  confirmation_sent_at: string | null
}

// Tipos exportados para uso no shared/
export type { PublicUser as User }

// ---------------------------------------------------------------------------
// TIPOS DA TABELA: leads (exemplo - ajuste conforme seu schema)
// ---------------------------------------------------------------------------

type PublicLead = {
  id: string
  user_id: string | null
  title: string
  email: string | null
  phone: string | null
  status: string
  value: number | null
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type { PublicLead as Lead }

// ---------------------------------------------------------------------------
// TIPOS DA TABELA: transactions (exemplo - ajuste conforme seu schema)
// ---------------------------------------------------------------------------

type PublicTransaction = {
  id: string
  user_id: string | null
  lead_id: string | null
  amount: number
  currency: string
  status: string
  description: string | null
  created_at: string
  updated_at: string
}

export type { PublicTransaction as Transaction }

// ---------------------------------------------------------------------------
// OUTROS TIPOS DE RETORNO DO SUPABASE
// ---------------------------------------------------------------------------

/** Linha única retornada por .single() ou .select().single() */
export type SingleResult<T> = {
  data: T | null
  error: Error | null
  count: number | null
}

/** Lista paginada retornada por .select() */
export type ListResult<T> = {
  data: T[]
  error: Error | null
  count: number | null
}

/** Método de inserção resultado */
export type InsertResult = {
  data: any | null
  error: Error | null
}

/** Método de atualização resultado */
export type UpdateResult = {
  data: any | null
  error: Error | null
}

/** Método de remoção resultado */
export type DeleteResult = {
  data: any | null
  error: Error | null
}