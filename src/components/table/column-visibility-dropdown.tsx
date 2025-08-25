import * as React from 'react'
import type { Table } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronDown } from 'lucide-react'

/* readable label helper ---------------------------------------------------- */
function toLabel(id: string) {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

interface Props<T> {
  table: Table<T>
}

export function ColumnVisibilitySelector<T>({ table }: Props<T>) {
  const columns = React.useMemo(
    () => table.getAllLeafColumns(),
    [table],
  )

  /* menu open state – populate local “pending” map when opened */
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (open) {
      const v: Record<string, boolean> = {}
      columns.forEach((c) => (v[c.id] = c.getIsVisible()))
      setPending(v)
    }
  }, [open, columns])

  /* helpers */
  const all = columns.every((c) => pending[c.id])
  const some = columns.some((c) => pending[c.id])

  const toggleAll = (val: boolean) =>
    setPending(Object.fromEntries(columns.map((c) => [c.id, val])))

  const apply = () => {
    table.setColumnVisibility(pending) // commit
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          Columns <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2">
        {/* master checkbox ------------------------------------------------ */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Checkbox
            checked={all || (some && 'indeterminate')}
            onCheckedChange={(v) => toggleAll(!!v)}
          />
          <span className="text-sm font-medium">Select all</span>
        </div>

        <DropdownMenuSeparator />

        {/* individual columns ------------------------------------------- */}
        <ScrollArea className="max-h-64 pr-2 overflow-scroll">
          {columns.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer"
            >
              <Checkbox
                checked={pending[c.id]}
                onCheckedChange={(v) =>
                  setPending((p) => ({ ...p, [c.id]: !!v }))
                }
              />
              {toLabel((c.columnDef.meta as { label?: string })?.label ?? c.id)}
            </label>
          ))}
        </ScrollArea>

        <DropdownMenuSeparator />

        {/* actions ------------------------------------------------------- */}
        <div className="flex justify-end gap-2 px-2 py-1.5">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
