'use server';

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateTattooDesign(prompt: string) {
  try {
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: prompt,
          negative_prompt: "blurry, low quality, text, watermark",
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25
        }
      }
    );
    return output[0];
  } catch (error) {
    console.error("Generation failed:", error);
    throw new Error("Failed to generate image");
  }
} 