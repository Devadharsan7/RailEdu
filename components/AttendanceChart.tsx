'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { batch: 'Jan-Feb', attendance: 1900 },
  { batch: 'Mar-Apr', attendance: 2020 },
  { batch: 'May-Jun', attendance: 2170 },
  { batch: 'Jul-Aug', attendance: 2060 },
  { batch: 'Sep-Oct', attendance: 2190 },
  { batch: 'Nov-Dec', attendance: 1970 },
]

export default function AttendanceChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Class Attendance</h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Attendance"
            dot={{ fill: '#3b82f6', r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


