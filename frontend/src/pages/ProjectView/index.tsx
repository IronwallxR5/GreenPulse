import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import { impactService } from '../../services/impact.service';
import type { ImpactLog } from '../../services/impact.service';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Plus, Trash2, Cloud, Database, Network, Webhook } from 'lucide-react';
import { useState } from 'react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  COMPUTE: <Cloud className="h-4 w-4" />,
  STORAGE: <Database className="h-4 w-4" />,
  NETWORK: <Network className="h-4 w-4" />,
  API_CALL: <Webhook className="h-4 w-4" />
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = parseInt(id!);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', type: 'COMPUTE', unitValue: '' });

  // Queries
  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectService.getOne(projectId)
  });

  const { data: summary } = useQuery({
    queryKey: ['projects', projectId, 'summary'],
    queryFn: () => projectService.getSummary(projectId)
  });

  const { data: impactsData } = useQuery({
    queryKey: ['projects', projectId, 'impacts'],
    queryFn: () => impactService.getAll(projectId)
  });

  // Mutations
  const createImpactMutation = useMutation({
    mutationFn: (data: any) => impactService.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setOpen(false);
      setFormData({ name: '', description: '', type: 'COMPUTE', unitValue: '' });
    }
  });

  const deleteImpactMutation = useMutation({
    mutationFn: (impactId: number) => impactService.delete(projectId, impactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createImpactMutation.mutate({ ...formData, unitValue: parseFloat(formData.unitValue) });
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button className="bg-transparent border shadow-sm hover:bg-accent p-2 text-foreground" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Carbon Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary?.totalCO2.toFixed(2) || '0.00'} <span className="text-lg font-normal text-muted-foreground">kg CO2e</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalLogs || 0}</div>
          </CardContent>
        </Card>
        <div className="flex gap-2 w-full">
          {summary?.byType.map(b => (
            <Card key={b.type} className="flex-1">
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{b.type}</CardTitle>
               </CardHeader>
               <CardContent className="text-lg font-bold">{b.totalCO2.toFixed(1)}kg</CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Impact Logs</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Log Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Impact Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Event Type (COMPUTE, STORAGE, NETWORK, API_CALL)</Label>
                <Input required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <Label>Unit Value</Label>
                <Input required type="number" step="0.1" value={formData.unitValue} onChange={(e) => setFormData({...formData, unitValue: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <Button type="submit" disabled={createImpactMutation.isPending} className="w-full">
                {createImpactMutation.isPending ? 'Logging...' : 'Log Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        {impactsData?.data && impactsData.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Carbon Score</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {impactsData.data.map((log: ImpactLog) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.name}
                    <div className="text-xs text-muted-foreground">{log.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {TYPE_ICONS[log.type] || <Plus className="h-4 w-4" />}
                      {log.type}
                    </div>
                  </TableCell>
                  <TableCell>{log.unitValue}</TableCell>
                  <TableCell className="text-right font-bold">{log.carbonScore.toFixed(4)} kg</TableCell>
                  <TableCell>
                    <Button className="h-8 w-8 text-destructive bg-transparent shadow-none hover:bg-accent p-2" onClick={() => deleteImpactMutation.mutate(log.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No impact events logged for this project yet.
          </div>
        )}
      </Card>
    </div>
  );
}
