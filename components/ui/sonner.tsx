"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "#334155",
          "--normal-border": "#e2e8f0",
          "--success-bg": "white",
          "--success-text": "#16a34a",
          "--success-border": "#bbf7d0",
          "--error-bg": "white",
          "--error-text": "#dc2626",
          "--error-border": "#fecaca",
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
