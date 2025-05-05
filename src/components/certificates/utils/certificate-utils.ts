import * as React from 'react'
import { formatDate as originalFormatDate, getDaysUntilExpiration as originalGetDaysUntilExpiration, getCertificateCustomStatus as originalGetCertificateCustomStatus } from '@/hooks/use-certificates'
import type { Certificate } from '@/hooks/use-certificates'
import type { ColumnVisibilityState } from '../certificate-column-types'
import { getFormattedColumnName } from '../certificate-column-types'

/**
 * Helper function to safely handle potentially null strings
 */
export function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/**
 * Helper function to safely handle potentially null dates
 */
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

/**
 * Improved formatDate with safety checks
 */
export function formatDate(dateString: any): string {
  try {
    return originalFormatDate(dateString);
  } catch (error) {
    return safeDate(dateString);
  }
}

/**
 * Format date with long format including ordinal suffix
 */
export function formatDateLong(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return '';
    
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
  } catch (error) {
    return '';
  }
}

/**
 * Get the day suffix (st, nd, rd, th)
 */
function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Add safety checks to getDaysUntilExpiration
 */
export function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo);
  } catch (error) {
    return null;
  }
}

/**
 * Add safety checks to getCertificateCustomStatus
 */
export function getCertificateCustomStatus(validTo: any): ReturnType<typeof originalGetCertificateCustomStatus> {
  try {
    return originalGetCertificateCustomStatus(validTo);
  } catch (error) {
    // Default to expired on error
    return 'Expired';
  }
}

/**
 * Custom debounce hook for input values
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Convert table data to CSV and download it
 */
export function downloadTableAsCSV(data: Certificate[], visibleColumns: string[]) {
  // Get all column headers except select and actions
  const columns = visibleColumns.filter(col => col !== 'select' && col !== 'actions');
  
  // Create CSV header row with column titles
  const headers = columns.map(col => escapeCsvField(getFormattedColumnName(col)));
  
  // Create CSV rows for each certificate
  const rows = data.map(cert => {
    return columns.map(col => {
      // Handle special columns
      let value: string;
      if (col === 'customStatus') {
        value = getCertificateCustomStatus(cert.validTo);
      } else if (col === 'daysLeft') {
        const days = getDaysUntilExpiration(cert.validTo);
        value = days === 0 ? 'Expired' : days ? `${days} days` : '';
      } else {
        // Access the regular field
        const rawValue = cert[col as keyof Certificate];
        // Format date fields
        if (col === 'validFrom' || col === 'validTo' || col === 'lastNotificationOn') {
          value = rawValue ? formatDate(rawValue as string) : '';
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
  link.setAttribute('download', `certificates_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper function to properly escape CSV fields
 */
function escapeCsvField(field: string): string {
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (/[",\n\r]/.test(field)) {
    // Escape any quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generic memoized fuzzy filter for table
 */
export function createFuzzyFilter() {
  return React.useCallback(
    (row: any, columnId: string, filterValue: string, addMeta: any) => {
      // Get the value from the row
      const value = row.getValue(columnId);
      
      // Skip null or undefined values
      if (value === null || value === undefined) return false;
      
      // Handle non-string values by converting to string
      const itemValue = String(value).toLowerCase();
      const searchValue = String(filterValue).toLowerCase();
      
      // Check if the value contains the search string
      try {
        return itemValue.includes(searchValue);
      } catch (error) {
        return false;
      }
    },
    []
  );
} 