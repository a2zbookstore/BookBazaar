import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
const cloudConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
};

console.log('Cloudinary config check:', {
  cloud_name: cloudConfig.cloud_name ? `${cloudConfig.cloud_name.substring(0, 5)}...` : 'missing',
  api_key: cloudConfig.api_key ? `${cloudConfig.api_key.substring(0, 5)}...` : 'missing',
  api_secret: cloudConfig.api_secret ? 'present' : 'missing'
});

cloudinary.config(cloudConfig);

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Upload an image buffer to Cloudinary
   * @param buffer - Image buffer
   * @param folder - Cloudinary folder (optional)
   * @param public_id - Custom public ID (optional)
   * @returns Upload result with secure URL
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'a2z-bookshop/books',
    public_id?: string
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };

      if (public_id) {
        uploadOptions.public_id = public_id;
      }

      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      ).end(buffer);
    });
  }

  /**
   * Upload image from URL to Cloudinary
   * @param imageUrl - URL of the image to upload
   * @param folder - Cloudinary folder (optional)
   * @param public_id - Custom public ID (optional)
   * @returns Upload result with secure URL
   */
  static async uploadFromUrl(
    imageUrl: string,
    folder: string = 'a2z-bookshop/books',
    public_id?: string
  ): Promise<CloudinaryUploadResult> {
    try {
      const uploadOptions: any = {
        folder,
        resource_type: 'image',
        format: 'jpg',
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      };

      if (public_id) {
        uploadOptions.public_id = public_id;
      }

      const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);
      
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      console.error('Cloudinary URL upload error:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param public_id - The public ID of the image to delete
   * @returns Deletion result
   */
  static async deleteImage(public_id: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(public_id);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Get optimized URL for an image
   * @param public_id - The public ID of the image
   * @param width - Desired width (optional)
   * @param height - Desired height (optional)
   * @returns Optimized image URL
   */
  static getOptimizedUrl(
    public_id: string,
    width?: number,
    height?: number
  ): string {
    const transformations: any[] = [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ];

    if (width || height) {
      transformations.push({
        width,
        height,
        crop: 'fill',
        gravity: 'center'
      });
    }

    return cloudinary.url(public_id, {
      transformation: transformations,
      secure: true
    });
  }

  /**
   * Test Cloudinary connection
   * @returns Promise that resolves if connection is successful
   */
  static async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      console.log('Cloudinary connection successful');
      return true;
    } catch (error) {
      console.error('Cloudinary connection failed:', error);
      return false;
    }
  }
}

export default CloudinaryService;