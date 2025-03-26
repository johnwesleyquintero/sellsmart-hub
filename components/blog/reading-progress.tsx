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

    window.addEventListener('scroll', updateProgress)
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-16 left-0 right-0 h-1 bg-muted z-50">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}