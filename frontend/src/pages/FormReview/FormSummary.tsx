import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import type {
  PublicFormData,
  PublicComponent,
} from '@/form/renderer/viewRenderer/runtimeForm.types';

// Assuming these match your ComponentIDs
const CATEGORICAL_COMPONENTS = [
  'radio',
  'dropdown',
  'checkbox',
  'single-choice-grid',
  'multi-choice-grid',
];
const TEXT_COMPONENTS = [
  'single-line-text',
  'multi-line-text',
  'single-line-input',
  'multi-line-input',
  'email',
  'url',
  'phone',
];
const NUMBER_COMPONENTS = [
  'number',
  'decimal',
  'rating',
  'slider',
  'linear-scale',
];

interface FormSummaryProps {
  formSchema: PublicFormData;
  submissions: any[]; // Using any to simplify matching with SubmissionRecord structure from FormReview
}

function processCategoricalData(
  componentId: string,
  submissions: any[]
): { name: string; value: number }[] {
  const counts: Record<string, number> = {};

  submissions.forEach((sub) => {
    sub.pages?.forEach((page: any) => {
      page.responses?.forEach((res: any) => {
        if (res.componentId === componentId) {
          const val = res.response;
          if (Array.isArray(val)) {
            val.forEach((v) => {
              const key = String(v);
              counts[key] = (counts[key] || 0) + 1;
            });
          } else if (val !== null && val !== undefined && val !== '') {
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
          }
        }
      });
    });
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort descending
}

function processTextData(componentId: string, submissions: any[]): string[] {
  const texts: string[] = [];

  submissions.forEach((sub) => {
    sub.pages?.forEach((page: any) => {
      page.responses?.forEach((res: any) => {
        if (res.componentId === componentId) {
          const val = res.response;
          if (val !== null && val !== undefined && val !== '') {
            texts.push(String(val));
          }
        }
      });
    });
  });

  return texts; // Latest first could be done if submissions are sorted newest first
}

function processNumericData(componentId: string, submissions: any[]) {
  const numbers: number[] = [];

  submissions.forEach((sub) => {
    sub.pages?.forEach((page: any) => {
      page.responses?.forEach((res: any) => {
        if (res.componentId === componentId) {
          const val = Number(res.response);
          if (!isNaN(val)) {
            numbers.push(val);
          }
        }
      });
    });
  });

  if (numbers.length === 0) return null;

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return { sum, avg, min, max, count: numbers.length };
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function FormSummary({
  formSchema,
  submissions,
}: FormSummaryProps) {
  const componentsToRender = useMemo(() => {
    const comps: PublicComponent[] = [];
    formSchema?.version?.pages?.forEach((page) => {
      page?.components?.forEach((comp) => {
        comps.push(comp);
      });
    });
    return comps;
  }, [formSchema]);

  return (
    <div className="space-y-6 pb-12">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              matching current filters
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {componentsToRender.map((comp) => (
          <ComponentAnalytics
            key={comp.componentId}
            component={comp}
            submissions={submissions}
          />
        ))}
      </div>
    </div>
  );
}

function ComponentAnalytics({
  component,
  submissions,
}: {
  component: PublicComponent;
  submissions: any[];
}) {
  const title =
    component.label ||
    (component.props as any)?.questionText?.replace(/<[^>]+>/g, '') ||
    component.componentType;

  if (CATEGORICAL_COMPONENTS.includes(component.componentType)) {
    const data = processCategoricalData(component.componentId, submissions);
    const totalResponses = data.reduce((acc, curr) => acc + curr.value, 0);

    const chartConfig: ChartConfig = {
      value: {
        label: 'Count',
        color: 'hsl(var(--primary))',
      },
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>
            {totalResponses} response{totalResponses !== 1 && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="h-[300px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={data} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4}>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (NUMBER_COMPONENTS.includes(component.componentType)) {
    const stats = processNumericData(component.componentId, submissions);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>Numeric summary</CardDescription>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Average</span>
                <span className="text-lg font-semibold">
                  {stats.avg.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Min</span>
                <span className="text-lg font-semibold">{stats.min}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Max</span>
                <span className="text-lg font-semibold">{stats.max}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
                <span className="text-xs text-muted-foreground">Count</span>
                <span className="text-lg font-semibold">{stats.count}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (TEXT_COMPONENTS.includes(component.componentType)) {
    const data = processTextData(component.componentId, submissions);

    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription>
            {data.length} response{data.length !== 1 && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {data.length > 0 ? (
            <ScrollArea className="h-[250px] w-full pr-4">
              <div className="flex flex-col gap-3">
                {data.map((text, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border bg-muted/20 p-3 text-sm"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
