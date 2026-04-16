import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { Project } from '../../services/project.service';
import { Link } from 'react-router-dom';
import { Plus, Trash2, FolderOpen, ArrowRight, Loader2, Leaf, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Create project state ─────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // ── Edit project state ───────────────────────────────────────────────────
  const [editOpen, setEditOpen]               = useState(false);
  const [editTarget, setEditTarget]           = useState<Project | null>(null);
  const [editName, setEditName]               = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setName('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      projectService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditOpen(false);
      setEditTarget(null);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  const openEditDialog = (project: Project) => {
    setEditTarget(project);
    setEditName(project.name);
    setEditDescription(project.description ?? '');
    setEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    editMutation.mutate({
      id: editTarget.id,
      data: { name: editName.trim(), description: editDescription.trim() || undefined },
    });
  };

  return (
    <div className="space-y-8">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-warm-950">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-warm-600 mt-1 text-sm">
            Manage your projects and track carbon emissions
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-forest-900 hover:bg-forest-800 text-warm-50 shadow-warm-sm gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-warm-50 border-warm-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-display text-warm-950">
                <div className="w-7 h-7 rounded-md bg-gold-100 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-gold-600" />
                </div>
                Create New Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-warm-800 font-medium">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. Cloud API v2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 border-warm-200 bg-white focus:border-forest-800"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc" className="text-warm-800 font-medium">
                  Description <span className="text-warm-500 font-normal">(optional)</span>
                </Label>
                <Input
                  id="proj-desc"
                  placeholder="Brief description of the project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10 border-warm-200 bg-white focus:border-forest-800"
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="w-full bg-forest-900 hover:bg-forest-800 text-warm-50"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  'Create Project'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
            <p className="text-xs text-warm-500 font-medium uppercase tracking-wide">Total Projects</p>
            <p className="text-3xl font-display font-bold text-warm-950 mt-2">{projects.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-warm-200 p-5 shadow-warm-sm">
            <p className="text-xs text-warm-500 font-medium uppercase tracking-wide">Total Events</p>
            <p className="text-3xl font-display font-bold text-warm-950 mt-2">
              {projects.reduce((sum, p) => sum + (p._count?.impactLogs || 0), 0)}
            </p>
          </div>
          <div className="hidden sm:block bg-forest-950 rounded-xl p-5 shadow-warm-sm">
            <p className="text-xs text-forest-400 font-medium uppercase tracking-wide">Status</p>
            <p className="text-sm font-semibold text-gold-400 mt-2 font-display">Tracking Active 🌱</p>
          </div>
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!isLoading && projects.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-warm-300 p-16 text-center shadow-warm-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-forest-950/5 mb-4">
            <FolderOpen className="h-8 w-8 text-forest-600" />
          </div>
          <h3 className="font-display text-lg font-semibold text-warm-950 mb-2">No projects yet</h3>
          <p className="text-warm-600 text-sm mb-6 max-w-sm mx-auto">
            Create your first project to start tracking carbon emissions across your infrastructure.
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-forest-900 hover:bg-forest-800 text-warm-50 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      )}

      {/* ── Projects grid ───────────────────────────────────────────── */}
      {!isLoading && projects.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wider mb-4">
            Your Projects ({projects.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className="group bg-white rounded-xl border border-warm-200 hover:border-forest-300 hover:shadow-warm-md transition-all duration-200 overflow-hidden"
              >
                {/* Warm gold top accent */}
                <div className="h-[3px] bg-gradient-to-r from-gold-500 to-gold-300" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-warm-950 hover:text-forest-800 transition-colors line-clamp-1 block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-warm-600 mt-0.5 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Action buttons — visible on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditDialog(project)}
                        className="p-1.5 rounded-lg hover:bg-warm-100 text-warm-400 hover:text-forest-700"
                        title="Edit project"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(project.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-warm-400 hover:text-red-500"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-warm-100">
                    <div className="flex items-center gap-1.5 text-xs text-warm-500">
                      <div className="w-2 h-2 rounded-full bg-forest-400" />
                      <span>{project._count?.impactLogs || 0} impact events</span>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-900 transition-colors"
                    >
                      View details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit Project Dialog ─────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md bg-warm-50 border-warm-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-warm-950">
              <div className="w-7 h-7 rounded-md bg-warm-100 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-warm-700" />
              </div>
              Edit Project
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Cloud API v2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-10 border-warm-200 bg-white"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-warm-800 font-medium">
                Description <span className="text-warm-500 font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Brief description of the project"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="h-10 border-warm-200 bg-white"
              />
            </div>
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
                disabled={editMutation.isPending || !editName.trim()}
                className="flex-1 bg-forest-900 hover:bg-forest-800 text-warm-50"
              >
                {editMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
