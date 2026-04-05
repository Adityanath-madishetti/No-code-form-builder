import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { FormHeader, SharedFormHeader, MySubmission } from './types';
import DashboardHeader from './components/DashboardHeader';
import TemplatesSection from './components/TemplatesSection';
import MyFormsList from './components/MyFormsList';
import SharedFormsList from './components/SharedFormsList';
import SubmissionsList from './components/SubmissionsList';

export default function Dashboard() {
  const [forms, setForms] = useState<FormHeader[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedFormHeader[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [bottomView, setBottomView] = useState<'myForms' | 'sharedForms' | 'mySubmissions'>('myForms');

  useEffect(() => {
    Promise.all([
      api
        .get<{ forms: FormHeader[] }>('/api/forms')
        .then((res) => setForms(res.forms))
        .catch(() => {}),
      api
        .get<{ forms: SharedFormHeader[] }>('/api/forms/shared')
        .then((res) => setSharedForms(res.forms))
        .catch(() => {}),
      api
        .get<{ submissions: MySubmission[] }>('/api/submissions/mine')
        .then((res) => setSubmissions(res.submissions))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Dashboard — Form Builder';
  }, []);

  const reloadFormLists = async () => {
    try {
      const [myRes, sharedRes] = await Promise.all([
        api.get<{ forms: FormHeader[] }>('/api/forms'),
        api.get<{ forms: SharedFormHeader[] }>('/api/forms/shared'),
      ]);
      setForms(myRes.forms || []);
      setSharedForms(sharedRes.forms || []);
    } catch {
      // Keep UI responsive; failures will be handled by existing empty states.
    }
  };

  const handleRenameForm = async (formId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename form', currentTitle);
    if (!nextTitle) return;
    try {
      await api.patch(`/api/forms/${formId}`, { title: nextTitle });
      await reloadFormLists();
    } catch (err) {
      window.alert((err as Error).message || 'Failed to rename form');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-900">
      <DashboardHeader />

      <main className="flex-1 bg-neutral-100 px-6 py-8 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-5xl">
          <TemplatesSection />

          <section className="mt-10 pl-3 pt-2">
            <div className="mb-3">
              <div className="flex flex-wrap items-end gap-5 border-b border-border pb-1">
                <button
                  type="button"
                  onClick={() => setBottomView('myForms')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${
                    bottomView === 'myForms'
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Forms
                </button>
                <button
                  type="button"
                  onClick={() => setBottomView('sharedForms')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${
                    bottomView === 'sharedForms'
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Shared With Me
                </button>
                <button
                  type="button"
                  onClick={() => setBottomView('mySubmissions')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${
                    bottomView === 'mySubmissions'
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Submissions
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div>
                {bottomView === 'myForms' && (
                  <MyFormsList forms={forms} onRenameForm={handleRenameForm} />
                )}
                {bottomView === 'sharedForms' && (
                  <SharedFormsList sharedForms={sharedForms} onRenameForm={handleRenameForm} />
                )}
                {bottomView === 'mySubmissions' && (
                  <SubmissionsList submissions={submissions} />
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
