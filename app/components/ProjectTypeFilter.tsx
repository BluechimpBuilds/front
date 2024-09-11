import React from 'react';

interface ProjectTypeFilterProps {
  onFilterChange: (filter: string) => void;
}

const ProjectTypeFilter: React.FC<ProjectTypeFilterProps> = ({ onFilterChange }) => {
  return (
    <select
      onChange={(e) => onFilterChange(e.target.value)}
      className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      defaultValue="all"
    >
      <option value="all">All</option>
      <option value="GitHub">GitHub</option>
      <option value="Replit">Replit</option>
    </select>
  );
};

export default ProjectTypeFilter;
