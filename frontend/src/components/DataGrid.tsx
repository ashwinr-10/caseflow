'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useImportStore, type ValidatedRow } from '@/store/importStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DataGrid() {
  const { rows, updateRow } = useImportStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<ValidatedRow>[]>(
    () => [
      {
        id: 'rowIndex',
        header: '#',
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">{row.original.rowIndex}</div>
        ),
        size: 60,
      },
      {
        accessorKey: 'data.case_id',
        header: 'Case ID',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value}
              onChange={(newValue) =>
                updateRow(row.index, { case_id: newValue })
              }
              hasError={row.original.errors.some((e) => e.includes('case_id'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.applicant_name',
        header: 'Applicant Name',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value}
              onChange={(newValue) =>
                updateRow(row.index, { applicant_name: newValue })
              }
              hasError={row.original.errors.some((e) => e.includes('applicant_name'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.dob',
        header: 'Date of Birth',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value}
              onChange={(newValue) => updateRow(row.index, { dob: newValue })}
              hasError={row.original.errors.some((e) => e.includes('dob'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.email',
        header: 'Email',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value || ''}
              onChange={(newValue) => updateRow(row.index, { email: newValue })}
              hasError={row.original.errors.some((e) => e.includes('email'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.phone',
        header: 'Phone',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value || ''}
              onChange={(newValue) => updateRow(row.index, { phone: newValue })}
              hasError={row.original.errors.some((e) => e.includes('phone'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.category',
        header: 'Category',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value}
              onChange={(newValue) => updateRow(row.index, { category: newValue })}
              hasError={row.original.errors.some((e) => e.includes('category'))}
            />
          );
        },
      },
      {
        accessorKey: 'data.priority',
        header: 'Priority',
        cell: ({ row, getValue }) => {
          const value = getValue() as string;
          return (
            <EditableCell
              value={value || 'LOW'}
              onChange={(newValue) => updateRow(row.index, { priority: newValue })}
              hasError={row.original.errors.some((e) => e.includes('priority'))}
            />
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.isValid ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
            {row.original.errors.length > 0 && (
              <span className="text-xs text-destructive">
                {row.original.errors.length} error(s)
              </span>
            )}
          </div>
        ),
        size: 120,
      },
    ],
    [updateRow]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const { rows: tableRows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Filter rows..."
          value={(table.getColumn('data.case_id')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('data.case_id')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto border rounded-lg"
        role="table"
        aria-label="Data grid"
      >
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-background z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b transition-colors',
                    row.original.isValid
                      ? 'hover:bg-muted/50'
                      : 'bg-destructive/5 hover:bg-destructive/10'
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - virtualRow.index * virtualRow.size}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {virtualizer.getVirtualItems().length} of {rows.length} rows
      </div>
    </div>
  );
}

function EditableCell({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleBlur = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn('h-8', hasError && 'border-destructive')}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        'px-2 py-1 rounded cursor-pointer hover:bg-muted min-h-[32px] flex items-center',
        hasError && 'bg-destructive/10 border border-destructive/20'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsEditing(true);
        }
      }}
    >
      {value || <span className="text-muted-foreground">—</span>}
    </div>
  );
}

