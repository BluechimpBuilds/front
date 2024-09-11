"use client";

import { useState, useEffect } from 'react';
import { useSupabase } from '../supabase-provider';
import Navbar from '../components/Navbar';
import { Session } from '@supabase/supabase-js';

// Remove the createClient import and supabase initialization

interface RepoSubmission {
  name: string;
  description: string;
  type: "GitHub" | "Replit";
  url: string;
  tags: string[];
  language: string;
  icon: string;
  // Remove rating and upvotes from here
}

export default function SubmitRepo() {
  const { supabase } = useSupabase();
  const [submission, setSubmission] = useState<RepoSubmission>({
    name: '',
    description: '',
    type: 'GitHub',
    url: '',
    tags: [],
    language: '',
    icon: '/icons/default.png',
    // Remove rating and upvotes from here
  });
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubmission(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    setSubmission(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Ensure tags are sent as an array
      const submissionData = {
        ...submission,
        tags: submission.tags.length > 0 ? submission.tags : submission.tags.join(',').split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      };

      console.log('Submitting repo with data:', JSON.stringify(submissionData, null, 2));

      const response = await fetch('http://localhost:4000/submit-repo', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(submissionData),
      });
      const result = await response.json();
      console.log('Response from server:', result);

      if (response.ok) {
        console.log('Repo submitted successfully:', result);
        alert('Success: Repo submitted successfully!');
        // Reset form
        setSubmission({
          name: '',
          description: '',
          type: 'GitHub',
          url: '',
          tags: [],
          language: '',
          icon: '/icons/default.png',
        });
      } else {
        console.error('Error submitting repo:', result);
        console.error('Submitted data:', submissionData);
        alert(`Error submitting repo: ${result.error}\nDetails: ${JSON.stringify(result.details || 'No additional details')}`);
      }
    } catch (error) {
      console.error('Error submitting repo:', error);
      alert('Network error occurred while submitting repo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={() => {}} />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Submit a Repo / Template</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={submission.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={submission.description}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={3}
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
              Type
            </label>
            <select
              id="type"
              name="type"
              value={submission.type}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="GitHub">GitHub</option>
              <option value="Replit">Replit</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
              URL
            </label>
            <input
              type="url"
              id="url"
              name="url"
              value={submission.url}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={submission.tags.join(', ')}
              onChange={handleTagsChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
              Primary Language
            </label>
            <input
              type="text"
              id="language"
              name="language"
              value={submission.language}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
