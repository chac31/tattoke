'use client';

import React, { useState, useEffect } from 'react';
import { generateTattooDesign } from '@/app/actions/replicate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Login from '@/components/auth/login';
import { uploadImageToStorage } from '@/lib/storage-utils';
import Image from 'next/image';

interface GeneratedImage {
  id: string;
  user_id: string;
  url: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    async function initializeHistory() {
      if (!user?.id) return;
      
      try {
        setHistoryLoading(true);
        setError(null);
        console.log('Loading history for user:', user.id);
        
        const { data, error: supabaseError } = await supabase
          .from('generated_images')
          .select('*')
          .eq('user_id', user.id.toString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw supabaseError;
        }

        console.log('Loaded history:', data);
        setHistory(data || []);
      } catch (err) {
        console.error('Error loading history:', err);
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }

    initializeHistory();
  }, [user?.id]); // Only re-run when user ID changes

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const prompt = formData.get('prompt') as string;
    
    if (!prompt) {
      setError('Please enter a prompt');
      return;
    }
    
    if (!user?.id) {
      setError('Please sign in to generate images');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentImage(null);

    try {
      console.log('Starting image generation with prompt:', prompt);
      const generatedImageUrl = await generateTattooDesign(prompt);
      console.log('Generated image URL:', generatedImageUrl);
      
      if (!generatedImageUrl) {
        throw new Error('No image URL received from the generation service');
      }

      // Upload to Supabase Storage
      console.log('Uploading to Supabase Storage...');
      const storedImageUrl = await uploadImageToStorage(generatedImageUrl, user.id.toString());
      console.log('Stored image URL:', storedImageUrl);

      setCurrentImage(storedImageUrl);
      
      // Save to Supabase database
      console.log('Saving to database with user ID:', user.id.toString());
      const { data: savedImage, error: saveError } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id.toString(),
          url: storedImageUrl,
          prompt: prompt
        })
        .select('*')
        .single();

      if (saveError) {
        console.error('Error saving to database:', saveError);
        throw new Error(`Database save failed: ${saveError.message}`);
      }

      console.log('Saved to database:', savedImage);

      // Update the history with the new image
      if (savedImage) {
        setHistory(prev => [savedImage, ...prev]);
        form.reset();
      } else {
        throw new Error('No data returned from database insert');
      }

    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
      // Don't clear currentImage if storage upload succeeded but database save failed
      if (!currentImage) {
        setCurrentImage(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // If auth is loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent"></div>
      </div>
    );
  }

  // If no user is logged in, show login page
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
          Welcome to AI Tattoo Generator
        </h1>
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-black/50 backdrop-blur-lg border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                <span className="text-blue-400">Tatto</span>
                <span>ke</span>
                <span className="ml-2 text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded-full">AI</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="px-4 py-2 bg-blue-400/20 text-blue-400 rounded-full hover:bg-blue-400/30 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-4 container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            AI Tattoo Generation
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Transform your ideas into stunning tattoo designs with AI.
            Visualize your perfect tattoo before making it permanent.
          </p>
        </div>

        {/* Input Form */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              name="prompt"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-32 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
              placeholder="Describe your tattoo idea..."
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`absolute right-2 top-2 px-6 py-2 bg-blue-400/20 text-blue-400 rounded-xl font-medium transition-colors
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-400/30'}`}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="mb-24">
          {loading ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-transparent"></div>
              <p className="mt-4 text-gray-400">Creating your masterpiece...</p>
            </div>
          ) : currentImage ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="relative w-full aspect-square">
                <img
                  src={currentImage}
                  alt="Generated tattoo"
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    console.error('Error loading image:', currentImage);
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    setError('Failed to load image. Please try again.');
                  }}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={currentImage}
                  download="tattoo-design.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Download Design
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* History Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Previous Designs</h2>
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="px-4 py-2 bg-blue-400/20 text-blue-400 rounded-xl hover:bg-blue-400/30 transition-colors text-sm"
            >
              {historyOpen ? 'Hide History' : 'Show All'}
            </button>
          </div>
          
          {historyLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-white/10 rounded-lg mb-4"></div>
                  <div className="h-4 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, historyOpen ? undefined : 3).map((img) => (
                <div
                  key={img.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col"
                >
                  <div className="relative aspect-square mb-4">
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        console.error('Error loading history image:', img.url);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNEgwVjBoMjR2MjR6Ii8+PC9zdmc+';
                      }}
                    />
                  </div>
                  <p className="text-gray-300 text-sm mb-2 line-clamp-2">{img.prompt}</p>
                  <p className="text-xs text-gray-600 mb-3">
                    {new Date(img.created_at).toLocaleDateString()} at{' '}
                    {new Date(img.created_at).toLocaleTimeString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentImage(img.url)}
                      className="flex-1 px-3 py-1.5 bg-blue-400/20 text-blue-400 rounded-lg hover:bg-blue-400/30 transition-colors text-sm"
                    >
                      Use Design
                    </button>
                    <a
                      href={img.url}
                      download={`tattoo-${new Date(img.created_at).toISOString()}.png`}
                      className="flex-1 px-3 py-1.5 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors text-sm text-center"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-gray-400">No designs generated yet. Create your first one!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
