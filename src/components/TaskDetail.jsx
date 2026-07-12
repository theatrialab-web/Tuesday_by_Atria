import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, Send, Trash2, FileText, Plus, PanelRightClose, Bold, Italic, Strikethrough, Pencil, ExternalLink, Maximize2, Bell } from 'lucide-react'
import { Modal, Avatar, Checkbox } from './ui'
import { ReminderModal } from './ReminderModal'
import { useReminders } from '../hooks/useReminders'
import { renderRich, wrapSelection, insertAtCursor } from '../lib/richtext'
import { EmojiPicker } from './EmojiPicker'
import { CellValue } from './TableView'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function Subtasks({ task, subtasksOf, createTask, updateTask, deleteTask, setValue, onOpenTask, columns, values, members }) {
  const subs = subtasksOf(task.id)
  const [draft, setDraft] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const done = subs.filter(s => s.completed).length
  const pct = subs.length ? Math.round((done / subs.length) * 100) : 0

  const saveName = (s) => {
    const v = editName.trim()
    if (v && v !== s.title) updateTask(s.id, { title: v })
    setEditId(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-2">Subtareas</h3>
        {subs.length > 0 && <span className="text-xs text-2 font-medium">{pct}%</span>}
      </div>
      {subs.length > 0 && (
        <div className="h-1.5 rounded-full surface-2 overflow-hidden mb-2.5">
          <div className="h-full bg-[#00C875] transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="flex flex-col">
        {subs.map(s => (
          <div key={s.id} className="py-2 group border-b hairline last:border-0">
            <div className="flex items-center gap-2.5">
              <Checkbox green size={16} checked={s.completed}
                onChange={() => updateTask(s.id, { completed: !s.completed })} ariaLabel="Completar subtarea" />
              {editId === s.id ? (
                <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  onBlur={() => saveName(s)}
                  onKeyDown={e => { if (e.key === 'Enter') saveName(s); if (e.key === 'Escape') setEditId(null) }}
                  className="flex-1 min-w-0 bg-transparent text-sm font-medium outline-none border-b border-brand" />
              ) : (
                <button onClick={() => { setEditId(s.id); setEditName(s.title) }}
                  className={`text-sm flex-1 min-w-0 truncate text-left ${s.completed ? 'line-through text-2' : ''}`}>
                  {s.title}
                </button>
              )}
              <button onClick={() => onOpenTask?.(s.id)} aria-label="Abrir subtarea"
                className="sm:opacity-0 group-hover:opacity-100 text-2 hover:text-brand dark:hover:text-brand-light shrink-0" title="Abrir (comentarios y detalle)">
                <Maximize2 size={14} />
              </button>
              <button onClick={() => deleteTask(s.id)} aria-label="Eliminar subtarea"
                className="sm:opacity-0 group-hover:opacity-100 text-2 hover:text-[#E2445C] shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
            {columns?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 pl-[26px]">
                {columns.map(c => (
                  <CellValue key={c.id} column={c} value={values?.[s.id]?.[c.id] ?? null}
                    members={members} small onChange={(v) => setValue(s.id, c.id, v)} />
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="flex items-center gap-2.5 py-2">
          <Plus size={15} className="text-2" />
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && draft.trim()) {
                createTask(draft.trim(), task.id)
                setDraft('')
              }
            }}
            placeholder="Agregar subtarea"
            className="flex-1 bg-transparent text-sm placeholder:text-2" />
        </div>
      </div>
    </section>
  )
}

function FormatToolbar({ targetRef, onApply }) {
  const apply = (marker) => {
    const el = targetRef.current
    if (!el) return
    const { next, selStart, selEnd } = wrapSelection(el, marker)
    onApply(next, selStart, selEnd)
  }
  const insertEmoji = (emoji) => {
    const el = targetRef.current
    if (!el) return
    const { next, selStart, selEnd } = insertAtCursor(el, emoji)
    onApply(next, selStart, selEnd)
  }
  const btn = 'w-7 h-7 rounded-md surface hover:surface-2 text-2 flex items-center justify-center'
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => apply('**')} className={btn} aria-label="Negrita"><Bold size={13} /></button>
      <button type="button" onClick={() => apply('_')} className={btn} aria-label="Cursiva"><Italic size={13} /></button>
      <button type="button" onClick={() => apply('~~')} className={btn} aria-label="Tachado"><Strikethrough size={13} /></button>
      <EmojiPicker onPick={insertEmoji} />
    </div>
  )
}

function Comments({ task, boardId, members }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [draft, setDraft] = useState('')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [editMentionQuery, setEditMentionQuery] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const inputRef = useRef(null)
  const editRef = useRef(null)
  const memberNames = members.map(m => m.full_name || m.email)

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, avatar_url)')
      .eq('task_id', task.id)
      .order('created_at')
    setComments(data || [])
  }
  useEffect(() => { fetchComments() }, [task.id])

  useEffect(() => {
    const channel = supabase.channel(`comments-${task.id}-${Math.random().toString(36).slice(2)}`)
    channel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${task.id}` },
        () => fetchComments())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [task.id])

  const onDraftChange = (e) => {
    const text = e.target.value
    setDraft(text)
    const m = text.slice(0, e.target.selectionStart).match(/@([\wáéíóúñ]*)$/i)
    setMentionQuery(m ? m[1].toLowerCase() : null)
  }

  const insertMention = (member) => {
    const name = member.full_name || member.email
    setDraft(d => d.replace(/@[\wáéíóúñ]*$/i, `@${name} `))
    setMentionQuery(null)
    inputRef.current?.focus()
  }

  const onEditDraftChange = (e) => {
    const text = e.target.value
    setEditDraft(text)
    const m = text.slice(0, e.target.selectionStart).match(/@([\wáéíóúñ]*)$/i)
    setEditMentionQuery(m ? m[1].toLowerCase() : null)
  }

  const insertMentionEdit = (member) => {
    const name = member.full_name || member.email
    setEditDraft(d => d.replace(/@[\wáéíóúñ]*$/i, `@${name} `))
    setEditMentionQuery(null)
    editRef.current?.focus()
  }

  const mentionsIn = (content) =>
    members.filter(m => content.includes(`@${m.full_name || m.email}`)).map(m => m.id)

  const send = async () => {
    const content = draft.trim()
    if (!content) return
    setDraft('')
    const { error } = await supabase.from('comments').insert({
      task_id: task.id, board_id: boardId, user_id: user.id,
      content, mentioned_user_ids: mentionsIn(content),
    })
    if (!error) fetchComments()
  }

  const startEdit = (c) => { setEditingId(c.id); setEditDraft(c.content); setEditMentionQuery(null) }

  const saveEdit = async (c) => {
    const content = editDraft.trim()
    if (!content) return
    setEditingId(null)
    const { error } = await supabase.from('comments')
      .update({ content, mentioned_user_ids: mentionsIn(content), updated_at: new Date().toISOString() })
      .eq('id', c.id)
    if (!error) fetchComments()
  }

  const remove = async (c) => {
    if (!window.confirm('¿Eliminar este comentario?')) return
    await supabase.from('comments').delete().eq('id', c.id)
    setComments(cs => cs.filter(x => x.id !== c.id))
  }

  const applyToDraft = (next, s, e) => {
    setDraft(next)
    requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(s, e) })
  }
  const applyToEdit = (next, s, e) => {
    setEditDraft(next)
    requestAnimationFrame(() => { editRef.current?.focus(); editRef.current?.setSelectionRange(s, e) })
  }

  // Atajos: Cmd/Ctrl+B negrita, Cmd/Ctrl+I cursiva, Cmd/Ctrl+Shift+S (o X) tachado
  const handleShortcut = (e, ref, apply) => {
    const mod = e.metaKey || e.ctrlKey
    if (!mod) return false
    const k = e.key.toLowerCase()
    let marker = null
    if (k === 'b' && !e.shiftKey) marker = '**'
    else if (k === 'i' && !e.shiftKey) marker = '_'
    else if ((k === 'x' || k === 's') && e.shiftKey) marker = '~~'
    if (!marker || !ref.current) return false
    e.preventDefault()
    e.stopPropagation()
    const { next, selStart, selEnd } = wrapSelection(ref.current, marker)
    apply(next, selStart, selEnd)
    return true
  }

  // Editor en vivo: el texto se ve formateado mientras escribes (marcadores atenuados).
  // Un div renderizado detras y un textarea transparente encima, con las mismas metricas.
  const renderLive = (text) => {
    let t = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    t = t.replace(/\b(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, '<span class="rt-u">$1</span>')
    t = t.replace(/\*\*([^*\n]+)\*\*/g, '<span class="rt-dim">**</span><span class="rt-b">$1</span><span class="rt-dim">**</span>')
    t = t.replace(/~~([^~\n]+)~~/g, '<span class="rt-dim">~~</span><span class="rt-s">$1</span><span class="rt-dim">~~</span>')
    t = t.replace(/_([^_\n]+)_/g, '<span class="rt-dim">_</span><span class="rt-i">$1</span><span class="rt-dim">_</span>')
    for (const name of memberNames) {
      if (!name) continue
      const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      t = t.replace(new RegExp('@' + esc, 'g'), '<span class="rt-m">@' + name + '</span>')
    }
    return t
  }

  const RichArea = ({ inputRef: ref, value, onChange, onKeyDown, placeholder }) => (
    <div className="rt-live flex-1 min-w-0">
      <div aria-hidden className="rt-live__render text-sm min-h-[24px] max-h-72 overflow-hidden">
        {value
          ? <span dangerouslySetInnerHTML={{ __html: renderLive(value) + '\n' }} />
          : <span className="text-2">{placeholder}</span>}
      </div>
      <textarea ref={ref} value={value} onChange={onChange} onKeyDown={onKeyDown}
        onScroll={(e) => { const r = e.target.parentElement.firstChild; if (r) r.scrollTop = e.target.scrollTop }}
        className="rt-live__input text-sm outline-none overflow-y-auto" aria-label={placeholder} />
    </div>
  )

  const suggestions = mentionQuery !== null
    ? members.filter(m => (m.full_name || m.email || '').toLowerCase().includes(mentionQuery)).slice(0, 5)
    : []
  const editSuggestions = editMentionQuery !== null
    ? members.filter(m => (m.full_name || m.email || '').toLowerCase().includes(editMentionQuery)).slice(0, 5)
    : []

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-2 mb-2">Comentarios</h3>
      <div className="flex flex-col gap-3 mb-3">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5 group">
            <Avatar profile={c.profiles} size={28} />
            <div className="flex-1 min-w-0">
              <p className="text-xs flex items-center gap-1.5">
                <span className="font-semibold">{c.profiles?.full_name || 'Usuario'}</span>
                <span className="text-2">{new Date(c.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {c.updated_at && <span className="text-2 italic">· editado</span>}
              </p>
              {editingId === c.id ? (
                <div className="mt-1">
                  <div className="relative">
                    {editSuggestions.length > 0 && (
                      <div className="absolute bottom-full mb-1 left-0 surface border hairline rounded-ios-sm shadow-lg overflow-hidden z-10 w-56">
                        {editSuggestions.map(m => (
                          <button key={m.id} onClick={() => insertMentionEdit(m)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:surface-2 text-left">
                            <Avatar profile={m} size={22} />
                            <span className="text-sm truncate">{m.full_name || m.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="surface-2 rounded-ios-sm px-3 py-2">
                      <FormatToolbar targetRef={editRef} onApply={applyToEdit} />
                      <div className="mt-1.5">
                        {RichArea({ inputRef: editRef, value: editDraft, onChange: onEditDraftChange,
                          onKeyDown: e => handleShortcut(e, editRef, applyToEdit),
                          placeholder: 'Editar comentario…' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    <button onClick={() => saveEdit(c)} className="text-xs font-semibold px-3 py-1.5 rounded-ios-sm btn-brand">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-ios-sm surface-2 text-2">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-sm break-words flex-1"
                    dangerouslySetInnerHTML={{ __html: renderRich(c.content, memberNames) }} />
                  {c.user_id === user.id && (
                    <span className="flex gap-1 sm:opacity-0 group-hover:opacity-100 shrink-0">
                      <button onClick={() => startEdit(c)} aria-label="Editar" className="text-2 hover:text-brand dark:hover:text-brand-light"><Pencil size={13} /></button>
                      <button onClick={() => remove(c)} aria-label="Eliminar" className="text-2 hover:text-[#E2445C]"><Trash2 size={13} /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-xs text-2">Escribe el primer comentario. Usa @ para mencionar.</p>}
      </div>
      <div className="relative">
        {suggestions.length > 0 && (
          <div className="absolute bottom-full mb-1 left-0 surface border hairline rounded-ios-sm shadow-lg overflow-hidden z-10 w-56">
            {suggestions.map(m => (
              <button key={m.id} onClick={() => insertMention(m)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:surface-2 text-left">
                <Avatar profile={m} size={22} />
                <span className="text-sm truncate">{m.full_name || m.email}</span>
              </button>
            ))}
          </div>
        )}
        <div className="surface-2 rounded-ios-sm px-3 py-2">
          <FormatToolbar targetRef={inputRef} onApply={applyToDraft} />
          <div className="flex items-end gap-2 mt-1.5">
            {RichArea({ inputRef, value: draft, onChange: onDraftChange,
              onKeyDown: e => {
                if (handleShortcut(e, inputRef, applyToDraft)) return
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
              },
              placeholder: 'Comentar… (@ menciona · Ctrl+B, Ctrl+I, Ctrl+Shift+S tacha)' })}
            <button onClick={send} disabled={!draft.trim()} aria-label="Enviar comentario"
              className="p-1.5 rounded-full btn-brand disabled:opacity-30">
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Files({ task, boardId }) {
  const { user } = useAuth()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFiles = async () => {
    const { data } = await supabase.from('task_files').select('*').eq('task_id', task.id).order('created_at')
    setFiles(data || [])
  }
  useEffect(() => { fetchFiles() }, [task.id])

  const publicUrl = (path) => supabase.storage.from('task-files').getPublicUrl(path).data.publicUrl

  const upload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Máximo 10 MB por archivo.'); return }
    setUploading(true); setError(null)
    const path = `${boardId}/${task.id}/${Date.now()}-${file.name.replace(/[^\w.\-áéíóúñ ]/gi, '_')}`
    const { error: upErr } = await supabase.storage.from('task-files').upload(path, file)
    if (upErr) { setError(upErr.message); setUploading(false); return }
    await supabase.from('task_files').insert({
      task_id: task.id, board_id: boardId, user_id: user.id,
      file_name: file.name, file_path: path, mime_type: file.type, size: file.size,
    })
    setUploading(false)
    fetchFiles()
  }

  const remove = async (f) => {
    await supabase.storage.from('task-files').remove([f.file_path])
    await supabase.from('task_files').delete().eq('id', f.id)
    setFiles(fs => fs.filter(x => x.id !== f.id))
  }

  const images = files.filter(f => f.mime_type?.startsWith('image/'))
  const docs = files.filter(f => !f.mime_type?.startsWith('image/'))

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-2">Archivos</h3>
        <label className="flex items-center gap-1.5 text-xs font-medium text-brand dark:text-brand-light cursor-pointer">
          <Paperclip size={13} />{uploading ? 'Subiendo…' : 'Adjuntar'}
          <input type="file" className="hidden" onChange={upload} disabled={uploading}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />
        </label>
      </div>
      {error && <p className="text-xs text-[#E2445C] mb-2">{error}</p>}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {images.map(f => (
            <div key={f.id} className="relative group aspect-square">
              <a href={publicUrl(f.file_path)} target="_blank" rel="noreferrer">
                <img src={publicUrl(f.file_path)} alt={f.file_name}
                  className="w-full h-full object-cover rounded-ios-sm border hairline" />
              </a>
              <button onClick={() => remove(f)} aria-label="Eliminar imagen"
                className="absolute top-1 right-1 p-1 rounded-full bg-black/55 text-white opacity-0 group-hover:opacity-100">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {docs.map(f => (
          <div key={f.id} className="flex items-center gap-2.5 surface-2 rounded-ios-sm px-3 py-2 group">
            <FileText size={16} className="text-2 shrink-0" />
            <a href={publicUrl(f.file_path)} target="_blank" rel="noreferrer"
              className="text-sm flex-1 truncate hover:underline">{f.file_name}</a>
            <span className="text-[10px] text-2">{(f.size / 1024).toFixed(0)} KB</span>
            <button onClick={() => remove(f)} aria-label="Eliminar archivo"
              className="sm:opacity-0 group-hover:opacity-100 text-2 hover:text-[#E2445C]">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      {files.length === 0 && !error && <p className="text-xs text-2">Sin archivos. Adjunta imágenes o documentos.</p>}
    </section>
  )
}

export function TaskDetail({ task, board, columns, values, members, subtasksOf, createTask, updateTask, deleteTask, setValue, onClose, onEditColumn, onOpenTask, isMobile = false, width = 460, onResize, linkToBoard = true }) {
  const navigate = useNavigate()
  const { items: reminders, createReminder, deleteReminder } = useReminders()
  const [title, setTitle] = useState(task?.title || '')
  const [reminderOpen, setReminderOpen] = useState(false)
  useEffect(() => { setTitle(task?.title || '') }, [task?.id])

  useEffect(() => {
    if (!task) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [task, onClose])

  if (!task) return null

  const body = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {board?.id && (linkToBoard ? (
          <button onClick={() => { onClose?.(); navigate(`/board/${board.id}`) }}
            className="self-start inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-brand dark:text-brand-light">
            <ExternalLink size={11} /> {board.name}
          </button>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-2">{board.name}</span>
        ))}
        <input value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && updateTask(task.id, { title: title.trim() })}
          className="text-xl font-semibold bg-transparent w-full" aria-label="Título de la tarea" placeholder="Título de la tarea" />
        <button onClick={() => setReminderOpen(true)}
          className="self-start mt-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full surface-2 text-xs font-medium text-2 hover:text-1 active:scale-95 transition-transform">
          <Bell size={13} /> Recordarme
        </button>
        {(() => {
          const mine = reminders.filter(r => r.task_id === task.id && !r.fired)
          if (mine.length === 0) return null
          return (
            <div className="mt-2 flex flex-col gap-1.5">
              {mine.map(r => (
                <div key={r.id} className="inline-flex items-center gap-2 self-start rounded-full bg-brand-soft dark:bg-brand-softDark text-brand dark:text-brand-light pl-2.5 pr-1.5 py-1 text-xs font-medium group">
                  <Bell size={12} />
                  <span>{new Date(r.remind_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  <button onClick={() => deleteReminder(r.id)} aria-label="Quitar recordatorio"
                    className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {columns.map(c => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5 border-b hairline">
            <span className="text-sm text-2 shrink-0">{c.name}</span>
            <div className="min-w-0 max-w-full flex justify-end">
              <CellValue column={c} value={values[task.id]?.[c.id] ?? null}
                members={members} onEditColumn={onEditColumn}
                onChange={(v) => setValue(task.id, c.id, v)} />
            </div>
          </div>
        ))}
      </div>

      <Subtasks task={task} subtasksOf={subtasksOf}
        createTask={createTask} updateTask={updateTask} deleteTask={deleteTask} setValue={setValue}
        onOpenTask={onOpenTask} columns={columns} values={values} members={members} />
      <Files task={task} boardId={board.id} />
      <Comments task={task} boardId={board.id} members={members} />

      <button onClick={() => { deleteTask(task.id); onClose() }}
        className="self-start flex items-center gap-1.5 text-sm text-[#E2445C] font-medium">
        <Trash2 size={14} /> Eliminar tarea
      </button>

      <ReminderModal open={reminderOpen} onClose={() => setReminderOpen(false)} defaultTitle={task.title}
        onCreate={({ title: t, remindAt }) => createReminder({ title: t, remindAt, taskId: task.id, boardId: board.id })} />
    </div>
  )

  // Móvil: hoja deslizante (Modal). Desktop: panel lateral derecho fijo.
  if (isMobile) {
    return <Modal open={!!task} onClose={onClose} title="Tarea" wide>{body}</Modal>
  }

  const startResize = (e) => {
    e.preventDefault()
    const onMove = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX
      onResize?.(window.innerWidth - x)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="fixed top-0 right-0 z-50 h-dvh surface border-l hairline shadow-2xl anim-panel flex flex-col"
      style={{ width, maxWidth: '92vw' }}>
      <div onPointerDown={startResize}
        className="absolute left-0 top-0 h-full w-2 -ml-1 cursor-ew-resize group/resize z-10"
        aria-label="Redimensionar panel" role="separator">
        <div className="w-0.5 h-full mx-auto bg-transparent group-hover/resize:bg-brand-light transition-colors" />
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b hairline shrink-0">
        <span className="text-sm font-semibold text-2">Tarea</span>
        <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-full surface-2 text-2 hover:opacity-80">
          <PanelRightClose size={16} />
        </button>
      </div>
      <div className="p-5 overflow-y-auto flex-1">{body}</div>
    </div>
  )
}
