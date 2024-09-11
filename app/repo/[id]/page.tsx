"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import ReviewSection from '../../components/ReviewSection';
import { useSupabase } from '../../supabase-provider';

// Remove the createClient import and supabase initialization

interface Repo {
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

export default function RepoPage() {
  const { supabase } = useSupabase();
  const params = useParams();
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepo = async () => {
      setLoading(true);
      setError(null);
      const id = params?.id;
      if (!id || Array.isArray(id)) {
        setError('Invalid repo ID');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('repos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setRepo(data);
      } catch (err) {
        setError('Error fetching repo');
        console.error('Error fetching repo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepo();
  }, [params?.id, supabase]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
  };

  if (loading) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} /><div>Loading...</div></div>;
  if (error) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} /><div>Error: {error}</div></div>;
  if (!repo) return <div className="min-h-screen bg-gray-100"><Navbar onSearch={handleSearch} /><div>Repo not found</div></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onSearch={handleSearch} />
      <div className="max-w-5xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <Image src={repo.icon} alt={repo.name} width={50} height={50} className="rounded-md mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{repo.name}</h1>
              <p className="text-gray-600">{repo.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full mr-2">
                {repo.type}
              </span>
              {Array.isArray(repo.tags) && repo.tags.length > 0 ? (
                repo.tags.map((tag, index) => (
                  <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tags available</span>
              )}
            </div>
            <div className="flex items-center">
              {repo.rating !== null ? (
                <>
                  <span className="text-2xl font-bold text-gray-800 mr-2">{repo.rating.toFixed(1)}</span>
                  <span className="text-yellow-400">★</span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No rating available</span>
              )}
            </div>
          </div>
          <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-4 block">
            View on {repo.type}
          </a>
        </div>

        {/* Review section */}
        {repo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <ReviewSection repoId={repo.id} />
          </div>
        )}

        {/* Temporarily comment out UsageGraph */}
        {/* {repo && <UsageGraph repoId={repo.id} />} */}
      </div>
    </div>
  );
}
