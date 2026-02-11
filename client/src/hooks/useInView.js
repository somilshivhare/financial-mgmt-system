import { useEffect, useRef, useState } from 'react'

/**
 * Returns a ref and whether the element is in view.
 * Use with CSS: .mkt-reveal { opacity: 0; transform: translateY(20px); transition: ... }
 *              .mkt-reveal.mkt-reveal-visible { opacity: 1; transform: none; }
 * @param {Object} options - { rootMargin: string, threshold: number }
 */
export function useInView(options = {}) {
  const { rootMargin = '0px 0px -40px 0px', threshold = 0.1 } = options
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsInView(true)
      },
      { rootMargin, threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return [ref, isInView]
}
