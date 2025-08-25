import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/table'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

type Props = {
  errors: string[][]
}

export function ValidationTable({ errors }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="sticky top-0 bg-muted z-10">
            <TableRow>
              <TableHead className="w-20 px-3 py-2 text-left font-semibold">Row</TableHead>
              <TableHead className="w-24 px-3 py-2 text-left font-semibold">Status</TableHead>
              <TableHead className="px-3 py-2 text-left font-semibold">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.map((errs, i) => (
              <TableRow
                key={i}
                className={cn(errs.length > 0 ? 'bg-destructive/5' : 'bg-green-50')}
              >
                <TableCell className="px-3 py-2">{i + 2}</TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    {errs.length > 0 ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">Invalid</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Valid</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className={cn('px-3 py-2', errs.length > 0 ? 'text-destructive' : 'text-green-700')}>
                  {errs.length > 0 ? errs.join('; ') : 'All fields valid'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
