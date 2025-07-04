import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import Header from '../components/Header'

import TanstackQueryLayout from '../integrations/tanstack-query/layout'

import type { QueryClient } from '@tanstack/react-query'
import { AppSidebar } from '@/components/ui/sidebar'
import { Preloader } from '@/components/ui/preloader'
import { Toaster } from '@/components/ui/sonner'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Preloader />
      <div className="flex min-h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden pl-16">
          <Header />
          <Outlet />
          <TanStackRouterDevtools />
          <TanstackQueryLayout />
        </div>
      </div>
      <Toaster position="bottom-left" />
    </>
  ),
})
