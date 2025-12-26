'use client';

import { useState } from 'react';
import { useImportStore } from '@/store/importStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function FixAllDialog() {
  const { rows, fixAll } = useImportStore();
  const [open, setOpen] = useState(false);

  const handleFix = (fixType: 'trim' | 'titleCase' | 'normalizePhone') => {
    fixAll(fixType);
    setOpen(false);
    toast.success(`Applied ${fixType} to all rows`);
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Fix All
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fix All Rows</DialogTitle>
          <DialogDescription>
            Apply bulk fixes to all rows in the dataset
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleFix('trim')}
          >
            Trim Whitespace
            <span className="ml-auto text-xs text-muted-foreground">
              Remove leading/trailing spaces
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleFix('titleCase')}
          >
            Title Case Names
            <span className="ml-auto text-xs text-muted-foreground">
              Convert applicant names to Title Case
            </span>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => handleFix('normalizePhone')}
          >
            Normalize Phone Numbers
            <span className="ml-auto text-xs text-muted-foreground">
              Convert to E.164 format (+country code)
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

