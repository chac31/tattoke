'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateTattooDesign(prompt: string) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  try {
    // Combine the required prompt with user's input and add safe content modifiers
    const fullPrompt = `A fresh ink TOK tattoo design, safe for work, ${prompt}`;
    const negativePrompt = "nsfw, nude, explicit content, violence, gore, blood, blurry, low quality, text, watermark, ugly, deformed, distorted";
    
    console.log('Starting image generation with prompt:', fullPrompt);
    
    const output = await replicate.run(
      "fofr/sdxl-fresh-ink:8515c238222fa529763ec99b4ba1fa9d32ab5d6ebc82b4281de99e4dbdcec943",
      {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25,
          safety_checker: true
        }
      }
    );

    console.log('Replicate API response:', output);

    // The model returns an array of image URLs
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
    
    console.error('No image in output:', output);
    throw new Error('No image was generated');
  } catch (error) {
    console.error("Generation failed:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error('Failed to generate image. Please try again.');
  }
} 