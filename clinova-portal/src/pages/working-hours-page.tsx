import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearch } from '@tanstack/react-router'
import { Building2, CalendarClock, Clock3, Filter, LoaderCircle, MousePointerClick, PencilLine, Plus, Power, PowerOff, RefreshCw, Save, Timer, Trash2, X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmationDialog from '@/components/confirmation-dialog'
import DoctorWorkspaceShell from '@/components/doctor-workspace-shell'
import Notice from '@/components/notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '@/hooks/use-api'
import { getErrorMessage } from '@/lib/api'
import type { LookupOption } from '@/types/auth'
import type { ClinicSummary } from '@/types/clinic'
import type { CreateWorkingHourRequest, UpdateWorkingHourRequest, WorkingHour } from '@/types/working-hours'

type ScheduleEntry = { clinic: ClinicSummary; workingHour: WorkingHour }
type EditorState = {
  mode: 'create' | 'edit'
  workingHourId?: number
  clinicId: string
  dayId: string
  dayName: string
  startTime: string
  endTime: string
  slotDurationMinutes: string
}
type SaveWorkingHour = {
  clinicId: number
  mode: EditorState['mode']
  workingHourId?: number
  createBody?: CreateWorkingHourRequest
  updateBody?: UpdateWorkingHourRequest
}
type PositionedEntry = ScheduleEntry & { top: number; height: number; left: number; width: number }

const defaultStartTime = '09:00'
const defaultEndTime = '17:00'
const defaultSlotDuration = '30'
const calendarHourHeight = 72

function toApiTime(value: string) { return value.length === 5 ? `${value}:00` : value }
function toInputTime(value: string) { return value.slice(0, 5) }
function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours * 60) + minutes
}
function minutesToInput(value: number) {
  const safeValue = Math.max(0, Math.min(value, (23 * 60) + 59))
  return `${String(Math.floor(safeValue / 60)).padStart(2, '0')}:${String(safeValue % 60).padStart(2, '0')}`
}

function positionEntries(entries: ScheduleEntry[], viewStartMinutes: number): PositionedEntry[] {
  const sorted = [...entries].sort((left, right) => timeToMinutes(left.workingHour.startTime) - timeToMinutes(right.workingHour.startTime))
  const result: PositionedEntry[] = []
  let cluster: ScheduleEntry[] = []
  let clusterEnd = -1
  function flushCluster() {
    if (!cluster.length) return
    const columnEnds: number[] = []
    const assignments = cluster.map((entry) => {
      const start = timeToMinutes(entry.workingHour.startTime)
      const end = timeToMinutes(entry.workingHour.endTime)
      let column = columnEnds.findIndex((columnEnd) => columnEnd <= start)
      if (column < 0) column = columnEnds.length
      columnEnds[column] = end
      return { entry, column, start, end }
    })
    const columnCount = Math.max(1, columnEnds.length)
    assignments.forEach(({ entry, column, start, end }) => result.push({
      ...entry,
      top: ((start - viewStartMinutes) / 60) * calendarHourHeight,
      height: Math.max(34, ((end - start) / 60) * calendarHourHeight - 4),
      left: (column / columnCount) * 100,
      width: 100 / columnCount,
    }))
    cluster = []
    clusterEnd = -1
  }
  sorted.forEach((entry) => {
    const start = timeToMinutes(entry.workingHour.startTime)
    const end = timeToMinutes(entry.workingHour.endTime)
    if (cluster.length && start >= clusterEnd) flushCluster()
    cluster.push(entry)
    clusterEnd = Math.max(clusterEnd, end)
  })
  flushCluster()
  return result
}

export default function WorkingHoursPage() {
  const { t } = useTranslation()
  const api = useApi()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/doctor/working-hours' })
  const [clinicFilter, setClinicFilter] = useState(search.clinicId ? String(search.clinicId) : 'all')
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null)
  const [localError, setLocalError] = useState('')
  const [success, setSuccess] = useState('')

  const clinics = useQuery({ queryKey: ['doctor', 'clinics'], queryFn: () => api.request<ClinicSummary[]>('/api/clinics', {}, { notifyOnError: false }) })
  const days = useQuery({ queryKey: ['lookups', 'days-of-week'], queryFn: () => api.request<LookupOption[]>('/api/lookups/days-of-week', {}, { notifyOnError: false }) })
  const hourQueries = useQueries({
    queries: (clinics.data ?? []).map((clinic) => ({
      queryKey: ['working-hours', clinic.id],
      queryFn: () => api.request<WorkingHour[]>(`/api/working-hours/clinic/${clinic.id}`, {}, { notifyOnError: false }),
    })),
  })

  const orderedDays = useMemo(() => [...(days.data ?? [])].sort((left, right) => left.id - right.id), [days.data])
  const entries = useMemo(() => (clinics.data ?? []).flatMap((clinic, index) => (hourQueries[index]?.data ?? []).map((workingHour) => ({ clinic, workingHour }))), [clinics.data, hourQueries])
  const validClinicFilter = clinicFilter === 'all' || clinics.data?.some((clinic) => String(clinic.id) === clinicFilter) ? clinicFilter : 'all'
  const visibleEntries = useMemo(() => validClinicFilter === 'all' ? entries : entries.filter((entry) => String(entry.clinic.id) === validClinicFilter), [entries, validClinicFilter])
  const configuredKeys = useMemo(() => new Set(entries.map((entry) => `${entry.clinic.id}:${entry.workingHour.day.toLowerCase()}`)), [entries])
  const queryError = clinics.error || days.error || hourQueries.find((query) => query.error)?.error
  const hoursLoading = Boolean(clinics.data?.length) && hourQueries.some((query) => query.isLoading)
  const hoursReady = days.isSuccess && hourQueries.every((query) => query.isSuccess)
  const activeCount = entries.filter((entry) => entry.workingHour.isActive).length
  const weeklyMinutes = entries.filter((entry) => entry.workingHour.isActive).reduce((total, entry) => total + Math.max(0, timeToMinutes(entry.workingHour.endTime) - timeToMinutes(entry.workingHour.startTime)), 0)
  const viewRange = useMemo(() => {
    if (!visibleEntries.length) return { startHour: 8, endHour: 18 }
    const earliest = Math.min(...visibleEntries.map((entry) => timeToMinutes(entry.workingHour.startTime)))
    const latest = Math.max(...visibleEntries.map((entry) => timeToMinutes(entry.workingHour.endTime)))
    return { startHour: Math.max(0, Math.min(8, Math.floor(earliest / 60) - 1)), endHour: Math.min(24, Math.max(18, Math.ceil(latest / 60) + 1)) }
  }, [visibleEntries])
  const calendarHours = Array.from({ length: viewRange.endHour - viewRange.startHour }, (_, index) => viewRange.startHour + index)
  const calendarHeight = calendarHours.length * calendarHourHeight
  const viewStartMinutes = viewRange.startHour * 60
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  function dayLabel(dayName: string) { return t(`workingHours.days.${dayName.toLowerCase()}`, { defaultValue: dayName }) }
  function availableClinics(dayName: string) { return (clinics.data ?? []).filter((clinic) => !configuredKeys.has(`${clinic.id}:${dayName.toLowerCase()}`)) }
  function preferredClinicFor(dayName: string) {
    const available = availableClinics(dayName)
    const preferredId = validClinicFilter !== 'all' ? Number(validClinicFilter) : search.clinicId
    return available.find((clinic) => clinic.id === preferredId) ?? available[0]
  }
  function startCreating(day?: LookupOption, startHour?: number) {
    const targetDay = day ?? orderedDays[0]
    if (!targetDay) return
    const clinic = preferredClinicFor(targetDay.name)
    if (!clinic) { setLocalError(t('workingHours.dayFullyScheduled')); setSuccess(''); return }
    saveWorkingHour.reset()
    setLocalError('')
    setSuccess('')
    setEditor({ mode: 'create', clinicId: String(clinic.id), dayId: String(targetDay.id), dayName: targetDay.name, startTime: startHour == null ? defaultStartTime : minutesToInput(startHour * 60), endTime: startHour == null ? defaultEndTime : minutesToInput((startHour + 1) * 60), slotDurationMinutes: defaultSlotDuration })
  }
  function startEditing(entry: ScheduleEntry) {
    saveWorkingHour.reset()
    setLocalError('')
    setSuccess('')
    setEditor({ mode: 'edit', workingHourId: entry.workingHour.id, clinicId: String(entry.clinic.id), dayId: '', dayName: entry.workingHour.day, startTime: toInputTime(entry.workingHour.startTime), endTime: toInputTime(entry.workingHour.endTime), slotDurationMinutes: String(entry.workingHour.slotDurationMinutes) })
  }

  async function refreshHours(clinicId: number) { await queryClient.invalidateQueries({ queryKey: ['working-hours', clinicId] }) }
  const saveWorkingHour = useMutation({
    mutationFn: (variables: SaveWorkingHour) => variables.mode === 'create'
      ? api.request<string>(`/api/working-hours/clinic/${variables.clinicId}`, { method: 'POST', body: JSON.stringify(variables.createBody) }, { notifyOnError: false })
      : api.request<string>(`/api/working-hours/${variables.workingHourId}/clinic/${variables.clinicId}`, { method: 'PATCH', body: JSON.stringify(variables.updateBody) }, { notifyOnError: false }),
    onSuccess: async (_, variables) => {
      setEditor(null)
      setLocalError('')
      setClinicFilter(String(variables.clinicId))
      setSuccess(t(variables.mode === 'create' ? 'workingHours.createdSuccess' : 'workingHours.updatedSuccess'))
      await refreshHours(variables.clinicId)
    },
  })
  const toggleWorkingHour = useMutation({
    mutationFn: ({ entry }: { entry: ScheduleEntry }) => api.request<string>(`/api/working-hours/${entry.workingHour.id}/clinic/${entry.clinic.id}/${entry.workingHour.isActive ? 'deactivate' : 'activate'}`, { method: 'PATCH' }, { notifyOnError: false }),
    onSuccess: async (_, variables) => {
      setSuccess(t(variables.entry.workingHour.isActive ? 'workingHours.deactivatedSuccess' : 'workingHours.activatedSuccess'))
      await refreshHours(variables.entry.clinic.id)
    },
  })
  const deleteWorkingHour = useMutation({
    mutationFn: ({ entry }: { entry: ScheduleEntry }) => api.request<string>(`/api/working-hours/${entry.workingHour.id}/clinic/${entry.clinic.id}`, { method: 'DELETE' }, { notifyOnError: false }),
    onSuccess: async (_, variables) => {
      setDeleteTarget(null)
      setEditor(null)
      setSuccess(t('workingHours.deletedSuccess'))
      await refreshHours(variables.entry.clinic.id)
    },
  })

  const selectedEntry = editor?.mode === 'edit' ? entries.find((entry) => entry.clinic.id === Number(editor.clinicId) && entry.workingHour.id === editor.workingHourId) : undefined
  const editorClinicOptions = editor?.mode === 'create' ? availableClinics(editor.dayName) : []
  const actionError = saveWorkingHour.error || toggleWorkingHour.error

  function updateEditor<Key extends keyof EditorState>(key: Key, value: EditorState[Key]) { setEditor((current) => current ? { ...current, [key]: value } : current) }
  function updateEditorDay(value: string | null) {
    if (!value) return
    const day = orderedDays.find((item) => String(item.id) === value)
    if (!day) return
    const options = availableClinics(day.name)
    setEditor((current) => current ? { ...current, dayId: value, dayName: day.name, clinicId: options.some((clinic) => String(clinic.id) === current.clinicId) ? current.clinicId : String(options[0]?.id ?? '') } : current)
  }
  function submitEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError('')
    setSuccess('')
    if (!editor || !editor.clinicId || !editor.startTime || !editor.endTime || (editor.mode === 'create' && !editor.dayId)) { setLocalError(t('workingHours.validationRequired')); return }
    if (editor.endTime <= editor.startTime) { setLocalError(t('workingHours.validationTimes')); return }
    const slotDurationMinutes = Number(editor.slotDurationMinutes)
    if (!Number.isInteger(slotDurationMinutes) || slotDurationMinutes < 1 || slotDurationMinutes > 1440) { setLocalError(t('workingHours.validationDuration')); return }
    const timeBody = { startTime: toApiTime(editor.startTime), endTime: toApiTime(editor.endTime), slotDurationMinutes }
    if (editor.mode === 'create') {
      saveWorkingHour.mutate({ clinicId: Number(editor.clinicId), mode: 'create', createBody: { day: Number(editor.dayId), ...timeBody } })
      return
    }
    saveWorkingHour.mutate({ clinicId: Number(editor.clinicId), mode: 'edit', workingHourId: editor.workingHourId, updateBody: timeBody })
  }
  function eventLabel(entry: ScheduleEntry) { return `${entry.clinic.name}, ${toInputTime(entry.workingHour.startTime)} - ${toInputTime(entry.workingHour.endTime)}` }

  return (
    <DoctorWorkspaceShell active="working-hours">
      <div className="mx-auto w-full min-w-0 max-w-7xl p-4 sm:p-6 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase"><CalendarClock className="size-3" />{t('workingHours.eyebrow')}</Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">{t('workingHours.title')}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t('workingHours.calendarDescription')}</p>
          </div>

        </div>

        {clinics.isLoading && <Card className="mt-6 min-h-72 items-center justify-center rounded-3xl border border-border bg-card"><LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" /><p className="text-xs text-muted-foreground">{t('workingHours.loadingClinics')}</p></Card>}
        {clinics.isError && <Card className="mt-6 items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center"><Notice message={getErrorMessage(clinics.error)} /><Button className="mt-3 h-11 rounded-xl text-sm font-bold normal-case" variant="outline" onClick={() => clinics.refetch()}><RefreshCw />{t('workingHours.retry')}</Button></Card>}
        {clinics.data?.length === 0 && (
          <Card className="mt-6 items-center rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5 p-10 text-center sm:p-16">
            <span className="relative grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-inner"><span className="absolute inset-0 rounded-3xl bg-primary/10 motion-safe:animate-ping" /><Building2 className="relative size-9" /></span>
            <h2 className="mt-6 font-heading text-2xl font-bold sm:text-3xl">{t('workingHours.noClinicsTitle')}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t('workingHours.noClinicsDescription')}</p>
            <Button className="mt-5 h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90" render={<Link to="/doctor/clinics/new" />}><Plus />{t('workingHours.createClinic')}</Button>
          </Card>
        )}

        {clinics.data && clinics.data.length > 0 && (
          <div className="mt-6 grid min-w-0 gap-5">
            {(localError || actionError) && <Notice message={localError || getErrorMessage(actionError)} />}
            {success && <Notice tone="success" message={success} />}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card className="flex-col items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:size-12"><Clock3 className="size-5 sm:size-6" /></span>
                <div className="min-w-0">
                  <small className="block truncate text-[9px] font-bold tracking-wider text-muted-foreground uppercase sm:text-[11px]">{t('workingHours.weeklyHours')}</small>
                  <strong className="mt-1 block text-xl leading-none font-bold text-foreground sm:text-3xl">{t('workingHours.hoursValue', { count: Math.round((weeklyMinutes / 60) * 10) / 10 })}</strong>
                </div>
              </Card>
              <Card className="flex-col items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:size-12"><CalendarClock className="size-5 sm:size-6" /></span>
                <div className="min-w-0">
                  <small className="block truncate text-[9px] font-bold tracking-wider text-muted-foreground uppercase sm:text-[11px]">{t('workingHours.activeSchedules')}</small>
                  <strong className="mt-1 block text-xl leading-none font-bold text-foreground sm:text-3xl">{activeCount}</strong>
                </div>
              </Card>
              <Card className="flex-col items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:size-12"><Building2 className="size-5 sm:size-6" /></span>
                <div className="min-w-0">
                  <small className="block truncate text-[9px] font-bold tracking-wider text-muted-foreground uppercase sm:text-[11px]">{t('workingHours.connectedClinics')}</small>
                  <strong className="mt-1 block text-xl leading-none font-bold text-foreground sm:text-3xl">{clinics.data.length}</strong>
                </div>
              </Card>
            </div>

            <div className="grid min-w-0 gap-5">
              <Card className="min-w-0 rounded-2xl border border-border bg-card">
                <CardHeader className="!pb-3 border-b border-border/40">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0"><CardTitle className="flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><CalendarClock className="size-7" /></span>{t('workingHours.calendarTitle')}</CardTitle><p className="mt-3 max-w-2xl rounded-lg bg-primary/[0.04] px-3 py-2 text-xs leading-5 font-medium text-foreground/70 sm:text-[13px]">{t('workingHours.scheduleDescription')}</p></div>
                    <div className="grid min-w-60 gap-1.5">
  <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.clinicFilter')}</Label>
  <Select
    items={[{ value: 'all', label: t('workingHours.allClinics') }, ...clinics.data.map((clinic) => ({ value: String(clinic.id), label: clinic.name }))]}
    value={validClinicFilter}
    onValueChange={(value) => value && setClinicFilter(value)}
  >
    <SelectTrigger className="h-12 w-full gap-2.5 rounded-xl border border-border bg-card px-3.5 text-sm shadow-sm transition-all hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 data-[popup-open]:border-primary/50 data-[popup-open]:ring-2 data-[popup-open]:ring-primary/20">
      <Filter className="size-4 text-primary/70" />
      <span className="h-5 w-px shrink-0 bg-border" />
      <SelectValue className="truncate font-bold text-foreground" />
    </SelectTrigger>
    <SelectContent className="rounded-xl border border-border bg-popover p-1 shadow-lg">
      <SelectItem className="rounded-lg py-2 font-medium" value="all">{t('workingHours.allClinics')}</SelectItem>
      {clinics.data.map((clinic) => <SelectItem className="rounded-lg py-2 font-medium" key={clinic.id} value={String(clinic.id)}>{clinic.name}</SelectItem>)}
    </SelectContent>
  </Select>
</div>
                  </div>
                </CardHeader>
                <CardContent className="min-w-0 p-0">
                  {(hoursLoading || days.isLoading) && <div className="grid min-h-72 place-items-center p-6"><div className="grid justify-items-center gap-3"><LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" /><p className="text-xs text-muted-foreground">{t('workingHours.loading')}</p></div></div>}
                  {queryError && <div className="grid justify-items-start gap-3 p-6"><Notice message={getErrorMessage(queryError)} /><Button variant="outline" className="h-11 rounded-xl text-sm font-bold normal-case" onClick={() => { clinics.refetch(); days.refetch(); hourQueries.forEach((query) => query.refetch()) }}><RefreshCw />{t('workingHours.retry')}</Button></div>}
                  {hoursReady && !queryError && (
                    <>
                      <div className="hidden max-h-[46rem] max-w-full overflow-auto [scrollbar-width:thin] lg:block" dir="ltr">
                        <div className="min-w-[70rem]">
                          <div className="sticky top-0 z-20 grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] border-b border-border bg-card">
                            <div className="grid min-h-20 place-items-center border-e border-border/60 bg-muted/40 text-primary"><Clock3 className="size-5" /></div>
                            {orderedDays.map((day) => {
                              const isToday = day.name.toLowerCase() === todayName
                              const count = visibleEntries.filter((entry) => entry.workingHour.day.toLowerCase() === day.name.toLowerCase()).length
                              return (
                                <div className={`flex min-w-0 items-center justify-between gap-2 border-e border-border/60 px-3 py-3 last:border-e-0 ${isToday ? 'bg-primary/10' : 'bg-muted/40'}`} key={day.id}>
                                  <div className="min-w-0" dir="auto">
                                    <strong className={`block truncate text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>{dayLabel(day.name)}</strong>
                                    <small className="mt-0.5 block text-[10px] font-medium text-muted-foreground">{count} {t('workingHours.schedules')}</small>
                                  </div>
                                  <Button type="button" variant="outline" size="icon" className="size-8 shrink-0 rounded-lg border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" aria-label={t('workingHours.addForDay', { day: dayLabel(day.name) })} onClick={() => startCreating(day)}><Plus className="size-4" /></Button>
                                </div>
                              )
                            })}
                          </div>
                          <div className="relative grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))]" style={{ height: calendarHeight }}>
                            <div className="relative border-e border-border/60 bg-muted/40">
                              {calendarHours.map((hour, index) => <span className="absolute inset-x-0 translate-y-2 pe-3 text-end text-[11px] font-semibold tabular-nums text-muted-foreground" key={hour} style={{ top: index * calendarHourHeight }}>{String(hour).padStart(2, '0')}:00</span>)}
                            </div>
                            {orderedDays.map((day) => {
                              const dayEntries = visibleEntries.filter((entry) => entry.workingHour.day.toLowerCase() === day.name.toLowerCase())
                              const positionedEntries = positionEntries(dayEntries, viewStartMinutes)
                              const isToday = day.name.toLowerCase() === todayName
                              return (
                                <div className={`relative border-e border-border/60 last:border-e-0 ${isToday ? 'bg-primary/[0.04]' : ''}`} key={day.id}>
                                  {calendarHours.map((hour, index) => (
                                    <button type="button" className="group absolute inset-x-0 border-t border-border/60 text-primary transition hover:bg-primary/5 focus-visible:z-10 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30" style={{ top: index * calendarHourHeight, height: calendarHourHeight }} key={hour} aria-label={t('workingHours.addAtTime', { day: dayLabel(day.name), time: `${String(hour).padStart(2, '0')}:00` })} onClick={() => startCreating(day, hour)}>
                                      <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border/30" />
                                      <Plus className="mx-auto size-4 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                                    </button>
                                  ))}
                                  {positionedEntries.map((entry) => (
<button
  type="button"
  className={`group/event absolute z-10 flex flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-start shadow-sm backdrop-blur-sm transition-all duration-200 hover:z-20 hover:-translate-y-0.5 hover:shadow-lg focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${entry.workingHour.isActive ? 'border-primary/25 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/[0.03] hover:border-primary/50' : 'border-dashed border-warm/40 bg-gradient-to-br from-warm/15 via-warm/10 to-warm/[0.03] hover:border-warm/60'}`}
  style={{ top: entry.top + 2, height: entry.height, left: `calc(${entry.left}% + 2px)`, width: `calc(${entry.width}% - 4px)` }}
  key={`${entry.clinic.id}:${entry.workingHour.id}`}
  aria-label={`${t('workingHours.edit')}: ${eventLabel(entry)}`}
  onClick={() => startEditing(entry)}
>
  <span className="flex min-w-0 items-center gap-2">
    <span className={`size-2 shrink-0 rounded-full ${entry.workingHour.isActive ? 'bg-primary shadow-[0_0_0_3px] shadow-primary/20' : 'bg-warm shadow-[0_0_0_3px] shadow-warm/20'}`} />
    <strong className="min-w-0 flex-1 truncate text-xs font-bold text-foreground" dir="auto">{entry.clinic.name}</strong>
    {!entry.workingHour.isActive && <PowerOff className="size-3 shrink-0 text-warm" />}
  </span>
  {entry.height >= 56 && (
    <span className="inline-flex w-fit max-w-full items-center gap-1 rounded-md bg-background/70 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-foreground/80 shadow-sm" dir="ltr">
      <Clock3 className="size-3 shrink-0 text-primary" />
      <span className="truncate">{toInputTime(entry.workingHour.startTime)} - {toInputTime(entry.workingHour.endTime)}</span>
    </span>
  )}
  {entry.height >= 80 && <span className="mt-auto flex items-center gap-1 truncate text-[10px] font-medium text-muted-foreground"><Timer className="size-3 shrink-0" />{t('workingHours.slotDuration', { count: entry.workingHour.slotDurationMinutes })}</span>}
</button>
                                  ))}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 p-4 lg:hidden">
                        <p className="flex items-center gap-2 text-xs leading-5 text-muted-foreground"><MousePointerClick className="size-4 shrink-0 text-primary" />{t('workingHours.mobileHint')}</p>
                        {orderedDays.map((day) => {
                          const dayEntries = visibleEntries.filter((entry) => entry.workingHour.day.toLowerCase() === day.name.toLowerCase()).sort((left, right) => timeToMinutes(left.workingHour.startTime) - timeToMinutes(right.workingHour.startTime))
                          return (
                            <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/35" key={day.id}>
                              <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
                                <div><h3 className="text-sm font-bold">{dayLabel(day.name)}</h3><small className="text-[10px] text-muted-foreground">{dayEntries.length} {t('workingHours.schedules')}</small></div>
                                <Button type="button" variant="outline" className="h-10 rounded-xl px-3 text-xs font-bold normal-case" onClick={() => startCreating(day)}><Plus />{t('workingHours.add')}</Button>
                              </div>
                              <div className="grid gap-2 p-3">
                                {dayEntries.length ? dayEntries.map((entry) => (
                                  <button type="button" className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-start transition hover:border-primary/30 ${entry.workingHour.isActive ? 'border-primary/15 bg-primary/8' : 'border-warm/20 bg-warm/8'}`} key={`${entry.clinic.id}:${entry.workingHour.id}`} onClick={() => startEditing(entry)}>
                                    <span className={`h-12 w-1 shrink-0 rounded-full ${entry.workingHour.isActive ? 'bg-primary' : 'bg-warm'}`} />
                                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-bold">{entry.clinic.name}</strong><small className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-muted-foreground"><span dir="ltr">{toInputTime(entry.workingHour.startTime)} - {toInputTime(entry.workingHour.endTime)}</span><span>·</span><span>{t('workingHours.slotDuration', { count: entry.workingHour.slotDurationMinutes })}</span></small></span>
                                    <PencilLine className="size-4 shrink-0 text-primary" />
                                  </button>
                                )) : <button type="button" className="flex items-center justify-center gap-2 rounded-xl bg-card p-4 text-xs font-bold text-muted-foreground transition hover:bg-primary/5 hover:text-primary" onClick={() => startCreating(day)}><Plus className="size-4" />{t('workingHours.addDay')}</button>}
                              </div>
                            </section>
                          )
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>


      <Dialog open={Boolean(editor)} onOpenChange={(open) => {
        if (!open && !saveWorkingHour.isPending && !toggleWorkingHour.isPending) {
          setEditor(null)
          setLocalError('')
          saveWorkingHour.reset()
          toggleWorkingHour.reset()
        }
      }}>
<DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-3xl border border-border bg-card p-0 text-card-foreground shadow-2xl sm:max-w-2xl">
  {editor && (
    <>
      <DialogHeader className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/15 via-primary/[0.06] to-transparent p-6 pe-16 text-start">
        <span className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10"><Clock3 className="size-7" /></span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-sans text-xl font-bold normal-case tracking-normal sm:text-2xl">{t(editor.mode === 'create' ? 'workingHours.newAvailability' : 'workingHours.editAvailability')}</DialogTitle>
            <DialogDescription className="mt-1 text-start text-xs leading-6 sm:text-sm">{t('workingHours.editorDescription')}</DialogDescription>
          </div>

        </div>
      </DialogHeader>

      <div className="grid gap-6 p-6">
        {(localError || saveWorkingHour.error || toggleWorkingHour.error) && <Notice message={localError || getErrorMessage(saveWorkingHour.error || toggleWorkingHour.error)} />}
        <form className="grid min-w-0 gap-6" onSubmit={submitEditor}>
          <div className="grid gap-2.5">
            <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.day')}</Label>
            {editor.mode === 'create' ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {orderedDays.map((day) => {
                  const selected = String(day.id) === editor.dayId
                  const unavailable = !availableClinics(day.name).length
                  return (
                    <button
                      type="button"
                      key={day.id}
                      disabled={unavailable}
                      aria-pressed={selected}
                      onClick={() => updateEditorDay(String(day.id))}
                      className={`h-11 cursor-pointer truncate rounded-xl border px-1 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25' : 'border-border bg-background/40 text-foreground/80 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5'}`}
                    >
                      {dayLabel(day.name)}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-12 items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 text-sm font-bold"><CalendarClock className="size-4 text-primary" />{dayLabel(editor.dayName)}</div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2.5">
              <Label htmlFor="workingHourStart" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.startTime')}</Label>
              <input id="workingHourStart" type="time" step={60} required value={editor.startTime} onChange={(event) => updateEditor('startTime', event.target.value)} className="h-12 w-full cursor-pointer rounded-xl border border-border bg-background/40 px-3.5 text-sm font-bold tabular-nums shadow-sm outline-none transition-all hover:border-primary/40 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20" />
            </div>
            <div className="grid gap-2.5">
              <Label htmlFor="workingHourEnd" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.endTime')}</Label>
              <input id="workingHourEnd" type="time" step={60} required value={editor.endTime} onChange={(event) => updateEditor('endTime', event.target.value)} className="h-12 w-full cursor-pointer rounded-xl border border-border bg-background/40 px-3.5 text-sm font-bold tabular-nums shadow-sm outline-none transition-all hover:border-primary/40 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20" />
            </div>
          </div>

          <div className="grid gap-2.5">
            <Label htmlFor="workingHourDuration" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.slotMinutes')}</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input id="workingHourDuration" type="number" min={1} max={1440} step={1} required value={editor.slotDurationMinutes} onChange={(event) => updateEditor('slotDurationMinutes', event.target.value)} className="h-12 w-28 rounded-xl border border-border bg-background/40 px-3.5 text-sm font-bold tabular-nums shadow-sm outline-none transition-all hover:border-primary/40 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20" />
              {[15, 30, 45, 60].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  aria-pressed={editor.slotDurationMinutes === String(minutes)}
                  onClick={() => updateEditor('slotDurationMinutes', String(minutes))}
                  className={`h-10 min-w-12 cursor-pointer rounded-full border px-3.5 text-xs font-bold tabular-nums transition-all ${editor.slotDurationMinutes === String(minutes) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-primary'}`}
                >
                  {minutes}
                </button>
              ))}
            </div>
          </div>

          <div className={`grid gap-4 ${selectedEntry ? 'sm:grid-cols-2' : ''}`}>
            <div className="grid min-w-0 content-start gap-2.5">
              <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.clinicLabel')}</Label>
              {editor.mode === 'create' ? (
                <Select items={editorClinicOptions.map((clinic) => ({ value: String(clinic.id), label: clinic.name }))} value={editor.clinicId || null} onValueChange={(value) => value && updateEditor('clinicId', value)}>
                  <SelectTrigger className="h-12 w-full cursor-pointer gap-2.5 rounded-xl border border-border bg-background/40 px-3.5 text-sm shadow-sm transition-all hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 data-[popup-open]:border-primary/50 data-[popup-open]:ring-2 data-[popup-open]:ring-primary/20">
                    <Building2 className="size-4 text-primary/70" />
                    <span className="h-5 w-px shrink-0 bg-border" />
                    <SelectValue className="truncate font-bold text-foreground" placeholder={t('workingHours.chooseClinic')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border bg-popover p-1 shadow-lg">{editorClinicOptions.map((clinic) => <SelectItem className="cursor-pointer rounded-lg py-2 font-medium" key={clinic.id} value={String(clinic.id)}>{clinic.name}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <div className="flex h-12 items-center gap-2.5 rounded-xl border border-border bg-background/40 px-3.5 text-sm font-bold"><Building2 className="size-4 shrink-0 text-primary" /><span className="truncate">{selectedEntry?.clinic.name}</span></div>
              )}
            </div>

            {selectedEntry && (
              <div className="grid min-w-0 content-start gap-2.5">
                <Label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{t('workingHours.status', { defaultValue: 'Status' })}</Label>
                <div
                  title={selectedEntry.workingHour.isActive ? t('workingHours.statusActiveHint', { defaultValue: 'This schedule is accepting appointments.' }) : t('workingHours.statusInactiveHint', { defaultValue: 'This schedule is paused and not accepting appointments.' })}
                  className={`flex h-12 items-center justify-between gap-3 rounded-xl border px-3.5 transition-colors ${selectedEntry.workingHour.isActive ? 'border-primary/20 bg-primary/5' : 'border-warm/30 bg-warm/10'}`}
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-sm font-bold">
                    <span className={`size-2 shrink-0 rounded-full ${selectedEntry.workingHour.isActive ? 'bg-primary shadow-[0_0_0_3px] shadow-primary/20' : 'bg-warm shadow-[0_0_0_3px] shadow-warm/20'}`} />
                    <span className="truncate">{selectedEntry.workingHour.isActive ? t('workingHours.statusActive', { defaultValue: 'Active' }) : t('workingHours.statusInactive', { defaultValue: 'Inactive' })}</span>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={selectedEntry.workingHour.isActive}
                    aria-label={t(selectedEntry.workingHour.isActive ? 'workingHours.deactivate' : 'workingHours.activate')}
                    disabled={toggleWorkingHour.isPending || deleteWorkingHour.isPending || saveWorkingHour.isPending}
                    onClick={() => toggleWorkingHour.mutate({ entry: selectedEntry })}
                    className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60 ${selectedEntry.workingHour.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`absolute top-0.5 grid size-6 place-items-center rounded-full bg-white shadow-md transition-all duration-200 ${selectedEntry.workingHour.isActive ? 'start-[1.375rem]' : 'start-0.5'}`}>
                      {toggleWorkingHour.isPending && <LoaderCircle className="size-3.5 animate-spin text-primary motion-reduce:animate-none" />}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {editor.startTime && editor.endTime && editor.endTime > editor.startTime && Number(editor.slotDurationMinutes) > 0 && (
            <div className="grid grid-cols-3 divide-x divide-primary/15 overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-primary/[0.04] to-transparent">
              <div className="grid min-w-0 content-between gap-2 px-3 py-3 sm:px-4">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"><Clock3 className="size-3.5 shrink-0 text-primary" /><span className="truncate">{t('workingHours.summaryHours', { defaultValue: 'Working hours' })}</span></span>
                <strong className="truncate text-sm font-bold tabular-nums sm:text-base" dir="ltr">{editor.startTime} - {editor.endTime}</strong>
              </div>
              <div className="grid min-w-0 content-between gap-2 px-3 py-3 sm:px-4">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"><Timer className="size-3.5 shrink-0 text-primary" /><span className="truncate">{t('workingHours.summaryDuration', { defaultValue: 'Per appointment' })}</span></span>
                <strong className="truncate text-sm font-bold tabular-nums sm:text-base">{t('workingHours.minutesShort', { count: Number(editor.slotDurationMinutes), defaultValue: '{{count}} min' })}</strong>
              </div>
              <div className="grid min-w-0 content-between gap-2 bg-primary/[0.06] px-3 py-3 sm:px-4">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase"><CalendarClock className="size-3.5 shrink-0 text-primary" /><span className="truncate">{t('workingHours.summarySlots', { defaultValue: 'Appointments' })}</span></span>
                <strong className="text-2xl leading-none font-bold tabular-nums text-primary">{Math.floor((timeToMinutes(editor.endTime) - timeToMinutes(editor.startTime)) / Number(editor.slotDurationMinutes))}</strong>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
            {selectedEntry ? (
              <button
                type="button"
                title={t('workingHours.delete')}
                aria-label={t('workingHours.delete')}
                disabled={toggleWorkingHour.isPending || deleteWorkingHour.isPending || saveWorkingHour.isPending}
                onClick={() => { deleteWorkingHour.reset(); setSuccess(''); setEditor(null); setDeleteTarget(selectedEntry) }}
                className="group/delete flex h-11 cursor-pointer items-center self-start overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 text-destructive transition-all duration-300 hover:border-destructive hover:bg-destructive hover:text-white hover:shadow-md hover:shadow-destructive/25 focus-visible:border-destructive focus-visible:bg-destructive focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              >
                <Trash2 className="size-[18px] shrink-0 transition-transform duration-300 group-hover/delete:-rotate-12 group-hover/delete:scale-110 group-focus-visible/delete:-rotate-12" />
                <span className="ms-2 max-w-40 overflow-hidden text-sm font-bold whitespace-nowrap opacity-100 transition-all duration-300 sm:ms-0 sm:max-w-0 sm:opacity-0 sm:group-hover/delete:ms-2 sm:group-hover/delete:max-w-40 sm:group-hover/delete:opacity-100 sm:group-focus-visible/delete:ms-2 sm:group-focus-visible/delete:max-w-40 sm:group-focus-visible/delete:opacity-100">{t('workingHours.delete')}</span>
              </button>
            ) : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 cursor-pointer rounded-xl text-sm font-bold normal-case disabled:cursor-not-allowed" disabled={saveWorkingHour.isPending} onClick={() => { setEditor(null); setLocalError(''); saveWorkingHour.reset() }}><X />{t('workingHours.cancel')}</Button>
              <Button type="submit" className="h-11 cursor-pointer rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 disabled:cursor-not-allowed" disabled={saveWorkingHour.isPending || !editor.clinicId}>{saveWorkingHour.isPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Save />}{t(editor.mode === 'create' ? 'workingHours.create' : 'workingHours.save')}</Button>
            </div>
          </div>
        </form>
      </div>
    </>
  )}
</DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={t('workingHours.deleteConfirmTitle')}
        description={t('workingHours.deleteConfirm', { day: deleteTarget ? dayLabel(deleteTarget.workingHour.day) : '' })}
        confirmLabel={t('workingHours.deleteAction')}
        cancelLabel={t('workingHours.keep')}
        destructive
        pending={deleteWorkingHour.isPending}
        error={deleteWorkingHour.error ? getErrorMessage(deleteWorkingHour.error) : undefined}
        onOpenChange={(open) => { if (!open && !deleteWorkingHour.isPending) { setDeleteTarget(null); deleteWorkingHour.reset() } }}
        onConfirm={() => { if (deleteTarget) deleteWorkingHour.mutate({ entry: deleteTarget }) }}
      />
    </DoctorWorkspaceShell>
  )
}