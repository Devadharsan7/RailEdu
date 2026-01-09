'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, BookOpen, Save, X, Calendar } from 'lucide-react'
import { batchStorage, type Batch } from '@/lib/storage'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

const availableCourses = [
  'Railway Safety and Operations (RSO-101)',
  'Locomotive Engineering (LE-201)',
  'Signal and Telecommunication Systems (STS-301)',
  'Track Maintenance and Infrastructure (TMI-401)',
  'Railway Traffic Management (RTM-501)',
  'Freight Operations (FO-601)',
  'Passenger Services Management (PSM-701)',
  'Railway Electrical Systems (RES-801)',
  'Rolling Stock Maintenance (RSM-901)',
  'Railway Signaling Systems (RSS-1001)',
]

const availableMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function BatchManagement() {
  const { toasts, success, error, removeToast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    const storedBatches = batchStorage.getAll()
    if (storedBatches.length === 0) {
      // Initialize with default batches
      const defaultBatches: Batch[] = [
        {
          id: '1',
          course: 'Railway Safety and Operations (RSO-101)',
          classesPerBatch: 6,
          crewLimitPerClass: 30,
          months: ['January', 'February'],
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          course: 'Locomotive Engineering (LE-201)',
          classesPerBatch: 6,
          crewLimitPerClass: 30,
          months: ['March', 'April'],
          createdAt: new Date().toISOString(),
        },
      ]
      defaultBatches.forEach(batch => batchStorage.save(batch))
      setBatches(defaultBatches)
    } else {
      setBatches(storedBatches)
    }
  }, [])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newBatch, setNewBatch] = useState({
    course: '',
    classesPerBatch: 6,
    crewLimitPerClass: 30,
    months: [] as string[],
  })

  const handleAddBatch = () => {
    if (newBatch.course.trim() && newBatch.months.length > 0) {
      const batch: Batch = {
        id: Date.now().toString(),
        course: newBatch.course,
        classesPerBatch: newBatch.classesPerBatch,
        crewLimitPerClass: newBatch.crewLimitPerClass,
        months: newBatch.months,
        createdAt: new Date().toISOString(),
      }
      batchStorage.save(batch)
      setBatches(batchStorage.getAll())
      setNewBatch({ course: '', classesPerBatch: 6, crewLimitPerClass: 30, months: [] })
      setIsAdding(false)
      success(`Batch created successfully for ${batch.course}`)
    } else {
      error('Please fill in all required fields: Course and at least one month.')
    }
  }

  const toggleMonth = (month: string) => {
    setNewBatch(prev => ({
      ...prev,
      months: prev.months.includes(month)
        ? prev.months.filter(m => m !== month)
        : [...prev.months, month]
    }))
  }

  const handleEdit = (batch: Batch) => {
    setEditingId(batch.id)
  }

  const handleSave = (id: string, updatedBatch: Partial<Batch>) => {
    const batch = batchStorage.getById(id)
    if (batch) {
      const updated = { ...batch, ...updatedBatch }
      batchStorage.save(updated)
      setBatches(batchStorage.getAll())
      setEditingId(null)
      success('Batch updated successfully!')
    }
  }

  const handleDelete = (id: string) => {
    const batch = batchStorage.getById(id)
    if (batch && confirm(`Are you sure you want to delete batch for ${batch.course}?`)) {
      batchStorage.delete(id)
      setBatches(batchStorage.getAll())
      success('Batch deleted successfully!')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Management</h3>
          <p className="text-sm text-gray-600 mt-1">Create and manage batches with class and crew limits</p>
        </div>
        <div className="flex items-center gap-3">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Batch
            </button>
          )}
        </div>
      </div>

      {/* Add New Batch Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Create New Batch</h4>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewBatch({ course: '', classesPerBatch: 6, crewLimitPerClass: 30, months: [] })
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Step 1: Select Course */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course <span className="text-red-500">*</span>
              </label>
              <select
                value={newBatch.course}
                onChange={(e) => setNewBatch({ ...newBatch, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a course...</option>
                {availableCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Number of Members per Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Members per Class <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newBatch.crewLimitPerClass}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, crewLimitPerClass: parseInt(e.target.value) || 0 })
                }
                min="1"
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Step 3: Number of Classes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Classes per Batch <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newBatch.classesPerBatch}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, classesPerBatch: parseInt(e.target.value) || 0 })
                }
                min="1"
                placeholder="e.g. 6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Step 4: Select Months */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Months <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => toggleMonth(month)}
                    className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                      newBatch.months.includes(month)
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
              {newBatch.months.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {newBatch.months.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false)
                setNewBatch({ course: '', classesPerBatch: 6, crewLimitPerClass: 30, months: [] })
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBatch}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Add Batch
            </button>
          </div>
        </div>
      )}

      {/* Batches List */}
      <div className="space-y-4">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            {editingId === batch.id ? (
              <EditBatchForm
                batch={batch}
                onSave={(updated) => handleSave(batch.id, updated)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-primary-600" />
                      <h4 className="font-semibold text-gray-900">{batch.course}</h4>
                    </div>
                    <p className="text-xs text-gray-500">Batch ID: {batch.id}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{batch.classesPerBatch} Classes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{batch.crewLimitPerClass} Members/Class</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{batch.months.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAdding(false)
                      handleEdit(batch)
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    title="Edit batch"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    title="Delete batch"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {batches.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No batches created yet. Click "Add Batch" to get started.</p>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

interface EditBatchFormProps {
  batch: Batch
  onSave: (updated: Partial<Batch>) => void
  onCancel: () => void
}

function EditBatchForm({ batch, onSave, onCancel }: EditBatchFormProps) {
  const [editedBatch, setEditedBatch] = useState({
    course: batch.course,
    classesPerBatch: batch.classesPerBatch,
    crewLimitPerClass: batch.crewLimitPerClass,
    months: [...batch.months],
  })

  const toggleMonth = (month: string) => {
    setEditedBatch(prev => ({
      ...prev,
      months: prev.months.includes(month)
        ? prev.months.filter(m => m !== month)
        : [...prev.months, month]
    }))
  }

  const handleSave = () => {
    if (editedBatch.course.trim() && editedBatch.months.length > 0) {
      onSave(editedBatch)
    } else {
      alert('Please fill in all required fields: Course and at least one month.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Course <span className="text-red-500">*</span>
        </label>
        <select
          value={editedBatch.course}
          onChange={(e) => setEditedBatch({ ...editedBatch, course: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Choose a course...</option>
          {availableCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Members per Class <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={editedBatch.crewLimitPerClass}
            onChange={(e) =>
              setEditedBatch({ ...editedBatch, crewLimitPerClass: parseInt(e.target.value) || 0 })
            }
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Classes per Batch <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={editedBatch.classesPerBatch}
            onChange={(e) =>
              setEditedBatch({ ...editedBatch, classesPerBatch: parseInt(e.target.value) || 0 })
            }
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Months <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {availableMonths.map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => toggleMonth(month)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                editedBatch.months.includes(month)
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
        {editedBatch.months.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {editedBatch.months.join(', ')}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

