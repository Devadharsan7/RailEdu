import { LucideIcon } from 'lucide-react'

interface StudentMetricCardProps {
  title: string
  value: string
  subtitle?: string
  tag?: string
  icon: LucideIcon
  iconColor: string
}

export default function StudentMetricCard({
  title,
  value,
  subtitle,
  tag,
  icon: Icon,
  iconColor,
}: StudentMetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {tag && (
          <span className="px-2.5 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
            {tag}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  )
}




