'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../supabase-provider';

export default function ConfirmEmail() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get the access_token and refresh_token from the URL
        const accessToken = new URLSearchParams(window.location.hash.slice(1)).get('access_token');
        const refreshToken = new URLSearchParams(window.location.hash.slice(1)).get('refresh_token');

        if (!accessToken || !refreshToken) {
          setMessage('Invalid confirmation link.');
          return;
        }

        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setMessage('Email confirmed successfully. Redirecting...');
          // Redirect to the home page or dashboard
          setTimeout(() => router.push('/'), 2000);
        } else {
          setMessage('Failed to confirm email. Please try signing in manually.');
        }
      } catch (error) {
        console.error('Error confirming email:', error);
        setMessage('An error occurred while confirming your email. Please try again.');
      }
    };

    confirmEmail();
  }, [supabase, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}
