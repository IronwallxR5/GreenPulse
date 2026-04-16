import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { projectService } from '../../services/project.service';
import type { ProjectAlert } from '../../services/project.service';
import {
  impactService,
  type ImpactLog,
  type ImpactType,
  type SortBy,
  type SortOrder,
} from '../../services/impact.service';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  ArrowLeft, Plus, Trash2, Cloud, Database, Network, Webhook,
  Loader2, Zap, TrendingUp, Activity, Search, X,
  ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal,
  FileText, FileSpreadsheet, Pencil, Bell, BellOff, ShieldAlert
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const IMPACT_TYPES: ImpactType[] = ['COMPUTE', 'STORAGE', 'NETWORK', 'API_CALL'];

const TYPE_CONFIG: Record<ImpactType, { icon: React.ReactNode; color: string; bg: string }> = {
  COMPUTE:  { icon: <Cloud     className="h-3.5 w-3.5" />, color: 'text-blue-700',   bg: 'bg-blue-50'   },
  STORAGE:  { icon: <Database  className="h-3.5 w-3.5" />, color: 'text-purple-700', bg: 'bg-purple-50' },
  NETWORK:  { icon: <Network   className="h-3.5 w-3.5" />, color: 'text-orange-700', bg: 'bg-orange-50' },
  API_CALL: { icon: <Webhook   className="h-3.5 w-3.5" />, color: 'text-teal-700',   bg: 'bg-teal-50'   },
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt',   label: 'Date' },
  { value: 'carbonScore', label: 'Carbon Score' },
  { value: 'name',        label: 'Name' },
];

const getCarbonIntensity = (score: number) => {
  if (score < 0.01) return { label: 'Very Low', color: 'text-green-600' };
  if (score < 0.1)  return { label: 'Low',      color: 'text-green-500' };
  if (score < 1)    return { label: 'Medium',    color: 'text-yellow-600' };
  return                   { label: 'High',      color: 'text-red-600' };
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id!);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput]     = useState('');
  const [typeFilter,  setTypeFilter]      = useState<ImpactType | ''>('');
  const [sortBy,      setSortBy]          = useState<SortBy>('createdAt');
  const [sortOrder,   setSortOrder]       = useState<SortOrder>('desc');
  const [page,        setPage]            = useState(1);
  const LIMIT = 10;

  // Debounce search so we don't fire on every keystroke
  const search = useDebounce(searchInput, 400);

  // ── Create-event dialog state ────────────────────────────────────────────
  const [open, setOpen]         = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', type: 'COMPUTE' as ImpactType, unitValue: '',
  });
  const [formError, setFormError] = useState('');

  // ── Edit-event dialog state ───────────────────────────────────────────────
  const [editOpen, setEditOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<ImpactLog | null>(null);
  const [editData, setEditData]   = useState({
    name: '', description: '', type: 'COMPUTE' as ImpactType, unitValue: '',
  });
  const [editError, setEditError] = useState('');

  // ── Budget state ────────────────────────────────────────────────────────────
  const [budgetInput, setBudgetInput] = useState('');

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectService.getOne(projectId),
  });

  const { data: summary } = useQuery({
    queryKey: ['projects', projectId, 'summary'],
    queryFn: () => projectService.getSummary(projectId),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['projects', projectId, 'alerts'],
    queryFn: () => projectService.getAlerts(projectId),
  });

  const unreadCount = alerts.filter((a: ProjectAlert) => !a.isRead).length;

  // ✅ All filter params are in the query key → auto-refetches on any change
  const { data: impactsData, isLoading: impactsLoading, isFetching } = useQuery({
    queryKey: ['projects', projectId, 'impacts', { search, typeFilter, sortBy, sortOrder, page }],
    queryFn: () =>
      impactService.getAll(projectId, {
        search:    search      || undefined,
        type:      typeFilter  || undefined,
        sortBy,
        sortOrder,
        page,
        limit: LIMIT,
      }),
    placeholderData: (prev) => prev, // keep old data while fetching (no flash)
  });

  const impacts    = impactsData?.data        ?? [];
  const pagination = impactsData?.pagination;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: any) => impactService.create(projectId, data),
    onSuccess: () => {
      // Invalidate summary + impacts list
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setOpen(false);
      setFormData({ name: '', description: '', type: 'COMPUTE', unitValue: '' });
      setFormError('');
      setPage(1); // go back to first page to see new entry
    },
    onError: (err: any) => {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Failed to log event',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (impactId: number) => impactService.delete(projectId, impactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      if (impacts.length === 1 && page > 1) setPage((p) => p - 1);
    },
  });

  const editMutation = useMutation({
    mutationFn: (payload: { impactId: number; data: any }) =>
      impactService.update(projectId, payload.impactId, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setEditOpen(false);
      setEditTarget(null);
      setEditError('');
    },
    onError: (err: any) => {
      setEditError(
        err.response?.data?.message ??
        err.response?.data?.errors?.[0]?.message ??
        'Failed to update event',
      );
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (format: 'pdf' | 'csv') => projectService.downloadReport(projectId, format),
    onError: (err: any) => {
      console.error('Failed to download report', err);
      alert('Failed to download report. Please try again.');
    }
  });

  const setBudgetMutation = useMutation({
    mutationFn: (budget: number | null) => projectService.setBudget(projectId, budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setBudgetInput('');
    },
  });

  const markAlertsReadMutation = useMutation({
    mutationFn: () => projectService.markAlertsRead(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'alerts'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const unitVal = parseFloat(formData.unitValue);
    if (!formData.name.trim())            return setFormError('Event name is required');
    if (isNaN(unitVal) || unitVal <= 0)   return setFormError('Unit value must be a positive number');
    createMutation.mutate({
      name:        formData.name.trim(),
      description: formData.description.trim() || undefined,
      type:        formData.type,
      unitValue:   unitVal,
    });
  };

  const openEditDialog = (log: ImpactLog) => {
    setEditTarget(log);
    setEditData({
      name:        log.name,
      description: log.description ?? '',
      type:        log.type,
      unitValue:   String(log.unitValue),
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError('');
    const unitVal = parseFloat(editData.unitValue);
    if (!editData.name.trim())           return setEditError('Event name is required');
    if (isNaN(unitVal) || unitVal <= 0)  return setEditError('Unit value must be a positive number');
    editMutation.mutate({
      impactId: editTarget.id,
      data: {
        name:        editData.name.trim(),
        description: editData.description.trim() || undefined,
        type:        editData.type,
        unitValue:   unitVal,
      },
    });
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hasActiveFilters = !!searchInput || !!typeFilter || sortBy !== 'createdAt' || sortOrder !== 'desc';

  const clearFilters = () => {
    setSearchInput('');
    setTypeFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <p className="text-warm-600">Project not found.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4 bg-forest-900 hover:bg-forest-800 text-warm-50">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-warm-200 bg-white hover:bg-warm-100 text-warm-700 transition-colors shadow-warm-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-warm-950">{project.name}</h1>
            {project.description && (
              <p className="text-warm-600 text-sm mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2 text-warm-700 font-medium bg-white hover:bg-warm-100 border-warm-200"
            onClick={() => downloadMutation.mutate('pdf')}
            disabled={downloadMutation.isPending}
          >
            {downloadMutation.isPending && downloadMutation.variables === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 text-red-500" />
            )}
            PDF Report
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-warm-700 font-medium bg-white hover:bg-warm-100 border-warm-200"
            onClick={() => downloadMutation.mutate('csv')}
            disabled={downloadMutation.isPending}
          >
            {downloadMutation.isPending && downloadMutation.variables === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 text-forest-600" />
            )}
            CSV Report
          </Button>
        </div>
      </div>

      {/* ── Summary Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-forest-950 rounded-xl p-5 shadow-warm-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gold-400" />
            </div>
            <span className="text-sm font-medium text-forest-400">Total Carbon</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-50">{summary?.totalCO2.toFixed(3) ?? '—'}</p>
          <p className="text-xs text-forest-500 mt-1">kg CO₂e</p>
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gold-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Total Events</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-950">{summary?.totalLogs ?? 0}</p>
          <p className="text-xs text-warm-500 mt-1">impact logs recorded</p>
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center">
              <Zap className="h-4 w-4 text-warm-700" />
            </div>
            <span className="text-sm font-medium text-warm-600">Top Emitter</span>
          </div>
          {summary?.byType && summary.byType.length > 0 ? (
            <>
              <p className="text-xl font-display font-bold text-warm-950">
                {summary.byType.reduce((a, b) => (a.totalCO2 > b.totalCO2 ? a : b)).type}
              </p>
              <p className="text-xs text-warm-500 mt-1">highest emission source</p>
            </>
          ) : (
            <p className="text-sm text-warm-500 mt-2">No data yet</p>
          )}
        </div>
      </div>

      {/* Breakdown by type */}
      {summary?.byType && summary.byType.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
          <h3 className="font-display text-sm font-semibold text-warm-800 mb-4">Emissions by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.byType.map((b) => {
              const cfg = TYPE_CONFIG[b.type as ImpactType] ?? { icon: null, color: 'text-gray-700', bg: 'bg-gray-50' };
              return (
                <div key={b.type} className={`rounded-lg p-3 ${cfg.bg}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${cfg.color}`}>
                    {cfg.icon}
                    <span className="text-xs font-semibold">{b.type}</span>
                  </div>
                  <p className={`text-lg font-bold ${cfg.color}`}>{b.totalCO2.toFixed(3)}</p>
                  <p className="text-xs text-gray-400">{b.count} events</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Carbon Budget Panel ──────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-gold-600" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-warm-800">Carbon Budget</h3>
              <p className="text-xs text-warm-500">
                {project?.carbonBudget != null
                  ? `Current limit: ${project.carbonBudget.toFixed(2)} kg CO₂e`
                  : 'No budget set — an alert fires when total CO₂ exceeds this threshold'}
              </p>
            </div>
          </div>
          {project?.carbonBudget != null && (
            <button
              onClick={() => setBudgetMutation.mutate(null)}
              disabled={setBudgetMutation.isPending}
              className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
            >
              Clear budget
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Enter CO₂ threshold in kg (e.g. 100)"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            className="h-9 text-sm flex-1 border-warm-200"
          />
          <Button
            onClick={() => {
              const val = parseFloat(budgetInput);
              if (!isNaN(val) && val > 0) setBudgetMutation.mutate(val);
            }}
            disabled={setBudgetMutation.isPending || !budgetInput || parseFloat(budgetInput) <= 0}
            className="bg-gold-500 hover:bg-gold-600 text-white h-9 px-4 text-sm"
          >
            {setBudgetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set Budget'}
          </Button>
        </div>

        {/* Budget progress bar (if budget set and summary loaded) */}
        {project?.carbonBudget != null && summary != null && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-warm-500">Usage</span>
              <span className={`font-semibold ${summary.totalCO2 >= project.carbonBudget ? 'text-red-600' : 'text-forest-600'}`}>
                {((summary.totalCO2 / project.carbonBudget) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  summary.totalCO2 >= project.carbonBudget ? 'bg-red-500' : 'bg-forest-500'
                }`}
                style={{ width: `${Math.min((summary.totalCO2 / project.carbonBudget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-warm-500 mt-1">
              {summary.totalCO2.toFixed(4)} / {project.carbonBudget.toFixed(4)} kg CO₂e
            </p>
          </div>
        )}
      </div>

      {/* ── Alerts Panel ─────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-red-100 shadow-warm-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-red-50 bg-red-50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-red-600" />
              <h3 className="font-display text-sm font-semibold text-red-700">Threshold Alerts</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAlertsReadMutation.mutate()}
                disabled={markAlertsReadMutation.isPending}
                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <BellOff className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="divide-y divide-red-50 max-h-48 overflow-y-auto">
            {alerts.map((alert: ProjectAlert) => (
              <div
                key={alert.id}
                className={`px-5 py-3 flex items-start gap-3 ${!alert.isRead ? 'bg-red-50/40' : ''}`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!alert.isRead ? 'bg-red-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Impact Logs section ─────────────────────────────────────────── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Impact Logs</h2>
            {pagination && (
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {pagination.total}
              </span>
            )}
            {isFetching && !impactsLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-green-500" />
            )}
          </div>

          {/* Log Event dialog */}
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setFormError(''); } }}>
            <DialogTrigger asChild>
              <Button className="bg-forest-900 hover:bg-forest-800 text-warm-50 gap-2 shadow-warm-sm">
                <Plus className="h-4 w-4" />
                Log Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Impact Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Image processing batch"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium">
                    Event Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {IMPACT_TYPES.map((t) => {
                      const cfg = TYPE_CONFIG[t];
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            formData.type === t
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={cfg.color}>{cfg.icon}</span>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium">
                    Unit Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 10.5"
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
                    className="h-10"
                  />
                  <p className="text-xs text-gray-400">
                    kWh for COMPUTE/STORAGE · GB for NETWORK · count for API_CALL
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-700 font-medium">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="Additional context"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full bg-forest-900 hover:bg-forest-800 text-warm-50"
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...</>
                  ) : 'Log Event'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-4 mb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="h-4 w-4 text-warm-400 flex-shrink-0" />
            <span className="text-sm font-medium text-warm-700">Filters</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events by name or description..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="pl-9 h-9 text-sm border-gray-200"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:block">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
                className="h-9 px-3 text-sm border border-warm-200 rounded-md bg-white text-warm-800 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-forest-700"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Descending — click for ascending' : 'Ascending — click for descending'}
                className={`h-9 w-9 flex items-center justify-center rounded-md border text-sm transition-colors ${
                  sortOrder === 'asc'
                    ? 'border-forest-700 bg-forest-50 text-forest-700'
                    : 'border-warm-200 bg-white text-warm-600 hover:border-warm-300'
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setTypeFilter(''); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                typeFilter === ''
                  ? 'bg-forest-900 text-warm-50 border-forest-900'
                  : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
              }`}
            >
              All Types
            </button>
            {IMPACT_TYPES.map((t) => {
              const cfg = TYPE_CONFIG[t];
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.color} border-current`
                      : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <span className={active ? cfg.color : 'text-warm-400'}>{cfg.icon}</span>
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm overflow-hidden">
          {impactsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-forest-600" />
            </div>
          ) : impacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warm-50 mb-3">
                <Activity className="h-6 w-6 text-warm-400" />
              </div>
              <p className="text-warm-700 font-medium">
                {hasActiveFilters ? 'No events match your filters' : 'No impact events yet'}
              </p>
              <p className="text-warm-500 text-sm mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Click "Log Event" to record your first emission'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-forest-700 hover:text-forest-900 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-warm-50">
                  <TableHead className="font-semibold text-warm-700">Event</TableHead>
                  <TableHead className="font-semibold text-warm-700">Type</TableHead>
                  <TableHead className="font-semibold text-warm-700">Unit Value</TableHead>
                  <TableHead className="font-semibold text-warm-700 text-right">Carbon Score</TableHead>
                  <TableHead className="font-semibold text-warm-700">Intensity</TableHead>
                  <TableHead className="font-semibold text-warm-700 hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-[88px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {impacts.map((log: ImpactLog) => {
                  const cfg = TYPE_CONFIG[log.type] ?? { icon: null, color: 'text-warm-700', bg: 'bg-warm-50' };
                  const intensity = getCarbonIntensity(log.carbonScore);
                  return (
                    <TableRow key={log.id} className="hover:bg-warm-50 transition-colors">
                      <TableCell>
                        <p className="font-medium text-warm-950">{log.name}</p>
                        {log.description && (
                          <p className="text-xs text-warm-500 mt-0.5 line-clamp-1">{log.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-warm-700 font-mono text-sm">
                        {log.unitValue}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-warm-950">
                        {log.carbonScore.toFixed(4)}
                        <span className="text-xs font-normal text-warm-500 ml-1">kg</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold ${intensity.color}`}>
                          {intensity.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-warm-500">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDialog(log)}
                            className="p-1.5 rounded-lg text-warm-400 hover:text-forest-700 hover:bg-forest-50 transition-colors"
                            title="Edit event"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(log.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* ── Pagination ───────────────────────────────────────────────── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-warm-100 bg-warm-50">
              <p className="text-sm text-warm-600">
                Showing{' '}
                <span className="font-medium text-warm-950">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium text-warm-950">{pagination.total}</span> events
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1 || isFetching}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-lg hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>

                {/* Page number chips */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-warm-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          disabled={isFetching}
                          className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                            page === p
                              ? 'bg-forest-900 text-warm-50'
                              : 'text-warm-700 hover:bg-warm-100'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                </div>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages || isFetching}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-warm-700 bg-white border border-warm-200 rounded-lg hover:bg-warm-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Impact Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditError(''); }}>
        <DialogContent className="sm:max-w-md bg-warm-50 border-warm-200">
          <DialogHeader>
            <DialogTitle className="font-display text-warm-950">Edit Impact Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Image processing batch"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="h-10 border-warm-200 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Event Type <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {IMPACT_TYPES.map((t) => {
                  const cfg = TYPE_CONFIG[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditData({ ...editData, type: t })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        editData.type === t
                          ? 'border-forest-700 bg-forest-50 text-forest-800'
                          : 'border-warm-200 bg-white text-warm-700 hover:border-warm-300'
                      }`}
                    >
                      <span className={cfg.color}>{cfg.icon}</span>
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Unit Value <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 10.5"
                value={editData.unitValue}
                onChange={(e) => setEditData({ ...editData, unitValue: e.target.value })}
                className="h-10 border-warm-200 bg-white"
              />
              <p className="text-xs text-warm-500">
                Carbon score will be recalculated automatically
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Description <span className="text-warm-500 font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Additional context"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="h-10 border-warm-200 bg-white"
              />
            </div>

            {editError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-warm-200 text-warm-700"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editMutation.isPending}
                className="flex-1 bg-forest-900 hover:bg-forest-800 text-warm-50"
              >
                {editMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
