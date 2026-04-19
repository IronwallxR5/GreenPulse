import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../../services/project.service';
import type { Project, Organization, OrganizationMember, OrganizationRole } from '../../services/project.service';
import { Link } from 'react-router-dom';
import { Plus, Trash2, FolderOpen, ArrowRight, Loader2, Leaf, Pencil, Sparkles, Gauge, Layers3, Building2, Users } from 'lucide-react';
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
  const [projectScope, setProjectScope] = useState<'PERSONAL' | 'ORG'>('PERSONAL');
  const [projectOrganizationId, setProjectOrganizationId] = useState('');

  // ── Organization state ──────────────────────────────────────────────────
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgMembersOpen, setOrgMembersOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<OrganizationRole>('MEMBER');

  // ── Edit project state ───────────────────────────────────────────────────
  const [editOpen, setEditOpen]               = useState(false);
  const [editTarget, setEditTarget]           = useState<Project | null>(null);
  const [editName, setEditName]               = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: projectService.getAll,
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: projectService.getOrganizations,
  });

  const selectedOrganization = organizations.find((org) => org.id === selectedOrgId) ?? null;
  const selectedOrganizationRole = selectedOrganization?.memberships?.[0]?.role ?? null;
  const canManageMembers = selectedOrganizationRole === 'OWNER' || selectedOrganizationRole === 'ADMIN';

  const { data: organizationMembers = [], isLoading: isLoadingOrganizationMembers } = useQuery<OrganizationMember[]>({
    queryKey: ['organization-members', selectedOrgId],
    queryFn: () => projectService.getOrganizationMembers(selectedOrgId!),
    enabled: orgMembersOpen && selectedOrgId !== null,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; organizationId?: number }) => projectService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      setName('');
      setDescription('');
      setProjectScope('PERSONAL');
      setProjectOrganizationId('');
    },
  });

  const createOrganizationMutation = useMutation({
    mutationFn: (data: { name: string }) => projectService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setOrgOpen(false);
      setOrgName('');
    },
  });

  const addOrganizationMemberMutation = useMutation({
    mutationFn: (data: { organizationId: number; email: string; role: OrganizationRole }) =>
      projectService.addOrganizationMember(data.organizationId, {
        email: data.email,
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', selectedOrgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setMemberEmail('');
      setMemberRole('MEMBER');
    },
  });

  const updateOrganizationMemberRoleMutation = useMutation({
    mutationFn: (data: { organizationId: number; memberUserId: number; role: OrganizationRole }) =>
      projectService.updateOrganizationMemberRole(data.organizationId, data.memberUserId, {
        role: data.role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', selectedOrgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const removeOrganizationMemberMutation = useMutation({
    mutationFn: (data: { organizationId: number; memberUserId: number }) =>
      projectService.removeOrganizationMember(data.organizationId, data.memberUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-members', selectedOrgId] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
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

    const organizationId = projectScope === 'ORG' ? parseInt(projectOrganizationId, 10) : undefined;
    if (projectScope === 'ORG' && (!projectOrganizationId || Number.isNaN(organizationId))) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      organizationId,
    });
  };

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    createOrganizationMutation.mutate({ name: orgName.trim() });
  };

  const openOrganizationMembersDialog = (organizationId: number) => {
    setSelectedOrgId(organizationId);
    setOrgMembersOpen(true);
  };

  const handleAddOrganizationMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !memberEmail.trim()) {
      return;
    }

    addOrganizationMemberMutation.mutate({
      organizationId: selectedOrgId,
      email: memberEmail.trim(),
      role: memberRole,
    });
  };

  const handleRoleChange = (member: OrganizationMember, role: OrganizationRole) => {
    if (!selectedOrgId || role === member.role) {
      return;
    }

    updateOrganizationMemberRoleMutation.mutate({
      organizationId: selectedOrgId,
      memberUserId: member.userId,
      role,
    });
  };

  const handleRemoveMember = (member: OrganizationMember) => {
    if (!selectedOrgId) {
      return;
    }

    removeOrganizationMemberMutation.mutate({
      organizationId: selectedOrgId,
      memberUserId: member.userId,
    });
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

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const totalEvents = projects.reduce((sum, p) => sum + (p._count?.impactLogs || 0), 0);
  const avgEventsPerProject = projects.length > 0 ? totalEvents / projects.length : 0;
  const activeProjects = projects.filter((p) => (p._count?.impactLogs || 0) > 0).length;
  const topProject = [...projects].sort((a, b) => (b._count?.impactLogs || 0) - (a._count?.impactLogs || 0))[0];

  return (
    <div className="space-y-7 route-enter">
      <section className="surface-strong reveal-up relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -left-24 top-2 h-64 w-64 rounded-full bg-forest-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-gold-300/30 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-heading text-forest-300">Mission Console</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight text-warm-50 sm:text-4xl">
              Welcome back, {firstName}. Keep your digital footprint efficient.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-forest-200/90 sm:text-base">
              Launch new projects, monitor activity density, and move high-emission services into your optimization queue.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-forest-200">
              <div className="flex items-center gap-1.5 rounded-full bg-forest-800/80 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold-300" />
                Live sustainability signals
              </div>
              <div className="rounded-full bg-forest-800/80 px-3 py-1.5">
                {projects.length} projects in workspace
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl bg-gold-500 px-5 text-forest-950 shadow-warm-lg hover:bg-gold-400">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-warm-200 bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-display text-warm-950">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gold-100">
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
                      className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
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
                      className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-warm-800 font-medium">Workspace</Label>
                    <select
                      value={projectScope}
                      onChange={(e) => setProjectScope(e.target.value as 'PERSONAL' | 'ORG')}
                      className="h-10 w-full rounded-md border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
                    >
                      <option value="PERSONAL">Personal Workspace</option>
                      {organizations.length > 0 && <option value="ORG">Organization Workspace</option>}
                    </select>
                  </div>

                  {projectScope === 'ORG' && (
                    <div className="space-y-1.5">
                      <Label className="text-warm-800 font-medium">Organization</Label>
                      <select
                        value={projectOrganizationId}
                        onChange={(e) => setProjectOrganizationId(e.target.value)}
                        className="h-10 w-full rounded-md border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
                      >
                        <option value="">Select organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={createMutation.isPending || !name.trim() || (projectScope === 'ORG' && !projectOrganizationId)}
                    className="w-full bg-forest-900 text-warm-50 hover:bg-forest-800"
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

            <Dialog open={orgOpen} onOpenChange={setOrgOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 gap-2 rounded-xl border border-forest-300 bg-white px-5 text-forest-700 hover:bg-forest-50">
                  <Building2 className="h-4 w-4" />
                  New Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border-warm-200 bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-display text-warm-950">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-forest-100">
                      <Users className="h-4 w-4 text-forest-700" />
                    </div>
                    Create Organization
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrganization} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="org-name" className="text-warm-800 font-medium">
                      Organization Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="org-name"
                      placeholder="e.g. GreenPulse Platform Team"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createOrganizationMutation.isPending || !orgName.trim()}
                    className="w-full bg-forest-900 text-warm-50 hover:bg-forest-800"
                  >
                    {createOrganizationMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                    ) : (
                      'Create Organization'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {organizations.length > 0 && (
        <section className="surface-card reveal-up p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-forest-700" />
            <h3 className="font-display text-sm font-semibold text-warm-900">Your Organizations</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <div key={org.id} className="rounded-lg border border-warm-100 bg-white p-4">
                <p className="font-semibold text-warm-900">{org.name}</p>
                <p className="mt-1 text-xs text-warm-500">
                  Role: {org.memberships?.[0]?.role ?? 'MEMBER'}
                </p>
                <p className="mt-1 text-xs text-warm-500">
                  Members: {org._count?.memberships ?? 0} | Projects: {org._count?.projects ?? 0}
                </p>
                <Button
                  type="button"
                  onClick={() => openOrganizationMembersDialog(org.id)}
                  className="mt-3 h-8 w-full rounded-md bg-forest-900 px-3 text-xs text-warm-50 hover:bg-forest-800"
                >
                  Manage Team
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={orgMembersOpen}
        onOpenChange={(open) => {
          setOrgMembersOpen(open);
          if (!open) {
            setSelectedOrgId(null);
            setMemberEmail('');
            setMemberRole('MEMBER');
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl border-warm-200 bg-white">
          <DialogHeader>
            <DialogTitle className="font-display text-warm-950">
              {selectedOrganization ? `${selectedOrganization.name} Team` : 'Organization Team'}
            </DialogTitle>
          </DialogHeader>

          {canManageMembers && (
            <form onSubmit={handleAddOrganizationMember} className="grid grid-cols-1 gap-3 border-b border-warm-100 pb-4 md:grid-cols-[1fr_160px_auto]">
              <Input
                placeholder="member@company.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
              />
              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value as OrganizationRole)}
                className="h-10 w-full rounded-md border border-warm-200 bg-white px-3 text-sm text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                {selectedOrganizationRole === 'OWNER' && <option value="OWNER">Owner</option>}
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
              <Button
                type="submit"
                disabled={!memberEmail.trim() || addOrganizationMemberMutation.isPending || !selectedOrgId}
                className="h-10 bg-forest-900 text-warm-50 hover:bg-forest-800"
              >
                {addOrganizationMemberMutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </form>
          )}

          {!canManageMembers && (
            <p className="rounded-md border border-warm-200 bg-warm-50 px-3 py-2 text-xs text-warm-700">
              You can view team members, but only owners and admins can manage memberships.
            </p>
          )}

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {isLoadingOrganizationMembers && (
              <div className="flex items-center justify-center py-8 text-sm text-warm-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading members...
              </div>
            )}

            {!isLoadingOrganizationMembers && organizationMembers.length === 0 && (
              <p className="py-6 text-center text-sm text-warm-500">No members found for this organization.</p>
            )}

            {!isLoadingOrganizationMembers && organizationMembers.map((member) => {
              const isCurrentUser = member.userId === user?.id;
              const isBusy = updateOrganizationMemberRoleMutation.isPending || removeOrganizationMemberMutation.isPending;

              return (
                <div key={member.id} className="flex flex-col gap-2 rounded-md border border-warm-100 px-3 py-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-warm-900">{member.user.name}</p>
                    <p className="text-xs text-warm-500">{member.user.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as OrganizationRole)}
                      disabled={!canManageMembers || isBusy || (!isCurrentUser && selectedOrganizationRole === 'ADMIN' && member.role === 'OWNER')}
                      className="h-9 rounded-md border border-warm-200 bg-white px-2 text-xs text-warm-800 focus:border-forest-700 focus:outline-none focus:ring-2 focus:ring-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {selectedOrganizationRole === 'OWNER' && <option value="OWNER">Owner</option>}
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Member</option>
                    </select>

                    <Button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      disabled={!canManageMembers || isBusy || (!isCurrentUser && selectedOrganizationRole === 'ADMIN' && member.role === 'OWNER')}
                      className="h-9 rounded-md border border-red-200 bg-white px-3 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {projects.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-group">
          <div className="surface-card interactive-lift p-5">
            <p className="section-heading">Total Projects</p>
            <p className="mt-2 font-display text-3xl font-semibold text-warm-950">{projects.length}</p>
            <p className="mt-1 text-xs text-warm-500">Across your current workspace</p>
          </div>

          <div className="surface-card interactive-lift p-5">
            <p className="section-heading">Impact Events</p>
            <p className="mt-2 font-display text-3xl font-semibold text-warm-950">{totalEvents}</p>
            <p className="mt-1 text-xs text-warm-500">Recorded logs across all projects</p>
          </div>

          <div className="surface-card interactive-lift p-5">
            <div className="mb-1 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-forest-600" />
              <p className="section-heading">Activity Density</p>
            </div>
            <p className="mt-2 font-display text-3xl font-semibold text-warm-950">{avgEventsPerProject.toFixed(1)}</p>
            <p className="mt-1 text-xs text-warm-500">Avg. events per project</p>
          </div>

          <div className="surface-card interactive-lift p-5">
            <div className="mb-1 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-gold-600" />
              <p className="section-heading">Active Tracking</p>
            </div>
            <p className="mt-2 font-display text-3xl font-semibold text-warm-950">{activeProjects}</p>
            <p className="mt-1 text-xs text-warm-500">Projects with at least one event</p>
          </div>
        </section>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-forest-600" />
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <div className="surface-card reveal-up stagger-1 border-dashed p-14 text-center sm:p-16">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100/80">
            <FolderOpen className="h-8 w-8 text-forest-600" />
          </div>
          <h3 className="mb-2 font-display text-xl font-semibold text-warm-950">No projects yet</h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-warm-600">
            Create your first project to start tracking carbon emissions across your infrastructure.
          </p>
          <Button
            onClick={() => setOpen(true)}
            className="h-10 gap-2 rounded-xl bg-forest-900 px-5 text-warm-50 hover:bg-forest-800"
          >
            <Plus className="h-4 w-4" />
            Create your first project
          </Button>
        </div>
      )}

      {!isLoading && projects.length > 0 && (
        <section className="reveal-up stagger-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-heading">
            Your Projects ({projects.length})
            </h2>
            {topProject && (
              <p className="hidden text-xs text-warm-500 sm:block">
                Most active: <span className="font-semibold text-warm-700">{topProject.name}</span>
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-group">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className="surface-card interactive-lift group overflow-hidden"
              >
                <div className="h-[3px] bg-gradient-to-r from-forest-600 via-gold-400 to-forest-400" />

                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="block line-clamp-1 font-semibold text-warm-950 transition-colors hover:text-forest-800"
                      >
                        {project.name}
                      </Link>
                      {project.organization && (
                        <span className="mt-1 inline-flex rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-700">
                          {project.organization.name}
                        </span>
                      )}
                      <p className="mt-0.5 line-clamp-2 text-sm text-warm-600">
                        {project.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEditDialog(project)}
                        className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-forest-50 hover:text-forest-700"
                        title="Edit project"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(project.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg p-1.5 text-warm-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-warm-100 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-warm-500">
                      <div className="h-2 w-2 rounded-full bg-forest-400" />
                      <span>{project._count?.impactLogs || 0} impact events</span>
                    </div>
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-forest-700 transition-colors hover:text-forest-900"
                    >
                      View details
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md border-warm-200 bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-warm-950">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-warm-100">
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
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
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
                className="h-10 border-warm-200 bg-white focus-visible:ring-forest-700"
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
                className="flex-1 bg-forest-900 text-warm-50 hover:bg-forest-800"
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
