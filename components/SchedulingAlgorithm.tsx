import { useState } from 'react';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';

export default function SchedulingAlgorithm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const scheduleClass = async (userId: string, classId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/schedule-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scheduleClass', userId, classId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to schedule class');
    } finally {
      setLoading(false);
    }
  };

  const assignBatchToStation = async (classId: string, stationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/schedule-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assignBatchToStation', classId, stationId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ message: 'Batch assigned to station successfully' });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to assign batch');
    } finally {
      setLoading(false);
    }
  };

  const getUserSchedule = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/schedule-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUserSchedule', userId })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to get schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Class Scheduling Algorithm</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => scheduleClass('user123', 'class456')}
          disabled={loading}
          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Calendar className="w-5 h-5" />
          Schedule Class for User
        </button>
        
        <button
          onClick={() => assignBatchToStation('class456', 'station-A1')}
          disabled={loading}
          className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          Assign Batch to Station
        </button>
        
        <button
          onClick={() => getUserSchedule('user123')}
          disabled={loading}
          className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
        >
          <Clock className="w-5 h-5" />
          Get User Schedule
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Result:</h3>
          <pre className="text-sm text-green-700 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Algorithm Features:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Prevents station conflicts - no overlapping classes at same station</li>
          <li>• Schedules classes before due dates</li>
          <li>• Creates alerts for users and admins</li>
          <li>• Assigns entire batches to stations automatically</li>
          <li>• Tracks user progress through multiple classes</li>
        </ul>
      </div>
    </div>
  );
}