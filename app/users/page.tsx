'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, ArrowLeft, MapPin, Train } from 'lucide-react'
import { divisionStorage, type Division, type Station, type User } from '@/lib/storage'

export default function UsersPage() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  useEffect(() => {
    loadDivisions()
  }, [])
  
  // Listen for custom event when data is updated
  useEffect(() => {
    const handleDataUpdate = () => {
      loadDivisions()
    }
    
    window.addEventListener('divisionsUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('divisionsUpdated', handleDataUpdate)
    }
  }, [])

  const loadDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setDivisions(result.data)
      } else {
        // Fallback to localStorage if database fails or returns empty
        const localDivisions = divisionStorage.getAll()
        console.log('Loading from localStorage:', localDivisions.length, 'divisions')
        setDivisions(localDivisions)
      }
    } catch (error) {
      console.error('Error loading divisions:', error)
      // Fallback to localStorage
      const localDivisions = divisionStorage.getAll()
      console.log('Loading from localStorage (error):', localDivisions.length, 'divisions')
      setDivisions(localDivisions)
    }
  }

  const handleDivisionClick = (division: Division) => {
    setSelectedDivision(division)
    setSelectedStation(null)
  }

  const handleStationClick = (station: Station) => {
    setSelectedStation(station)
  }

  const handleBack = () => {
    if (selectedStation) {
      setSelectedStation(null)
    } else if (selectedDivision) {
      setSelectedDivision(null)
    }
  }

  // Show Station Users View
  if (selectedStation) {
    return (
      <ProtectedRoute allowedUserTypes={['administrator']}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="pt-16 p-6">
              <div className="max-w-7xl mx-auto">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Stations
                </button>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{selectedStation.name}</h1>
                      <p className="text-gray-600">Station Code: {selectedStation.code} | {selectedDivision?.name} Division</p>
                    </div>
                  </div>
                </div>

                {selectedStation.users.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Users at {selectedStation.name} ({selectedStation.users.length} {selectedStation.users.length === 1 ? 'User' : 'Users'})
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedStation.users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                                    <Users className="w-5 h-5 text-primary-600" />
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.phone || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.status === 'Active' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.status}
                                </span>
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">There are no users assigned to this station.</p>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show Stations View (when division is selected)
  if (selectedDivision) {
    return (
      <ProtectedRoute allowedUserTypes={['administrator']}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 ml-64">
            <Header />
            <main className="pt-16 p-6">
              <div className="max-w-7xl mx-auto">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Divisions
                </button>

                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedDivision.name} Division</h1>
                  <p className="text-gray-600">Stations under {selectedDivision.name} Division (Code: {selectedDivision.code})</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedDivision.stations.map((station) => (
                    <div
                      key={station.id}
                      onClick={() => handleStationClick(station)}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
                          <p className="text-sm text-gray-500">Code: {station.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {station.users.length} {station.users.length === 1 ? 'User' : 'Users'}
                        </span>
                        <span className="text-sm text-primary-600 font-medium">View Users →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show Divisions View (default when Users is clicked)
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Southern Railway Divisions</h1>
                <p className="text-gray-600">Select a division to view stations and users</p>
              </div>

              {/* Divisions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {divisions.map((division) => (
                  <div
                    key={division.id}
                    onClick={() => handleDivisionClick(division)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Train className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{division.name}</h3>
                        <p className="text-sm text-gray-500">Code: {division.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-600">
                        {division.stations.length} {division.stations.length === 1 ? 'Station' : 'Stations'}
                      </span>
                      <span className="text-sm text-primary-600 font-medium">View Stations →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

