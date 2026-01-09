'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { week: 'Week 1', class: 8, lab: 4 },
  { week: 'Week 2', class: 10, lab: 6 },
  { week: 'Week 3', class: 8, lab: 5 },
  { week: 'Week 4', class: 12, lab: 4 },
  { week: 'Week 5', class: 9, lab: 6 },
  { week: 'Week 6', class: 10, lab: 5 },
  { week: 'Week 7', class: 8, lab: 4 },
  { week: 'Week 8', class: 11, lab: 5 },
]

export default function SemesterWorkload() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Semester Workload</h3>
        <p className="text-sm text-gray-600">Weekly hours allocated</p>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="text-sm text-gray-700">Class</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm text-gray-700">Lab</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="week" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="class" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lab" fill="#f97316" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}


