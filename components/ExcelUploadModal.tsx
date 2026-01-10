'use client'

import { useState, useRef } from 'react'
import { Upload as UploadIcon, X, FileSpreadsheet, CheckCircle, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { notificationStorage } from '@/lib/storage'
import * as XLSX from 'xlsx'

interface ExcelUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

// Station list - you can fetch this from API or keep it static
const stations = [
  { id: '1', name: 'Chennai Central', code: 'MAS' },
  { id: '2', name: 'Chennai Egmore', code: 'MS' },
  { id: '3', name: 'Tambaram', code: 'TBM' },
  { id: '4', name: 'Madurai Junction', code: 'MDU' },
  { id: '5', name: 'Tirunelveli Junction', code: 'TEN' },
  { id: '6', name: 'Dindigul', code: 'DG' },
  { id: '7', name: 'Salem Junction', code: 'SA' },
  { id: '8', name: 'Erode Junction', code: 'ED' },
  { id: '9', name: 'Coimbatore Junction', code: 'CBE' },
  { id: '10', name: 'Tiruchirappalli Junction', code: 'TPJ' },
  { id: '11', name: 'Thanjavur Junction', code: 'TJ' },
  { id: '12', name: 'Kumbakonam', code: 'KMU' },
  { id: '13', name: 'Palakkad Junction', code: 'PGT' },
  { id: '14', name: 'Shoranur Junction', code: 'SRR' },
  { id: '15', name: 'Ottapalam', code: 'OTP' },
  { id: '16', name: 'Thiruvananthapuram Central', code: 'TVC' },
  { id: '17', name: 'Kollam Junction', code: 'QLN' },
  { id: '18', name: 'Alappuzha', code: 'ALLP' },
]

type Step = 'upload' | 'sheet' | 'station' | 'config' | 'uploading'

export default function ExcelUploadModal({ isOpen, onClose }: ExcelUploadModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [excelSheets, setExcelSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [selectedStation, setSelectedStation] = useState<string>('')
  const [courseName, setCourseName] = useState('')
  const [courseTiming, setCourseTiming] = useState('')
  const [numberOfBatches, setNumberOfBatches] = useState<number>(1)
  const [membersPerClass, setMembersPerClass] = useState<number>(0)
  const [totalMembers, setTotalMembers] = useState<number>(0)
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationError, setValidationError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthPairs = [
    { label: 'Jan - Feb', months: ['January', 'February'] },
    { label: 'Mar - Apr', months: ['March', 'April'] },
    { label: 'May - Jun', months: ['May', 'June'] },
    { label: 'Jul - Aug', months: ['July', 'August'] },
    { label: 'Sep - Oct', months: ['September', 'October'] },
    { label: 'Nov - Dec', months: ['November', 'December'] },
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2)

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

  const handleFileSelect = async (file: File) => {
    // Validate file type
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

    // Read Excel file to detect sheets
    try {
      const bytes = await file.arrayBuffer()
      const workbook = XLSX.read(bytes, { type: 'array' })
      const sheetNames = workbook.SheetNames

      if (sheetNames.length === 0) {
        alert('Excel file has no sheets')
        return
      }

      setExcelSheets(sheetNames)
      
      // If only one sheet, auto-select it
      if (sheetNames.length === 1) {
        setSelectedSheet(sheetNames[0])
        // Count rows in the sheet
        const worksheet = workbook.Sheets[sheetNames[0]]
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        setTotalMembers(data.length - 1) // Subtract header row
        setCurrentStep('station')
      } else {
        setCurrentStep('sheet')
      }
    } catch (error: any) {
      alert(`Error reading Excel file: ${error.message}`)
      setSelectedFile(null)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName)
    
    // Count rows in selected sheet
    if (selectedFile) {
      try {
        const bytes = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(bytes, { type: 'array' })
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        setTotalMembers(data.length - 1) // Subtract header row
      } catch (error) {
        console.error('Error counting rows:', error)
      }
    }
    
    setCurrentStep('station')
  }

  const handleNextFromStation = () => {
    if (!selectedStation) {
      alert('Please select a station')
      return
    }
    setCurrentStep('config')
  }

  const handleMembersPerClassChange = (value: number) => {
    setMembersPerClass(value)
    setValidationError('')

    // Validation: If members per class is too high
    const totalCapacity = numberOfBatches * value
    if (totalCapacity > totalMembers * 2) {
      setValidationError(
        `Warning: You have set ${value} members per class, but there are only ${totalMembers} members. Please select a lower value (recommended: ${Math.ceil(totalMembers / numberOfBatches)} or less).`
      )
    } else if (totalCapacity < totalMembers) {
      setValidationError(
        `Warning: You have ${totalMembers} members, but capacity is only ${totalCapacity} (${numberOfBatches} batches × ${value} per class). Please increase members per class to at least ${Math.ceil(totalMembers / numberOfBatches)}.`
      )
    }
  }

  const handleBatchesChange = (value: number) => {
    setNumberOfBatches(value)
    setValidationError('')

    // Re-validate members per class
    if (membersPerClass > 0) {
      handleMembersPerClassChange(membersPerClass)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedSheet || !selectedStation) {
      alert('Please complete all steps')
      return
    }

    if (!courseName || !courseTiming) {
      alert('Please fill in course name and timing')
      return
    }

    if (membersPerClass <= 0) {
      alert('Please set members per class')
      return
    }

    if (selectedMonths.length === 0) {
      alert('Please select at least one batch month')
      return
    }

    // Final validation
    const totalCapacity = numberOfBatches * membersPerClass
    if (totalCapacity < totalMembers) {
      const minRequired = Math.ceil(totalMembers / numberOfBatches)
      alert(`Cannot proceed: You have ${totalMembers} members but capacity is only ${totalCapacity}. Please increase members per class to at least ${minRequired}.`)
      return
    }

    setIsUploading(true)
    setUploadProgress(10)
    setCurrentStep('uploading')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('sheetName', selectedSheet)
      
      const station = stations.find(s => s.id === selectedStation)
      if (!station) {
        throw new Error('Station not found')
      }
      
      formData.append('stationId', station.id)
      formData.append('stationName', station.name)
      formData.append('stationCode', station.code)
      formData.append('courseName', courseName)
      formData.append('courseTiming', courseTiming)
      formData.append('numberOfBatches', numberOfBatches.toString())
      formData.append('membersPerClass', membersPerClass.toString())
      formData.append('totalMembers', totalMembers.toString())
      formData.append('batchMonths', JSON.stringify(selectedMonths))
      formData.append('batchYear', selectedYear.toString())

      setUploadProgress(30)
      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(60)
      const result = await response.json()
      setUploadProgress(80)

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      notificationStorage.add({
        title: 'Excel File Uploaded',
        message: `Successfully uploaded ${totalMembers} members to ${station.name}. Course: ${courseName}`,
        type: 'success',
      })

      setUploadProgress(100)
      
      // Reset and close after 2 seconds
      setTimeout(() => {
        handleReset()
        onClose()
        window.dispatchEvent(new Event('divisionsUpdated'))
      }, 2000)
    } catch (error: any) {
      alert(`Upload Error: ${error.message}`)
      setIsUploading(false)
      setCurrentStep('config')
      setUploadProgress(0)
    }
  }

  const handleReset = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setExcelSheets([])
    setSelectedSheet('')
    setSelectedStation('')
    setCourseName('')
    setCourseTiming('')
    setNumberOfBatches(1)
    setMembersPerClass(0)
    setTotalMembers(0)
    setSelectedMonths([])
    setSelectedYear(new Date().getFullYear())
    setIsUploading(false)
    setUploadProgress(0)
    setValidationError('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleBack = () => {
    if (currentStep === 'sheet') {
      setCurrentStep('upload')
    } else if (currentStep === 'station') {
      if (excelSheets.length > 1) {
        setCurrentStep('sheet')
      } else {
        setCurrentStep('upload')
      }
    } else if (currentStep === 'config') {
      setCurrentStep('station')
    }
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
              <p className="text-sm text-gray-600">
                {currentStep === 'upload' && 'Step 1: Upload Excel file'}
                {currentStep === 'sheet' && 'Step 2: Select sheet'}
                {currentStep === 'station' && 'Step 3: Select station'}
                {currentStep === 'config' && 'Step 4: Configure course'}
                {currentStep === 'uploading' && 'Uploading...'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Upload File */}
          {currentStep === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
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
                    <p className="text-gray-700 font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <UploadIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">Excel files (.xlsx, .xls) up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Sheet */}
          {currentStep === 'sheet' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                This Excel file contains {excelSheets.length} sheet(s). Please select which sheet to upload:
              </p>
              <div className="space-y-2">
                {excelSheets.map((sheetName) => (
                  <button
                    key={sheetName}
                    onClick={() => handleSheetSelect(sheetName)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedSheet === sheetName
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{sheetName}</span>
                      {selectedSheet === sheetName && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Station */}
          {currentStep === 'station' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Station <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a station...</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </select>
              {totalMembers > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Total members in selected sheet: <strong>{totalMembers}</strong>
                </p>
              )}
            </div>
          )}

          {/* Step 4: Configure Course */}
          {currentStep === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Enter course name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Timing <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseTiming}
                  onChange={(e) => setCourseTiming(e.target.value)}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Batches <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={numberOfBatches}
                  onChange={(e) => handleBatchesChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Members per Class <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={membersPerClass || ''}
                  onChange={(e) => handleMembersPerClassChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {totalMembers > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Total members: {totalMembers} | Total capacity: {numberOfBatches * membersPerClass || 0}
                  </p>
                )}
              </div>

              {/* Batch Year Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Months Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Months <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {monthPairs.map((pair) => {
                    const isSelected = pair.months.every(month => selectedMonths.includes(month))
                    return (
                      <button
                        key={pair.label}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            // Deselect: remove both months
                            setSelectedMonths(prev => 
                              prev.filter(m => !pair.months.includes(m))
                            )
                          } else {
                            // Select: add both months if not already selected
                            setSelectedMonths(prev => {
                              const newMonths = [...prev]
                              pair.months.forEach(month => {
                                if (!newMonths.includes(month)) {
                                  newMonths.push(month)
                                }
                              })
                              return newMonths.sort((a, b) => 
                                months.indexOf(a) - months.indexOf(b)
                              )
                            })
                          }
                        }}
                        className={`p-3 border-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-900'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{pair.label}</span>
                          {isSelected && (
                            <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {selectedMonths.length > 0 && (
                  <p className="mt-2 text-xs text-gray-600">
                    Selected: {selectedMonths.map(m => m.substring(0, 3)).join(', ')}
                  </p>
                )}
              </div>

              {/* Validation Error/Warning */}
              {validationError && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  validationError.includes('Warning') ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${
                    validationError.includes('Warning') ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <p className={`text-sm ${
                    validationError.includes('Warning') ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {validationError}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Uploading */}
          {currentStep === 'uploading' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Uploading and processing...</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleBack}
            disabled={currentStep === 'upload' || currentStep === 'uploading'}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isUploading}
            >
              Cancel
            </button>
            
            {currentStep === 'upload' && selectedFile && (
              <button
                onClick={() => {
                  if (excelSheets.length > 1) {
                    setCurrentStep('sheet')
                  } else {
                    setCurrentStep('station')
                  }
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {currentStep === 'station' && (
              <button
                onClick={handleNextFromStation}
                disabled={!selectedStation}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            
            {currentStep === 'config' && (
              <button
                onClick={handleUpload}
                disabled={!courseName || !courseTiming || membersPerClass <= 0 || selectedMonths.length === 0 || !!validationError}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <UploadIcon className="w-4 h-4" />
                Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
