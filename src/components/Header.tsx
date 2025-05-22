import { Link } from '@tanstack/react-router'
import { TeamSwitcher } from './ui/team-switcher'
import { SmallAnimatedLogo } from './ui/animated-logo'
import { useEffect, useState } from 'react'
import { getUsernameFromDOM } from '@/lib/user-session'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion } from 'framer-motion'

export default function Header() {
  const [username, setUsername] = useState('')

  useEffect(() => {
    setUsername(getUsernameFromDOM())
  }, [])

  return (
    <header className="p-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center gap-3">
        {username && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
            className="flex items-center gap-2"
          >
            <Avatar>
              <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-base">Welcome, {username}!</span>
          </motion.div>
        )}
      </div>
      <div className="flex items-center">
        <TeamSwitcher />
      </div>
    </header>
  )
}
