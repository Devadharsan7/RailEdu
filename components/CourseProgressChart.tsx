'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CrewCourse {
  classTimeFrom: string | null
  classTimeTo: string | null
}

interface CourseProgressChartProps {
  crewCourses?: CrewCourse[]
}

export default function CourseProgressChart({ crewCourses = [] }: CourseProgressChartProps) {
  // Group crew courses by month periods based on CLASS TIME FROM and CLASS TIME TO
  const monthGroups: Record<string, number> = {}
  
  crewCourses.forEach(course => {
    if (course.classTimeFrom && course.classTimeTo && 
        course.classTimeFrom !== 'N/A' && course.classTimeTo !== 'N/A') {
      try {
        // Parse dates - they're in DD-MM-YYYY format
        const parseDate = (dateStr: string): Date | null => {
          const parts = dateStr.split('-')
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10)
            const month = parseInt(parts[1], 10) - 1 // JavaScript months are 0-indexed
            const year = parseInt(parts[2], 10)
            return new Date(year, month, day)
          }
          return null
        }

        const fromDate = parseDate(course.classTimeFrom)
        const toDate = parseDate(course.classTimeTo)
        
        if (fromDate && toDate && !isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          // Get the month/year of the start date
          const fromMonth = fromDate.getMonth()
          const fromYear = fromDate.getFullYear()
          
          // Get the month/year of the end date
          const toMonth = toDate.getMonth()
          const toYear = toDate.getFullYear()
          
          // Create month labels
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          
          // If same month, just use that month
          if (fromYear === toYear && fromMonth === toMonth) {
            const monthKey = `${monthNames[fromMonth]} ${fromYear}`
            monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1
          } else {
            // If different months, create a range
            const monthKey = `${monthNames[fromMonth]}-${monthNames[toMonth]} ${fromYear}`
            monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1
          }
        }
      } catch (error) {
        // Skip invalid dates
        console.warn('Invalid date format:', course.classTimeFrom, course.classTimeTo)
      }
    }
  })

  // Convert to chart data format and sort by date
  const batchData = Object.entries(monthGroups)
    .map(([batch, count]) => ({ batch, completed: count }))
    .sort((a, b) => {
      // Extract year and month for sorting
      const getSortKey = (batch: string): number => {
        const parts = batch.split(' ')
        const year = parseInt(parts[parts.length - 1]) || 0
        const monthPart = parts[0].split('-')[0] // Get first month if range
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const month = monthNames.indexOf(monthPart)
        return year * 100 + month
      }
      return getSortKey(a.batch) - getSortKey(b.batch)
    })

  // If no data, show empty state
  if (batchData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Course Progress Overview</h3>
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
        <h3 className="text-lg font-semibold text-gray-900">Course Progress Overview</h3>
        <p className="text-sm text-gray-500 mt-1">Grouped by CLASS TIME period</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={batchData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="batch" 
            stroke="#6b7280"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`${value} members`, 'Members']}
          />
          <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
