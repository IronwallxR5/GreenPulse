import { useQueries, useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { ProjectSummary } from '../../services/project.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Activity, FolderOpen, Loader2, Leaf } from 'lucide-react';

// ── Chart colour palette (warm-earth tones) ──────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  COMPUTE:  '#4a8a5c', // forest green
  STORAGE:  '#c9963d', // gold
  NETWORK:  '#8a6015', // dark gold
  API_CALL: '#6aab87', // light forest
};

const PROJECT_COLORS = [
  '#172e1e', '#1f3f2a', '#2c5639', '#3a6e49', '#4a8a5c',
  '#67a87b', '#8fc4a1', '#c9963d', '#d4a853', '#e0bf7a',
];

// ── Custom bar chart tooltip ─────────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forest-950 border border-forest-800 rounded-lg shadow-warm-lg p-3 text-sm">
      <p className="font-semibold text-warm-200 mb-1 max-w-[180px] truncate">{label}</p>
      <p className="text-gold-400 font-bold">{payload[0].value.toFixed(4)} kg CO₂e</p>
    </div>
  );
};

// ── Custom pie chart tooltip ─────────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-forest-950 border border-forest-800 rounded-lg shadow-warm-lg p-3 text-sm">
      <p className="font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-warm-300">{d.value.toFixed(4)} kg CO₂e</p>
      <p className="text-warm-500">{d.payload.count} events</p>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const summaryQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: ['projects', p.id, 'summary'],
      queryFn: () => projectService.getSummary(p.id),
      enabled: projects.length > 0,
    })),
  });

  const summariesLoading = summaryQueries.some((q) => q.isLoading);
  const summaries: (ProjectSummary | undefined)[] = summaryQueries.map((q) => q.data);

  const totalCO2 = summaries.reduce((sum, s) => sum + (s?.totalCO2 ?? 0), 0);
  const totalEvents = summaries.reduce((sum, s) => sum + (s?.totalLogs ?? 0), 0);

  const projectBarData = projects
    .map((p, i) => ({
      name: p.name.length > 18 ? p.name.slice(0, 15) + '…' : p.name,
      fullName: p.name,
      co2: summaries[i]?.totalCO2 ?? 0,
      events: summaries[i]?.totalLogs ?? 0,
    }))
    .filter((d) => d.co2 > 0)
    .sort((a, b) => b.co2 - a.co2);

  const typeMap: Record<string, { co2: number; count: number }> = {};
  summaries.forEach((s) => {
    s?.byType.forEach((b) => {
      if (!typeMap[b.type]) typeMap[b.type] = { co2: 0, count: 0 };
      typeMap[b.type].co2   += b.totalCO2;
      typeMap[b.type].count += b.count;
    });
  });
  const pieData = Object.entries(typeMap).map(([type, val]) => ({
    name: type,
    value: val.co2,
    count: val.count,
    fill: TYPE_COLORS[type] ?? '#9e9689',
  }));

  const topProjects = [...projectBarData].slice(0, 5);
  const isLoading = projectsLoading || summariesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-warm-300 p-16 text-center shadow-warm-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-950/5 mb-4">
          <Leaf className="h-8 w-8 text-forest-600" />
        </div>
        <h3 className="font-display text-lg font-semibold text-warm-950 mb-2">No analytics yet</h3>
        <p className="text-warm-600 text-sm">
          Create a project and log some impact events to see your analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-2xl font-bold text-warm-950">Analytics</h1>
        <p className="text-warm-600 text-sm mt-1">Carbon footprint overview across all your projects</p>
      </div>

      {/* ── Hero stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-forest-950 rounded-xl p-5 shadow-warm-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-forest-900 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-gold-400" />
            </div>
            <span className="text-sm font-medium text-forest-400">Total Carbon Emitted</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-50">{totalCO2.toFixed(3)}</p>
          <p className="text-xs text-forest-500 mt-1">kg CO₂e across all projects</p>
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gold-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Total Impact Events</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-950">{totalEvents}</p>
          <p className="text-xs text-warm-500 mt-1">logged across all projects</p>
        </div>

        <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-forest-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Active Projects</span>
          </div>
          <p className="text-3xl font-display font-bold text-warm-950">{projects.length}</p>
          <p className="text-xs text-warm-500 mt-1">being tracked</p>
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {projectBarData.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-6">
            <h3 className="font-display text-sm font-semibold text-warm-800 mb-1">CO₂ by Project</h3>
            <p className="text-xs text-warm-500 mb-5">Total emissions per project (kg CO₂e)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectBarData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0e8da" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8a7e74' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8a7e74' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#edf7f1' }} />
                <Bar dataKey="co2" radius={[6, 6, 0, 0]}>
                  {projectBarData.map((_, i) => (
                    <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-6">
            <h3 className="font-display text-sm font-semibold text-warm-800 mb-1">Emissions by Type</h3>
            <p className="text-xs text-warm-500 mb-5">Share of total CO₂e per impact type</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-warm-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Top emitters table ───────────────────────────────────────── */}
      {topProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-warm-200 shadow-warm-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-warm-100">
            <h3 className="font-display text-sm font-semibold text-warm-800">Top Projects by Emissions</h3>
            <p className="text-xs text-warm-500 mt-0.5">Ranked by total CO₂e</p>
          </div>
          <div className="divide-y divide-warm-50">
            {topProjects.map((p, i) => {
              const pct = totalCO2 > 0 ? (p.co2 / totalCO2) * 100 : 0;
              return (
                <div key={p.fullName} className="flex items-center gap-4 px-6 py-4 hover:bg-warm-50 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-gold-100 text-gold-700'
                    : i === 1 ? 'bg-warm-100 text-warm-700'
                    : i === 2 ? 'bg-forest-100 text-forest-700'
                    : 'bg-warm-50 text-warm-500'
                  }`}>
                    {i + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-950 truncate">{p.fullName}</p>
                    <div className="mt-1.5 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-forest-600 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-warm-950">{p.co2.toFixed(4)} kg</p>
                    <p className="text-xs text-warm-500">{p.events} events · {pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Type breakdown grid ───────────────────────────────────────── */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pieData.sort((a, b) => b.value - a.value).map((d) => (
            <div key={d.name} className="bg-white rounded-xl border border-warm-200 shadow-warm-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs font-semibold text-warm-700">{d.name}</span>
              </div>
              <p className="text-xl font-display font-bold text-warm-950">{d.value.toFixed(3)}</p>
              <p className="text-xs text-warm-500 mt-0.5">kg CO₂e · {d.count} events</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
