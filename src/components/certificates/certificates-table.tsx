'use client'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
  type RowData,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table'
import { ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, X, CheckCircle, XCircle, Clock, Eye, History, RefreshCw, Pencil, Trash2, MoreVertical, AlertTriangle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Certificate } from '@/hooks/use-certificates'
import { 
  formatDate as originalFormatDate, 
  getDaysUntilExpiration as originalGetDaysUntilExpiration, 
  getCertificateCustomStatus as originalGetCertificateCustomStatus,
  customStatusColors,
  customStatusIcons,
  type CertificateCustomStatus
} from '@/hooks/use-certificates'
import { useTeamStore } from '@/store/team-store'
import { cn } from '@/lib/utils'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { CertificateAddDrawerForm } from './CertificateAddDrawerForm'
import { useQueryClient } from '@tanstack/react-query'
import { BulkCertificateUpload } from './BulkCertificateUpload'
import { CertificateDetailsModal } from './certificate-details-modal'
import { CertificateUpdateDrawer } from './certificate-update-drawer'
import { CertificateRenewDrawer } from './certificate-renew-drawer'
import { CertificateDeleteDialog } from './certificate-delete-dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { CERTIFICATE_DELETE_API } from '@/lib/api-endpoints'
import { toast } from 'sonner'
import { CertificateDeletionStatus, type DeletionResult } from './certificate-deletion-status'

// Define motion components with proper typing
const MotionBadge = motion(Badge)
const MotionButton = motion(Button)
const MotionTableRow = motion(TableRow)
const MotionCard = motion(Card)
const MotionCardContent = motion(CardContent)
const MotionDropdownMenuContent = motion(DropdownMenuContent)

// Animation variants
const tableRowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03, // Staggered delay based on row index
      duration: 0.2,
      ease: "easeOut"
    }
  }),
  hover: { 
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    transition: { duration: 0.1 }
  }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
}

const statusBadgeVariants = {
  initial: { scale: 0.95 },
  animate: { scale: 1, transition: { duration: 0.2 } },
  hover: { scale: 1.03, transition: { duration: 0.2 } }
}

type FilterCriteria = {
  field: string
  operator: string
  value: string | string[]
}

type AdvFilters = {
  expiresIn?: '30' | '60' | '90' | null
  status?: string[]
  environment?: string[]
  purpose?: string[]
  hostname?: string
  issuer?: string
  team?: string
  customFilters: FilterCriteria[]
}

interface CertificateTableProps {
  data: Certificate[]
  isLoading: boolean
  isError: boolean
  error?: Error | null
  teamName?: string
  onCertificateAdded?: () => void
}

const statusIcons: Record<string, React.ReactNode> = {
  Issued: <CheckCircle className="h-4 w-4 text-green-500" />,
  Expired: <XCircle className="h-4 w-4 text-destructive" />,
  Pending: <Clock className="h-4 w-4 text-amber-500" />,
  Revoked: <XCircle className="h-4 w-4 text-gray-500" />,
}

const statusColors: Record<string, string> = {
  Issued: 'bg-green-100 text-green-800 hover:bg-green-200/80',
  Expired: 'bg-red-100 text-red-800 hover:bg-red-200/80',
  Pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200/80',
  Revoked: 'bg-gray-100 text-gray-800 hover:bg-gray-200/80',
}

// Helper function for memoizing expensive operations
function useDebouncedValue<T>(value: T, delay = 300): T {
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

// Helper function to safely handle potentially null strings
function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

// Helper function to safely handle potentially null dates
function safeDate(dateString: any): string {
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

// Improved formatDate with safety checks
function formatDate(dateString: any): string {
  try {
    return originalFormatDate(dateString);
  } catch (error) {
    return safeDate(dateString);
  }
}

// Add safety checks to getDaysUntilExpiration
function getDaysUntilExpiration(validTo: any): number | null {
  try {
    return originalGetDaysUntilExpiration(validTo);
  } catch (error) {
    return null;
  }
}

// Add safety checks to getCertificateCustomStatus
function getCertificateCustomStatus(validTo: any): CertificateCustomStatus {
  try {
    return originalGetCertificateCustomStatus(validTo);
  } catch (error) {
    // Default to expired on error
    return 'Expired';
  }
}

// Memoized HighlightedText component with safety checks
const MemoizedHighlightedText = React.memo(
  function HighlightedText({ text, highlight }: { text: any, highlight: string }) {
    // Safely convert text to string
    const safeText = safeString(text);
    const safeHighlight = safeString(highlight).trim();
    
    if (!safeHighlight || !safeText) return <span>{safeText}</span>;
    
    try {
      const regex = new RegExp(`(${safeHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = safeText.split(regex);
      
      return (
        <span>
          {parts.map((part, i) => 
            regex.test(part) ? (
              <span key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </span>
      );
    } catch (error) {
      // Fallback if regex fails
      return <span>{safeText}</span>;
    }
  },
  (prevProps, nextProps) => 
    prevProps.text === nextProps.text && 
    prevProps.highlight === nextProps.highlight
);

// Update CopyableText component with safety checks
function CopyableText({ text, fieldName, className }: { text: any; fieldName: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const safeText = safeString(text);
  
  const handleCopy = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection when copying
    
    navigator.clipboard.writeText(safeText).then(
      () => {
        // Show visual feedback directly in the component
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  }, [safeText]);
  
  if (!safeText) return <span className="text-muted-foreground italic">—</span>;
  
  return (
    <motion.div 
      className={cn(
        "group relative cursor-pointer flex items-start gap-1",
        className
      )} 
      onClick={handleCopy}
      title={`Click to copy ${fieldName}`}
      whileTap={{ scale: 0.97 }}
      whileHover={{ 
        backgroundColor: "rgba(0, 0, 0, 0.03)", 
        borderRadius: "4px",
        paddingLeft: "4px",
        paddingRight: "4px",
      }}
    >
      <span className="break-words">{safeText}</span>
      <AnimatePresence>
        {copied ? (
          <motion.span 
            className="text-green-500 ml-1 flex-shrink-0 mt-1"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.span>
        ) : (
          <motion.span 
            className="text-muted-foreground ml-1 opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Update MotionDaysLeft component with safety checks
function MotionDaysLeft({ days }: { days: number | null }) {
  if (days === null) return <div className="text-muted-foreground italic">—</div>;
  
  // Define color based on days left
  const textColor = days === 0 
    ? "text-destructive" 
    : days <= 30 
      ? "text-amber-600" 
      : "text-green-600";
  
  return (
    <motion.div 
      className={cn("font-medium flex items-center gap-1", textColor)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {days === 0 ? (
        <motion.span
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          Expired
        </motion.span>
      ) : (
        <>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.1 }
            }}
            className="font-bold"
          >
            {days}
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.2 }
            }}
          >
            days
          </motion.span>
          
          {/* Visual indicator for urgency */}
          {days <= 30 && (
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full ml-1",
                days <= 7 ? "bg-destructive" : "bg-amber-500"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 10,
                delay: 0.3
              }}
            />
          )}
        </>
      )}
    </motion.div>
  );
}

// Update MotionDateDisplay component with safety checks
function MotionDateDisplay({ shortDate, longDate }: { shortDate: any; longDate: any }) {
  const safeShortDate = safeString(shortDate);
  const safeLongDate = safeString(longDate);
  
  if (!safeShortDate) return <span className="text-muted-foreground italic">—</span>;
  
  return (
    <motion.div 
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span 
        className="text-sm"
        initial={{ y: -5 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {safeShortDate}
      </motion.span>
      {safeLongDate && (
        <motion.span 
          className="text-xs text-muted-foreground"
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 0.8 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ opacity: 1 }}
        >
          {safeLongDate}
        </motion.span>
      )}
    </motion.div>
  );
}

// Update the MemoizedExpandableComment component for better null handling
const MemoizedExpandableComment = React.memo(
  function ExpandableComment({ comment, globalFilter }: { comment: any, globalFilter: string }) {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const safeComment = safeString(comment);
    const shouldTruncate = safeComment && safeComment.length > 100;

    if (!safeComment) return <div className="text-muted-foreground italic">—</div>;

    return (
      <div className="max-w-[400px]">
        <div
          className={cn(
            "relative",
            !isExpanded && shouldTruncate && "max-h-[2.5em] overflow-hidden"
          )}
        >
          {globalFilter ? (
            <MemoizedHighlightedText text={safeComment} highlight={globalFilter} />
          ) : (
            <span>{safeComment}</span>
          )}
        </div>
        {shouldTruncate && (
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Show Less" : "Show More"}
          </Button>
        )}
      </div>
    );
  }
);

// Memoized filter functions to avoid recreating on every render - move outside component
const createFuzzyFilter = () => React.useCallback(
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

// Define all possible column IDs
type AllColumnIds = 
  | 'select'
  | 'actions'
  | 'commonName'
  | 'serialNumber'
  | 'customStatus'
  | 'validFrom'
  | 'validTo'
  | 'applicationName'
  | 'zeroTouch'
  | 'hostingTeamName'
  | 'certificatePurpose'
  | 'certificateStatus'
  | 'comment'
  | 'certificateIdentifier'
  | 'currentCert'
  | 'environment'
  | 'subjectAlternateNames'
  | 'issuerCertAuthName'
  | 'certType'
  | 'idaasIntegrationId'
  | 'isAmexCert'
  | 'centralID'
  | 'uri'
  | 'acknowledgedBy'
  | 'lastNotification'
  | 'lastNotificationOn'
  | 'renewingTeamName'
  | 'changeNumber'
  | 'serverName'
  | 'keystorePath'
  | 'daysLeft'

// Update column categories with proper typing
const columnCategories: Record<string, readonly AllColumnIds[]> = {
  essential: [
    'select',
    'commonName',
    'serialNumber',
    'customStatus',
    'validFrom',
    'validTo',
    'daysLeft',
    'applicationName',
    'zeroTouch',
    'hostingTeamName',
    'certificatePurpose',
    'certificateStatus'
  ],
  details: [
    'certificateIdentifier',
    'currentCert',
    'environment',
    'subjectAlternateNames',
    'issuerCertAuthName',
    'certType'
  ],
  integration: [
    'idaasIntegrationId',
    'isAmexCert',
    'centralID',
    'uri'
  ],
  management: [
    'acknowledgedBy',
    'lastNotification',
    'lastNotificationOn',
    'renewingTeamName',
    'changeNumber',
    'serverName',
    'keystorePath'
  ]
} as const;

type ColumnVisibilityState = {
  [K in AllColumnIds]: boolean;
};

// Add ExpandableComment component
function ExpandableComment({ comment, globalFilter }: { comment: string, globalFilter: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldTruncate = comment && comment.length > 100;

  if (!comment) return <div>-</div>;

  return (
    <div className="max-w-[400px]">
      <div
        className={cn(
          "relative",
          !isExpanded && shouldTruncate && "max-h-[2.5em] overflow-hidden"
        )}
      >
        {globalFilter ? (
          <MemoizedHighlightedText text={comment} highlight={globalFilter} />
        ) : (
          <span>{comment}</span>
        )}
      </div>
      {shouldTruncate && (
        <Button
          variant="link"
          className="h-auto p-0 text-xs"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
}

// Add type for sticky styles
type StickyStyles = {
  position: 'sticky';
  left?: string | number;
  right?: number;
  zIndex: number;
  backgroundColor: string;
}

// Add a helper function to get formatted column name
const getFormattedColumnName = (columnId: string): string => {
  const columnMap: Record<string, string> = {
    select: 'Select',
    commonName: 'Common Name',
    serialNumber: 'Serial Number',
    customStatus: 'Status',
    validFrom: 'Valid From',
    validTo: 'Valid To',
    applicationName: 'Application',
    zeroTouch: 'Zero Touch',
    hostingTeamName: 'Hosting Team',
    certificatePurpose: 'Purpose',
    certificateStatus: 'Certificate Status',
    comment: 'Comment',
    certificateIdentifier: 'Certificate Identifier',
    currentCert: 'Current Cert',
    environment: 'Environment',
    subjectAlternateNames: 'Subject Alternate Names',
    issuerCertAuthName: 'Issuer',
    certType: 'Certificate Type',
    idaasIntegrationId: 'IDaaS Integration ID',
    isAmexCert: 'Is Amex Cert',
    centralID: 'Central ID',
    uri: 'URI',
    acknowledgedBy: 'Acknowledged By',
    lastNotification: 'Last Notification',
    lastNotificationOn: 'Last Notification On',
    renewingTeamName: 'Renewing Team',
    changeNumber: 'Change Number',
    serverName: 'Server',
    keystorePath: 'Keystore Path',
    daysLeft: 'Days Left',
  };

  return columnMap[columnId] || columnId.replace(/([A-Z])/g, ' $1').trim();
};

// First add a new formatted date function after the other helper functions
function formatDateLong(dateString: string): string {
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

function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// First add a utility function to convert table data to CSV and download it
function downloadTableAsCSV(data: Certificate[], visibleColumns: string[]) {
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

// Helper function to properly escape CSV fields
function escapeCsvField(field: string): string {
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (/[",\n\r]/.test(field)) {
    // Escape any quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Helper function for animated column headers
function AnimatedColumnHeader({ column, children, className }: { 
  column: any; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionButton
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className={cn("px-0 hover:bg-transparent", className)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {children}
      <motion.span 
        animate={{ 
          rotate: column.getIsSorted() ? (column.getIsSorted() === "asc" ? 0 : 180) : 0,
          opacity: column.getIsSorted() ? 1 : 0.5
        }}
        transition={{ duration: 0.2 }}
      >
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </motion.span>
    </MotionButton>
  );
}

// Motion checkbox component with animation
function MotionCheckbox({ checked, onChange, label }: { 
  checked: boolean | "indeterminate"; 
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <div className="w-[28px]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ 
          scale: checked ? 1.1 : 1, 
          opacity: 1 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 10 
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          aria-label={label || "Checkbox"}
          className="translate-y-[2px]"
        />
      </motion.div>
    </div>
  );
}

// Update the BulkDeleteDialog component
function BulkDeleteDialog({ 
  certificates, 
  open, 
  onOpenChange, 
  onDeleteComplete 
}: { 
  certificates: Certificate[], 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  onDeleteComplete: () => void
}) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [results, setResults] = React.useState<DeletionResult[]>([])
  const [isCompleted, setIsCompleted] = React.useState(false)
  const totalCertificates = certificates.length

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setIsDeleting(false)
      setCurrentIndex(0)
      setResults([])
      setIsCompleted(false)
    }
  }, [open])

  if (!certificates.length) return null

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    setError(null)
    setCurrentIndex(0)
    setResults([])
    setIsCompleted(false)

    try {
      let newResults: DeletionResult[] = [];

      // Process certificates one by one
      for (let i = 0; i < certificates.length; i++) {
        const certificate = certificates[i];
        
        if (!certificate.commonName) {
          newResults.push({
            commonName: certificate.serialNumber || 'Unknown',
            success: false,
            error: 'Certificate missing common name'
          });
          setResults([...newResults]);
          setCurrentIndex(i + 1);
          continue;
        }

        try {
          const res = await fetch(CERTIFICATE_DELETE_API(certificate.commonName), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });

          let errorText = '';
          if (!res.ok) {
            try {
              errorText = await res.text();
            } catch {}
          }

          newResults.push({
            commonName: certificate.commonName,
            success: res.ok,
            error: !res.ok ? (errorText || `Failed with status: ${res.status}`) : undefined,
            statusCode: res.status
          });
          
          setResults([...newResults]);
          setCurrentIndex(i + 1);
        } catch (err: any) {
          newResults.push({
            commonName: certificate.commonName,
            success: false,
            error: err?.message || 'Network error occurred'
          });
          setResults([...newResults]);
          setCurrentIndex(i + 1);
        }
      }

      setIsCompleted(true);
      
      // Show summary toast
      const successCount = newResults.filter(r => r.success).length;
      if (successCount > 0) {
        toast.success(`${successCount} of ${totalCertificates} certificates deleted`, {
          description: successCount < totalCertificates ? 'Some certificates could not be deleted.' : undefined
        });
      } else {
        toast.error('Failed to delete certificates', {
          description: 'None of the selected certificates could be deleted.'
        });
      }
      
      // Only auto-close on complete success
      if (successCount === totalCertificates) {
        setTimeout(() => {
          onOpenChange(false);
          onDeleteComplete();
        }, 1500);
      }
    } catch (err: any) {
      let message = 'An error occurred during bulk deletion.';
      if (err?.message) {
        message = err.message;
      }
      setError(message);
      setIsCompleted(true);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if not actively deleting
      if (!isDeleting) {
        onOpenChange(isOpen);
        if (!isOpen && isCompleted) {
          onDeleteComplete();
        }
      }
    }}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Bulk Delete Certificates
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!isDeleting && !isCompleted && (
              <p>
                Are you sure you want to delete {certificates.length} selected certificates? This action cannot be undone.
              </p>
            )}
            
            <CertificateDeletionStatus
              results={results}
              isCompleted={isCompleted}
              inProgress={isDeleting}
              currentIndex={currentIndex}
              totalCount={totalCertificates}
            />
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {isCompleted ? 'Close' : 'Cancel'}
          </AlertDialogCancel>
          {!isCompleted && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${certificates.length} Certificates`
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function CertificatesTable({ data, isLoading, isError, error, teamName, onCertificateAdded }: CertificateTableProps & { onCertificateAdded?: () => void }) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const debouncedGlobalFilter = useDebouncedValue(globalFilter, 300)
  const [rowSelection, setRowSelection] = React.useState({})
  const [statusFilter, setStatusFilter] = React.useState<CertificateCustomStatus[]>([])
  const [expirationFilter, setExpirationFilter] = React.useState<string[]>([])
  const { selectedTeam } = useTeamStore()
  
  // Add column visibility state
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({
    select: true,
    commonName: true,
    serialNumber: true,
    customStatus: true,
    validFrom: true,
    validTo: true,
    daysLeft: true,
    applicationName: true,
    zeroTouch: true,
    hostingTeamName: true,
    certificatePurpose: true,
    certificateStatus: true,
    comment: true,
    actions: true,
    // Hide other columns initially
    certificateIdentifier: false,
    currentCert: false,
    environment: false,
    subjectAlternateNames: false,
    issuerCertAuthName: false,
    certType: false,
    idaasIntegrationId: false,
    isAmexCert: false,
    centralID: false,
    uri: false,
    acknowledgedBy: false,
    lastNotification: false,
    lastNotificationOn: false,
    renewingTeamName: false,
    changeNumber: false,
    serverName: false,
    keystorePath: false,
  })
  const [tempColumnVisibility, setTempColumnVisibility] = React.useState<ColumnVisibilityState>(columnVisibility)
  const [isColumnMenuOpen, setIsColumnMenuOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [bulkDrawerOpen, setBulkDrawerOpen] = React.useState(false)
  const [updateDrawerOpen, setUpdateDrawerOpen] = React.useState(false)
  const [renewDrawerOpen, setRenewDrawerOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedCertificate, setSelectedCertificate] = React.useState<Certificate | null>(null)
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false)
  
  // Handle expiration filter change
  const handleExpirationFilterChange = (value: string, checked: boolean) => {
    if (checked) {
      setExpirationFilter(prev => [...prev, value])
    } else {
      setExpirationFilter(prev => prev.filter(v => v !== value))
    }
  }

  // Handle status filter change
  const handleStatusFilterChange = (status: CertificateCustomStatus, checked: boolean) => {
    if (checked) {
      setStatusFilter(prev => [...prev, status])
    } else {
      setStatusFilter(prev => prev.filter(s => s !== status))
    }
  }
  
  // Generate array of all searchable fields
  const searchableFields = React.useMemo(() => [
    'commonName', 'certificateStatus', 'certificatePurpose', 
    'environment', 'issuerCertAuthName', 'hostingTeamName', 
    'renewingTeamName', 'applicationName', 'serverName', 
    'serialNumber', 'uri', 'certType', 'validFrom', 'validTo',
    'certificateIdentifier', 'currentCert', 'subjectAlternateNames',
    'zeroTouch', 'idaasIntegrationId', 'isAmexCert', 'acknowledgedBy',
    'centralID', 'comment', 'lastNotification', 'lastNotificationOn',
    'changeNumber', 'keystorePath'
  ], []);
  
  // Create all needed hooks at the top level of the component
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const fuzzyFilter = React.useCallback(
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
  
  // Extract useMemo hooks to top level
  const availableCustomStatuses = React.useMemo<CertificateCustomStatus[]>(() => {
    return ['Valid', 'Expiring Soon', 'Expired'];
  }, []);

  const availableCertStatuses = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.certificateStatus)))
      .filter(status => status && status.trim() !== '')
  }, [data]);
  
  const availableEnvironments = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.environment)))
  }, [data]);
  
  const availablePurposes = React.useMemo(() => {
    return Array.from(new Set(data.map(cert => cert.certificatePurpose)))
  }, [data]);
  
  const availableTeams = React.useMemo(() => {
    const hostingTeams = data.map(cert => cert.hostingTeamName)
    const renewingTeams = data.map(cert => cert.renewingTeamName)
    return Array.from(new Set([...hostingTeams, ...renewingTeams].filter(Boolean)))
  }, [data]);

  // Available expiration options
  const availableExpirations = React.useMemo(() => {
    return [
      { value: '30', label: 'Expires in 30 days' },
      { value: '60', label: 'Expires in 60 days' },
      { value: '90', label: 'Expires in 90 days' }
    ]
  }, []);
  
  // Memoize filtered data
  const filteredData = React.useMemo(() => {
    try {
      let filtered = [...data];

      if (selectedTeam) {
        filtered = filtered.filter(cert => 
          (cert?.hostingTeamName === selectedTeam || 
           cert?.renewingTeamName === selectedTeam) ?? false
        );
      }

      if (expirationFilter.length > 0) {
        filtered = filtered.filter(cert => {
          const daysUntil = getDaysUntilExpiration(cert?.validTo);
          // Check if days until expiration is less than or equal to any of the selected filters
          return daysUntil !== null && expirationFilter.some(days => daysUntil <= parseInt(days));
        });
      }

      if (statusFilter.length > 0) {
        filtered = filtered.filter(cert => {
          const customStatus = getCertificateCustomStatus(cert?.validTo);
          return statusFilter.includes(customStatus);
        });
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering data:", error);
      return data; // Return original data on error
    }
  }, [data, selectedTeam, expirationFilter, statusFilter]);
  
  // Conditionally use virtualization for large datasets with error handling
  const shouldUseVirtualization = React.useMemo(() => {
    try {
      return filteredData.length > 100;
    } catch (error) {
      return false;
    }
  }, [filteredData.length]);
  
  // Memoize columns to prevent unnecessary re-renders
  const columns = React.useMemo<ColumnDef<Certificate>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <MotionCheckbox 
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          label="Select all"
        />
      ),
      cell: ({ row }) => (
        <MotionCheckbox 
          checked={row.getIsSelected()}
          onChange={(value) => row.toggleSelected(!!value)}
          label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'commonName',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column} className="p-0 h-auto font-medium">
          Common Name
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const value = row.getValue('commonName') as string;
        return (
          <div 
            className="font-medium overflow-hidden text-ellipsis min-w-[150px] break-words" 
            title={value}
          >
            {globalFilter ? (
              <MemoizedHighlightedText text={value} highlight={globalFilter} />
            ) : (
              <CopyableText text={value} fieldName="Common Name" />
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'serialNumber',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column} className="p-0 h-auto font-medium">
          Serial Number
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const serial = row.getValue('serialNumber') as string;
        return (
          <div className="font-mono text-xs">
            {globalFilter ? (
              <MemoizedHighlightedText text={serial} highlight={globalFilter} />
            ) : (
              <CopyableText text={serial} fieldName="Serial Number" className="font-mono text-xs" />
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'customStatus',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Status
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validTo = row.original.validTo as string;
        const status = getCertificateCustomStatus(validTo);
        return (
          <div className="flex items-center gap-2">
            <MotionBadge 
              variant="outline" 
              className={customStatusColors[status]}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {customStatusIcons[status] && (
                <span className="mr-1">{customStatusIcons[status]}</span>
              )}
              {status}
            </MotionBadge>
          </div>
        )
      },
      accessorFn: (row) => {
        // Create accessor function to make sorting work properly
        const validTo = row.validTo;
        const status = getCertificateCustomStatus(validTo);
        // Define the order: Valid (0), Expiring Soon (1), Expired (2)
        const statusOrder = { 'Valid': 0, 'Expiring Soon': 1, 'Expired': 2 };
        return statusOrder[status];
      },
      enableSorting: true,
    },
    {
      accessorKey: 'validFrom',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Valid From
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validFrom = row.getValue('validFrom') as string;
        return <MotionDateDisplay shortDate={formatDate(validFrom)} longDate={formatDateLong(validFrom)} />;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('validFrom'));
        const dateB = new Date(rowB.getValue('validFrom'));
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorKey: 'validTo',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Valid To
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validTo = row.getValue('validTo') as string;
        return <MotionDateDisplay shortDate={formatDate(validTo)} longDate={formatDateLong(validTo)} />;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.getValue('validTo'));
        const dateB = new Date(rowB.getValue('validTo'));
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      id: 'daysLeft',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Days Left
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const validTo = row.getValue('validTo') as string;
        const daysUntil = getDaysUntilExpiration(validTo);
        return <MotionDaysLeft days={daysUntil} />;
      },
      accessorFn: (row) => {
        // Create accessor function to make sorting work properly
        const validTo = row.validTo;
        if (!validTo) return Infinity;
        
        const validToDate = new Date(validTo);
        const today = new Date();
        
        // Clear time part for accurate day calculation
        validToDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        const diffTime = validToDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'applicationName',
      header: ({ column }) => (
        <AnimatedColumnHeader column={column}>
          Application
        </AnimatedColumnHeader>
      ),
      cell: ({ row }) => {
        const app = row.getValue('applicationName') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={app} highlight={globalFilter} /> : app}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'zeroTouch',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Zero Touch
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const zeroTouch = row.getValue('zeroTouch') as string
        return <div>{zeroTouch === 'true' ? 'Yes' : 'No'}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const valueA = rowA.getValue('zeroTouch') === 'true' ? 1 : 0;
        const valueB = rowB.getValue('zeroTouch') === 'true' ? 1 : 0;
        return valueA - valueB;
      },
    },
    {
      accessorKey: 'hostingTeamName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Hosting Team
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const team = row.getValue('hostingTeamName') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={team} highlight={globalFilter} /> : team}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certificatePurpose',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Purpose
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const purpose = row.getValue('certificatePurpose') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={purpose} highlight={globalFilter} /> : purpose}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certificateStatus',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.certificateStatus as string;
        return (
          <div className="flex items-center gap-2">
            <MotionBadge 
              variant="outline" 
              className={statusColors[status]}
              initial="initial"
              animate="animate"
              whileHover="hover"
              variants={statusBadgeVariants}
            >
              {statusIcons[status] && (
                <span className="mr-1">{statusIcons[status]}</span>
              )}
              {status}
            </MotionBadge>
          </div>
        )
      },
      accessorFn: (row) => {
        // Create accessor function to make sorting work properly
        const status = row.certificateStatus as 'Issued' | 'Pending' | 'Expiring Soon' | 'Expired' | 'Revoked' | string;
        // Define the order: Issued (0), Pending (1), Expiring Soon (2), Expired (3), Revoked (4)
        const statusOrder: Record<string, number> = { 
          'Issued': 0, 
          'Pending': 1, 
          'Expiring Soon': 2,
          'Expired': 3,
          'Revoked': 4
        };
        return statusOrder[status] !== undefined ? statusOrder[status] : 999; // Handle unknown statuses
      },
      enableSorting: true,
    },
    {
      accessorKey: 'comment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Comment
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const comment = row.getValue('comment') as string;
        return <ExpandableComment comment={comment} globalFilter={globalFilter} />;
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certificateIdentifier',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Identifier
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('certificateIdentifier') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <MemoizedHighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'currentCert',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Current Cert
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const current = row.getValue('currentCert') as string
        return <div>{current === 'true' ? 'Yes' : 'No'}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const valueA = rowA.getValue('currentCert') === 'true' ? 1 : 0;
        const valueB = rowB.getValue('currentCert') === 'true' ? 1 : 0;
        return valueA - valueB;
      },
    },
    {
      accessorKey: 'environment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Environment
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const env = row.getValue('environment') as string
        return (
          <MotionBadge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 hover:bg-blue-100/80"
            initial="initial"
            animate="animate"
            whileHover="hover"
            variants={statusBadgeVariants}
          >
            {globalFilter ? <MemoizedHighlightedText text={env} highlight={globalFilter} /> : env}
          </MotionBadge>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'subjectAlternateNames',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Subject Alternate Names
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const sans = row.getValue('subjectAlternateNames') as string
        return <div className="truncate max-w-[180px]">
          {globalFilter ? <MemoizedHighlightedText text={sans} highlight={globalFilter} /> : sans}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'issuerCertAuthName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Issuer
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const issuer = row.getValue('issuerCertAuthName') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={issuer} highlight={globalFilter} /> : issuer}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'idaasIntegrationId',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          IDaaS Integration ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('idaasIntegrationId') as string
        return <div className="font-mono text-xs truncate max-w-[180px]">
          {globalFilter ? <MemoizedHighlightedText text={id} highlight={globalFilter} /> : id}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'isAmexCert',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Is Amex Cert
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const isAmex = row.getValue('isAmexCert') as string
        return <div>{isAmex}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'certType',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Certificate Type
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const certType = row.getValue('certType') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={certType} highlight={globalFilter} /> : certType}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'acknowledgedBy',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Acknowledged By
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const name = row.getValue('acknowledgedBy') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={name} highlight={globalFilter} /> : name}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'centralID',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Central ID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const id = row.getValue('centralID') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={id} highlight={globalFilter} /> : id}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'lastNotification',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Last Notification
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const notification = row.getValue('lastNotification') as number
        return <div>{notification || '-'}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'lastNotificationOn',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Last Notification On
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('lastNotificationOn') as string
        const formattedDate = date ? formatDate(date) : '-'
        return <div>{globalFilter && date ? <MemoizedHighlightedText text={formattedDate} highlight={globalFilter} /> : formattedDate}</div>
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.getValue('lastNotificationOn') ? new Date(rowA.getValue('lastNotificationOn')) : new Date(0);
        const dateB = rowB.getValue('lastNotificationOn') ? new Date(rowB.getValue('lastNotificationOn')) : new Date(0);
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      accessorKey: 'renewingTeamName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Renewing Team
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const team = row.getValue('renewingTeamName') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={team} highlight={globalFilter} /> : team}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'changeNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Change Number
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const changeNumber = row.getValue('changeNumber') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={changeNumber} highlight={globalFilter} /> : changeNumber}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'serverName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Server
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const server = row.getValue('serverName') as string
        return <div>{globalFilter ? <MemoizedHighlightedText text={server} highlight={globalFilter} /> : server}</div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'keystorePath',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          Keystore Path
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const path = row.getValue('keystorePath') as string
        return <div className="font-mono text-xs">
          {globalFilter ? <MemoizedHighlightedText text={path} highlight={globalFilter} /> : path}
        </div>
      },
      enableSorting: true,
    },
    {
      accessorKey: 'uri',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-0 hover:bg-transparent"
        >
          URI
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const uri = row.getValue('uri') as string
        if (!uri) return null
        
        const displayUri = uri.replace(/^https?:\/\//, '').substring(0, 25) + 
          (uri.replace(/^https?:\/\//, '').length > 25 ? '...' : '')
        
        return (
          <a 
            href={uri} 
            target="_blank" 
            rel="noreferrer" 
            className="text-blue-600 hover:underline hover:text-blue-800"
          >
            {globalFilter ? <MemoizedHighlightedText text={displayUri} highlight={globalFilter} /> : displayUri}
          </a>
        )
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const certificate = row.original
        const [showDetails, setShowDetails] = React.useState(false)

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedCertificate(certificate)
                  setUpdateDrawerOpen(true)
                }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Update
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedCertificate(certificate)
                  setRenewDrawerOpen(true)
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <History className="mr-2 h-4 w-4" />
                  History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setSelectedCertificate(certificate)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CertificateDetailsModal 
              certificate={certificate}
              open={showDetails}
              onOpenChange={setShowDetails}
            />
          </>
        )
      },
      enableSorting: false,
    },
  ], [globalFilter]) // Only recalculate when globalFilter changes

  // Setup the table
  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    // Use debounced value for global filter to reduce renders
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' 
        ? updater(columnVisibility)
        : updater;
      setColumnVisibility(prev => ({
        ...prev,
        ...newVisibility
      }));
    },
    onRowSelectionChange: setRowSelection,
    // Add getCoreRowModel().rows
    getCoreRowModel: React.useCallback(getCoreRowModel(), []),
    // Add getSortedRowModel().rows
    getSortedRowModel: React.useCallback(getSortedRowModel(), []),
    // Add getFilteredRowModel().rows
    getFilteredRowModel: React.useCallback(getFilteredRowModel(), []),
    // Add getPaginationRowModel().rows
    getPaginationRowModel: React.useCallback(getPaginationRowModel(), []),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      columnFilters,
      globalFilter: debouncedGlobalFilter, // Use debounced value here
      columnVisibility,
      rowSelection,
    },
  });
  
  // Define handlers that need access to the table object
  // Clear all filters
  const clearFilters = () => {
    setExpirationFilter([])
    setStatusFilter([])
    setGlobalFilter("")
    // Reset table filters
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }
  
  // Handle column visibility toggle after table is defined
  const handleColumnVisibilityChange = (columnId: AllColumnIds, isVisible: boolean) => {
    setTempColumnVisibility(prev => {
      const newVisibility = { ...prev };
      newVisibility[columnId] = isVisible;
      return newVisibility;
    });
  };

  // Function to apply column visibility changes
  const applyColumnVisibility = () => {
    try {
      // Always ensure comment column is last
      const newVisibility = { ...tempColumnVisibility };
      const commentVisible = newVisibility.comment;
      
      // Create new object without comment
      const { comment: _, ...restVisibility } = newVisibility;
      
      // Add comment back at the end if it was visible
      const finalVisibility: ColumnVisibilityState = {
        ...restVisibility,
        comment: commentVisible ?? false
      };
      
      setColumnVisibility(finalVisibility);
      setIsColumnMenuOpen(false);
    } catch (error) {
      // Fallback to current visibility on error
      console.error("Error applying column visibility:", error);
      setIsColumnMenuOpen(false);
    }
  };
  
  // Set up virtualization for large tables
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // approximate row height
    overscan: 5,
  });
  
  // Create a virtualized row renderer with proper memoization
  const VirtualizedRows = React.useCallback(() => {
    if (!rows || rows.length === 0) return null;
    
    try {
      const virtualRows = rowVirtualizer.getVirtualItems();
      const totalSize = rowVirtualizer.getTotalSize();
      const paddingTop = virtualRows.length > 0 ? virtualRows[0].start || 0 : 0;
      const paddingBottom = 
        virtualRows.length > 0
          ? totalSize - (virtualRows[virtualRows.length - 1].end || 0)
          : 0;
        
      return (
        <>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow: { index: number; start: number; end: number; }) => {
            // Check if row exists
            if (virtualRow.index >= rows.length) return null;
            
            const row = rows[virtualRow.index];
            if (!row) return null;
            
            return (
              <MotionTableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                custom={virtualRow.index}
                initial="hidden"
                animate={row.getIsSelected() ? {
                  opacity: 1,
                  y: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.03)"
                } : "visible"}
                variants={tableRowVariants}
                whileHover="hover"
                exit={{ opacity: 0, height: 0 }}
              >
                {row.getVisibleCells().map((cell) => {
                  if (!cell) return null;
                  
                  const isFixed = cell.column.id === 'select' || cell.column.id === 'commonName' || cell.column.id === 'actions';
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "p-4 align-middle [&:has([role=checkbox])]:pr-0",
                        isFixed && "sticky bg-background",
                        cell.column.id === 'select' && "left-0 w-[28px] z-30",
                        cell.column.id === 'commonName' && "left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb] py-3",
                        cell.column.id === 'actions' && "right-0 z-20",
                        cell.column.id === 'comment' && "max-w-[400px]"
                      )}
                      style={{
                        minWidth: cell.column.id === 'select' ? '28px' : undefined,
                        width: cell.column.id === 'select' ? '28px' : undefined,
                        maxWidth: cell.column.id === 'commonName' ? '300px' : undefined
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </MotionTableRow>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </>
      );
    } catch (error) {
      console.error("Error rendering virtualized rows:", error);
      return null;
    }
  }, [rowVirtualizer, rows]);

  // Calculate the number of active filters
  const hasActiveFilters = globalFilter || statusFilter.length > 0 || expirationFilter.length > 0

  function handleDrawerClose() {
    setDrawerOpen(false)
  }

  // Add refreshing function
  const handleCertificateUpdated = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  const handleCertificateRenewed = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  // Add a handler for certificate deletion
  const handleCertificateDeleted = React.useCallback(() => {
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded])

  // Get selected certificates
  const getSelectedCertificates = React.useCallback(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    return selectedRows.map(row => row.original)
  }, [table])

  // Add a handler for bulk certificate deletion
  const handleBulkDeleteComplete = React.useCallback(() => {
    // Clear selection
    table.resetRowSelection()
    
    // Refresh data
    if (onCertificateAdded) {
      onCertificateAdded()
    }
  }, [onCertificateAdded, table])

  if (isLoading) return (
    <MotionCard 
      className="shadow-sm border-border/40 p-8 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center">
        <motion.div 
          className="rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
          animate={{ 
            rotate: 360,
            borderColor: ["#3b82f6", "#10b981", "#8b5cf6", "#3b82f6"]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            ease: "linear" 
          }}
        />
        <motion.p 
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Loading certificates...
        </motion.p>
      </div>
    </MotionCard>
  )

  if (isError) return (
    <MotionCard 
      className="shadow-sm border-border/40 p-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        <motion.p 
          className="font-medium"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          Error loading certificates
        </motion.p>
        <motion.p 
          className="text-sm mt-1"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {error instanceof Error ? error.message : 'Unknown error'}
        </motion.p>
      </div>
    </MotionCard>
  )

  return (
    <MotionCard 
      className="shadow-sm border-border/40"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Certificate Management</CardTitle>
            <CardDescription className="text-muted-foreground">
              {teamName ? (
                <>Managing certificates for <motion.span 
                  className="font-medium text-primary"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >{teamName}</motion.span> team</>
              ) : (
                <>View and manage all certificates in the system</>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <MotionButton 
                  variant="default" 
                  size="sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Add Certificate
                </MotionButton>
              </DrawerTrigger>
              <DrawerContent className="min-w-[750px] max-w-4xl ml-auto">
                <DrawerHeader>
                  <DrawerTitle>Add Certificate</DrawerTitle>
                </DrawerHeader>
                <CertificateAddDrawerForm onSuccess={handleDrawerClose} onCertificateAdded={onCertificateAdded} />
              </DrawerContent>
            </Drawer>
            <Drawer direction="right" open={bulkDrawerOpen} onOpenChange={setBulkDrawerOpen}>
              <DrawerTrigger asChild>
                <MotionButton 
                  variant="outline" 
                  size="sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Bulk Upload
                </MotionButton>
              </DrawerTrigger>
              <DrawerContent className="min-w-[90vw] max-w-[90vw] ml-auto">
                <DrawerHeader>
                  <DrawerTitle>Bulk Certificate Upload</DrawerTitle>
                </DrawerHeader>
                <BulkCertificateUpload onUploadSuccess={() => {
                  setBulkDrawerOpen(false)
                  if (onCertificateAdded) onCertificateAdded()
                }} />
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
          <div className="flex-1 max-w-md relative">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 pr-10"
              />
              <AnimatePresence>
                {globalFilter && (
                  <MotionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setGlobalFilter("")}
                    className="absolute right-1 top-1.5 h-7 w-7 p-0"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-4 w-4" />
                  </MotionButton>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Add CSV Export Button */}
            <MotionButton 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => downloadTableAsCSV(
                table.getFilteredRowModel().rows.map(row => row.original), 
                table.getVisibleLeafColumns().map(col => col.id)
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </MotionButton>
            
            {/* Expiration filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MotionButton 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Expiration {expirationFilter.length > 0 && `(${expirationFilter.length})`}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </MotionButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-[200px]"
              >
                {availableExpirations.map(({ value, label }) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={expirationFilter.includes(value)}
                    onCheckedChange={(checked) => {
                      handleExpirationFilterChange(value, !!checked)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {expirationFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setExpirationFilter([])}
                      className="justify-center text-center text-sm text-muted-foreground"
                    >
                      Clear expiration filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MotionButton 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Status {statusFilter.length > 0 && `(${statusFilter.length})`}
                  <ChevronDown className="ml-1 h-3 w-3" />
                </MotionButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-[200px]"
              >
                {availableCustomStatuses.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilter.includes(status)}
                    onCheckedChange={(value) => {
                      handleStatusFilterChange(status, !!value)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {customStatusIcons[status] && (
                        <span className="mr-1">{customStatusIcons[status]}</span>
                      )}
                      {status}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setStatusFilter([])}
                      className="justify-center text-center text-sm text-muted-foreground"
                    >
                      Clear status filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Columns visibility dropdown */}
            <DropdownMenu open={isColumnMenuOpen} onOpenChange={setIsColumnMenuOpen}>
              <DropdownMenuTrigger asChild>
                <MotionButton 
                  variant="outline" 
                  size="sm" 
                  className="h-8"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Columns <ChevronDown className="ml-1 h-3 w-3" />
                </MotionButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-[280px]" 
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex flex-col gap-4 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm leading-none">Show/Hide Columns</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const allColumns = table.getAllLeafColumns()
                              .filter(col => col.id !== 'comment' && col.id !== 'actions')
                              .map(col => col.id);
                            const newVisibility = Object.fromEntries(
                              allColumns.map(id => [id, true])
                            );
                            // Preserve comment and actions visibility
                            newVisibility.comment = tempColumnVisibility.comment;
                            newVisibility.actions = true;
                            setTempColumnVisibility(newVisibility as ColumnVisibilityState);
                          }}
                        >
                          View All
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={applyColumnVisibility}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(columnCategories).map(([category, columnIds]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-sm font-medium capitalize">{category}</h5>
                          {columnIds.map((columnId) => {
                            if (columnId === 'actions') return null;
                            return (
                              <div key={columnId} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={tempColumnVisibility[columnId]}
                                  onCheckedChange={(checked) => {
                                    handleColumnVisibilityChange(columnId, !!checked);
                                  }}
                                  id={`column-${columnId}`}
                                />
                                <label
                                  htmlFor={`column-${columnId}`}
                                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {getFormattedColumnName(columnId)}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      {/* Comment column always at the end */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Additional</h5>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={tempColumnVisibility.comment}
                            onCheckedChange={(checked) => {
                              handleColumnVisibilityChange('comment', !!checked);
                            }}
                            id="column-comment"
                          />
                          <label
                            htmlFor="column-comment"
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Comment
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear filters button */}
            <AnimatePresence>
              {hasActiveFilters && (
                <MotionButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </MotionButton>
              )}
            </AnimatePresence>
          </div>
        </div>
       
      </CardHeader>
      <MotionCardContent className="p-0">
        <div className="relative rounded-md border">
          <div 
            className="relative overflow-auto"
            ref={tableContainerRef}
            style={{ height: shouldUseVirtualization ? '500px' : 'auto' }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <React.Fragment key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const isFixed = header.column.id === 'select' || header.column.id === 'commonName' || header.column.id === 'actions';
                        
                        return (
                          <TableHead
                            key={header.id}
                            className={cn(
                              "h-11 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                              isFixed && "sticky bg-background",
                              header.column.id === 'select' && "left-0 w-[28px] z-30",
                              header.column.id === 'commonName' && "left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb]",
                              header.column.id === 'actions' && "right-0 z-20",
                              header.column.id === 'comment' && "max-w-[400px]"
                            )}
                            style={{
                              minWidth: header.column.id === 'select' ? '28px' : undefined,
                              width: header.column.id === 'select' ? '28px' : undefined
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        )
                      })}
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {table.getRowModel().rows?.length ? (
                    shouldUseVirtualization ? (
                      <VirtualizedRows />
                    ) : (
                      <>
                        {table.getRowModel().rows.map((row, index) => (
                          <MotionTableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            custom={index}
                            initial="hidden"
                            animate={row.getIsSelected() ? {
                              opacity: 1,
                              y: 0,
                              backgroundColor: "rgba(0, 0, 0, 0.03)"
                            } : "visible"}
                            variants={tableRowVariants}
                            whileHover="hover"
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {row.getVisibleCells().map((cell) => {
                              const isFixed = cell.column.id === 'select' || cell.column.id === 'commonName' || cell.column.id === 'actions';
                              return (
                                <TableCell
                                  key={cell.id}
                                  className={cn(
                                    "p-4 align-middle [&:has([role=checkbox])]:pr-0",
                                    isFixed && "sticky bg-background",
                                    cell.column.id === 'select' && "left-0 w-[28px] z-30",
                                    cell.column.id === 'commonName' && "left-[28px] z-20 border-l shadow-[-1px_0_0_0_#e5e7eb] py-3",
                                    cell.column.id === 'actions' && "right-0 z-20",
                                    cell.column.id === 'comment' && "max-w-[400px]"
                                  )}
                                  style={{
                                    minWidth: cell.column.id === 'select' ? '28px' : undefined,
                                    width: cell.column.id === 'select' ? '28px' : undefined,
                                    maxWidth: cell.column.id === 'commonName' ? '300px' : undefined
                                  }}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              )
                            })}
                          </MotionTableRow>
                        ))}
                      </>
                    )
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                            delay: 0.2 
                          }}
                          className="flex flex-col items-center justify-center space-y-3 text-muted-foreground"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            className="mb-2"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M9 9h6" />
                            <path d="M9 13h6" />
                            <path d="M9 17h6" />
                          </svg>
                          No certificates found.
                          <motion.p 
                            className="text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.7 }}
                            transition={{ delay: 0.4 }}
                          >
                            Try adjusting your search or filters.
                          </motion.p>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </div>
      </MotionCardContent>
      <CardFooter className="border-t flex items-center justify-between p-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <AnimatePresence>
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span>{table.getFilteredSelectedRowModel().rows.length} row(s) selected</span>
                <Separator orientation="vertical" className="h-4" />
                <MotionButton
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-8 px-2 py-0"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Selected
                </MotionButton>
              </motion.div>
            )}
          </AnimatePresence>
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center mr-2">
            <span className="text-xs mr-2">Rows per page:</span>
            <Select value={table.getState().pagination.pageSize.toString()} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <motion.div
                // Animation for pagination size change
                key={table.getState().pagination.pageSize}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </motion.div>
            </Select>
          </div>
          <MotionButton
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronsLeft className="h-4 w-4" />
          </MotionButton>
          <MotionButton
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </MotionButton>
          <motion.span 
            className="text-sm"
            key={table.getState().pagination.pageIndex} // Animate on page change
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            Page{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </motion.span>
          <MotionButton
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-4 w-4" />
          </MotionButton>
          <MotionButton
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronsRight className="h-4 w-4" />
          </MotionButton>
        </div>
      </CardFooter>
      
      {/* Add the update drawer at the end */}
      <CertificateUpdateDrawer
        certificate={selectedCertificate}
        open={updateDrawerOpen}
        onOpenChange={setUpdateDrawerOpen}
        onCertificateUpdated={handleCertificateUpdated}
      />
      
      {/* Add the renew drawer */}
      <CertificateRenewDrawer
        certificate={selectedCertificate}
        open={renewDrawerOpen}
        onOpenChange={setRenewDrawerOpen}
        onCertificateRenewed={handleCertificateRenewed}
      />
      
      {/* Add the delete dialog at the end */}
      <CertificateDeleteDialog
        certificate={selectedCertificate}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onCertificateDeleted={handleCertificateDeleted}
      />
      
      {/* Add the bulk delete dialog */}
      <BulkDeleteDialog
        certificates={getSelectedCertificates()}
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onDeleteComplete={handleBulkDeleteComplete}
      />
    </MotionCard>
  )
}
// Export memoized component to prevent unnecessary re-renders from parent components
export default React.memo(CertificatesTable); 