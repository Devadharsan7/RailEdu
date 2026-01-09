import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  trend: number
  trendLabel: string
  icon: LucideIcon
  iconColor: string
  trendColor: string
}

export default function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  iconColor,
  trendColor,
}: MetricCardProps) {
  const isPositive = trend > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span className="text-sm font-semibold">{Math.abs(trend)}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  )
}



