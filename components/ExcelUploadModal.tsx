'use client'

import { useState, useRef } from 'react'
import { Upload as UploadIcon, Download, X, FileSpreadsheet, CheckCircle } from 'lucide-react'
import { notificationStorage } from '@/lib/storage'

interface ExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ExcelUploadModal({ isOpen, onClose }: ExcelUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
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

  const handleUpload = () => {
    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    setIsUploading(true)

    // Simulate file upload and data processing
    setTimeout(() => {
      // In a real app, you would parse the Excel file here
      // For now, we'll simulate processing and add a notification
      notificationStorage.add({
        title: 'Excel File Uploaded',
        message: `File "${selectedFile.name}" has been uploaded and processed successfully. Data has been imported.`,
        type: 'success',
      })
      
      setIsUploading(false)
      setIsUploaded(true)
      
      // Reset after showing success
      setTimeout(() => {
        setSelectedFile(null)
        setIsUploaded(false)
        onClose()
      }, 2000)
    }, 2000)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setIsUploaded(false)
    setIsDragging(false)
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

          {/* Success Message */}
          {isUploaded && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✓ File uploaded successfully! Processing data...
              </p>
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
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || isUploaded}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

