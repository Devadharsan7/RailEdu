'use client'

import { RefreshCw } from 'lucide-react'

export default function NewContentCard() {
  const handleReview = () => {
    alert('Review Content: There are 3 pending course updates waiting for your review:\n\n1. Introduction to Data Science - Updated syllabus\n2. Advanced Algorithms - New assignments added\n3. Database Systems - Lab materials updated\n\nClick OK to view details.')
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-sm border border-gray-800 p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <RefreshCw className="w-6 h-6 text-primary-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">New Content Available</h3>
      <p className="text-sm text-gray-400 mb-6">Review pending course updates.</p>
      <button
        onClick={handleReview}
        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        Review Now
      </button>
    </div>
  )
}

