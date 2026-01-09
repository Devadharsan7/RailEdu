'use client'

import { Edit, FolderOpen } from 'lucide-react'

interface Station {
  id: string
  name: string
  location: string
  course: string
  testCount: number
  status: 'Ready' | 'Pending' | 'Error'
  iconBgColor: string
}

const stations: Station[] = [
  {
    id: 'ST-001',
    name: 'Chemistry Lab A',
    location: 'Building 4, Room 202',
    course: 'Intro to Organic Chem',
    testCount: 12,
    status: 'Ready',
    iconBgColor: 'bg-blue-500',
  },
  {
    id: 'ST-002',
    name: 'Biology Station 1',
    location: 'Building 4, Room 105',
    course: 'Molecular Biology 101',
    testCount: 8,
    status: 'Ready',
    iconBgColor: 'bg-pink-500',
  },
]

export default function ImportPreview() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review identified stations and tests before committing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
            Clear Data
          </button>
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Commit Import
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                STATION ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                STATION NAME
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                ASSOCIATED COURSE
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                TEST COUNT
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                STATUS
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                ACTION
              </th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station) => (
              <tr
                key={station.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-sm font-medium text-gray-900">
                    {station.id}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${station.iconBgColor}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {station.name}
                      </p>
                      <p className="text-xs text-gray-500">{station.location}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700">{station.course}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-700">
                    {station.testCount} Tests
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {station.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button className="p-2 text-gray-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

