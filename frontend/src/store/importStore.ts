import { create } from 'zustand';

export interface ValidatedRow {
  rowIndex: number;
  data: {
    case_id: string;
    applicant_name: string;
    dob: string;
    email?: string;
    phone?: string;
    category: string;
    priority?: string;
  };
  errors: string[];
  isValid: boolean;
}

interface ImportState {
  rows: ValidatedRow[];
  columns: string[];
  fileName: string;
  isUploading: boolean;
  isSubmitting: boolean;
  submitProgress: number;
  submitResults: {
    success: any[];
    failed: any[];
  } | null;
  setRows: (rows: ValidatedRow[]) => void;
  setColumns: (columns: string[]) => void;
  setFileName: (fileName: string) => void;
  updateRow: (index: number, data: Partial<ValidatedRow['data']>) => void;
  fixAll: (fixType: 'trim' | 'titleCase' | 'normalizePhone') => void;
  reset: () => void;
  setUploading: (isUploading: boolean) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitProgress: (progress: number) => void;
  setSubmitResults: (results: { success: any[]; failed: any[] }) => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  rows: [],
  columns: [],
  fileName: '',
  isUploading: false,
  isSubmitting: false,
  submitProgress: 0,
  submitResults: null,

  setRows: (rows) => set({ rows }),
  setColumns: (columns) => set({ columns }),
  setFileName: (fileName) => set({ fileName }),

  updateRow: (index, data) => {
    const rows = [...get().rows];
    rows[index] = {
      ...rows[index],
      data: { ...rows[index].data, ...data },
    };
    set({ rows });
  },

  fixAll: (fixType) => {
    const rows = [...get().rows];
    rows.forEach((row) => {
      if (fixType === 'trim') {
        row.data.case_id = row.data.case_id.trim();
        row.data.applicant_name = row.data.applicant_name.trim();
        if (row.data.email) row.data.email = row.data.email.trim();
        if (row.data.phone) row.data.phone = row.data.phone.trim();
      } else if (fixType === 'titleCase') {
        row.data.applicant_name = row.data.applicant_name
          .toLowerCase()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else if (fixType === 'normalizePhone') {
        if (row.data.phone) {
          // Normalize phone to E.164 format
          let phone = row.data.phone.replace(/[^\d+]/g, '');
          if (!phone.startsWith('+')) {
            if (phone.length === 10) {
              phone = '+1' + phone;
            } else if (phone.length === 12 && phone.startsWith('91')) {
              phone = '+' + phone;
            } else {
              phone = '+' + phone;
            }
          }
          row.data.phone = phone;
        }
      }
    });
    set({ rows });
  },

  reset: () =>
    set({
      rows: [],
      columns: [],
      fileName: '',
      isUploading: false,
      isSubmitting: false,
      submitProgress: 0,
      submitResults: null,
    }),

  setUploading: (isUploading) => set({ isUploading }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setSubmitProgress: (progress) => set({ submitProgress: progress }),
  setSubmitResults: (results) => set({ submitResults: results }),
}));

