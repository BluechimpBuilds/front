"use client";

import Link from 'next/link';
import { useState } from 'react';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <button 
            className="text-white mr-4 focus:outline-none"
            onClick={toggleMenu}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="text-white text-xl font-bold">ReplRepo</Link>
        </div>
        <form onSubmit={handleSearch} className="flex items-center">
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-gray-700 text-white px-3 py-1 rounded-md mr-4"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
          />
          <button type="submit" className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>
      {isMenuOpen && (
        <div className="mt-4">
          <Link href="/my-lists" className="block text-white py-2 hover:bg-gray-700">My Lists</Link>
          <Link href="/submit-repo" className="block text-white py-2 hover:bg-gray-700">Submit Repo / Template</Link>
        </div>
      )}
    </nav>
  );
}
