import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { projectService } from '../../services/project.service';
import type {
  ProjectAlert,
  ProjectAlertStreamEvent,
  ProjectAuditLog,
  ComplianceReport,
  ReportFormat,
  ReportFrequency,
} from '../../services/project.service';
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
  COMPUTE:  { icon: <Cloud     className="h-3.5 w-3.5" />, color: 'text-forest-700', bg: 'bg-forest-50' },
  STORAGE:  { icon: <Database  className="h-3.5 w-3.5" />, color: 'text-gold-700',   bg: 'bg-gold-50'   },
  NETWORK:  { icon: <Network   className="h-3.5 w-3.5" />, color: 'text-forest-800', bg: 'bg-forest-100' },
  API_CALL: { icon: <Webhook   className="h-3.5 w-3.5" />, color: 'text-warm-700',   bg: 'bg-warm-100'   },
};

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'createdAt',   label: 'Date' },
  { value: 'carbonScore', label: 'Carbon Score' },
  { value: 'name',        label: 'Name' },
];

const REPORT_FREQUENCIES: ReportFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
const REPORT_FORMATS: ReportFormat[] = ['PDF', 'CSV'];

const getCarbonIntensity = (score: number) => {
  if (score < 0.01) return { label: 'Very Low', color: 'text-green-600' };
  if (score < 0.1)  return { label: 'Low',      color: 'text-green-500' };
  if (score < 1)    return { label: 'Medium',    color: 'text-yellow-600' };
  return                   { label: 'High',      color: 'text-red-600' };
};

const formatAuditAction = (action: string) =>
  action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const summarizeAuditMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata) {
    return null;
  }

  const summary = Object.entries(metadata)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' | ');

  return summary || null;
};

const toLocalDateTimeInput = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
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
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  const [liveAlertNotice, setLiveAlertNotice] = useState<string | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState<ReportFrequency>('WEEKLY');
  const [scheduleFormat, setScheduleFormat] = useState<ReportFormat>('PDF');
  const [scheduleStartsAt, setScheduleStartsAt] = useState('');
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);

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

  const { data: auditLogsData } = useQuery({
    queryKey: ['projects', projectId, 'audit-logs'],
    queryFn: () => projectService.getAuditLogs(projectId, { limit: 8 }),
  });

  const { data: reportSchedule } = useQuery({
    queryKey: ['projects', projectId, 'report-schedule'],
    queryFn: () => projectService.getReportSchedule(projectId),
  });

  const { data: complianceReportsData } = useQuery({
    queryKey: ['projects', projectId, 'compliance-reports'],
    queryFn: () => projectService.getComplianceReports(projectId, { limit: 6 }),
  });

  const unreadCount = alerts.filter((a: ProjectAlert) => !a.isRead).length;
  const auditLogs = auditLogsData?.data ?? [];
  const complianceReports = complianceReportsData?.data ?? [];

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

  const upsertReportScheduleMutation = useMutation({
    mutationFn: (payload: { frequency: ReportFrequency; format: ReportFormat; startsAt?: string }) =>
      projectService.upsertReportSchedule(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'report-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'audit-logs'] });
      setScheduleNotice('Recurring report schedule saved.');
    },
    onError: (err: any) => {
      setScheduleNotice(err.response?.data?.message || 'Failed to save report schedule');
    },
  });

  const deleteReportScheduleMutation = useMutation({
    mutationFn: () => projectService.deleteReportSchedule(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'report-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'audit-logs'] });
      setScheduleNotice('Recurring report schedule removed.');
    },
    onError: (err: any) => {
      setScheduleNotice(err.response?.data?.message || 'Failed to remove report schedule');
    },
  });

  const runComplianceNowMutation = useMutation({
    mutationFn: () => projectService.runComplianceReportNow(projectId, { format: scheduleFormat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'compliance-reports'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'audit-logs'] });
      setScheduleNotice('Compliance report generated successfully.');
    },
    onError: (err: any) => {
      setScheduleNotice(err.response?.data?.message || 'Failed to generate compliance report');
    },
  });

  useEffect(() => {
    if (!Number.isFinite(projectId)) {
      return;
    }

    setStreamStatus('connecting');

    const stopStream = projectService.streamAlertsSocket(
      projectId,
      (event: ProjectAlertStreamEvent) => {
        setStreamStatus('live');
        setLiveAlertNotice(event.message);

        queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'summary'] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'alerts'] });
        queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'audit-logs'] });
      },
      () => setStreamStatus('live'),
      (_error) => setStreamStatus((prev) => (prev === 'live' ? prev : 'error')),
    );

    return () => {
      stopStream();
    };
  }, [projectId, queryClient]);

  useEffect(() => {
    if (!liveAlertNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setLiveAlertNotice(null);
    }, 8000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [liveAlertNotice]);

  useEffect(() => {
    if (!reportSchedule) {
      return;
    }

    setScheduleFrequency(reportSchedule.frequency);
    setScheduleFormat(reportSchedule.format);
    setScheduleStartsAt(toLocalDateTimeInput(reportSchedule.nextRunAt));
  }, [reportSchedule]);

  useEffect(() => {
    if (!scheduleNotice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setScheduleNotice(null);
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [scheduleNotice]);

  const handleSaveReportSchedule = () => {
    let startsAtIso: string | undefined;

    if (scheduleStartsAt.trim()) {
      const parsed = new Date(scheduleStartsAt);
      if (Number.isNaN(parsed.getTime())) {
        setScheduleNotice('Please provide a valid start datetime');
        return;
      }

      startsAtIso = parsed.toISOString();
    }

    upsertReportScheduleMutation.mutate({
      frequency: scheduleFrequency,
      format: scheduleFormat,
      startsAt: startsAtIso,
    });
  };

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
    <div className="space-y-7 route-enter">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="surface-card reveal-up relative flex flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="pointer-events-none absolute -left-16 top-0 h-32 w-32 rounded-full bg-forest-200/30 blur-2xl" />
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

        <div className="flex flex-wrap items-center gap-2">
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
      <div className="surface-card reveal-up border-warm-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-warm-700 sm:text-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                streamStatus === 'live'
                  ? 'bg-forest-500'
                  : streamStatus === 'connecting'
                    ? 'bg-gold-500 animate-pulseSoft'
                    : 'bg-red-500'
              }`}
            />
            Live threshold alert stream (WebSocket)
            <span className="font-semibold text-warm-900">
              {streamStatus === 'live'
                ? '(connected)'
                : streamStatus === 'connecting'
                  ? '(connecting)'
                  : '(reconnecting)'}
            </span>
          </div>

          {liveAlertNotice && (
            <button
              onClick={() => setLiveAlertNotice(null)}
              className="text-xs font-medium text-warm-500 hover:text-warm-700"
            >
              Dismiss
            </button>
          )}
        </div>

        {liveAlertNotice && (
          <p className="mt-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {liveAlertNotice}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-group">
        <div className="surface-strong p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gold-300" />
            </div>
            <span className="text-sm font-medium text-forest-300">Total Carbon</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-50">{summary?.totalCO2.toFixed(3) ?? '—'}</p>
          <p className="text-xs text-forest-400 mt-1">kg CO₂e</p>
        </div>

        <div className="surface-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gold-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Total Events</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-950">{summary?.totalLogs ?? 0}</p>
          <p className="text-xs text-warm-500 mt-1">impact logs recorded</p>
        </div>

        <div className="surface-card p-5">
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
        <div className="surface-card reveal-up stagger-1 p-5">
          <h3 className="font-display text-sm font-semibold text-warm-800 mb-4">Emissions by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.byType.map((b) => {
              const cfg = TYPE_CONFIG[b.type as ImpactType] ?? { icon: null, color: 'text-warm-700', bg: 'bg-warm-50' };
              return (
                <div key={b.type} className={`rounded-lg p-3 ${cfg.bg}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${cfg.color}`}>
                    {cfg.icon}
                    <span className="text-xs font-semibold">{b.type}</span>
                  </div>
                  <p className={`text-lg font-bold ${cfg.color}`}>{b.totalCO2.toFixed(3)}</p>
                  <p className="text-xs text-warm-500">{b.count} events</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Carbon Budget Panel ──────────────────────────────────────────── */}
      <div className="surface-card reveal-up stagger-2 p-5">
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
            className="h-10 flex-1 border-warm-200 bg-white text-sm focus-visible:ring-forest-700"
          />
          <Button
            onClick={() => {
              const val = parseFloat(budgetInput);
              if (!isNaN(val) && val > 0) setBudgetMutation.mutate(val);
            }}
            disabled={setBudgetMutation.isPending || !budgetInput || parseFloat(budgetInput) <= 0}
            className="h-10 rounded-xl bg-gold-500 px-4 text-sm text-forest-950 hover:bg-gold-400"
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

      {/* ── Recurring Compliance Reports ────────────────────────────────── */}
      <div className="surface-card reveal-up stagger-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-semibold text-warm-900">Recurring Compliance Reports</h3>
            <p className="mt-1 text-xs text-warm-500">
              Schedule automated report snapshots and review recent compliance history.
            </p>
          </div>

          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              reportSchedule?.isActive
                ? 'bg-forest-100 text-forest-700'
                : 'bg-warm-100 text-warm-600'
            }`}
          >
            {reportSchedule?.isActive ? 'Active schedule' : 'No active schedule'}
          </span>
        </div>

        {reportSchedule && (
          <div className="mt-3 rounded-lg border border-warm-100 bg-warm-50 p-3 text-xs text-warm-600">
            <p>
              Current: {reportSchedule.frequency} / {reportSchedule.format}
            </p>
            <p className="mt-1">Next run: {new Date(reportSchedule.nextRunAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            {reportSchedule.lastRunAt && (
              <p className="mt-1">Last run: {new Date(reportSchedule.lastRunAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-700">Frequency</Label>
            <select
              value={scheduleFrequency}
              onChange={(e) => setScheduleFrequency(e.target.value as ReportFrequency)}
              className="mt-1 h-10 w-full rounded-lg border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              {REPORT_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>{frequency}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-700">Format</Label>
            <select
              value={scheduleFormat}
              onChange={(e) => setScheduleFormat(e.target.value as ReportFormat)}
              className="mt-1 h-10 w-full rounded-lg border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              {REPORT_FORMATS.map((format) => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-[0.14em] text-warm-700">Start At (optional)</Label>
            <Input
              type="datetime-local"
              value={scheduleStartsAt}
              onChange={(e) => setScheduleStartsAt(e.target.value)}
              className="mt-1 h-10 border-warm-200 bg-white text-sm focus-visible:ring-forest-700"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={handleSaveReportSchedule}
            disabled={upsertReportScheduleMutation.isPending}
            className="h-10 rounded-xl bg-forest-900 px-4 text-sm text-warm-50 hover:bg-forest-800"
          >
            {upsertReportScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Schedule'}
          </Button>

          <Button
            onClick={() => runComplianceNowMutation.mutate()}
            disabled={runComplianceNowMutation.isPending}
            className="h-10 rounded-xl border border-forest-200 bg-white px-4 text-sm text-forest-700 hover:bg-forest-50"
          >
            {runComplianceNowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run Now'}
          </Button>

          {reportSchedule && (
            <Button
              onClick={() => deleteReportScheduleMutation.mutate()}
              disabled={deleteReportScheduleMutation.isPending}
              className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm text-red-600 hover:bg-red-50"
            >
              {deleteReportScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Schedule'}
            </Button>
          )}
        </div>

        {scheduleNotice && (
          <p className="mt-3 rounded-lg border border-warm-100 bg-warm-50 px-3 py-2 text-sm text-warm-700">
            {scheduleNotice}
          </p>
        )}

        <div className="mt-4 border-t border-warm-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-warm-800">Recent Compliance Snapshots</h4>
            <span className="text-xs text-warm-500">{complianceReportsData?.pagination.total ?? 0} total</span>
          </div>

          {complianceReports.length === 0 ? (
            <p className="text-sm text-warm-500">No compliance reports generated yet.</p>
          ) : (
            <div className="space-y-2">
              {complianceReports.map((report: ComplianceReport) => (
                <div key={report.id} className="rounded-lg border border-warm-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-warm-800">{report.format} snapshot</p>
                    <p className="text-xs text-warm-500">
                      {new Date(report.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-warm-600">
                    Total CO2: {report.totalCO2.toFixed(4)} kg | Total events: {report.totalLogs}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Alerts Panel ─────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="surface-card reveal-up stagger-2 border-red-100 overflow-hidden">
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
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!alert.isRead ? 'bg-red-500' : 'bg-warm-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-warm-700">{alert.message}</p>
                  <p className="text-xs text-warm-500 mt-0.5">
                    {new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Audit Trail Panel ─────────────────────────────────────────────── */}
      <div className="surface-card reveal-up stagger-2 overflow-hidden">
        <div className="flex items-center justify-between border-b border-warm-100 bg-warm-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-forest-700" />
            <h3 className="font-display text-sm font-semibold text-warm-900">Audit Trail</h3>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-warm-600">
            {auditLogsData?.pagination.total ?? 0} entries
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="px-5 py-6 text-sm text-warm-500">
            No audit entries yet for this project.
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {auditLogs.map((entry: ProjectAuditLog) => (
              <div key={entry.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-warm-800">{formatAuditAction(entry.action)}</p>
                  <p className="text-xs text-warm-500">
                    {new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <p className="mt-1 text-xs text-warm-500">
                  {entry.entityType}{entry.entityId ? ` #${entry.entityId}` : ''}
                </p>
                {summarizeAuditMetadata(entry.metadata) && (
                  <p className="mt-1 text-xs text-warm-600">{summarizeAuditMetadata(entry.metadata)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Impact Logs section ─────────────────────────────────────────── */}
      <div className="reveal-up stagger-3">
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-warm-900">Impact Logs</h2>
            {pagination && (
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-medium text-warm-500">
                {pagination.total}
              </span>
            )}
            {isFetching && !impactsLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-forest-600" />
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
            <DialogContent className="sm:max-w-md border-warm-200 bg-white">
              <DialogHeader>
                <DialogTitle className="font-display text-warm-900">Log Impact Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Image processing batch"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
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
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                            formData.type === t
                              ? 'border-forest-600 bg-forest-50 text-forest-700 shadow-warm-sm'
                              : 'border-warm-200 bg-white text-warm-700 hover:border-forest-300 hover:bg-forest-50/40'
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
                  <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                    Unit Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 10.5"
                    value={formData.unitValue}
                    onChange={(e) => setFormData({ ...formData, unitValue: e.target.value })}
                    className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
                  />
                  <p className="text-xs text-warm-500">
                    kWh for COMPUTE/STORAGE · GB for NETWORK · count for API_CALL
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                    Description <span className="text-warm-500 font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="Additional context"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
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
                  className="h-10 w-full rounded-xl bg-forest-900 text-warm-50 hover:bg-forest-800"
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
        <div className="surface-card mb-4 space-y-3 p-4">
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warm-400" />
              <Input
                placeholder="Search events by name or description..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
                className="h-9 border-warm-200 bg-white pl-9 text-sm focus-visible:ring-forest-700"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-warm-500 font-medium whitespace-nowrap hidden sm:block">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
                className="h-9 rounded-lg border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={toggleSortOrder}
                title={sortOrder === 'desc' ? 'Descending — click for ascending' : 'Ascending — click for descending'}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors ${
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
        <div className="surface-card overflow-hidden">
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
            <Table className="[&_tbody_tr:nth-child(even)]:bg-warm-50/40">
              <TableHeader>
                <TableRow className="bg-warm-100/80 backdrop-blur supports-[backdrop-filter]:bg-warm-100/65">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">Event</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">Unit Value</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">Carbon Score</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700">Intensity</TableHead>
                  <TableHead className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-700 sm:table-cell">Date</TableHead>
                  <TableHead className="w-[88px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {impacts.map((log: ImpactLog) => {
                  const cfg = TYPE_CONFIG[log.type] ?? { icon: null, color: 'text-warm-700', bg: 'bg-warm-50' };
                  const intensity = getCarbonIntensity(log.carbonScore);
                  return (
                    <TableRow key={log.id} className="group border-warm-100 transition-colors hover:bg-white">
                      <TableCell>
                        <p className="font-medium text-warm-950 group-hover:text-forest-800">{log.name}</p>
                        {log.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-warm-500">{log.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-warm-700">
                        {log.unitValue}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-warm-950">
                        {log.carbonScore.toFixed(4)}
                        <span className="text-xs font-normal text-warm-500 ml-1">kg</span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          intensity.label === 'Very Low' ? 'bg-forest-100 text-forest-700'
                          : intensity.label === 'Low' ? 'bg-emerald-100 text-emerald-700'
                          : intensity.label === 'Medium' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        } ${intensity.color}`}>
                          {intensity.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-xs text-warm-500 sm:table-cell">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDialog(log)}
                            className="rounded-lg border border-transparent p-1.5 text-warm-400 transition-colors hover:border-forest-200 hover:bg-forest-50 hover:text-forest-700"
                            title="Edit event"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(log.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg border border-transparent p-1.5 text-warm-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
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
            <div className="flex items-center justify-between border-t border-warm-100 bg-warm-50 px-4 py-3">
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
        <DialogContent className="sm:max-w-md border-warm-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-warm-950">Edit Impact Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Image processing batch"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
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
              <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                Unit Value <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 10.5"
                value={editData.unitValue}
                onChange={(e) => setEditData({ ...editData, unitValue: e.target.value })}
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
              />
              <p className="text-xs text-warm-500">
                Carbon score will be recalculated automatically
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-warm-800 text-xs font-semibold uppercase tracking-[0.14em]">
                Description <span className="text-warm-500 font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Additional context"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
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
