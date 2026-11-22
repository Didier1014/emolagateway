/**
 * Rotas da API principal (emola) usando Supabase Client.
 * 
 * Contém os endpoints principais do sistema:
 * - OTP (one-time password) para login/validação
 * - Login de usuários
 * - Consulta de saldo
 * - Transferências e voucher
 * - Gateway de pagamentos
 * - Check de conta
 */

import { supabase } from '../supabaseClient.js'

// ---------------------------------------------------------------------------
// AUTENTICAÇÃO / OTP
// ---------------------------------------------------------------------------

/**
 * POST /api/emola/request-otp
 * Solicita um código OTP para autenticação.
 * 
 * Corpo: { email: string }
 * 
 * Retorna: { success: true, data: { session_id } }
 */
export async function requestOtp(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email é obrigatório' })
    }

    // Usa a auth do Supabase para enviar OTP por email
    const { data, error } = await supabase.auth.signInWithOtp({
      email
    })

    if (error) {
      console.error('Erro ao solicitar OTP:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em requestOtp:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * POST /api/emola/verify-otp
 * Verifica o código OTP e login o usuário.
 * 
 * Corpo: { email: string, otp: string }
 * 
 * Retorna: { success: true, data: { user } }
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body

    if (!otp) {
      return res.status(400).json({ success: false, error: 'Código OTP é obrigatório' })
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email' // ou 'sms' se usar SMS
    })

    if (error) {
      console.error('Erro ao verificar OTP:', error)
      return res.status(400).json({ success: false, error: error.message })
    }

    // Retorna o usuário logado (pode ser usado para setar sessão no NextAuth)
    return res.status(200).json({ success: true, data: { user: data.user } })
  } catch (err) {
    console.error('Exceção em verifyOtp:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// USUÁRIO / PERFIL
// ---------------------------------------------------------------------------

/**
 * GET /api/emola/user
 * Retorna o perfil do usuário autenticado.
 */
export async function getUser(req, res) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      console.error('Erro ao buscar usuário:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em getUser:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

/**
 * PATCH /api/emola/user
 * Atualiza o perfil do usuário (nome, avatar, etc.).
 */
export async function updateUser(req, res) {
  try {
    const { full_name, avatar_url } = req.body

    const { data, error } = await supabase
      .from('users')
      .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar usuário:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error('Exceção em updateUser:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// SALDO
// ---------------------------------------------------------------------------

/**
 * GET /api/emola/saldo
 * Retorna o saldo atual do usuário.
 * 
 * A tabela de transações é usada para calcular o saldo baseado em
 * entradas e saídas (deposit, withdrawal, transfer).
 */
export async function getSaldo(req, res) {
  try {
    // Busca todas as transações do usuário
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', req.user.id)

    if (txError) {
      console.error('Erro ao buscar transações:', txError)
      return res.status(500).json({ success: false, error: txError.message })
    }

    // Calcula o saldo: soma dos depósitos menos saques/transferências
    let saldo = 0
    if (transactions) {
      transactions.forEach(tx => {
        if (tx.type === 'deposit' || tx.type === 'credit') {
          saldo += tx.amount
        } else {
          // withdrawal, transfer, fee etc.
          saldo -= tx.amount
        }
      })
    }

    return res.status(200).json({ success: true, data: { saldo } })
  } catch (err) {
    console.error('Exceção em getSaldo:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// TRANSFERÊNCIAS
// ---------------------------------------------------------------------------

/**
 * POST /api/emola/transfer
 * Cria uma nova transferência.
 * 
 * Corpo: {
 *   target_email: string,
 *   amount: number,
 *   description: string (opcional)
 * }
 * 
 * Esta é uma transferência simulada/integração com gateway.
 * Em produção real, esta função também chamaria o provedor de pagamento.
 */
export async function createTransfer(req, res) {
  try {
    const { target_email, amount, description } = req.body

    if (!target_email || !amount) {
      return res.status(400).json({ success: false, error: 'Email alvo e valor são obrigatórios' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valor deve ser maior que zero' })
    }

    // 1. Registra a transação no banco
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        lead_id: null, // pode ser associado a um lead se necessário
        amount,
        currency: 'BRL', // ou de configuração
        status: 'pending', // inicial: pending -> completed após gateway confirmar
        description: description || 'Transferência via eMola Gateway',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (txError) {
      console.error('Erro ao registrar transação:', txError)
      return res.status(500).json({ success: false, error: txError.message })
    }

    // 2. Em um sistema real, aqui chamaríamos o gateway de pagamento
    // Por enquanto, marcamos como completed (transferência simulada)
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.data.id)

    return res.status(201).json({ success: true, data: { transactionId: tx.data.id } })
  } catch (err) {
    console.error('Exceção em createTransfer:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// VOUCHER / CÓDIGO PROMOCIONAL
// ---------------------------------------------------------------------------

/**
 * POST /api/emola/voucher
 * Resgata um código de voucher/promocional.
 * 
 * Corpo: { code: string }
 * 
 * Lógica simplificada: verifica se código existe e aplica crédito.
 */
export async function redeemVoucher(req, res) {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ success: false, error: 'Código do voucher é obrigatório' })
    }

    // TODO: Implementar lógica real de validação de voucher
    // Por enquanto, resposta genérica
    return res.status(200).json({ success: true, data: { message: 'Voucher processado (simulado)' } })
  } catch (err) {
    console.error('Exceção em redeemVoucher:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// GATEWAY DE PAGAMENTOS
// ---------------------------------------------------------------------------

/**
 * POST /api/emola/gateway/process
 * Processa um pagamento pelo gateway.
 * 
 * Corpo: { amount: number, payment_method_id: string, ... }
 * 
 * Lógica: registra transação como pending, depois simula confirmação do gateway.
 */
export async function processGateway(req, res) {
  try {
    const { amount, payment_method_id, ...rest } = req.body

    if (!amount) {
      return res.status(400).json({ success: false, error: 'Valor é obrigatório' })
    }

    // 1. Registra transação inicial
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id: req.user.id,
        amount,
        currency: 'BRL',
        status: 'pending',
        description: 'Pagamento via gateway',
        ...rest
      }])
      .select()
      .single()

    if (txError) {
      return res.status(500).json({ success: false, error: txError.message })
    }

    // 2. Simula confirmação do gateway (em produção, seria chamada API do provedor)
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', tx.data.id)

    return res.status(200).json({ success: true, data: { transactionId: tx.data.id, status: 'completed' } })
  } catch (err) {
    console.error('Exceção em processGateway:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// ---------------------------------------------------------------------------
// CHECK DE CONTA
// ---------------------------------------------------------------------------

/**
 * POST /api/emola/check-acc
 * Verifica status da conta do usuário.
 * 
 * Corpo: { account_number: string, agency: string }
 * 
 * Registra um check de conta e retorna status.
 */
export async function checkAcc(req, res) {
  try {
    const { account_number, agency } = req.body

    if (!account_number || !agency) {
      return res.status(400).json({ success: false, error: 'Número da conta e agência são obrigatórios' })
    }

    // Registra o check no banco
    const { data, error } = await supabase
      .from('transactions') // Reutilizando tabela transactions para logs de check
      .insert([{
        user_id: req.user.id,
        amount: 0,
        currency: 'BRL',
        type: 'check',
        status: 'completed',
        description: `Check de conta: ${account_number}/${agency}`,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, data: { checked: true } })
  } catch (err) {
    console.error('Exceção em checkAcc:', err)
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' })
  }
}

// Exporta todas as funções para o roteador Express
export {
  requestOtp,
  verifyOtp,
  getUser,
  updateUser,
  getSaldo,
  createTransfer,
  redeemVoucher,
  processGateway,
  checkAcc
}