import * as React from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export interface ExportOptions {
  includeCertificates: boolean
  includeServiceIds: boolean
  includeActive: boolean
  includeExpired: boolean
  includeExpiringSoon: boolean
}

interface ExportControlsProps {
  onExportPDF: (options: ExportOptions) => void
  onExportCSV: () => void
}

export function ExportControls({ onExportPDF, onExportCSV }: ExportControlsProps) {
  const [options, setOptions] = React.useState<ExportOptions>({
    includeCertificates: true,
    includeServiceIds: true,
    includeActive: true,
    includeExpired: true,
    includeExpiringSoon: true
  })
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOptionChange = (key: keyof ExportOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleExportPDF = () => {
    onExportPDF(options)
    setIsOpen(false)
  }

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px'
  }

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 500,
    color: '#111827'
  }

  const optionContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const dialogContentStyle: React.CSSProperties = {
    display: 'grid',
    gap: '24px',
    padding: '24px 0'
  }

  return (
    <div style={buttonContainerStyle}>
      <Button onClick={onExportCSV} variant="outline" size="sm">
        <FileDown className="mr-2 h-4 w-4" />
        Export CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>PDF Export Options</DialogTitle>
            <DialogDescription>
              Select what to include in your PDF export
            </DialogDescription>
          </DialogHeader>
          
          <div style={dialogContentStyle}>
            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Content Type</h3>
              <div style={optionContainerStyle}>
                <Checkbox 
                  id="certificates"
                  checked={options.includeCertificates}
                  onCheckedChange={() => handleOptionChange('includeCertificates')}
                />
                <Label htmlFor="certificates">Include Certificates</Label>
              </div>
              <div style={optionContainerStyle}>
                <Checkbox 
                  id="serviceIds"
                  checked={options.includeServiceIds}
                  onCheckedChange={() => handleOptionChange('includeServiceIds')}
                />
                <Label htmlFor="serviceIds">Include Service IDs</Label>
              </div>
            </div>

            <div style={sectionStyle}>
              <h3 style={sectionTitleStyle}>Status Filter</h3>
              <div style={optionContainerStyle}>
                <Checkbox 
                  id="active"
                  checked={options.includeActive}
                  onCheckedChange={() => handleOptionChange('includeActive')}
                />
                <Label htmlFor="active">Include Active</Label>
              </div>
              <div style={optionContainerStyle}>
                <Checkbox 
                  id="expired"
                  checked={options.includeExpired}
                  onCheckedChange={() => handleOptionChange('includeExpired')}
                />
                <Label htmlFor="expired">Include Expired</Label>
              </div>
              <div style={optionContainerStyle}>
                <Checkbox 
                  id="expiringSoon"
                  checked={options.includeExpiringSoon}
                  onCheckedChange={() => handleOptionChange('includeExpiringSoon')}
                />
                <Label htmlFor="expiringSoon">Include Expiring Soon</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleExportPDF}
              disabled={!options.includeCertificates && !options.includeServiceIds}
            >
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 