'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { DOC_ROUTES } from '@/lib/routes';

export default function GenerateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Generate Route Error:', error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="mb-4 rounded-full bg-red-100 p-4">
        <RefreshCcw className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight">Something went wrong!</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        We encountered an error while trying to process your request in the generation dashboard. 
        You can try again or return to safety.
      </p>
      
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={() => reset()}
          size="lg"
          aria-label="Try generating again"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" size="lg" aria-label="Return to Dashboard">
          <Link href={DOC_ROUTES.DASHBOARD}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
