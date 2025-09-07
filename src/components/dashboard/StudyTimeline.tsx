import React from 'react';

interface StudyTimelineProps {
  currentDay: number;
  totalDays: number;
}

const StudyTimeline: React.FC<StudyTimelineProps> = ({ currentDay, totalDays }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Study Timeline</h3>
      <div className="flex items-center space-x-2">
        {Array.from({ length: totalDays }, (_, index) => {
          const day = index + 1;
          let status: 'completed' | 'current' | 'locked' = 'locked';
          if (day < currentDay) {
            status = 'completed';
          } else if (day === currentDay) {
            status = 'current';
          }

          return (
            <div key={day} className="flex-1 text-center">
              <div
                className={`h-3 rounded-full ${
                  status === 'completed'
                    ? 'bg-green-500'
                    : status === 'current'
                    ? 'bg-indigo-500'
                    : 'bg-gray-200'
                }`}
              />
              <p className="text-xs text-gray-600 mt-2">
                Day {day}
              </p>
              <p className={`text-xs font-semibold ${
                status === 'completed' ? 'text-green-600' :
                status === 'current' ? 'text-indigo-600' :
                'text-gray-400'
              }`}>
                {
                  status === 'completed' ? 'Completed' :
                  status === 'current' ? "Today's Video" :
                  'Locked'
                }
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-gray-600 mt-4 text-center">
        {currentDay - 1} of {totalDays} days completed
      </p>
    </div>
  );
};

export default StudyTimeline;
