'use client'

import * as React from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Link } from '@tanstack/react-router'

export function AnimatedLogo() {
  const pathRef = React.useRef<SVGPathElement>(null)

  React.useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      pathRef.current.style.strokeDasharray = `${length}`
      pathRef.current.style.strokeDashoffset = `${length}`
    }
  }, [])

  return (
    <div className="cursor-pointer">
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 97 92"
        fill="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Background Rectangle with Blue Gradient */}
        <motion.rect
          x="1.5"
          y="1.5"
          width="94"
          height="89"
          rx="18.5"
          fill="url(#paint0_linear_9_135)"
          stroke="url(#paint1_linear_9_135)"
          strokeWidth="3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* Dotted Path - Animated to draw itself */}
        <motion.path
          ref={pathRef}
          d="M9.64282 36.6596C10.2692 36.5813 10.7751 34.8393 11.0723 34.349C12.1849 32.5132 12.9726 30.616 14.3816 28.9641C16.9223 25.9852 19.8658 22.6844 23.5457 21.1511C30.1136 18.4144 36.7507 16.569 43.8518 16.569C48.3257 16.569 52.2914 18.5935 52.2914 23.6183C52.2914 31.2508 42.2751 36.4044 37.2137 40.8893C31.3825 46.0561 25.0098 51.3551 21.6267 58.591C20.7968 60.3662 19.8671 61.6119 20.2364 63.643C20.6921 66.149 22.5 69.0312 24.4465 70.6532C26.6349 72.4769 30.1789 72.6114 32.8665 72.6114C37.1866 72.6114 41.3661 72.2311 45.6141 71.3973C50.1561 70.5059 54.3302 68.8261 58.7925 67.6964C65.5703 65.9805 72.376 64.3003 79.079 62.3115C82.2992 61.356 85.3598 59.6741 88.5956 58.8651"
          stroke="url(#paint2_linear_9_135)"
          strokeLinecap="round"
          strokeDasharray="2 2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: 1,
            transition: {
              pathLength: { duration: 1, ease: "easeInOut" },
              opacity: { duration: 0.2, delay: 0.1 },
            },
          }}
        />

        {/* Paper Airplane Shape */}
        <motion.g
          filter="url(#filter0_d_9_135)"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 1.2,
            type: "spring",
            stiffness: 100,
          }}
        >
          <motion.path
            d="M73.2775 41.1735L26.5331 21.2179C25.4288 20.6879 24.1748 20.5008 22.9507 20.6834C21.7266 20.8661 20.5953 21.409 19.7189 22.2345C18.8426 23.0599 18.2661 24.1255 18.0723 25.2785C17.8784 26.4315 18.077 27.6128 18.6397 28.6529L39.8258 72.6823C40.2898 73.6843 41.0587 74.5341 42.0354 75.1245C43.0121 75.7148 44.1527 76.0192 45.313 75.9991H46.0466C47.4618 75.8718 48.796 75.3196 49.8527 74.4238C50.9093 73.5281 51.6324 72.3362 51.9153 71.024L55.2312 55.6012L71.6049 52.478C72.998 52.2115 74.2634 51.5304 75.2144 50.5351C76.1654 49.5399 76.7517 48.2831 76.8868 46.9501C77.0399 45.7478 76.7697 44.5314 76.1177 43.4878C75.4656 42.4442 74.4678 41.6311 73.2775 41.1735Z"
            fill="url(#paint3_linear_9_135)"
          />
          <motion.path
            d="M74.4153 36.5581L28.5208 16.6025C27.4366 16.0725 26.2054 15.8854 25.0035 16.0681C23.8017 16.2507 22.6909 16.7936 21.8305 17.6191C20.9701 18.4445 20.4041 19.5101 20.2138 20.6631C20.0235 21.8161 20.2185 22.9974 20.7709 24.0375L41.5718 68.067C42.0274 69.0689 42.7823 69.9187 43.7413 70.5091C44.7002 71.0995 45.8201 71.4038 46.9593 71.3837H47.6795C49.069 71.2564 50.379 70.7042 51.4164 69.8084C52.4538 68.9127 53.1638 67.7208 53.4416 66.4086L56.6971 50.9859L72.7731 47.8626C74.1409 47.5961 75.3833 46.915 76.317 45.9198C77.2507 44.9245 77.8263 43.6677 77.959 42.3347C78.1093 41.1324 77.844 39.916 77.2038 38.8724C76.5636 37.8288 75.5839 37.0157 74.4153 36.5581Z"
            fill="white"
          />
        </motion.g>

        {/* Left Vertical Line - Grows from bottom to top */}
        <motion.path
          d="M14.5 87.5V4"
          stroke="url(#paint4_linear_9_135)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.4,
            ease: [0.87, 0, 0.13, 1], // Custom easing for a "snap" effect
          }}
        />

        {/* Right Vertical Line - Grows from bottom to top */}
        <motion.path
          d="M83 87.5V4"
          stroke="url(#paint5_linear_9_135)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.6,
            ease: [0.87, 0, 0.13, 1], // Custom easing for a "snap" effect
          }}
        />

        {/* Bottom Horizontal Line - Grows from left to right */}
        <motion.path
          d="M6 82H89.5"
          stroke="url(#paint6_linear_9_135)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.8,
            ease: [0.87, 0, 0.13, 1], // Custom easing for a "snap" effect
          }}
        />

        {/* Connection Points - Small circles that appear at line intersections */}
        <motion.circle
          cx="14.5"
          cy="82"
          r="2"
          fill="#016fcf"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.2, type: "spring" }}
        />

        <motion.circle
          cx="83"
          cy="82"
          r="2"
          fill="#016fcf"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.2, type: "spring" }}
        />

        {/* Definitions for gradients and filters */}
        <defs>
          <filter
            id="filter0_d_9_135"
            x="13"
            y="16"
            width="70"
            height="71"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="6" />
            <feGaussianBlur stdDeviation="2.5" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_135" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_135" result="shape" />
          </filter>

          {/* Blue gradients */}
          <linearGradient id="paint0_linear_9_135" x1="48.5" y1="0" x2="48.5" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#016fcf" />
            <stop offset="0.273156" stopColor="#3fa6f7" />
            <stop offset="0.453125" stopColor="#87C1FF" />
            <stop offset="0.734375" stopColor="#016fcf" />
            <stop offset="0.9999" stopColor="#0058FA" />
            <stop offset="1" stopColor="#2990FF" />
          </linearGradient>

          <linearGradient id="paint1_linear_9_135" x1="48.5" y1="0" x2="48.5" y2="92" gradientUnits="userSpaceOnUse">
            <stop stopColor="#016fcf" />
            <stop offset="0.869792" stopColor="#016fcf" stopOpacity="0.408542" />
            <stop offset="1" stopColor="#016fcf" stopOpacity="0.32" />
          </linearGradient>

          <linearGradient
            id="paint2_linear_9_135"
            x1="49.1192"
            y1="16.569"
            x2="49.1192"
            y2="72.6114"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#5AA9FF" />
            <stop offset="1" stopColor="#3C99FF" />
          </linearGradient>

          <linearGradient id="paint3_linear_9_135" x1="48" y1="16" x2="48" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="#ABABAB" stopOpacity="0.46" />
          </linearGradient>

          <linearGradient id="paint4_linear_9_135" x1="15" y1="4" x2="15" y2="87.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#016fcf" />
            <stop offset="1" stopColor="#8BC3FF" />
          </linearGradient>

          <linearGradient id="paint5_linear_9_135" x1="83.5" y1="4" x2="83.5" y2="87.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#016fcf" />
            <stop offset="1" stopColor="white" />
          </linearGradient>

          <linearGradient id="paint6_linear_9_135" x1="6" y1="81.5" x2="89.5" y2="81.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#016fcf" />
            <stop offset="1" stopColor="#3D9AFF" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  )
}

export function SmallAnimatedLogo() {
  const [isHovered, setIsHovered] = React.useState(false)
  const controls = useAnimation()
  const pathRef = React.useRef<SVGPathElement>(null)

  React.useEffect(() => {
    // Apply pulse animation
    controls.start({
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    })

    // Get path length for stroke animation
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      pathRef.current.style.strokeDasharray = `${length}`
      pathRef.current.style.strokeDashoffset = `${length}`
    }
  }, [controls])
  
  return (
    <motion.div
      className="cursor-pointer"
      animate={controls}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to="/">
        <motion.svg 
          width="48" 
          height="48" 
          viewBox="0 0 97 92" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Rectangle with Blue Gradient */}
          <motion.rect
            x="1.5"
            y="1.5"
            width="94"
            height="89"
            rx="18.5"
            fill="url(#paint0_linear_small)"
            stroke="url(#paint1_linear_small)"
            strokeWidth="3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Dotted Path - Animated to draw itself */}
          <motion.path
            ref={pathRef}
            d="M9.64282 36.6596C10.2692 36.5813 10.7751 34.8393 11.0723 34.349C12.1849 32.5132 12.9726 30.616 14.3816 28.9641C16.9223 25.9852 19.8658 22.6844 23.5457 21.1511C30.1136 18.4144 36.7507 16.569 43.8518 16.569C48.3257 16.569 52.2914 18.5935 52.2914 23.6183C52.2914 31.2508 42.2751 36.4044 37.2137 40.8893C31.3825 46.0561 25.0098 51.3551 21.6267 58.591C20.7968 60.3662 19.8671 61.6119 20.2364 63.643C20.6921 66.149 22.5 69.0312 24.4465 70.6532C26.6349 72.4769 30.1789 72.6114 32.8665 72.6114C37.1866 72.6114 41.3661 72.2311 45.6141 71.3973C50.1561 70.5059 54.3302 68.8261 58.7925 67.6964C65.5703 65.9805 72.376 64.3003 79.079 62.3115C82.2992 61.356 85.3598 59.6741 88.5956 58.8651"
            stroke="url(#paint2_linear_small)"
            strokeLinecap="round"
            strokeDasharray="2 2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: 1,
              transition: {
                pathLength: { duration: 1, ease: "easeInOut" },
                opacity: { duration: 0.2, delay: 0.1 },
              },
            }}
          />

          {/* Paper Airplane Shape */}
          <motion.g
            filter="url(#filter0_d_small)"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 1.2,
              type: "spring",
              stiffness: 100,
            }}
          >
            <motion.path
              d="M73.2775 41.1735L26.5331 21.2179C25.4288 20.6879 24.1748 20.5008 22.9507 20.6834C21.7266 20.8661 20.5953 21.409 19.7189 22.2345C18.8426 23.0599 18.2661 24.1255 18.0723 25.2785C17.8784 26.4315 18.077 27.6128 18.6397 28.6529L39.8258 72.6823C40.2898 73.6843 41.0587 74.5341 42.0354 75.1245C43.0121 75.7148 44.1527 76.0192 45.313 75.9991H46.0466C47.4618 75.8718 48.796 75.3196 49.8527 74.4238C50.9093 73.5281 51.6324 72.3362 51.9153 71.024L55.2312 55.6012L71.6049 52.478C72.998 52.2115 74.2634 51.5304 75.2144 50.5351C76.1654 49.5399 76.7517 48.2831 76.8868 46.9501C77.0399 45.7478 76.7697 44.5314 76.1177 43.4878C75.4656 42.4442 74.4678 41.6311 73.2775 41.1735Z"
              fill="url(#paint3_linear_small)"
            />
            <motion.path
              d="M74.4153 36.5581L28.5208 16.6025C27.4366 16.0725 26.2054 15.8854 25.0035 16.0681C23.8017 16.2507 22.6909 16.7936 21.8305 17.6191C20.9701 18.4445 20.4041 19.5101 20.2138 20.6631C20.0235 21.8161 20.2185 22.9974 20.7709 24.0375L41.5718 68.067C42.0274 69.0689 42.7823 69.9187 43.7413 70.5091C44.7002 71.0995 45.8201 71.4038 46.9593 71.3837H47.6795C49.069 71.2564 50.379 70.7042 51.4164 69.8084C52.4538 68.9127 53.1638 67.7208 53.4416 66.4086L56.6971 50.9859L72.7731 47.8626C74.1409 47.5961 75.3833 46.915 76.317 45.9198C77.2507 44.9245 77.8263 43.6677 77.959 42.3347C78.1093 41.1324 77.844 39.916 77.2038 38.8724C76.5636 37.8288 75.5839 37.0157 74.4153 36.5581Z"
              fill="white"
            />
          </motion.g>

          {/* Left Vertical Line */}
          <motion.path
            d="M14.5 87.5V4"
            stroke="url(#paint4_linear_small)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.4,
              ease: [0.87, 0, 0.13, 1],
            }}
          />

          {/* Right Vertical Line */}
          <motion.path
            d="M83 87.5V4"
            stroke="url(#paint5_linear_small)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.6,
              ease: [0.87, 0, 0.13, 1],
            }}
          />

          {/* Bottom Horizontal Line */}
          <motion.path
            d="M6 82H89.5"
            stroke="url(#paint6_linear_small)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.8,
              ease: [0.87, 0, 0.13, 1],
            }}
          />

          {/* Connection Points */}
          <motion.circle
            cx="14.5"
            cy="82"
            r="1.5"
            fill="#016fcf"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.2, type: "spring" }}
          />

          <motion.circle
            cx="83"
            cy="82"
            r="1.5"
            fill="#016fcf"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.2, type: "spring" }}
          />

          <defs>
            <filter
              id="filter0_d_small"
              x="13"
              y="16"
              width="70"
              height="71"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="6" />
              <feGaussianBlur stdDeviation="2.5" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_9_135" />
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_9_135" result="shape" />
            </filter>

            {/* Blue gradients */}
            <linearGradient id="paint0_linear_small" x1="48.5" y1="0" x2="48.5" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016fcf" />
              <stop offset="0.273156" stopColor="#3fa6f7" />
              <stop offset="0.453125" stopColor="#87C1FF" />
              <stop offset="0.734375" stopColor="#016fcf" />
              <stop offset="0.9999" stopColor="#0058FA" />
              <stop offset="1" stopColor="#2990FF" />
            </linearGradient>

            <linearGradient id="paint1_linear_small" x1="48.5" y1="0" x2="48.5" y2="92" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016fcf" />
              <stop offset="0.869792" stopColor="#016fcf" stopOpacity="0.408542" />
              <stop offset="1" stopColor="#016fcf" stopOpacity="0.32" />
            </linearGradient>

            <linearGradient
              id="paint2_linear_small"
              x1="49.1192"
              y1="16.569"
              x2="49.1192"
              y2="72.6114"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#5AA9FF" />
              <stop offset="1" stopColor="#3C99FF" />
            </linearGradient>

            <linearGradient id="paint3_linear_small" x1="48" y1="16" x2="48" y2="76" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="1" stopColor="#ABABAB" stopOpacity="0.46" />
            </linearGradient>

            <linearGradient id="paint4_linear_small" x1="15" y1="4" x2="15" y2="87.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016fcf" />
              <stop offset="1" stopColor="#8BC3FF" />
            </linearGradient>

            <linearGradient id="paint5_linear_small" x1="83.5" y1="4" x2="83.5" y2="87.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016fcf" />
              <stop offset="1" stopColor="white" />
            </linearGradient>

            <linearGradient id="paint6_linear_small" x1="6" y1="81.5" x2="89.5" y2="81.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#016fcf" />
              <stop offset="1" stopColor="#3D9AFF" />
            </linearGradient>
          </defs>
        </motion.svg>
      </Link>
    </motion.div>
  )
} 