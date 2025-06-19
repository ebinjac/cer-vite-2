import { Outlet } from '@tanstack/react-router'
import Header from './components/Header'
import { TeamsProvider } from './providers/teams-provider'

export default function App() {
  return (
    <TeamsProvider>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-auto">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TeamsProvider>
  )
} 