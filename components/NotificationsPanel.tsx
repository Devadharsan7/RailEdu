'use client'

import { X, Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useUserAlerts, useAdminAlerts } from '@/hooks/useScheduler'

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userType: string
}

export default function NotificationsPanel({ isOpen, onClose, userId, userType }: NotificationsPanelProps) {
  const { alerts: userAlerts, markAsSent: markUserAlert } = useUserAlerts(userType === 'crew' ? userId : '')
  const { alerts: adminAlerts, markAsSent: markAdminAlert } = useAdminAlerts(userType === 'administrator' ? userId : '')
  
  const alerts = userType === 'administrator' ? adminAlerts : userAlerts
  const markAsSent = userType === 'administrator' ? markAdminAlert : markUserAlert

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'reminder': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'due-soon': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'assignment': return 'border-l-blue-500 bg-blue-50'
      case 'reminder': return 'border-l-yellow-500 bg-yellow-50'
      case 'due-soon': return 'border-l-orange-500 bg-orange-50'
      case 'overdue': return 'border-l-red-500 bg-red-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const handleDismiss = (alertId: string) => {
    markAsSent(alertId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden flex flex-col mt-16 mr-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 p-3 rounded-r-lg ${getAlertColor(alert.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.scheduledTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

