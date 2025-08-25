import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'

// Define motion components with proper typing
export const MotionBadge = motion(Badge)
export const MotionButton = motion(Button)
export const MotionTableRow = motion(TableRow)
export const MotionCard = motion(Card)
export const MotionCardContent = motion(CardContent)
export const MotionDropdownMenuContent = motion(DropdownMenuContent)
