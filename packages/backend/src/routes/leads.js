/**
 * Rotas de Leads usando Supabase Client.
 * 
 * Substitui a versão antiga que usava pg (PostgreSQL direto).
 * Agora todas as operações de banco de dados passam pelo Supabase,
 * o que garante RLS (Row Level Security) automático e tipos consistentes.
 */

import { supabase } from '../supabaseClient.js'

/**
 * GET /api/leads
 * Lista os leads do usuário autenticado.
 * 
 * Middleware esperado: req.user.id contém o ID do usuário (do Supabase Auth).
 */
export async function getLeads(req, res) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id) // RLS: só vê seus próprios leads

    if (error) {
      console.error('Erro ao buscar leads:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em getLeads:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * POST /api/leads
 * Cria um novo lead para o usuário autenticado.
 * 
 * Corpo esperado no request:
 * {
 *   title: string,
 *   email: string (opcional),
 *   phone: string (opcional),
 *   source: string (opcional),
 *   notes: string (opcional)
 * }
 */
export async function createLead(req, res) {
  try {
    const { title, email, phone, source, notes } = req.body

    if (!title) {
      return res.status(400).json({ success: false, error: 'Título é obrigatório' })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        user_id: req.user.id,
        title,
        email,
        phone,
        source,
        notes,
        status: 'new',        // Status padrão para leads novos
        created_at: new Date().toISOString()
      }])
      .select() // Retorna o registro inserido
      .single()

    if (error) {
      console.error('Erro ao criar lead:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(201).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em createLead:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * GET /api/leads/:id
 * Busca um lead específico pelo ID (com verificação de propriedade).
 */
export async function getLeadById(req, res) {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id) // Segurança: só pode ver o próprio
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // 'not found'
        return res.status(404).json({ success: false, error: 'Lead não encontrado' })
      }
      console.error('Erro ao buscar lead:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em getLeadById:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * PATCH /api/leads/:id
 * Atualiza um lead existente.
 * Apenas o proprietário do lead pode atualizá-lo (RLS).
 */
export async function updateLead(req, res) {
  try {
    const { id } = req.params
    const updates = req.body // { status, notes, email, phone, ... }

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id) // Segurança RLS
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar lead:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em updateLead:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * DELETE /api/leads/:id
 * Remove um lead (soft delete ou remove permanentemente).
 * Apenas o proprietário pode deletar.
 */
export async function deleteLead(req, res) {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id) // Segurança RLS

    if (error) {
      console.error('Erro ao deletar lead:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data: { id } })
  } catch (err) {
    console.error('Exceção em deleteLead:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// Exporta todas as funções para o roteador Express
export {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead
}