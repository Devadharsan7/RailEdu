'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const monthlyData = [
  { name: 'Completed', value: 3200, percentage: 78, color: '#3b82f6' },
  { name: 'In Progress', value: 550, percentage: 13, color: '#60a5fa' },
  { name: 'Not Started', value: 350, percentage: 9, color: '#f97316' },
]

export default function StatusBreakdownChart() {
  const data = monthlyData
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status Breakdown</h3>
      </div>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
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
            <span className="text-sm font-semibold text-gray-900">{total}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

