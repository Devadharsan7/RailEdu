'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, MapPin, Train, Search, Filter } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface CrewCourseData {
  sno: number
  crewId: string
  crewName: string
  crewDesignation: string
  dueDate: string
  testCode: string
  statusReason: string
  station: string
  division: string
  _id: string
}

export default function UsersPage() {
  const [crewCourses, setCrewCourses] = useState<CrewCourseData[]>([])
  const [filteredCourses, setFilteredCourses] = useState<CrewCourseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDivision, setSelectedDivision] = useState<string>('')
  const [selectedDesignation, setSelectedDesignation] = useState<string>('')
  const [divisions, setDivisions] = useState<string[]>([])
  const [designations, setDesignations] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchQuery, selectedDivision, selectedDesignation, crewCourses])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load all crew courses
      const coursesResponse = await fetch('/api/crew-courses/all')
      const coursesResult = await coursesResponse.json()
      
      if (coursesResult.success) {
        setCrewCourses(coursesResult.data)
        setFilteredCourses(coursesResult.data)
      }

      // Load divisions - get distinct division codes from crew courses
      if (coursesResult.success && coursesResult.data) {
        // Extract unique division codes from crew courses
        const uniqueDivisions = Array.from(
          new Set(coursesResult.data.map((course: CrewCourseData) => course.division))
        ).sort() as string[]
        setDivisions(uniqueDivisions)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDesignations = async (divisionCode: string) => {
    if (!divisionCode) {
      setDesignations([])
      return
    }
    
    try {
      const response = await fetch(`/api/divisions/${divisionCode}/designations`)
      const result = await response.json()
      
      if (result.success) {
        setDesignations(result.data)
      }
    } catch (error) {
      console.error('Error loading designations:', error)
    }
  }

  useEffect(() => {
    if (selectedDivision) {
      loadDesignations(selectedDivision)
    } else {
      setDesignations([])
    }
  }, [selectedDivision])

  const filterData = () => {
    let filtered = [...crewCourses]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.crewId.toLowerCase().includes(query) ||
          course.crewName.toLowerCase().includes(query) ||
          course.testCode.toLowerCase().includes(query) ||
          course.crewDesignation.toLowerCase().includes(query)
      )
    }

    // Filter by division
    if (selectedDivision) {
      filtered = filtered.filter((course) => course.division === selectedDivision)
    }

    // Filter by designation
    if (selectedDesignation) {
      filtered = filtered.filter((course) => course.crewDesignation === selectedDesignation)
    }

    setFilteredCourses(filtered)
  }

  const formatDate = (dateString: string) => {
    if (dateString === 'N/A') return dateString
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={['administrator']}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="pt-16 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Page Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Information</h1>
                <p className="text-gray-600">View and manage crew member information</p>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by Crew ID, Name, Test Code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Division Filter */}
                  <select
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value)
                      setSelectedDesignation('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Divisions</option>
                    {divisions.map((div) => (
                      <option key={div} value={div}>
                        {div}
                      </option>
                    ))}
                  </select>

                  {/* Designation Filter */}
                  <select
                    value={selectedDesignation}
                    onChange={(e) => setSelectedDesignation(e.target.value)}
                    disabled={!selectedDivision}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">All Designations</option>
                    {designations.map((des) => (
                      <option key={des} value={des}>
                        {des}
                      </option>
                    ))}
                  </select>

                  {/* Results Count */}
                  <div className="flex items-center justify-end text-sm text-gray-600">
                    <span>
                      Showing <strong>{filteredCourses.length}</strong> of <strong>{crewCourses.length}</strong> records
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              {isLoading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading data...</p>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            SNO.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            CREW ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            CREW NAME
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            CREW DESIGNATION
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            DUE DATE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            TEST CODE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            STATUS REASON
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                            STATION
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            DIVISION
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCourses.map((course) => (
                          <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {course.sno}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                              {course.crewId}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {course.crewName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {course.crewDesignation}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {formatDate(course.dueDate)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {course.testCode}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap border-r border-gray-200">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                course.statusReason === 'ACTIVE' || course.statusReason === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : course.statusReason === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {course.statusReason}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                              {course.station}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {course.division}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
                  <p className="text-gray-600">
                    {searchQuery || selectedDivision || selectedDesignation
                      ? 'Try adjusting your filters'
                      : 'No crew courses data available'}
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
