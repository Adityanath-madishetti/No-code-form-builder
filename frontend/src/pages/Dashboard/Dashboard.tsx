import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Separate data array for cleaner JSX mapping
  const dashboardTabs = [
    {
      name: 'My Forms',
      value: 'myForms',
      content: <MyFormsTab forms={forms} onReload={fetchAllData} />,
    },
    {
      name: 'Shared With Me',
      value: 'sharedForms',
      content: (
        <SharedFormsTab sharedForms={sharedForms} onReload={fetchAllData} />
      ),
    },
    {
      name: 'My Submissions',
      value: 'mySubmissions',
      content: (
        <SubmissionsTab
          submissions={submissions}
          selectedId={selectedSubmissionId}
          onSelect={setSelectedSubmissionId}
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-900">
      <DashboardHeader />

      <main className="flex-1 bg-neutral-100 px-6 py-8 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-5xl">
          <TemplatesSection />

          <section className="mt-10 pt-2">
            <Tabs
              value={bottomView}
              onValueChange={(val) => setBottomView(val as TabView)}
              className="w-full gap-4"
            >
              <div className="mb-4 pl-3">
                {/* Updated to Solid Pills styling */}
                <TabsList className="gap-1 bg-background">
                  {dashboardTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
                    >
                      {tab.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {loading ? (
                <div className="mt-4 pl-3">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex h-[130px] flex-col rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-full">
                            <Skeleton className="mb-2 h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="mt-auto flex items-end justify-between">
                          <Skeleton className="h-3 w-1/3" />
                          <div className="flex gap-1">
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                            <Skeleton className="h-8 w-8 rounded-md" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pl-3">
                  {dashboardTabs.map((tab) => (
                    <TabsContent
                      key={tab.value}
                      value={tab.value}
                      className="mt-0"
                    >
                      {tab.content}
                    </TabsContent>
                  ))}
                </div>
              )}
            </Tabs>
          </section>

          {bottomView === 'mySubmissions' && selectedSubmission && (
            <SubmissionDetails submission={selectedSubmission} />
          )}
        </div>
      </main>
    </div>
  );
}
