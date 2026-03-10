import React from 'react';

const VersionHistory: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Version History</h2>
      <p className="text-gray-600 mb-6">
        View and restore previous versions of your bot configuration.
      </p>
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">No versions saved yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Save your bot to create version history.
        </p>
      </div>
    </div>
  );
};

export default VersionHistory;
