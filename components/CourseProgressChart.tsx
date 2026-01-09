'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const batchData = [
  { batch: 'Jan-Feb', completed: 255 },
  { batch: 'Mar-Apr', completed: 255 },
  { batch: 'May-Jun', completed: 280 },
  { batch: 'Jul-Aug', completed: 265 },
  { batch: 'Sep-Oct', completed: 303 },
  { batch: 'Nov-Dec', completed: 325 },
]

export default function CourseProgressChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Course Progress Overview</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={batchData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="batch" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

