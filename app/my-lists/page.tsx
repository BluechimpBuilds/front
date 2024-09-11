"use client";

import { useState, useEffect } from 'react';
import { useSupabase } from '../supabase-provider';
import Navbar from '../components/Navbar';
import { Session } from '@supabase/supabase-js';
import Link from 'next/link';

interface List {
  id: number;
  name: string;
  description: string;
}

interface SavedRepo {
  id: number;
  name: string;
  description: string;
  list_id: number;
  url: string;
}

export default function MyLists() {
  const { supabase } = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [savedRepos, setSavedRepos] = useState<SavedRepo[]>([]);
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [supabase.auth]);

  useEffect(() => {
    if (session) {
      fetchLists();
      fetchSavedRepos();
    }
  }, [session]);

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching lists:', error);
      setError('Failed to fetch lists');
    } else {
      setLists(data || []);
    }
  };

  const fetchSavedRepos = async () => {
    const { data, error } = await supabase
      .from('list_repos')
      .select(`
        id,
        repos (id, name, description, url),
        list_id
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching saved repos:', error);
      setError('Failed to fetch saved repos');
    } else {
      setSavedRepos(data?.map(item => ({
        id: item.repos.id,
        name: item.repos.name,
        description: item.repos.description,
        list_id: item.list_id,
        url: item.repos.url
      })) || []);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('lists')
        .insert([{ ...newList, user_id: session?.user.id }])
        .select();

      if (error) throw error;

      if (data) {
        setLists([...lists, data[0]]);
        setNewList({ name: '', description: '' });
        console.log('List created successfully:', data[0]);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      setError('Failed to create list. Please try again.');
    }
  };

  const handleMoveRepo = async (repoId: number, newListId: number) => {
    if (newListId === 0) {
      // Remove from list_repos if moving to "Unsorted"
      const { error } = await supabase
        .from('list_repos')
        .delete()
        .eq('repo_id', repoId);
      if (error) {
        console.error('Error removing repo from list:', error);
        setError('Failed to move repo to Unsorted');
      } else {
        setSavedRepos(savedRepos.map(repo => 
          repo.id === repoId ? { ...repo, list_id: null } : repo
        ));
      }
    } else {
      // Update or insert into list_repos
      const { error } = await supabase
        .from('list_repos')
        .upsert({ repo_id: repoId, list_id: newListId })
        .eq('repo_id', repoId);
      if (error) {
        console.error('Error moving repo:', error);
        setError('Failed to move repo');
      } else {
        setSavedRepos(savedRepos.map(repo => 
          repo.id === repoId ? { ...repo, list_id: newListId } : repo
        ));
      }
    }
  };

  const handleRemoveRepo = async (repoId: number) => {
    const isConfirmed = window.confirm("Are you sure you want to remove this repo from your lists?");
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from('list_repos')
        .delete()
        .eq('repo_id', repoId);

      if (error) throw error;

      setSavedRepos(prevRepos => prevRepos.filter(repo => repo.id !== repoId));
    } catch (error) {
      console.error('Error removing repo:', error);
      setError('Failed to remove repo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={() => {}} />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">My Lists</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create New List</h2>
            <form onSubmit={handleCreateList} className="mb-8">
              <input
                type="text"
                placeholder="List Name"
                value={newList.name}
                onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                className="w-full p-2 mb-2 border rounded text-gray-800"
              />
              <input
                type="text"
                placeholder="Description"
                value={newList.description}
                onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                className="w-full p-2 mb-2 border rounded text-gray-800"
              />
              <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Create List</button>
            </form>

            <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Lists</h2>
            <ul>
              {lists.map(list => (
                <li 
                  key={list.id} 
                  className={`p-2 mb-2 cursor-pointer ${selectedList === list.id ? 'bg-blue-100 text-gray-800' : 'hover:bg-gray-200 text-gray-700'}`}
                  onClick={() => setSelectedList(list.id)}
                >
                  {list.name}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              {selectedList === null ? "All Saved Repos" : lists.find(l => l.id === selectedList)?.name || "Saved Repos"}
            </h2>
            {savedRepos
              .filter(repo => selectedList === null || repo.list_id === selectedList)
              .map(repo => (
                <div key={repo.id} className="bg-white p-4 mb-4 rounded shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/repo/${repo.id}`} className="font-semibold text-blue-600 hover:underline">
                        <h3>{repo.name}</h3>
                      </Link>
                      <p className="text-sm text-gray-600">{repo.description}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveRepo(repo.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <select 
                    value={repo.list_id || 0}
                    onChange={(e) => handleMoveRepo(repo.id, parseInt(e.target.value))}
                    className="mt-2 p-1 border rounded text-gray-800"
                  >
                    <option value={0}>Unsorted</option>
                    {lists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
