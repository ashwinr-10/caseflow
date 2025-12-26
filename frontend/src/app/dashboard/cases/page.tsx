'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Case {
  id: string;
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string;
  phone?: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  assignee?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadCases = async (cursor?: string) => {
    try {
      const response = await apiClient.getCases({
        cursor,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });

      if (response.success && response.data) {
        if (cursor) {
          setCases((prev) => [...prev, ...response.data!.cases]);
        } else {
          setCases(response.data.cases);
        }
        setNextCursor(response.data.pagination.nextCursor);
      }
    } catch (error) {
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadCases();
  }, [search, statusFilter]);

  const loadMore = () => {
    if (nextCursor) {
      loadCases(nextCursor);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cases</h1>
        <p className="text-muted-foreground">View and manage all cases</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by case ID, name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Cases</CardTitle>
          <CardDescription>{cases.length} case(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && cases.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading cases...</p>
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No cases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">Case ID</th>
                      <th className="text-left p-3 text-sm font-medium">Applicant</th>
                      <th className="text-left p-3 text-sm font-medium">Category</th>
                      <th className="text-left p-3 text-sm font-medium">Priority</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                      <th className="text-left p-3 text-sm font-medium">Created</th>
                      <th className="text-left p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((caseItem) => (
                      <tr key={caseItem.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm font-mono">{caseItem.caseId}</td>
                        <td className="p-3 text-sm">{caseItem.applicantName}</td>
                        <td className="p-3 text-sm">{caseItem.category}</td>
                        <td className="p-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              caseItem.priority === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : caseItem.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {caseItem.priority}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{caseItem.status}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {format(new Date(caseItem.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-3">
                          <Link href={`/dashboard/cases/${caseItem.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {nextCursor && (
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

