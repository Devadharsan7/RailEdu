import { LucideIcon, TrendingUp, Check } from 'lucide-react'

interface ExcelMetricCardProps {
  title: string
  value: string
  trend?: number
  subtitle?: string
  status?: string
  icon: LucideIcon
  iconColor: string
  trendColor?: string
}

export default function ExcelMetricCard({
  title,
  value,
  trend,
  subtitle,
  status,
  icon: Icon,
  iconColor,
  trendColor,
}: ExcelMetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && trendColor && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">+{trend}%</span>
          </div>
        )}
        {status && (
          <div className="flex items-center gap-1 text-blue-600">
            <Check className="w-4 h-4" />
            <span className="text-sm font-semibold">{status}</span>
          </div>
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


