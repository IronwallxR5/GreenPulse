import { useQueries, useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { ProjectSummary } from '../../services/project.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Activity, FolderOpen, Loader2, Leaf } from 'lucide-react';

// ── Colour palette for charts ────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  COMPUTE:  '#3b82f6', // blue
  STORAGE:  '#a855f7', // purple
  NETWORK:  '#f97316', // orange
  API_CALL: '#14b8a6', // teal
};

const PROJECT_COLORS = [
  '#16a34a', '#15803d', '#166534', '#22c55e', '#4ade80',
  '#86efac', '#134e4a', '#0f766e', '#0d9488',
];

// ── Custom tooltip for bar chart ─────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1 max-w-[180px] truncate">{label}</p>
      <p className="text-green-700 font-bold">{payload[0].value.toFixed(4)} kg CO₂e</p>
    </div>
  );
};

// ── Custom tooltip for pie chart ─────────────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-gray-700">{d.value.toFixed(4)} kg CO₂e</p>
      <p className="text-gray-400">{d.payload.count} events</p>
    </div>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Analytics() {
  // 1. Fetch all projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  // 2. Fetch each project's summary in parallel
  const summaryQueries = useQueries({
    queries: projects.map((p) => ({
      queryKey: ['projects', p.id, 'summary'],
      queryFn: () => projectService.getSummary(p.id),
      enabled: projects.length > 0,
    })),
  });

  const summariesLoading = summaryQueries.some((q) => q.isLoading);
  const summaries: (ProjectSummary | undefined)[] = summaryQueries.map((q) => q.data);

  // 3. Aggregate data client-side ────────────────────────────────────────────
  const totalCO2 = summaries.reduce((sum, s) => sum + (s?.totalCO2 ?? 0), 0);
  const totalEvents = summaries.reduce((sum, s) => sum + (s?.totalLogs ?? 0), 0);

  // Per-project bar chart data (only projects with at least some CO2)
  const projectBarData = projects
    .map((p, i) => ({
      name: p.name.length > 18 ? p.name.slice(0, 15) + '…' : p.name,
      fullName: p.name,
      co2: summaries[i]?.totalCO2 ?? 0,
      events: summaries[i]?.totalLogs ?? 0,
    }))
    .filter((d) => d.co2 > 0)
    .sort((a, b) => b.co2 - a.co2);

  // Global type breakdown (flattened across all projects)
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
    fill: TYPE_COLORS[type] ?? '#94a3b8',
  }));

  // Top projects by CO2
  const topProjects = [...projectBarData].slice(0, 5);

  // ── Loading ───────────────────────────────────────────────────────────────
  const isLoading = projectsLoading || summariesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-4">
          <Leaf className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No analytics yet</h3>
        <p className="text-gray-500 text-sm">Create a project and log some impact events to see your analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Carbon footprint overview across all your projects</p>
      </div>

      {/* ── Hero stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Carbon Emitted</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalCO2.toFixed(3)}</p>
          <p className="text-xs text-gray-400 mt-1">kg CO₂e across all projects</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Impact Events</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalEvents}</p>
          <p className="text-xs text-gray-400 mt-1">logged across all projects</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Active Projects</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-xs text-gray-400 mt-1">being tracked</p>
        </div>
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar chart — CO2 by project */}
        {projectBarData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">CO₂ by Project</h3>
            <p className="text-xs text-gray-400 mb-5">Total emissions per project (kg CO₂e)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectBarData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#f0fdf4' }} />
                <Bar dataKey="co2" radius={[6, 6, 0, 0]}>
                  {projectBarData.map((_, i) => (
                    <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie chart — CO2 by type */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Emissions by Type</h3>
            <p className="text-xs text-gray-400 mb-5">Share of total CO₂e per impact type</p>
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
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Top emitters table ───────────────────────────────────────────── */}
      {topProjects.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Top Projects by Emissions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by total CO₂e</p>
          </div>
          <div className="divide-y divide-gray-50">
            {topProjects.map((p, i) => {
              const pct = totalCO2 > 0 ? (p.co2 / totalCO2) * 100 : 0;
              return (
                <div key={p.fullName} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  {/* Rank */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700'
                    : i === 1 ? 'bg-gray-100 text-gray-600'
                    : i === 2 ? 'bg-orange-50 text-orange-600'
                    : 'bg-gray-50 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.fullName}</p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{p.co2.toFixed(4)} kg</p>
                    <p className="text-xs text-gray-400">{p.events} events · {pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Type breakdown grid ──────────────────────────────────────────── */}
      {pieData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {pieData.sort((a, b) => b.value - a.value).map((d) => (
            <div key={d.name} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-xs font-semibold text-gray-600">{d.name}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{d.value.toFixed(3)}</p>
              <p className="text-xs text-gray-400 mt-0.5">kg CO₂e · {d.count} events</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
