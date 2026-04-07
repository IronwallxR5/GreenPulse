import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import { impactService } from '../../services/impact.service';
import type { ImpactLog } from '../../services/impact.service';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  ArrowLeft, Plus, Trash2, Cloud, Database, Network, Webhook,
  Loader2, Zap, TrendingUp, Activity,
} from 'lucide-react';
import { useState } from 'react';

// Backend-defined impact types
const IMPACT_TYPES = ['COMPUTE', 'STORAGE', 'NETWORK', 'API_CALL'] as const;
type ImpactType = typeof IMPACT_TYPES[number];

const TYPE_CONFIG: Record<ImpactType, { icon: React.ReactNode; color: string; bg: string }> = {
  COMPUTE: { icon: <Cloud className="h-3.5 w-3.5" />, color: 'text-blue-700', bg: 'bg-blue-50' },
  STORAGE: { icon: <Database className="h-3.5 w-3.5" />, color: 'text-purple-700', bg: 'bg-purple-50' },
  NETWORK: { icon: <Network className="h-3.5 w-3.5" />, color: 'text-orange-700', bg: 'bg-orange-50' },
  API_CALL: { icon: <Webhook className="h-3.5 w-3.5" />, color: 'text-teal-700', bg: 'bg-teal-50' },
};

const getCarbonIntensity = (score: number) => {
  if (score < 0.01) return { label: 'Very Low', color: 'text-green-600' };
  if (score < 0.1) return { label: 'Low', color: 'text-green-500' };
  if (score < 1) return { label: 'Medium', color: 'text-yellow-600' };
  return { label: 'High', color: 'text-red-600' };
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id!);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'COMPUTE' as ImpactType,
    unitValue: '',
  });
  const [formError, setFormError] = useState('');

  // ── Queries ─────────────────────────────────────────
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectService.getOne(projectId),
  });

  const { data: summary } = useQuery({
    queryKey: ['projects', projectId, 'summary'],
    queryFn: () => projectService.getSummary(projectId),
  });

  const { data: impactsData, isLoading: impactsLoading } = useQuery({
    queryKey: ['projects', projectId, 'impacts'],
    queryFn: () => impactService.getAll(projectId),
  });

  // ── Mutations ────────────────────────────────────────
  const createImpactMutation = useMutation({
    mutationFn: (data: any) => impactService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setOpen(false);
      setFormData({ name: '', description: '', type: 'COMPUTE', unitValue: '' });
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Failed to log event');
    },
  });

  const deleteImpactMutation = useMutation({
    mutationFn: (impactId: number) => impactService.delete(projectId, impactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const unitVal = parseFloat(formData.unitValue);
    if (!formData.name.trim()) return setFormError('Event name is required');
    if (isNaN(unitVal) || unitVal <= 0) return setFormError('Unit value must be a positive number');
    createImpactMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      unitValue: unitVal,
    });
  };

  // ── Loading states ───────────────────────────────────
  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Project not found.</p>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  const impacts = impactsData?.data || [];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-500 text-sm mt-0.5">{project.description}</p>
          )}
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total CO2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Carbon</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {summary?.totalCO2.toFixed(3) ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">kg CO₂e</p>
        </div>

        {/* Total Events */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Events</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary?.totalLogs ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">impact logs recorded</p>
        </div>

        {/* Top emitter */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Top Emitter</span>
          </div>
          {summary?.byType && summary.byType.length > 0 ? (
            <>
              <p className="text-xl font-bold text-gray-900">
                {summary.byType.reduce((a, b) => a.totalCO2 > b.totalCO2 ? a : b).type}
              </p>
              <p className="text-xs text-gray-400 mt-1">highest emission source</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No data yet</p>
          )}
        </div>
      </div>

      {/* Breakdown by type */}
      {summary?.byType && summary.byType.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Emissions by Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.byType.map((b) => {
              const cfg = TYPE_CONFIG[b.type as ImpactType] || { icon: null, color: 'text-gray-700', bg: 'bg-gray-50' };
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

      {/* ── Impact Logs Table ───────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Impact Logs
            {impacts.length > 0 && (
              <span className="ml-2 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {impacts.length}
              </span>
            )}
          </h2>

          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setFormError(''); } }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Log Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Impact Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                {/* Name */}
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

                {/* Type */}
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

                {/* Unit Value */}
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
                    kWh for compute/storage · GB for network · count for API calls
                  </p>
                </div>

                {/* Description */}
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

                {/* Error */}
                {formError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={createImpactMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {createImpactMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging...</>
                  ) : (
                    'Log Event'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {impactsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : impacts.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 mb-3">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No impact events yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Log Event" to record your first emission</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-600">Event</TableHead>
                  <TableHead className="font-semibold text-gray-600">Type</TableHead>
                  <TableHead className="font-semibold text-gray-600">Unit Value</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-right">Carbon Score</TableHead>
                  <TableHead className="font-semibold text-gray-600">Intensity</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {impacts.map((log: ImpactLog) => {
                  const cfg = TYPE_CONFIG[log.type as ImpactType] || { icon: null, color: 'text-gray-700', bg: 'bg-gray-50' };
                  const intensity = getCarbonIntensity(log.carbonScore);
                  return (
                    <TableRow key={log.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <p className="font-medium text-gray-900">{log.name}</p>
                        {log.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{log.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 font-mono text-sm">
                        {log.unitValue}
                      </TableCell>
                      <TableCell className="text-right font-bold font-mono text-gray-900">
                        {log.carbonScore.toFixed(4)}
                        <span className="text-xs font-normal text-gray-400 ml-1">kg</span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold ${intensity.color}`}>
                          {intensity.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => deleteImpactMutation.mutate(log.id)}
                          disabled={deleteImpactMutation.isPending}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
