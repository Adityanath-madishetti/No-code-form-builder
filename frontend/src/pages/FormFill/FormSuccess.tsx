// src/pages/FormFill/FormSuccess.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home } from 'lucide-react';

export default function FormSuccess() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-semibold">Response Submitted!</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Thank you for your response. Your submission has been recorded successfully.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <Home className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
