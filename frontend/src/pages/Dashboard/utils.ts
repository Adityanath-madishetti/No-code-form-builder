export const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getCreatorLabel = (form: { createdBy?: string }, userUid?: string, fallback = 'You') => {
  if (form.createdBy && userUid && form.createdBy === userUid) return 'You';
  if (form.createdBy) return form.createdBy;
  return fallback;
};

export const isWithinDays = (iso: string, days: number) => {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed <= days * 24 * 60 * 60 * 1000;
};

export const matchesDateFilter = (
  iso: string,
  filter: 'all' | 'last7' | 'last30' | 'older'
) => {
  if (filter === 'all') return true;
  if (filter === 'last7') return isWithinDays(iso, 7);
  if (filter === 'last30') return isWithinDays(iso, 30);
  return !isWithinDays(iso, 30);
};

export const getSharedRoleLabel = (form: any) => {
  const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
  const hasEditor = roles.includes('editor');
  const hasReviewer = roles.includes('reviewer');

  if (hasEditor && hasReviewer) return 'Editor + Reviewer';
  if (hasEditor) return 'Editor';
  return 'Reviewer';
};

export const canSharedUserEditForm = (form: any) => {
  const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
  return roles.includes('editor');
};

export const statusColor: Record<string, string> = {
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  under_review: 'bg-amber-500',
  draft: 'bg-neutral-400',
};

export const formatResponseValue = (value: unknown) => {
  if (value === null || value === undefined) return 'No response';
  if (typeof value === 'string') return value || 'No response';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.length ? value.map((entry) => String(entry)).join(', ') : 'No response';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};
