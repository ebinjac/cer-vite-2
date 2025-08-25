import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'

interface MotionCheckboxProps {
  checked: boolean | "indeterminate"
  onChange: (checked: boolean) => void
  label?: string
}

export function MotionCheckbox({ checked, onChange, label }: MotionCheckboxProps) {
  return (
    <div className="w-[28px]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ 
          scale: checked ? 1.1 : 1, 
          opacity: 1 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 10 
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          aria-label={label || "Checkbox"}
          className="translate-y-[2px]"
        />
      </motion.div>
    </div>
  )
}
