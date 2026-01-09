'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function ReschedulePanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('mar-apr')
  const [selectedCourse, setSelectedCourse] = useState('Locomotive Engineering (LE-201)')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for the reschedule request.')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      alert(`Reschedule Request Submitted!\n\nCourse: ${selectedCourse}\nDesired Period: ${selectedPeriod === 'mar-apr' ? 'Mar - Apr' : 'May - Jun'}\nReason: ${reason}\n\nYour request has been sent for review. You will receive a notification once it's processed.`)
      setReason('')
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reschedule Class</h3>
        <p className="text-sm text-gray-600">
          Submit a request to change time slots.
        </p>
      </div>

      <div className="space-y-4">
        {/* Select Course */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option>Railway Safety and Operations (RSO-101)</option>
            <option>Locomotive Engineering (LE-201)</option>
            <option>Signal and Telecommunication Systems (STS-301)</option>
            <option>Track Maintenance and Infrastructure (TMI-401)</option>
          </select>
        </div>

        {/* Current Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current
          </label>
          <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">Jan - Feb</p>
            <p className="text-xs text-gray-500 mt-1">Mon/Wed</p>
          </div>
        </div>

        {/* Desired Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Period
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedPeriod('mar-apr')}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                selectedPeriod === 'mar-apr'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Mar - Apr</span>
                {selectedPeriod === 'mar-apr' && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
            <button
              onClick={() => setSelectedPeriod('may-jun')}
              className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                selectedPeriod === 'may-jun'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">May - Jun</span>
                {selectedPeriod === 'may-jun' && (
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Reason for Change */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Change
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Schedule conflict with internship..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  )
}

