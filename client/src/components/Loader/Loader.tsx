import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-600 mt-4 font-medium animate-pulse">Generating AI variations, please wait...</p>
    </div>
  );
};
