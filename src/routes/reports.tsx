import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ComplianceScoreCard } from '@/components/reports/compliance-score-card'
import { ComplianceBreakdown } from '@/components/reports/compliance-breakdown'
import { RenewalMetrics } from '@/components/reports/renewal-metrics'
import { PageTransition } from '@/components/ui/sidebar'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  BarChart, 
  FileBarChart, 
  PieChart,
  RefreshCw
} from 'lucide-react'

function ReportsPage() {
  return (
    <PageTransition keyId="reports">
      <div className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <FileBarChart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <ScrollArea>
            <TabsList className="text-foreground mb-3 h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
              <TabsTrigger
                value="overview"
                className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <BarChart className="-ms-0.5 me-1.5 opacity-60" size={16} />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="renewals"
                className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <RefreshCw className="-ms-0.5 me-1.5 opacity-60" size={16} />
                Renewals
              </TabsTrigger>
              <TabsTrigger
                value="breakdown"
                className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                <PieChart className="-ms-0.5 me-1.5 opacity-60" size={16} />
                Breakdown
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="overview" className="space-y-4">
            <ComplianceScoreCard />
          </TabsContent>

          <TabsContent value="renewals" className="space-y-4">
            <RenewalMetrics />
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4">
            <ComplianceBreakdown />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  )
}

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})
