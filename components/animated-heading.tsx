"use client"

import React, { useEffect, useRef } from "react"
import anime from "animejs"

interface AnimatedHeadingProps {
  children: React.ReactNode
  className?: string
}

export const AnimatedHeading: React.FC<AnimatedHeadingProps> = ({ children, className }) => {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (ref.current) {
      anime({
        targets: ref.current,
        translateY: [-50, 0],
        opacity: [0, 1],
        easing: "easeOutExpo",
        duration: 1400,
      })
    }
  }, [])

  return (
    <h1 ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </h1>
  )
}
