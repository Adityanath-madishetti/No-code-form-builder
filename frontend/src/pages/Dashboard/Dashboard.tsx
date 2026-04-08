import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

import DashboardHeader from './components/DashboardHeader';
import TemplatesSection from './components/TemplatesSection';
import MyFormsTab from './components/MyFormsTab';
import SharedFormsTab from './components/SharedFormsTab';
import SubmissionsTab from './components/SubmissionsTab';
import SubmissionDetails from './components/SubmissionDetails';
import type {
  FormHeader,
  SharedFormHeader,
  MySubmission,
} from './dashboard.types';

type TabView = 'myForms' | 'sharedForms' | 'mySubmissions';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [bottomView, setBottomView] = useState<TabView>('myForms');

  const [forms, setForms] = useState<FormHeader[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedFormHeader[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  const fetchAllData = async () => {
    try {
      const [fRes, sfRes, subRes] = await Promise.all([
        api.get<{ forms: FormHeader[] }>('/api/forms'),
        api.get<{ forms: SharedFormHeader[] }>('/api/forms/shared'),
        api.get<{ submissions: MySubmission[] }>('/api/submissions/mine'),
      ]);
      if (fRes.forms) setForms(fRes.forms);
      if (sfRes.forms) setSharedForms(sfRes.forms);
      if (subRes.submissions) setSubmissions(subRes.submissions);
    } catch {
      // Handled silently; UI fallbacks exist in components
    }
  };

  useEffect(() => {
    document.title = 'Dashboard — Form Builder';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData().finally(() => setLoading(false));
  }, []);

  const selectedSubmission =
    submissions.find((s) => s.submissionId === selectedSubmissionId) || null;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-900">
      <DashboardHeader />

      <main className="flex-1 bg-neutral-100 px-6 py-8 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-5xl">
          <TemplatesSection />

          <section className="mt-10 pt-2 pl-3">
            <div className="mb-3 flex flex-wrap items-end gap-5 border-b border-border pb-1">
              {(['myForms', 'sharedForms', 'mySubmissions'] as TabView[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setBottomView(tab)}
                    className={`border-b-2 pb-1 text-sm transition-colors ${
                      bottomView === tab
                        ? 'border-foreground font-medium text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'myForms'
                      ? 'My Forms'
                      : tab === 'sharedForms'
                        ? 'Shared With Me'
                        : 'My Submissions'}
                  </button>
                )
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid [&>*]:[grid-area:1/1]">
                <div
                  className={
                    bottomView !== 'myForms'
                      ? 'pointer-events-none invisible'
                      : ''
                  }
                >
                  <MyFormsTab forms={forms} onReload={fetchAllData} />
                </div>

                <div
                  className={
                    bottomView !== 'sharedForms'
                      ? 'pointer-events-none invisible'
                      : ''
                  }
                >
                  <SharedFormsTab
                    sharedForms={sharedForms}
                    onReload={fetchAllData}
                  />
                </div>

                <div
                  className={
                    bottomView !== 'mySubmissions'
                      ? 'pointer-events-none invisible'
                      : ''
                  }
                >
                  <SubmissionsTab
                    submissions={submissions}
                    selectedId={selectedSubmissionId}
                    onSelect={setSelectedSubmissionId}
                  />
                </div>
              </div>
            )}
          </section>

          {bottomView === 'mySubmissions' && selectedSubmission && (
            <SubmissionDetails submission={selectedSubmission} />
          )}
        </div>
      </main>
    </div>
  );
}
