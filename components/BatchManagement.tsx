'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Users, BookOpen, Save, X } from 'lucide-react'

interface Batch {
  id: string
  name: string
  classesPerBatch: number
  crewLimitPerClass: number
}

const initialBatches: Batch[] = [
  {
    id: '1',
    name: 'Batch 1',
    classesPerBatch: 6,
    crewLimitPerClass: 30,
  },
  {
    id: '2',
    name: 'Batch 2',
    classesPerBatch: 6,
    crewLimitPerClass: 30,
  },
]

export default function BatchManagement() {
  const [batches, setBatches] = useState<Batch[]>(initialBatches)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newBatch, setNewBatch] = useState({
    name: '',
    classesPerBatch: 6,
    crewLimitPerClass: 30,
  })

  const handleAddBatch = () => {
    if (newBatch.name.trim()) {
      const batch: Batch = {
        id: Date.now().toString(),
        name: newBatch.name,
        classesPerBatch: newBatch.classesPerBatch,
        crewLimitPerClass: newBatch.crewLimitPerClass,
      }
      setBatches([...batches, batch])
      setNewBatch({ name: '', classesPerBatch: 6, crewLimitPerClass: 30 })
      setIsAdding(false)
      alert(`Batch "${batch.name}" created successfully!\n\nClasses per Batch: ${batch.classesPerBatch}\nCrew Limit per Class: ${batch.crewLimitPerClass}`)
    }
  }

  const handleEdit = (batch: Batch) => {
    setEditingId(batch.id)
  }

  const handleSave = (id: string, updatedBatch: Partial<Batch>) => {
    setBatches(
      batches.map((batch) =>
        batch.id === id ? { ...batch, ...updatedBatch } : batch
      )
    )
    setEditingId(null)
    alert('Batch updated successfully!')
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      setBatches(batches.filter((batch) => batch.id !== id))
      alert('Batch deleted successfully!')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Batch Management</h3>
          <p className="text-sm text-gray-600 mt-1">Create and manage batches with class and crew limits</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Batch
        </button>
      </div>

      {/* Add New Batch Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">Create New Batch</h4>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewBatch({ name: '', classesPerBatch: 6, crewLimitPerClass: 30 })
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name
              </label>
              <input
                type="text"
                value={newBatch.name}
                onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                placeholder="e.g. Batch 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes per Batch
              </label>
              <input
                type="number"
                value={newBatch.classesPerBatch}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, classesPerBatch: parseInt(e.target.value) || 0 })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crew Limit per Class
              </label>
              <input
                type="number"
                value={newBatch.crewLimitPerClass}
                onChange={(e) =>
                  setNewBatch({ ...newBatch, crewLimitPerClass: parseInt(e.target.value) || 0 })
                }
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddBatch}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create Batch
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
                <div className="flex items-center gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900">{batch.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Batch ID: {batch.id}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{batch.classesPerBatch} Classes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{batch.crewLimitPerClass} Crew/Class</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(batch)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit batch"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete batch"
                  >
                    <Trash2 className="w-5 h-5" />
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
          <p>No batches created yet. Click "Create Batch" to get started.</p>
        </div>
      )}
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
    name: batch.name,
    classesPerBatch: batch.classesPerBatch,
    crewLimitPerClass: batch.crewLimitPerClass,
  })

  const handleSave = () => {
    onSave(editedBatch)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Batch Name
          </label>
          <input
            type="text"
            value={editedBatch.name}
            onChange={(e) => setEditedBatch({ ...editedBatch, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Classes per Batch
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crew Limit per Class
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

