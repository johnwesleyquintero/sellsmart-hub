'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article')
      if (!article) return

      const windowHeight = window.innerHeight
      const articleHeight = article.clientHeight
      const scrollTop = window.scrollY
      const scrollHeight = articleHeight - windowHeight

      const progress = Math.max(0, Math.min(100, (scrollTop / scrollHeight) * 100))
      setProgress(progress)
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-16 left-0 right-0 h-1 bg-muted/30 z-50">
      <div
        className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300 ease-out transform origin-left"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute right-4 top-4 text-xs font-medium text-muted-foreground">
        {Math.round(progress)}% read
      </div>
    </div>
  )
}