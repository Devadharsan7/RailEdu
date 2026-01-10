import { MapPin } from 'lucide-react'

export default function StationMap() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Station Activity Map</h3>
      <div className="relative bg-gray-100 rounded-lg h-64 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Map View</p>
          </div>
        </div>
        {/* Station Pins */}
        <div className="absolute top-1/4 left-1/4">
          <MapPin className="w-8 h-8 text-primary-500 fill-primary-500" />
        </div>
        <div className="absolute top-1/2 right-1/3">
          <MapPin className="w-8 h-8 text-blue-500 fill-blue-500" />
        </div>
        <div className="absolute bottom-1/4 left-1/2">
          <MapPin className="w-8 h-8 text-orange-500 fill-orange-500" />
        </div>
      </div>
    </div>
  )
}




