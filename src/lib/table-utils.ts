import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to safely handle potentially null strings
export function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

// Helper function to safely handle potentially null dates
export function safeDate(dateString: any): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  } catch (error) {
    return '';
  }
}

// Enhanced formatDate with safety checks
export function formatDate(dateString: any, originalFormatFn?: (date: any) => string): string {
  try {
    if (originalFormatFn) {
      return originalFormatFn(dateString);
    }
    return safeDate(dateString);
  } catch (error) {
    return safeDate(dateString);
  }
}

// First add a new formatted date function
export function formatDateLong(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  
  // Add ordinal suffix to day
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  
  return date.toLocaleDateString('en-US', options)
    .replace(/\b\d+\b/, day + suffix);
}

export function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// CSV Export functionality
export function downloadTableAsCSV(data: any[], visibleColumns: string[], getFormattedColumnName: (col: string) => string, entityType: 'certificates' | 'serviceids' = 'certificates') {
  // Get all column headers except select and actions
  const columns = visibleColumns.filter(col => col !== 'select' && col !== 'actions');
  
  // Create CSV header row with column titles
  const headers = columns.map(col => escapeCsvField(getFormattedColumnName(col)));
  
  // Create CSV rows for each item
  const rows = data.map(item => {
    return columns.map(col => {
      // Handle special columns
      let value: string;
      if (col === 'customStatus') {
        // This will be handled by the specific table implementation
        value = item.customStatus || '';
      } else if (col === 'daysLeft') {
        // This will be handled by the specific table implementation  
        value = item.daysLeft || '';
      } else {
        // Access the regular field
        const rawValue = item[col];
        // Format date fields
        if (col === 'validFrom' || col === 'validTo' || col === 'lastNotificationOn' || col === 'lastReset' || col === 'expDate') {
          value = rawValue ? formatDate(rawValue) : '';
        } else {
          value = rawValue !== undefined ? String(rawValue) : '';
        }
      }
      return escapeCsvField(value);
    });
  });
  
  // Combine headers and rows
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  // Create a blob and download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${entityType}_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to properly escape CSV fields
export function escapeCsvField(field: string): string {
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (/[",\n\r]/.test(field)) {
    // Escape any quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Animation variants
export const tableRowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.2,
      ease: "easeOut"
    }
  }),
  hover: { 
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transition: { duration: 0.1 }
  }
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
}

export const statusBadgeVariants = {
  initial: { scale: 0.95 },
  animate: { scale: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.03, transition: { duration: 0.2 } }
}
