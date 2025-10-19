"use client"
import React, { useEffect, useState, useContext, createContext, useMemo } from "react"

const CarouselCtx = createContext(null)
export function useCarousel() {
  const ctx = useContext(CarouselCtx)
  if (!ctx) throw new Error("useCarousel must be used within <Carousel />")
  return ctx
}

export function Carousel({
  opts = { loop: true },
  orientation = "horizontal",
  className = "",
  children,
  ...rest
}) {
  const [index, setIndex] = useState(0)
  const [count, setCount] = useState(0)
  const loop = opts?.loop ?? true

  const api = useMemo(() => ({
    scrollPrev: () => setIndex((i) => (loop ? (i - 1 + count) % Math.max(count, 1) : Math.max(0, i - 1))),
    scrollNext: () => setIndex((i) => (loop ? (i + 1) % Math.max(count, 1) : Math.min(count - 1, i + 1))),
    canScrollPrev: () => loop ? count > 1 : index > 0,
    canScrollNext: () => loop ? count > 1 : index < count - 1,
    selectedScrollSnap: () => index,
    setCount,
  }), [index, count, loop])

  return (
    <CarouselCtx.Provider value={{ index, setIndex, count, setCount, api, orientation, loop }}>
      <div className={`relative ${className}`} aria-roledescription="carousel" {...rest}>
        {React.Children.map(children, (child) => child)}
      </div>
    </CarouselCtx.Provider>
  )
}

export function CarouselContent({ className = "", children, ...rest }) {
  const { index, setCount, orientation } = useCarousel()
  const items = React.Children.toArray(children)
  useEffect(() => { setCount(items.length) }, [items.length, setCount])
  const trackDir = orientation === "vertical" ? "flex-col" : "flex-row"

  const translate = orientation === "vertical" ? `translate3d(0, -${index * 100}%, 0)` : `translate3d(-${index * 100}%, 0, 0)`

  return (
    <div className="overflow-hidden">
      <div
        className={`flex ${trackDir} -ml-4 will-change-transform transition-transform duration-500 ease-out ${className}`}
        style={{ transform: translate }}
        {...rest}
      >
        {items}
      </div>
    </div>
  )
}

export function CarouselItem({ className = "", children, ...rest }) {
  return (
    <div
      className={`min-w-0 shrink-0 grow-0 basis-full pl-4 ${className}`}
      role="group"
      aria-roledescription="slide"
      {...rest}
    >
      {children}
    </div>
  )
}

function Arrow({ side, onClick, disabled, className = "", ...rest }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 -translate-y-1/2 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-neutral-900 border border-neutral-200 shadow-lg backdrop-blur-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-white hover:shadow-xl hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${side === "left" ? "left-3" : "right-3"} ${className}`}
      {...rest}
    >
      {side === "left" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="sr-only">{side === "left" ? "Previous slide" : "Next slide"}</span>
    </button>
  )
}

export function CarouselPrevious(props) {
  const { api } = useCarousel()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const disabled = !api.canScrollPrev()
  return <Arrow side="left" disabled={disabled} onClick={() => api.scrollPrev()} {...props} />
}

export function CarouselNext(props) {
  const { api } = useCarousel()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  const disabled = !api.canScrollNext()
  return <Arrow side="right" disabled={disabled} onClick={() => api.scrollNext()} {...props} />
}
