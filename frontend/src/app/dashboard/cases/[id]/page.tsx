'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      const response = await apiClient.getCase(caseId);
      if (response.success && response.data) {
        setCaseData(response.data.case);
      }
    } catch (error) {
      toast.error('Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    try {
      const response = await apiClient.addCaseNote(caseId, note);
      if (response.success) {
        toast.success('Note added');
        setNote('');
        loadCase();
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading case...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Case not found</p>
        <Link href="/dashboard/cases">
          <Button variant="outline" className="mt-4">
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/cases">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Case {caseData.caseId}</h1>
          <p className="text-muted-foreground">Case details and history</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Case ID</label>
              <p className="text-sm font-mono">{caseData.caseId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Applicant Name</label>
              <p className="text-sm">{caseData.applicantName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
              <p className="text-sm">{format(new Date(caseData.dob), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{caseData.email || '—'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-sm">{caseData.phone || '—'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <p className="text-sm">{caseData.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <p className="text-sm">{caseData.priority}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <p className="text-sm">{caseData.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Add notes about this case</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a note..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button onClick={handleAddNote}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-auto">
              {caseData.notes?.map((note: any) => (
                <div key={note.id} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              ))}
              {(!caseData.notes || caseData.notes.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No notes yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {caseData.auditLogs && caseData.auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Audit trail for this case</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {caseData.auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {log.user && (
                    <p className="text-xs text-muted-foreground">{log.user.email}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

