import { useState, useEffect } from 'react';

interface UsageGraphProps {
  repoId: number | undefined;
}

export default function UsageGraph({ repoId }: UsageGraphProps) {
  if (repoId === undefined) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Usage Graph</h2>
      <p>Usage graph for repo ID: {repoId}</p>
      {/* Implement actual graph here */}
    </div>
  );
}
