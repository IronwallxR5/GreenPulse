import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { Project } from '../../services/project.service';
import { Link } from 'react-router-dom';
import { Plus, Trash2, FolderOpen, ArrowRight, Loader2, Leaf } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage your projects and track carbon emissions
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                Create New Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="proj-name" className="text-gray-700 font-medium">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. Cloud API v2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-desc" className="text-gray-700 font-medium">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="proj-desc"
                  placeholder="Brief description of the project"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  'Create Project'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats bar */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{projects.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {projects.reduce((sum, p) => sum + (p._count?.impactLogs || 0), 0)}
            </p>
          </div>
          <div className="hidden sm:block bg-green-50 rounded-xl border border-green-100 p-4 shadow-sm">
            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Status</p>
            <p className="text-sm font-semibold text-green-700 mt-1">Tracking Active 🌱</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-4">
            <FolderOpen className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Create your first project to start tracking carbon emissions across your infrastructure.
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      )}

      {/* Projects grid */}
      {!isLoading && projects.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Your Projects ({projects.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className="group bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Card top accent */}
                <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-semibold text-gray-900 hover:text-green-700 transition-colors line-clamp-1 block"
                      >
                        {project.name}
                      </Link>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(project.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span>{project._count?.impactLogs || 0} impact events</span>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
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
    </div>
  );
}
