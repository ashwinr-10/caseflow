'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportStore } from '@/store/importStore';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Send, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SubmitDialog() {
  const router = useRouter();
  const {
    rows,
    fileName,
    isSubmitting,
    submitProgress,
    submitResults,
    setSubmitting,
    setSubmitProgress,
    setSubmitResults,
    reset,
  } = useImportStore();
  const [open, setOpen] = useState(false);

  const validRows = rows.filter((r) => r.isValid);

  const handleSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows to submit');
      return;
    }

    setSubmitting(true);
    setSubmitProgress(0);

    try {
      const response = await apiClient.batchCreateCases(validRows, fileName);

      if (response.success && response.data) {
        setSubmitResults(response.data.results);
        setSubmitProgress(100);
        toast.success(
          `Successfully imported ${response.data.summary.success} cases`
        );
        
        // Reset after 3 seconds and redirect
        setTimeout(() => {
          reset();
          setOpen(false);
          router.push('/dashboard/cases');
        }, 3000);
      } else {
        toast.error(response.error?.message || 'Submission failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={validRows.length === 0}>
          <Send className="mr-2 h-4 w-4" />
          Submit {validRows.length} Cases
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Cases</DialogTitle>
          <DialogDescription>
            Submit {validRows.length} valid case(s) to the system
          </DialogDescription>
        </DialogHeader>

        {!submitResults ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>{validRows.length}</strong> valid case(s) will be imported
              </p>
              {rows.length - validRows.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rows.length - validRows.length} row(s) with errors will be skipped
                </p>
              )}
            </div>

            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Submitting cases...</span>
                  <span>{submitProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${submitProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  {submitResults.success.length} case(s) imported successfully
                </span>
              </div>
              {submitResults.failed.length > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {submitResults.failed.length} case(s) failed
                  </span>
                </div>
              )}
            </div>

            {submitResults.failed.length > 0 && (
              <div className="max-h-48 overflow-auto border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Failed rows:</p>
                <ul className="space-y-1 text-sm">
                  {submitResults.failed.slice(0, 10).map((failed, idx) => (
                    <li key={idx} className="text-muted-foreground">
                      Row {failed.rowIndex}: {failed.errors?.join(', ')}
                    </li>
                  ))}
                  {submitResults.failed.length > 10 && (
                    <li className="text-muted-foreground">
                      ... and {submitResults.failed.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                router.push('/dashboard/cases');
              }}
            >
              View Cases
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

