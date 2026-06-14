import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Calcula totales de un ciclo dado sus abonos.
export function cycleTotals(cycle, payments) {
  const total = Number(cycle?.total_amount || 0)
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const remaining = Math.max(0, total - paid)
  let daysLeft = null
  if (cycle?.due_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [y, m, d] = cycle.due_date.split('-').map(Number)
    daysLeft = Math.round((new Date(y, m - 1, d) - today) / 86400000)
  }
  const isPending = (cycle?.status || 'pending') !== 'paid' && remaining > 0
  return { total, paid, remaining, daysLeft, isPending, fullyPaid: total > 0 && remaining === 0 }
}

export function useBilling(workspaceId) {
  const { user } = useAuth()
  const [cycles, setCycles] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('billing_cycles').select('*').eq('workspace_id', workspaceId).order('period_month', { ascending: false }),
      supabase.from('workspace_payments').select('*').eq('workspace_id', workspaceId).order('paid_on', { ascending: false }),
    ])
    setCycles(c || [])
    setPayments(p || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createCycle = async ({ period_month, total_amount, currency, due_date, notes }) => {
    const { data, error } = await supabase.from('billing_cycles')
      .insert({ workspace_id: workspaceId, period_month, total_amount: total_amount || 0, currency: currency || 'EUR', due_date: due_date || null, notes: notes || null, status: 'pending' })
      .select().single()
    if (error) throw error
    setCycles(cs => [data, ...cs].sort((a, b) => (a.period_month < b.period_month ? 1 : -1)))
    return data
  }

  const updateCycle = async (id, patch) => {
    setCycles(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c)))
    const { error } = await supabase.from('billing_cycles').update(patch).eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  const setPaid = async (id, paid) => {
    const patch = { status: paid ? 'paid' : 'pending', paid_date: paid ? new Date().toISOString().slice(0, 10) : null }
    await updateCycle(id, patch)
  }

  const deleteCycle = async (id) => {
    setCycles(cs => cs.filter(c => c.id !== id))
    setPayments(ps => ps.filter(p => p.cycle_id !== id))
    const { error } = await supabase.from('billing_cycles').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  const addPayment = async ({ cycle_id, amount, paid_on, note }) => {
    const { data, error } = await supabase.from('workspace_payments')
      .insert({ workspace_id: workspaceId, cycle_id, amount, paid_on, note: note || null, created_by: user?.id })
      .select().single()
    if (error) throw error
    setPayments(ps => [data, ...ps])
    return data
  }

  const deletePayment = async (id) => {
    setPayments(ps => ps.filter(p => p.id !== id))
    const { error } = await supabase.from('workspace_payments').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  const paymentsByCycle = useMemo(() => {
    const map = {}
    for (const p of payments) { (map[p.cycle_id] = map[p.cycle_id] || []).push(p) }
    return map
  }, [payments])

  const current = cycles[0] || null

  return {
    cycles, payments, paymentsByCycle, current, loading,
    createCycle, updateCycle, setPaid, deleteCycle, addPayment, deletePayment, refetch: fetchAll,
  }
}

// Panel global: todos los ciclos de todos los workspaces del usuario.
export function useAllBilling() {
  const [cycles, setCycles] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('billing_cycles').select('*, workspaces(name, color, icon)').order('due_date', { ascending: true }),
      supabase.from('workspace_payments').select('cycle_id, amount'),
    ])
    setCycles(c || [])
    setPayments(p || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const paidByCycle = useMemo(() => {
    const map = {}
    for (const p of payments) map[p.cycle_id] = (map[p.cycle_id] || 0) + Number(p.amount || 0)
    return map
  }, [payments])

  return { cycles, paidByCycle, loading, refetch: fetchAll }
}
