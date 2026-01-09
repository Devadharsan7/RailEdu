'use client'

import { useState, useRef } from 'react'
import { Upload as UploadIcon, Download, X, FileSpreadsheet, CheckCircle } from 'lucide-react'
import { notificationStorage } from '@/lib/storage'

interface ExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

const divisions = [
  { id: '1', name: 'Chennai', code: 'MAS' },
  { id: '2', name: 'Madurai', code: 'MDU' },
  { id: '3', name: 'Salem', code: 'SA' },
  { id: '4', name: 'Tiruchirappalli', code: 'TPJ' },
  { id: '5', name: 'Palakkad', code: 'PGT' },
  { id: '6', name: 'Thiruvananthapuram', code: 'TVC' },
]

export default function ExcelUploadModal({ isOpen, onClose }: ExcelUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDivision, setSelectedDivision] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a valid Excel file (.xlsx or .xls)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setIsUploaded(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDownloadTemplate = () => {
    alert('Download Template: A template Excel file will be downloaded with the required format for data import.')
    // In a real application, this would download an actual template file
  }

  const handlePreview = async () => {
    if (!selectedFile || !selectedDivision) return

    setIsUploading(true)
    setUploadProgress(20)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const division = divisions.find(d => d.id === selectedDivision)
      if (!division) {
        throw new Error('Division not found')
      }
      
      formData.append('divisionId', division.id)
      formData.append('divisionName', division.name)
      formData.append('preview', 'true') // Request preview mode

      setUploadProgress(40)
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setUploadProgress(80)

      if (!response.ok) {
        throw new Error(result.error || 'Preview failed')
      }

      setPreviewData(result.data)
      setShowPreview(true)
      setUploadProgress(100)
      setIsUploading(false)
    } catch (error: any) {
      alert(`Preview Error: ${error.message}`)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    if (!selectedDivision) {
      alert('Please select a division')
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const division = divisions.find(d => d.id === selectedDivision)
      if (!division) {
        throw new Error('Division not found')
      }
      
      formData.append('divisionId', division.id)
      formData.append('divisionName', division.name)

      setUploadProgress(30)
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(60)
      const result = await response.json()
      setUploadProgress(80)

      if (!response.ok) {
        const errorMsg = result.error || 'Upload failed'
        const errorDetails = result.details ? `: ${result.details}` : ''
        throw new Error(`${errorMsg}${errorDetails}`)
      }

      // Data is already saved to database by the API
      // Also save to localStorage as backup
      const { divisionStorage } = require('@/lib/storage')
      
      // Ensure division exists in localStorage
      let divisionData = divisionStorage.getById(selectedDivision)
      if (!divisionData) {
        // Create division if it doesn't exist
        const newDivision = {
          id: selectedDivision,
          name: division.name,
          code: division.code || division.name.substring(0, 3).toUpperCase(),
          stations: [],
        }
        divisionStorage.save(newDivision)
        divisionData = newDivision
      }
      
      // Save users to stations
      if (result.data.stations) {
        Object.keys(result.data.stations).forEach(crewId => {
          const stationData = result.data.stations[crewId]
          const users = stationData.users.map((u: any, index: number) => ({
            id: u.id || `${selectedDivision}-${crewId}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            name: u.name || 'Unknown',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || 'Crew',
            status: u.status || 'Active',
            joinDate: u.joinDate || new Date().toISOString().split('T')[0],
            division: division.name,
            station: stationData.name,
            crewId: crewId,
          }))
          
          divisionStorage.addUsersToStation(
            selectedDivision,
            stationData.code,
            users,
            stationData.name // Pass station name
          )
        })
        
        // Trigger event to refresh users page
        window.dispatchEvent(new Event('divisionsUpdated'))
      }

      notificationStorage.add({
        title: 'Excel File Uploaded',
        message: `Successfully imported ${result.data.totalMembers} members from ${Object.keys(result.data.stations).length} stations.`,
        type: 'success',
      })

      setUploadResult(result.data)
      setUploadProgress(100)
      setIsUploading(false)
      setIsUploaded(true)
      
      // Reset after showing success
      setTimeout(() => {
        setSelectedFile(null)
        setSelectedDivision('')
        setIsUploaded(false)
        setUploadResult(null)
        setUploadProgress(0)
        setShowPreview(false)
        setPreviewData(null)
        onClose()
        // Trigger custom event to refresh users page
        window.dispatchEvent(new Event('divisionsUpdated'))
        // Also reload the page to ensure everything is fresh
        window.location.reload()
      }, 3000)
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload and process Excel file'
      notificationStorage.add({
        title: 'Upload Failed',
        message: errorMessage,
        type: 'error',
      })
      setIsUploading(false)
      setUploadProgress(0)
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setSelectedDivision('')
    setIsUploaded(false)
    setIsDragging(false)
    setUploadResult(null)
    setUploadProgress(0)
    setShowPreview(false)
    setPreviewData(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Excel File</h2>
              <p className="text-sm text-gray-600">Import data from Excel spreadsheet</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Division Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Division <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Choose a division...</option>
              {divisions.map((division) => (
                <option key={division.id} value={division.id}>
                  {division.name} ({division.code})
                </option>
              ))}
            </select>
          </div>

          {/* Download Template Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleDownloadTemplate}
              className="text-primary-500 hover:text-primary-600 font-medium text-sm flex items-center gap-2 px-3 py-2 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              {selectedFile ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <UploadIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Excel files (.xlsx, .xls) up to 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* File Info */}
          {selectedFile && !isUploaded && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>File selected:</strong> {selectedFile.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Size: {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {showPreview && previewData && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📊 Data Preview
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Total Rows:</strong> {previewData.summary?.totalRows || previewData.totalMembers}</p>
                <p><strong>Valid Members:</strong> {previewData.totalMembers}</p>
                <p><strong>Stations:</strong> {previewData.stationsCount}</p>
                {previewData.summary?.errorRows > 0 && (
                  <p className="text-red-600"><strong>Errors:</strong> {previewData.summary.errorRows}</p>
                )}
                {previewData.summary?.warningRows > 0 && (
                  <p className="text-yellow-600"><strong>Warnings:</strong> {previewData.summary.warningRows}</p>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Hide Preview
              </button>
            </div>
          )}

          {/* Success Message */}
          {isUploaded && uploadResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✓ File uploaded successfully!
              </p>
              <div className="text-xs text-green-700 space-y-1">
                <p><strong>Total Members:</strong> {uploadResult.totalMembers}</p>
                <p><strong>Stations:</strong> {uploadResult.stationsCount}</p>
                <p><strong>Division:</strong> {uploadResult.divisionName}</p>
                {uploadResult.summary && (
                  <>
                    {uploadResult.summary.errorRows > 0 && (
                      <p className="text-red-600"><strong>Errors:</strong> {uploadResult.summary.errorRows} rows</p>
                    )}
                    {uploadResult.summary.warningRows > 0 && (
                      <p className="text-yellow-600"><strong>Warnings:</strong> {uploadResult.summary.warningRows} rows</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          {!showPreview && (
            <button
              onClick={handlePreview}
              disabled={!selectedFile || !selectedDivision || isUploading || isUploaded}
              className="px-4 py-2 border border-primary-500 text-primary-600 rounded-lg hover:bg-primary-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Preview Data
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedDivision || isUploading || isUploaded}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {showPreview ? 'Previewing...' : 'Uploading...'}
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" />
                {showPreview ? 'Confirm & Upload' : 'Upload File'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

