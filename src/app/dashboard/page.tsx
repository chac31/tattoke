'use client';

import React, { useState, useEffect } from 'react';
import { generateTattooDesign } from '@/app/actions/replicate';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Login from '@/components/auth/login';
import { uploadImageToStorage } from '@/lib/storage-utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const TATTOO_STYLES = {
  traditional: {
    name: "Traditional American",
    prompt: "bold lines, classic colors, white background, vector ink, Traditional American tattoo of"
  },
  neoTraditional: {
    name: "Neo-Traditional",
    prompt: "bold lines, classic colors, white background, vector ink, Neo-Traditional tattoo of"
  },
  irezumi: {
    name: "Irezumi",
    prompt: "bold lines, classic colors, white background, vector ink, Irezumi tattoo of"
  }
};

interface GeneratedImage {
  id: string;
  user_id: string;
  url: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

// Update color scheme constants
const COLORS = {
  primary: '#FFD700', // Golden yellow
  primaryDark: '#B8860B', // Dark golden
  background: '#0A0A0A', // Very dark background
  card: '#141414', // Slightly lighter dark for cards
  border: '#FFD70020', // Semi-transparent golden
  text: '#E5E5E5', // Light text
  textDim: '#808080', // Dimmed text
};

// Add bubble animation styles
const bubbleStyle = `
  @keyframes float {
    0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0; }
    50% { opacity: 0.3; }
    100% { transform: translateY(-100vh) translateX(20px) rotate(360deg); opacity: 0; }
  }

  .bubble {
    position: fixed;
    background: radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
  }
`;

function Bubbles() {
  const bubbles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    left: Math.random() * 100,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <>
      <style>{bubbleStyle}</style>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            width: bubble.size + 'px',
            height: bubble.size + 'px',
            left: bubble.left + '%',
            bottom: '-100px',
            animation: `float ${bubble.duration}s linear ${bubble.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

interface DesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: GeneratedImage;
  onUseDesign: (url: string) => void;
}

function getTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now.getTime() - past.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 0) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
}

function DesignModal({ isOpen, onClose, image, onUseDesign }: DesignModalProps) {
  if (!isOpen) return null;

  // Extract user's prompt by removing the style prefix
  const userPrompt = image.prompt.replace(/bold lines, classic colors, white background, vector ink, (?:Traditional American|Neo-Traditional|Irezumi) tattoo of /, '');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-2xl max-w-2xl w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#808080] hover:text-[#FFD700] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="relative">
              <img
                src={image.url}
                alt={userPrompt}
                className="w-full aspect-square object-contain rounded-xl"
              />
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors group"
                title="View Full Screen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white group-hover:text-[#FFD700] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </a>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-bold mb-4">Design Details</h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#808080] mb-2">Prompt</h4>
              <p className="text-[#E5E5E5]">{userPrompt}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[#808080] mb-2">Created</h4>
              <p className="text-[#E5E5E5]">
                {getTimeAgo(image.created_at)}
              </p>
            </div>

            <div className="mt-auto space-y-3">
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-2 bg-[#FFD700]/10 text-[#FFD700] rounded-xl hover:bg-[#FFD700]/20 transition-colors text-center"
              >
                View Full Screen
              </a>
              <a
                href={image.url}
                download={`tattoo-${new Date(image.created_at).toISOString()}.png`}
                className="block w-full px-4 py-2 bg-[#141414] text-[#808080] rounded-xl hover:bg-[#1A1A1A] transition-colors text-center border border-[#FFD700]/10"
              >
                Download Design
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('traditional');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Clean up URL hash on page load and navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove hash on page load
      window.history.replaceState({}, '', window.location.pathname);

      // Listen for hashchange and remove hash
      const handleHashChange = () => {
        if (window.location.hash) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      };

      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

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
  }, [user?.id]);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show/hide scroll to top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const userPrompt = formData.get('prompt') as string;
    
    if (!userPrompt) {
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
      const style = TATTOO_STYLES[selectedStyle as keyof typeof TATTOO_STYLES];
      const fullPrompt = `${style.prompt} ${userPrompt}`;
      console.log('Starting image generation with prompt:', fullPrompt);
      const generatedImageUrl = await generateTattooDesign(userPrompt, selectedStyle as keyof typeof TATTOO_STYLES);
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
          prompt: fullPrompt
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
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please try again.');
      if (!currentImage) {
        setCurrentImage(null);
      }
    } finally {
      setLoading(false);
    }
  }

  // Modify the sign out handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Remove any hash before redirecting
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // If auth is loading, show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FFD700] border-t-transparent"></div>
      </div>
    );
  }

  // If no user is logged in, redirect to landing page
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] relative overflow-hidden">
      <Bubbles />
      
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 bg-[#FFD700] text-[#0A0A0A] rounded-full p-3 shadow-lg hover:bg-[#B8860B] transition-all transform hover:scale-110 z-50 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-lg border-b border-[#FFD700]/10 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={scrollToTop}
                className="text-3xl font-black tracking-tight flex items-center hover:opacity-80 transition-opacity"
              >
                <span className="text-[#FFD700] mr-1">TATTO</span>
                <span className="relative">
                  <span className="text-[#E5E5E5]">KE</span>
                  <span className="absolute -top-1 -right-6 text-xs bg-[#FFD700] text-[#0A0A0A] px-1.5 py-0.5 rounded-sm font-bold transform -rotate-12">
                    AI
                  </span>
                </span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#808080]">{user?.email}</span>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-[#FFD700]/10 text-[#FFD700] rounded-full hover:bg-[#FFD700]/20 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-24 px-4 container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-[#FFD700] to-[#B8860B] text-transparent bg-clip-text">
            AI Tattoo Generation
          </h1>
          <p className="text-lg text-[#808080] max-w-2xl mx-auto">
            Transform your ideas into stunning tattoo designs with AI.
            Visualize your perfect tattoo before making it permanent.
          </p>
        </div>

        {/* Style Selector and Input Form */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {Object.entries(TATTOO_STYLES).map(([key, style]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedStyle(key)}
                    className={`cursor-pointer rounded-xl p-3 transition-all ${
                      selectedStyle === key
                        ? 'bg-[#FFD700]/10 border-2 border-[#FFD700]'
                        : 'bg-[#141414] border border-[#FFD700]/10 hover:bg-[#141414]/80'
                    }`}
                  >
                    <h3 className="font-medium mb-2 text-center text-sm">{style.name}</h3>
                    <p className="text-xs text-[#808080] text-center leading-tight">
                      {key === 'traditional' && "Bold outlines, limited colors, classic American symbols"}
                      {key === 'neoTraditional' && "Modern take on traditional, detailed shading, expanded color palette"}
                      {key === 'irezumi' && "Japanese style, flowing designs, mythological themes"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                name="prompt"
                className="w-full bg-[#141414] border border-[#FFD700]/10 rounded-2xl px-6 py-4 pr-32 text-[#E5E5E5] placeholder-[#808080] focus:outline-none focus:border-[#FFD700]/30"
                placeholder="Describe your tattoo idea..."
                required
              />
              <button
                type="submit"
                disabled={loading}
                className={`absolute right-2 top-2 px-6 py-2 bg-[#FFD700]/10 text-[#FFD700] rounded-xl font-medium transition-colors
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FFD700]/20'}`}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="mb-16">
          {loading ? (
            <div className="bg-[#141414] border border-[#FFD700]/10 rounded-2xl p-8 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FFD700] border-t-transparent"></div>
              <p className="mt-4 text-[#808080]">Creating your masterpiece...</p>
            </div>
          ) : currentImage ? (
            <div className="bg-[#141414] border border-[#FFD700]/10 rounded-2xl p-6">
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
                  className="text-[#FFD700] hover:text-[#B8860B] text-sm"
                >
                  Download Design
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* History Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Designs</h2>
            {history.length > 3 && (
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="text-[#FFD700] hover:text-[#B8860B] text-sm"
              >
                {historyOpen ? 'Show Less' : 'View All'}
              </button>
            )}
          </div>

          {historyLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FFD700] border-t-transparent mx-auto"></div>
            </div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.slice(0, historyOpen ? undefined : 3).map((img) => {
                // Extract user's prompt by removing the style prefix
                const userPrompt = img.prompt.replace(/bold lines, classic colors, white background, vector ink, (?:Traditional American|Neo-Traditional|Irezumi) tattoo of /, '');
                
                return (
                  <div
                    key={img.id}
                    className="bg-[#141414] border border-[#FFD700]/10 rounded-xl p-4 flex flex-col h-[420px]"
                  >
                    <div className="relative aspect-square mb-4 flex-shrink-0">
                      <img
                        src={img.url}
                        alt={userPrompt}
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          console.error('Error loading history image:', img.url);
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAyNEgwVjBoMjR2MjR6Ii8+PC9zdmc+';
                        }}
                      />
                    </div>
                    <div className="flex flex-col flex-grow">
                      <p className="text-[#E5E5E5] text-sm mb-2 line-clamp-2">{userPrompt}</p>
                      <p className="text-xs text-[#808080]">
                        {getTimeAgo(img.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setSelectedImage(img)}
                        className="flex-1 px-3 py-1.5 bg-[#FFD700]/10 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/20 transition-colors text-sm"
                      >
                        Use Design
                      </button>
                      <a
                        href={img.url}
                        download={`tattoo-${new Date(img.created_at).toISOString()}.png`}
                        className="flex-1 px-3 py-1.5 bg-[#141414] text-[#808080] rounded-lg hover:bg-[#1A1A1A] transition-colors text-sm text-center"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#141414] border border-[#FFD700]/10 rounded-xl">
              <p className="text-[#808080]">No designs generated yet. Create your first one!</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <DesignModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        image={selectedImage!}
        onUseDesign={setCurrentImage}
      />
    </div>
  );
} 