import { supabase } from './supabase';

export async function uploadImageToStorage(imageUrl: string, userId: string): Promise<string> {
  try {
    console.log('Starting upload process for:', imageUrl);
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch the image
    console.log('Fetching image from URL...');
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Generate a unique filename with user ID in path
    const timestamp = Date.now();
    const filename = `${userId}/${timestamp}.png`;

    console.log('Uploading to Supabase Storage:', {
      bucket: 'tattogenerator',
      filename,
      size: blob.size
    });

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('tattogenerator')
      .upload(filename, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    if (!data?.path) {
      throw new Error('Upload successful but no path returned');
    }

    // Get the public URL directly
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tattogenerator/${data.path}`;
    
    console.log('Upload complete:', {
      path: data.path,
      publicUrl: publicUrl
    });

    return publicUrl;
  } catch (error) {
    console.error('Detailed upload error:', error);
    if (error instanceof Error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    throw new Error('Failed to upload image to storage');
  }
}

export async function listUserImages(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('tattogenerator')
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw error;
    }

    return data.map(file => {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tattogenerator/${userId}/${file.name}`;
    });
  } catch (error) {
    console.error('Error listing images:', error);
    return [];
  }
} 