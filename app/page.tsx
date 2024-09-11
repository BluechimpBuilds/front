"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from 'next/link';
import Navbar from './components/Navbar';
import ProjectTypeFilter from './components/ProjectTypeFilter';
import { useSupabase } from './supabase-provider';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Session } from '@supabase/supabase-js';

interface Project {
  id: number;
  name: string;
  description: string;
  icon: string;
  tags: string[] | null;
  upvotes: number;
  type: "GitHub" | "Replit";
  rating: number | null;
  url: string;
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return <span className="text-sm text-gray-500">No rating</span>;
  }

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <i
          key={i}
          className={`text-yellow-400 text-sm ${
            i < fullStars
              ? 'fas fa-star'
              : i === fullStars && hasHalfStar
              ? 'fas fa-star-half-alt'
              : 'far fa-star'
          }`}
        ></i>
      ))}
      <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

interface LeaderboardItem {
  name: string;
  uses: number;
  type: "GitHub" | "Replit";
}

const leaderboardData: LeaderboardItem[] = [
  { name: "Next.js Starter", uses: 15234, type: "GitHub" },
  { name: "Python Flask API", uses: 12789, type: "Replit" },
  { name: "React Todo App", uses: 10567, type: "Replit" },
  { name: "Node.js Express Boilerplate", uses: 9876, type: "GitHub" },
  { name: "Vue.js Dashboard", uses: 8765, type: "GitHub" },
];

function Leaderboard() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Most Used Templates</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderboardData.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.uses.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchSessionAndProjects = async () => {
      try {
        console.log('Fetching session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          console.log('Session fetched:', session);
          setSession(session);
        }
        
        console.log('Fetching projects...');
        await fetchProjects();
        if (isMounted) {
          console.log('Projects fetched successfully');
        }
      } catch (err) {
        console.error('Error in fetchSessionAndProjects:', err);
        if (isMounted) {
          setError('Failed to load initial data: ' + (err instanceof Error ? err.message : String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessionAndProjects();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const fetchProjects = async () => {
    try {
      console.log('Starting fetchProjects...');
      const { data, error } = await supabase
        .from('repos')
        .select('*');
      
      if (error) {
        console.error('Supabase error in fetchProjects:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('No data returned from Supabase in fetchProjects');
        setProjects([]);
        setFilteredProjects([]);
        return;
      }
      
      console.log('Fetched projects:', data);
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description.toLowerCase().includes(query.toLowerCase()) ||
      (Array.isArray(project.tags) && project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
    setFilteredProjects(filtered);
  };

  const handleProjectTypeFilterChange = (filter: string) => {
    setProjectTypeFilter(filter);
    if (filter === 'all') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project => project.type === filter);
      setFilteredProjects(filtered);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to sign in...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error('Error signing in:', error.message);
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError('Failed to sign in: ' + error.message);
        }
      } else {
        console.log('Signed in successfully', data);
        setSession(data.session);
        await fetchProjects();
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to sign up...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (error) {
        console.error('Error signing up:', error.message);
        setError('Failed to sign up: ' + error.message);
      } else {
        console.log('Signed up successfully', data);
        setError('Signed up successfully. Please check your email for a confirmation link. Click the link to confirm your email and sign in automatically.');
      }
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
    else {
      console.log('Signed out successfully');
      setProjects([]);
      setFilteredProjects([]);
    }
  };

  const resendConfirmationEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) {
        console.error('Error resending confirmation email:', error.message);
        setError('Failed to resend confirmation email: ' + error.message);
      } else {
        setError('Confirmation email resent. Please check your inbox.');
      }
    } catch (err) {
      console.error('Unexpected error resending confirmation email:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleSaveRepo = async (project: Project) => {
    if (!session) {
      setError('You must be logged in to save repos.');
      return;
    }

    try {
      // Check if the default "Saved" list exists, if not create it
      let { data: savedList, error: listError } = await supabase
        .from('lists')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', 'Saved')
        .single();

      if (listError && listError.code === 'PGRST116') {
        // List doesn't exist, create it
        const { data: newList, error: createError } = await supabase
          .from('lists')
          .insert({ user_id: session.user.id, name: 'Saved' })
          .select('id')
          .single();

        if (createError) throw createError;
        savedList = newList;
      } else if (listError) {
        throw listError;
      }

      // Save the repo to the "Saved" list
      const { error: saveError } = await supabase
        .from('list_repos')
        .insert({ list_id: savedList.id, repo_id: project.id });

      if (saveError) throw saveError;

      alert('Repo saved to "My Lists"!');
    } catch (error) {
      console.error('Error saving repo:', error);
      setError('Failed to save repo. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we fetch the latest data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-800 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={handleSearch} />
      <div className="max-w-7xl mx-auto p-8">
        <header className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Welcome to ReplRepo! 👋</h1>
          <p className="text-gray-600">Find the perfect starting point for your next project.</p>
          {!session ? (
            <form onSubmit={handleSignIn} className="mt-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mr-2 p-2 border rounded text-gray-800"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mr-2 p-2 border rounded text-gray-800"
              />
              <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign In
              </button>
              <button onClick={handleSignUp} type="button" className="ml-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                Sign Up
              </button>
            </form>
          ) : (
            <div className="mt-4">
              <p className="text-gray-600">Signed in as: {session.user.email}</p>
              <button
                onClick={handleSignOut}
                className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign Out
              </button>
            </div>
          )}
          {error && <p className={`mt-2 ${error.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}
          {error && error.includes('email has not been confirmed') && (
            <button
              onClick={resendConfirmationEmail}
              className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Resend Confirmation Email
            </button>
          )}
        </header>

        <main>
          <div className="flex items-center mb-4 bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800">Top Projects</h2>
            <div className="ml-auto flex items-center">
              <span className="mr-2 text-sm text-gray-600">Type:</span>
              <ProjectTypeFilter onFilterChange={handleProjectTypeFilterChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <Link href={`/repo/${project.id}`} key={index} className="block">
                <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <Image src={project.icon} alt={project.name} width={40} height={40} className="rounded-md mr-4" />
                      <h3 className="font-semibold text-white text-lg">{project.name}</h3>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">{project.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-green-400 hover:text-green-300 text-sm">
                        Use Template
                      </span>
                      <span className="text-sm text-gray-400">{project.type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">★</span>
                        <span className="text-sm text-gray-300">{project.rating ? project.rating.toFixed(1) : 'N/A'}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          handleSaveRepo(project);
                        }}
                        className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Leaderboard />
        </main>
      </div>
    </div>
  );
}
