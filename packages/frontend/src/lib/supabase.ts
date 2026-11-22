import { createClient } from '@supabase/ssr'

/**
 * Cliente Supabase para o frontend (Next.js).
 * 
 * Usado em:
 * - Componentes React: para ler/scribir dados
 * - Páginas Next.js: getServerSideProps ou useEffect
 * - Formulários: insert/update de leads/transactions
 * 
 * As chaves vêm das env vars:
 * - NEXT_PUBLIC_SUPABASE_URL (pública, pode ir pro Vercel)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (pública, pode ir pro Vercel)
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)