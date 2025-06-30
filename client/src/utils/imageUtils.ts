// Comprehensive image URL handling utility for A2Z BOOKSHOP
// Fixes recurring image display issues

export const getImageSrc = (imageUrl: string | null | undefined): string => {
  // Fallback placeholder for missing images
  const placeholder = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  
  if (!imageUrl || imageUrl.trim() === '') {
    return placeholder;
  }

  const cleanUrl = imageUrl.trim();

  // If it's already a working external URL (not a2zbookshop.com), return as-is
  if (cleanUrl.startsWith('https://images.unsplash.com/') || 
      cleanUrl.startsWith('https://covers.openlibrary.org/') ||
      cleanUrl.startsWith('https://books.google.com/')) {
    return cleanUrl;
  }

  // Fix a2zbookshop.com URLs by converting them to relative paths
  if (cleanUrl.includes('a2zbookshop.com/uploads/images/')) {
    const filename = cleanUrl.split('/uploads/images/')[1];
    if (filename) {
      return `/uploads/images/${filename}`;
    }
  }

  // If it's already a correct relative path, return as-is
  if (cleanUrl.startsWith('/uploads/images/')) {
    return cleanUrl;
  }

  // If it contains uploads/images anywhere, extract the filename
  if (cleanUrl.includes('/uploads/images/')) {
    const parts = cleanUrl.split('/uploads/images/');
    const filename = parts[parts.length - 1];
    if (filename) {
      return `/uploads/images/${filename}`;
    }
  }

  // If it's just a filename, prepend the uploads path
  if (!cleanUrl.includes('/') && (cleanUrl.includes('.jpg') || cleanUrl.includes('.jpeg') || cleanUrl.includes('.png'))) {
    return `/uploads/images/${cleanUrl}`;
  }

  // For any other case, try to extract filename and prepend uploads path
  const filename = cleanUrl.split('/').pop();
  if (filename && (filename.includes('.jpg') || filename.includes('.jpeg') || filename.includes('.png'))) {
    return `/uploads/images/${filename}`;
  }

  // If nothing works, return placeholder
  return placeholder;
};

// Error handler for image loading failures
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  const placeholder = 'https://via.placeholder.com/300x400/f0f0f0/666?text=No+Image';
  
  if (target.src !== placeholder) {
    target.src = placeholder;
  }
};