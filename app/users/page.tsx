'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, ArrowLeft, MapPin, Train } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Inactive'
  joinDate: string
  phone?: string
  division?: string
  station?: string
}

interface Division {
  id: string
  name: string
  code: string
  stations: Station[]
}

interface Station {
  id: string
  name: string
  code: string
  users: User[]
}

const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@weave.edu', role: 'Student', status: 'Active', joinDate: '2024-01-15', phone: '+1 234-567-8900', division: 'Chennai', station: 'Chennai Central' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@weave.edu', role: 'Instructor', status: 'Active', joinDate: '2023-11-20', phone: '+1 234-567-8901', division: 'Madurai', station: 'Madurai Junction' },
  { id: '3', name: 'Mike Johnson', email: 'mike.j@weave.edu', role: 'Student', status: 'Active', joinDate: '2024-02-01', phone: '+1 234-567-8902', division: 'Salem', station: 'Salem Junction' },
  { id: '4', name: 'Sarah Williams', email: 'sarah.w@weave.edu', role: 'Admin', status: 'Active', joinDate: '2023-09-10', phone: '+1 234-567-8903', division: 'Tiruchirappalli', station: 'Tiruchirappalli Junction' },
  { id: '5', name: 'Tom Brown', email: 'tom.brown@weave.edu', role: 'Student', status: 'Inactive', joinDate: '2023-12-05', phone: '+1 234-567-8904', division: 'Palakkad', station: 'Palakkad Junction' },
  { id: '6', name: 'Emily Davis', email: 'emily.d@weave.edu', role: 'Student', status: 'Active', joinDate: '2024-01-20', phone: '+1 234-567-8905', division: 'Chennai', station: 'Chennai Egmore' },
  { id: '7', name: 'David Wilson', email: 'david.w@weave.edu', role: 'Instructor', status: 'Active', joinDate: '2023-10-15', phone: '+1 234-567-8906', division: 'Madurai', station: 'Tirunelveli Junction' },
  { id: '8', name: 'Lisa Anderson', email: 'lisa.a@weave.edu', role: 'Student', status: 'Active', joinDate: '2024-02-10', phone: '+1 234-567-8907', division: 'Salem', station: 'Erode Junction' },
]

const divisions: Division[] = [
  {
    id: '1',
    name: 'Chennai',
    code: 'MAS',
    stations: [
      { id: '1', name: 'Chennai Central', code: 'MAS', users: mockUsers.filter(u => u.station === 'Chennai Central') },
      { id: '2', name: 'Chennai Egmore', code: 'MS', users: mockUsers.filter(u => u.station === 'Chennai Egmore') },
      { id: '3', name: 'Tambaram', code: 'TBM', users: [] },
    ]
  },
  {
    id: '2',
    name: 'Madurai',
    code: 'MDU',
    stations: [
      { id: '4', name: 'Madurai Junction', code: 'MDU', users: mockUsers.filter(u => u.station === 'Madurai Junction') },
      { id: '5', name: 'Tirunelveli Junction', code: 'TEN', users: mockUsers.filter(u => u.station === 'Tirunelveli Junction') },
      { id: '6', name: 'Dindigul', code: 'DG', users: [] },
    ]
  },
  {
    id: '3',
    name: 'Salem',
    code: 'SA',
    stations: [
      { id: '7', name: 'Salem Junction', code: 'SA', users: mockUsers.filter(u => u.station === 'Salem Junction') },
      { id: '8', name: 'Erode Junction', code: 'ED', users: mockUsers.filter(u => u.station === 'Erode Junction') },
      { id: '9', name: 'Coimbatore Junction', code: 'CBE', users: [] },
    ]
  },
  {
    id: '4',
    name: 'Tiruchirappalli',
    code: 'TPJ',
    stations: [
      { id: '10', name: 'Tiruchirappalli Junction', code: 'TPJ', users: mockUsers.filter(u => u.station === 'Tiruchirappalli Junction') },
      { id: '11', name: 'Thanjavur Junction', code: 'TJ', users: [] },
      { id: '12', name: 'Kumbakonam', code: 'KMU', users: [] },
    ]
  },
  {
    id: '5',
    name: 'Palakkad',
    code: 'PGT',
    stations: [
      { id: '13', name: 'Palakkad Junction', code: 'PGT', users: mockUsers.filter(u => u.station === 'Palakkad Junction') },
      { id: '14', name: 'Shoranur Junction', code: 'SRR', users: [] },
      { id: '15', name: 'Ottapalam', code: 'OTP', users: [] },
    ]
  },
  {
    id: '6',
    name: 'Thiruvananthapuram',
    code: 'TVC',
    stations: [
      { id: '16', name: 'Thiruvananthapuram Central', code: 'TVC', users: [] },
      { id: '17', name: 'Kollam Junction', code: 'QLN', users: [] },
      { id: '18', name: 'Alappuzha', code: 'ALLP', users: [] },
    ]
  },
]

export default function UsersPage() {
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

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

