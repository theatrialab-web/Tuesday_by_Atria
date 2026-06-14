import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useBilling(workspaceId) {
  const { user } = useAuth()
  const [billing, setBilling] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('workspace_billing').select('*').eq('workspace_id', workspaceId).maybeSingle(),
      supabase.from('workspace_payments').select('*').eq('workspace_id', workspaceId).order('paid_on', { ascending: false }),
    ])
    setBilling(b || null)
    setPayments(p || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const saveBilling = async (patch) => {
    const row = { workspace_id: workspaceId, ...patch, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('workspace_billing')
      .upsert(row, { onConflict: 'workspace_id' })
      .select()
      .single()
    if (error) throw error
    setBilling(data)
    return data
  }

  const addPayment = async ({ amount, paid_on, note }) => {
    const { data, error } = await supabase
      .from('workspace_payments')
      .insert({ workspace_id: workspaceId, amount, paid_on, note: note || null, created_by: user?.id })
      .select()
      .single()
    if (error) throw error
    setPayments(ps => [data, ...ps])
    return data
  }

  const deletePayment = async (id) => {
    setPayments(ps => ps.filter(p => p.id !== id))
    const { error } = await supabase.from('workspace_payments').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  const totals = useMemo(() => {
    const total = Number(billing?.total_amount || 0)
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const remaining = Math.max(0, total - paid)
    let daysLeft = null
    if (billing?.due_date) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const [y, m, d] = billing.due_date.split('-').map(Number)
      const due = new Date(y, m - 1, d)
      daysLeft = Math.round((due - today) / 86400000)
    }
    // "Sigue pendiente" si no está marcado como pagado y aún falta saldo.
    const isPending = (billing?.status || 'pending') !== 'paid' && remaining > 0
    return { total, paid, remaining, daysLeft, isPending, fullyPaid: total > 0 && remaining === 0 }
  }, [billing, payments])

  return { billing, payments, loading, totals, saveBilling, addPayment, deletePayment, refetch: fetchAll }
}
