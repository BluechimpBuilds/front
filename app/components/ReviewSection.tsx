'use client'

import { useState, useEffect } from 'react';
import { useSupabase } from '../supabase-provider';

interface Review {
  id: number;
  user_id: string;
  repo_id: number;
  rating: number;
  content: string;
  created_at: string;
}

interface ReviewSectionProps {
  repoId: number;
}

export default function ReviewSection({ repoId }: ReviewSectionProps) {
  const { supabase } = useSupabase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ rating: 0, content: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, [repoId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('repo_id', repoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a review');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            repo_id: repoId,
            user_id: user.id,
            rating: newReview.rating,
            content: newReview.content,
          },
        ])
        .select();

      if (error) throw error;
      
      setNewReview({ rating: 0, content: '' });
      setIsModalOpen(false);
      fetchReviews();
      alert('Review submitted successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review');
      alert('Failed to submit review. Please try again.');
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Reviews</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Leave Review
        </button>
      </div>

      {loading && <div>Loading reviews...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <div>
          {reviews.length === 0 ? (
            <p>No reviews yet. Be the first to leave a review!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">User ID: {review.user_id}</span>
                  <div>
                    <span className="text-yellow-400">{`★`.repeat(review.rating)}</span>
                    <span className="text-gray-400">{`★`.repeat(5 - review.rating)}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.content}</p>
                <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Leave a Review</h3>
              <form onSubmit={handleSubmitReview} className="mt-2 text-left">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
                    Rating
                  </label>
                  <select
                    id="rating"
                    value={newReview.rating}
                    onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="0">Select a rating</option>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} star{num !== 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                    Review
                  </label>
                  <textarea
                    id="content"
                    value={newReview.content}
                    onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows={4}
                  ></textarea>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Submit Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
