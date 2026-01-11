'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CrewCourse {
  statusReason: string
}

interface StatusBreakdownChartProps {
  crewCourses?: CrewCourse[]
}

export default function StatusBreakdownChart({ crewCourses = [] }: StatusBreakdownChartProps) {
  // Count statuses
  const statusCounts = crewCourses.reduce((acc, course) => {
    const status = course.statusReason || 'ACTIVE'
    // Normalize status names
    let normalizedStatus = status.toUpperCase()
    if (normalizedStatus === 'COMPLETED') {
      normalizedStatus = 'Completed'
    } else if (normalizedStatus === 'ACTIVE') {
      normalizedStatus = 'In Progress'
    } else {
      normalizedStatus = 'Not Started'
    }
    
    acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const colors: Record<string, string> = {
    'Completed': '#3b82f6',
    'In Progress': '#60a5fa',
    'Not Started': '#f97316',
  }

  const data = [
    { name: 'Completed', value: statusCounts['Completed'] || 0, color: colors['Completed'] },
    { name: 'In Progress', value: statusCounts['In Progress'] || 0, color: colors['In Progress'] },
    { name: 'Not Started', value: statusCounts['Not Started'] || 0, color: colors['Not Started'] },
  ].filter(item => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Calculate percentages
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
        </div>
        <div className="flex items-center justify-center h-[300px] text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
      </div>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataWithPercentages}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {dataWithPercentages.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: number) => `${value} members`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {dataWithPercentages.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {item.percentage}%
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-200 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-semibold text-gray-900">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
