import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

function ToastProgressBar({ duration = 5000, isPaused }: { duration?: number, isPaused: boolean }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 100))
        return newProgress <= 0 ? 0 : newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, isPaused])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl">
      <div
        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 group-[.destructive]:from-red-500 group-[.destructive]:to-orange-500 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function Toaster() {
  const { toasts } = useToast()
  const [hoveredToastId, setHoveredToastId] = useState<string | null>(null)

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            onMouseEnter={() => setHoveredToastId(id)}
            onMouseLeave={() => setHoveredToastId(null)}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            <ToastProgressBar isPaused={hoveredToastId === id} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
