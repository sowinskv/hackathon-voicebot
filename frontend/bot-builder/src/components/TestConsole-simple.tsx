import React from 'react';

interface Props {
  flow: any;
  prompt: string;
  fields: any[];
}

const TestConsole: React.FC<Props> = ({ flow, prompt, fields }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Console</h2>
      <p className="text-gray-600 mb-6">
        Test your bot configuration in a simulated environment.
      </p>
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Test console coming soon...</p>
        <p className="text-sm text-gray-400 mt-2">
          This feature will allow you to test conversations before publishing.
        </p>
      </div>
    </div>
  );
};

export default TestConsole;
