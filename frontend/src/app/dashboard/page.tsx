'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useImportStore } from '@/store/importStore';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/DataGrid';
import { FixAllDialog } from '@/components/FixAllDialog';
import { SubmitDialog } from '@/components/SubmitDialog';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const {
    rows,
    columns,
    fileName,
    isUploading,
    isSubmitting,
    setRows,
    setColumns,
    setFileName,
    setUploading,
    reset,
  } = useImportStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setFileName(file.name);

      try {
        const response = await apiClient.uploadCSV(file);
        if (response.success && response.data) {
          setRows(response.data.rows);
          setColumns(response.data.columns);
          toast.success(`Uploaded ${response.data.totalRows} rows`);
        } else {
          toast.error(response.error?.message || 'Upload failed');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [setRows, setColumns, setFileName, setUploading]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Cases</h1>
        <p className="text-muted-foreground">Upload a CSV file to import cases</p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">Uploading and parsing CSV...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      or click to browse (max 50MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CSV Preview</CardTitle>
                  <CardDescription>
                    {fileName} • {rows.length} rows • {validRows.length} valid • {invalidRows.length}{' '}
                    with errors
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <FixAllDialog />
                  <SubmitDialog />
                  <Button variant="outline" onClick={reset}>
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invalidRows.length > 0 && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-destructive">
                      {invalidRows.length} row(s) have validation errors
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please fix the errors before submitting
                    </p>
                  </div>
                </div>
              )}
              <DataGrid />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

