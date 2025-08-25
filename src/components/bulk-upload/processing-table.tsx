import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { motion } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { UploadStatus } from '@/hooks/use-bulk-upload'

type RowPreview = { primary: string; secondary?: string }

type Props = {
  rows: RowPreview[]
  statuses: UploadStatus[]
  scrollHeight?: number
}

export function ProcessingTable({ rows, statuses, scrollHeight = 500 }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/40">
      <ScrollArea className={`h-[${scrollHeight}px]`}>
        <Table>
          <TableHeader className="sticky top-0 bg-muted z-10">
            <TableRow>
              <TableHead className="px-4 py-3 text-left font-semibold">Item</TableHead>
              <TableHead className="w-48 px-4 py-3 text-left font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b last:border-0"
              >
                <TableCell className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{row.primary}</span>
                    {row.secondary && <span className="text-sm text-muted-foreground">{row.secondary}</span>}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {statuses[index]?.status === 'loading' && (
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </motion.div>
                    )}
                    {statuses[index]?.status === 'success' && (
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </motion.div>
                    )}
                    {statuses[index]?.status === 'error' && (
                      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                        <XCircle className="h-4 w-4 text-destructive" />
                      </motion.div>
                    )}
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          statuses[index]?.status === 'error' && 'text-destructive',
                          statuses[index]?.status === 'success' && 'text-green-600',
                          statuses[index]?.status === 'loading' && 'text-blue-600'
                        )}
                      >
                        {statuses[index]?.status === 'loading' ? 'Uploading...' :
                         statuses[index]?.status === 'success' ? 'Uploaded' :
                         statuses[index]?.status === 'error' ? 'Failed' : 'Pending'}
                      </span>
                      {statuses[index]?.status === 'error' && statuses[index]?.message && (
                        <span className="text-xs text-destructive mt-0.5 whitespace-normal break-words">
                          {statuses[index].message}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
