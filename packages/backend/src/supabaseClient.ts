import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'

/**
 * Cria um cliente Supabase configurado para o ambiente Next.js/server-side.
 * Este cliente usa as credenciais públicas (anon key) e gerencia cookies automaticamente
 * para sessões autenticadas em rotas API e servidor-side rendering.
 */
export function createSupabaseClient(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lê os cookies da request entrante (definidos pelo navegador ou proxy)
        getAll() {
          return request.cookies
        },

        // Define cookies na resposta (usado pelo Next.js para setar sessão)
        setAll(cookiesToSet: CookieOptions[]) {
          const response = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value)
            if (options) {
              if (options.expires) {
                response.cookies.set('Path', options.path)
                response.cookies.set('Domain', options.domain)
                response.cookies.set('SameSite', options.sameSite)
                response.cookies.set('Secure', options.secure?.toString() ?? 'false')
                response.cookies.set('Max-Age', options.maxAge?.toString() ?? '')
              }
            }
          })
          return response
        },
      },
    }
  )
}

/**
 * Cria um cliente Supabase usando a service role key (server-only).
 * Use este cliente no backend Express, funções server-side ou migrations.
 * A service role key contorna o Row Level Security (RLS) do Supabase,
 * então só use em código de confiança (seu próprio backend).
 */
export function createSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida no .env')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type { CookieOptions }