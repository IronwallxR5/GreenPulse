import { useQueries, useQuery } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { ProjectSummary } from '../../services/project.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Activity, Loader2, Leaf, Orbit } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  COMPUTE: '#1e6672',
  STORAGE: '#d6943e',
  NETWORK: '#b97a28',
  API_CALL: '#4e9da8',
};

const PROJECT_COLORS = [
  '#0f3d45',
  '#14515c',
  '#1e6672',
  '#2f7f8d',
  '#4e9da8',
  '#77bcc2',
  '#d6943e',
  '#ebb269',
  '#98611a',
  '#b97a28',
];

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-forest-800 bg-forest-950 p-3 text-sm shadow-warm-lg">
      <p className="mb-1 max-w-[180px] truncate font-semibold text-warm-200">{label}</p>
      <p className="font-bold text-gold-300">{payload[0].value.toFixed(4)} kg CO2e</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];

  return (
    <div className="rounded-xl border border-forest-800 bg-forest-950 p-3 text-sm shadow-warm-lg">
      <p className="font-semibold" style={{ color: d.payload.fill }}>{d.name}</p>
      <p className="text-warm-300">{d.value.toFixed(4)} kg CO2e</p>
      <p className="text-forest-400">{d.payload.count} events</p>
    </div>
  );
};

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
      name: p.name.length > 18 ? `${p.name.slice(0, 15)}...` : p.name,
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
      typeMap[b.type].co2 += b.totalCO2;
      typeMap[b.type].count += b.count;
    });
  });

  const pieData = Object.entries(typeMap).map(([type, val]) => ({
    name: type,
    value: val.co2,
    count: val.count,
    fill: TYPE_COLORS[type] ?? '#8da1a8',
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
      <div className="surface-card border-dashed p-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100">
          <Leaf className="h-8 w-8 text-forest-600" />
        </div>
        <h3 className="mb-2 font-display text-lg font-semibold text-warm-950">No analytics yet</h3>
        <p className="text-sm text-warm-600">
          Create a project and log some impact events to see your analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 route-enter">
      <section className="surface-strong reveal-up relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-forest-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-gold-300/25 blur-3xl" />

        <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="section-heading text-forest-300">Insight Stream</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-warm-50 sm:text-4xl">Analytics Command Center</h1>
            <p className="mt-3 max-w-2xl text-sm text-forest-200 sm:text-base">
              Understand emission trends by project and impact type to prioritize the next efficiency win.
            </p>
          </div>

          <div className="rounded-2xl border border-forest-800 bg-forest-900/70 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-forest-400">Signal Quality</p>
            <p className="mt-1 text-sm font-semibold text-gold-300">Live aggregation active</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-group">
        <div className="surface-strong p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-900">
              <TrendingUp className="h-4 w-4 text-gold-300" />
            </div>
            <span className="text-sm font-medium text-forest-300">Total Carbon Emitted</span>
          </div>
          <p className="font-display text-3xl font-bold text-warm-50">{totalCO2.toFixed(3)}</p>
          <p className="mt-1 text-xs text-forest-400">kg CO2e across all projects</p>
        </div>

        <div className="surface-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50">
              <Activity className="h-4 w-4 text-gold-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Total Impact Events</span>
          </div>
          <p className="font-display text-3xl font-bold text-warm-950">{totalEvents}</p>
          <p className="mt-1 text-xs text-warm-500">logged across all projects</p>
        </div>

        <div className="surface-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50">
              <Orbit className="h-4 w-4 text-forest-600" />
            </div>
            <span className="text-sm font-medium text-warm-600">Active Projects</span>
          </div>
          <p className="font-display text-3xl font-bold text-warm-950">{projects.length}</p>
          <p className="mt-1 text-xs text-warm-500">being tracked</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 stagger-group">
        {projectBarData.length > 0 && (
          <div className="surface-card p-6">
            <h3 className="font-display text-sm font-semibold text-warm-800">CO2 by Project</h3>
            <p className="mb-5 text-xs text-warm-500">Total emissions per project (kg CO2e)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={projectBarData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dfe7e9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#51666c' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#51666c' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                />
                <Tooltip content={<BarTooltip />} cursor={{ fill: '#eef7f8' }} />
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
          <div className="surface-card p-6">
            <h3 className="font-display text-sm font-semibold text-warm-800">Emissions by Type</h3>
            <p className="mb-5 text-xs text-warm-500">Share of total CO2e per impact type</p>
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
                    <span className="text-xs text-warm-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {topProjects.length > 0 && (
        <div className="surface-card reveal-up stagger-1 overflow-hidden">
          <div className="border-b border-warm-100 px-6 py-4">
            <h3 className="font-display text-sm font-semibold text-warm-800">Top Projects by Emissions</h3>
            <p className="mt-0.5 text-xs text-warm-500">Ranked by total CO2e</p>
          </div>
          <div className="divide-y divide-warm-50">
            {topProjects.map((p, i) => {
              const pct = totalCO2 > 0 ? (p.co2 / totalCO2) * 100 : 0;
              return (
                <div key={p.fullName} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-warm-50/80">
                  <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i === 0 ? 'bg-gold-100 text-gold-700'
                    : i === 1 ? 'bg-warm-100 text-warm-700'
                    : i === 2 ? 'bg-forest-100 text-forest-700'
                    : 'bg-warm-50 text-warm-500'
                  }`}>
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-warm-950">{p.fullName}</p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-warm-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-forest-700 to-gold-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-warm-950">{p.co2.toFixed(4)} kg</p>
                    <p className="text-xs text-warm-500">{p.events} events · {pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pieData.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 stagger-group reveal-up stagger-2">
          {pieData
            .slice()
            .sort((a, b) => b.value - a.value)
            .map((d) => (
              <div key={d.name} className="surface-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs font-semibold text-warm-700">{d.name}</span>
                </div>
                <p className="font-display text-xl font-bold text-warm-950">{d.value.toFixed(3)}</p>
                <p className="mt-0.5 text-xs text-warm-500">kg CO2e · {d.count} events</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
