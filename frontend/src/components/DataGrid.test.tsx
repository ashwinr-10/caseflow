import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataGrid } from './DataGrid';
import { useImportStore } from '@/store/importStore';

// Mock the store
vi.mock('@/store/importStore', () => ({
  useImportStore: vi.fn(),
}));

describe('DataGrid', () => {
  it('should render empty state when no rows', () => {
    (useImportStore as any).mockReturnValue({
      rows: [],
      updateRow: vi.fn(),
    });

    render(<DataGrid />);
    // Add assertions based on your implementation
  });
});

