"use client"
import React, { useEffect, useState, useContext, createContext } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const CarouselCtx = createContext(null)
export function useCarousel() {
  const ctx = useContext(CarouselCtx)
  if (!ctx) throw new Error("useCarousel must be used within <Carousel />")
  return ctx
}

export function Carousel({
  opts = { align: "start", loop: true },
  plugins = [],
  orientation = "horizontal",
  setApi,
  className = "",
  children,
  ...rest
}) {
  const axis = orientation === "vertical" ? "y" : "x"
  const [viewportRef, api] = useEmblaCarousel({ axis, ...opts }, plugins)

  useEffect(() => { if (setApi && api) setApi(api) }, [api, setApi])

  return (
    <CarouselCtx.Provider value={{ viewportRef, api, orientation }}>
      <div className={`relative ${className}`} aria-roledescription="carousel" {...rest}>
        {children}
      </div>
    </CarouselCtx.Provider>
  )
}

export function CarouselContent({ className = "", children, ...rest }) {
  const { viewportRef, orientation } = useCarousel()
  const trackDir = orientation === "vertical" ? "flex-col" : "flex-row"

  return (
    <div className="overflow-hidden" ref={viewportRef}>
      <div className={`flex ${trackDir} -ml-4 ${className}`} {...rest}>
        {children}
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
      className={`absolute top-1/2 -translate-y-1/2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-900 shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-gray-100 hover:scale-110 transition-all duration-200 active:scale-95 ${side === "left" ? "left-2" : "right-2"} ${className}`}
      {...rest}
    >
      {side === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      <span className="sr-only">{side === "left" ? "Previous slide" : "Next slide"}</span>
    </button>
  )
}

export function CarouselPrevious(props) {
  const { api } = useCarousel()
  const [disabled, setDisabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setDisabled(!api.canScrollPrev())
    api.on("select", onSelect); onSelect()
    return () => api.off("select", onSelect)
  }, [api])

  if (!mounted) return null

  return <Arrow side="left" disabled={disabled} onClick={() => api && api.scrollPrev()} {...props} />
}

export function CarouselNext(props) {
  const { api } = useCarousel()
  const [disabled, setDisabled] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!api) return
    const onSelect = () => setDisabled(!api.canScrollNext())
    api.on("select", onSelect); onSelect()
    return () => api.off("select", onSelect)
  }, [api])

  if (!mounted) return null

  return <Arrow side="right" disabled={disabled} onClick={() => api && api.scrollNext()} {...props} />
}
