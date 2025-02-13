'use client';

import React, { useState } from 'react';
import { generateTattooDesign } from './actions/replicate';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const prompt = formData.get('prompt') as string;

    if (!prompt) return;

    setLoading(true);
    setError(null);

    try {
      const generatedImageUrl = await generateTattooDesign(prompt);
      setImageUrl(generatedImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-2">AI Image Generator</h1>
        <p className="text-center text-gray-600 mb-8">Create beautiful images with Flux AI</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Enter your prompt</p>
            <input
              type="text"
              name="prompt"
              placeholder="A serene landscape with mountains and a lake at sunset..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            {loading ? 'Generating...' : 'Generate Image'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-center">
            {error}
          </div>
        )}

        {imageUrl && (
          <div className="mt-8">
            <img
              src={imageUrl}
              alt="Generated image"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
} 