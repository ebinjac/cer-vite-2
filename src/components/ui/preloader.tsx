"use client"

import * as React from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { SmallAnimatedLogo } from "@/components/ui/animated-logo"

export function Preloader() {
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    // Simulate loading time - in a real app, you would check if all resources are loaded
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          <motion.div
            className="flex flex-col items-center justify-center flex-1 w-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1,
              scale: 1,
              transition: {
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }
            }}
          >
            {/* Logo with Glow Effect */}
            <motion.div 
              className="mb-6 relative"
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: [0.8, 1.1, 1],
                transition: {
                  duration: 1,
                  times: [0, 0.6, 1],
                  ease: "easeOut"
                }
              }}
            >
              <div className="absolute inset-0 blur-xl" style={{ background: '#016fcf22', borderRadius: '9999px' }} />
              <div className="relative scale-150">
                <SmallAnimatedLogo />
              </div>
            </motion.div>

            {/* Cerser Text with Fade Up Animation */}
            <motion.div
              className="text-center relative mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.3
                }
              }}
            >
              <h1 className="text-4xl font-bold" >
                Cerser
              </h1>
              <p className="text-sm text-foreground">
                Certificate & Service ID Management
              </p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              className="mt-2 h-2 w-48 overflow-hidden rounded-full shadow-inner"
              style={{ background: '#e5e7eb' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
            >
              <motion.div
                className="h-full"
                style={{ background: 'linear-gradient(90deg, #016fcf, #016fcf 80%)' }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>

          {/* American Express Logo and Caption at Bottom */}
          <motion.div
            className="absolute bottom-4 left-0 w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 1.2, duration: 0.5 } }}
          >
            <img
              src="https://www.aexp-static.com/cdaas/one/statics/axp-static-assets/1.8.0/package/dist/img/logos/dls-logo-bluebox-solid.svg"
              alt="American Express Logo"
              className="h-6 mb-1 drop-shadow-sm"
              draggable="false"
              style={{ userSelect: 'none' }}
            />
            <span className="text-[11px] text-gray-400 italic font-normal">
              An American Express Product
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 