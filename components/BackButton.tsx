'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  label?: string
  onClick?: () => void
  className?: string
}

export default function BackButton({ label = 'Back', onClick, className = '' }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors ${className}`}
    >
      <ArrowLeft className="w-5 h-5" />
      {label}
    </button>
  )
}

