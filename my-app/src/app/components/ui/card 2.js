"use client"
import React from "react"

export function Card({ className = "", ...props }) {
  return <div className={`rounded-xl border border-gray-300 bg-white text-gray-900 shadow-md ${className}`} {...props} />
}

export function CardHeader({ className = "", ...props }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

export function CardTitle({ as: Tag = "h3", className = "", ...props }) {
  return <Tag className={`text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`} {...props} />
}

export function CardDescription({ as: Tag = "p", className = "", ...props }) {
  return <Tag className={`text-sm text-gray-600 ${className}`} {...props} />
}

export function CardContent({ className = "", ...props }) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />
}

export function CardFooter({ className = "", ...props }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
}
