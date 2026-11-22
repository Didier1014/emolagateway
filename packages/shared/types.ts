/**
 * Tipos TypeScript compartilhados entre frontend (Next.js) e backend (Express).
 * Mantenha estes tipos sincronizados com o schema do Supabase.
 * 
 * Para gerar tipos automaticamente do Supabase:
 *   supabase gen types --pg --schema public --out packages/shared/supabaseTypes.ts
 */

import { supabase } from '../backend/src/supabaseClient.js' // Ajustar import conforme estrutura real

// ---------------------------------------------------------------------------
// USER
// ---------------------------------------------------------------------------

export interface User {
  id: string                    // uuid, primary key, linked to auth.users
  email: string | null          // email do usuário
  name: string | null           // nome completo
  role: 'user' | 'admin'        // função no sistema
  created_at: string            // timestamp ISO
  updated_at: string            // timestamp ISO (pode ser mesmo valor de created_at)
}

// ---------------------------------------------------------------------------
// LEAD
// ---------------------------------------------------------------------------

export interface Lead {
  id: string                    // uuid, primary key
  user_id: string               // uuid, FK → users.id (quem criou o lead)
  title: string                 // título/nome do lead
  email: string | null          // email do lead
  phone: string | null          // telefone do lead
  status: 'new' | 'contacted' | 'qualified' | 'closed' | 'lost' // status do funil
  value?: number                // valor/montante (opcional, em moeda local)
  source?: string               // fonte (website, indicacao, social, etc.)
  notes?: string                // observações livres
  created_at: string            // timestamp ISO
  updated_at: string            // timestamp ISO
}

// ---------------------------------------------------------------------------
// TRANSACTION
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string                    // uuid, primary key
  user_id: string               // uuid, FK → users.id (quem fez a transação)
  lead_id?: string              // uuid, FK → leads.id (lead associado, pode ser null)
  amount: number                // valor da transação
  currency: 'BRL' | 'USD' | 'EUR' | 'MT' | string   // moeda
  status: 'pending' | 'completed' | 'failed' | 'refunded' // status financeiro
  description?: string          // descrição livre
  created_at: string            // timestamp ISO
  updated_at: string            // timestamp ISO
}

// ---------------------------------------------------------------------------
// AUTH SESSION (NextAuth / Supabase Auth)
// ---------------------------------------------------------------------------

export interface AuthSession {
  user: User
  sessionToken: string
  expiresAt: string
  issuedAt: string
}

// ---------------------------------------------------------------------------
// QUERY/PAGINATION OPTIONS (compartilhados)
// ---------------------------------------------------------------------------

export interface LeadQueryOptions {
  status?: string
  source?: string
  user_id?: string
  search?: string      // busca em título ou email
  page?: number        // número da página (para paginação)
  limit?: number       // itens por página
  orderBy?: 'created_at' | 'updated_at' | 'value'
  orderDir?: 'asc' | 'desc'
}

export interface TransactionQueryOptions {
  status?: string
  user_id?: string
  lead_id?: string
  currency?: string
  page?: number
  limit?: number
  orderBy?: 'created_at' | 'updated_at' | 'amount'
  orderDir?: 'asc' | 'desc'
}

// ---------------------------------------------------------------------------
// RESPOSTA DE API PADRÃO (uso em rotas Express)
// ---------------------------------------------------------------------------

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  lastPage: number
  perPage: number
}