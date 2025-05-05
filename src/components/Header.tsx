import { Link } from '@tanstack/react-router'
import { TeamSwitcher } from './ui/team-switcher'
import { SmallAnimatedLogo } from './ui/animated-logo'

export default function Header() {
  return (
    <header className="p-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center">
        
      </div>
      <div className="flex items-center">
        <TeamSwitcher />
      </div>
    </header>
  )
}
