import XLSX from 'xlsx';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { storage } from './storage';
import { InsertBook } from '@shared/schema';
import { CloudinaryService } from './cloudinaryService';

interface BookRow {
  title?: string;
  author?: string;
  isbn?: string;
  price?: number;
  category?: string;
  condition?: string;
  description?: string;
  publisher?: string;
  publishedYear?: number;
  pages?: number;
  language?: string;
  stock?: number;
  featured?: boolean;
}

interface BookCoverData {
  imageUrl: string;
  source: 'google' | 'openlibrary' | 'fallback';
}

export class BookImporter {
  private static async fetchBookCover(isbn: string): Promise<BookCoverData | null> {
    const cleanISBN = isbn.replace(/[^0-9X]/g, '');
    
    // Try Google Books API first
    try {
      const googleResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
      );
      const googleData = await googleResponse.json();
      
      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0];
        if (book.volumeInfo?.imageLinks?.thumbnail) {
          return {
            imageUrl: book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'),
            source: 'google'
          };
        }
      }
    } catch (error) {
      console.log(`Google Books API failed for ISBN ${isbn}:`, error.message);
    }

    // Try Open Library API
    try {
      const openLibraryResponse = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`
      );
      const openLibraryData = await openLibraryResponse.json();
      
      const bookKey = `ISBN:${cleanISBN}`;
      if (openLibraryData[bookKey]?.cover?.medium) {
        return {
          imageUrl: openLibraryData[bookKey].cover.medium,
          source: 'openlibrary'
        };
      }
    } catch (error) {
      console.log(`Open Library API failed for ISBN ${isbn}:`, error.message);
    }

    // Try alternative Open Library cover URL
    try {
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`;
      const response = await fetch(coverUrl, { method: 'HEAD' });
      if (response.ok) {
        return {
          imageUrl: coverUrl,
          source: 'openlibrary'
        };
      }
    } catch (error) {
      console.log(`Open Library cover direct URL failed for ISBN ${isbn}:`, error.message);
    }

    return null;
  }

  private static async downloadAndSaveImage(imageUrl: string, isbn: string): Promise<string | null> {
    try {
      // Upload directly to Cloudinary from URL for permanent storage
      const uploadResult = await CloudinaryService.uploadFromUrl(
        imageUrl,
        'a2z-bookshop/books',
        `book-${isbn}-${Date.now()}`
      );
      
      console.log(`Image uploaded to Cloudinary for ISBN ${isbn}:`, {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url
      });
      
      return uploadResult.secure_url;
    } catch (error) {
      console.error(`Failed to upload image to Cloudinary for ISBN ${isbn}:`, error);
      return null;
    }
  }

  static async importFromExcel(filePath: string): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Read Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      // Get headers
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      // Get all categories for mapping
      const categories = await storage.getCategories();
      const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // Excel row number (1-indexed + header)

        try {
          // Map row data to book object
          const bookData: BookRow = {};
          headers.forEach((header, index) => {
            const value = row[index];
            const normalizedHeader = header.toLowerCase().trim();
            
            switch (normalizedHeader) {
              case 'title':
              case 'name': // Support for your Excel format
                bookData.title = value?.toString().trim();
                break;
              case 'author':
                bookData.author = value?.toString().trim();
                break;
              case 'isbn':
              case 'item code': // Support for your Excel format
                bookData.isbn = value?.toString().trim();
                break;
              case 'price':
                bookData.price = parseFloat(value) || 0;
                break;
              case 'category':
                bookData.category = value?.toString().trim();
                break;
              case 'condition':
                bookData.condition = value?.toString().trim() || 'Good';
                break;
              case 'description':
                bookData.description = value?.toString().trim();
                break;
              case 'publisher':
                bookData.publisher = value?.toString().trim();
                break;
              case 'published_year':
              case 'year':
                bookData.publishedYear = parseInt(value) || null;
                break;
              case 'pages':
                bookData.pages = parseInt(value) || null;
                break;
              case 'language':
                bookData.language = value?.toString().trim() || 'English';
                break;
              case 'stock':
                bookData.stock = parseInt(value) || 1;
                break;
              case 'featured':
                bookData.featured = Boolean(value) || false;
                break;
            }
          });

          // Validate required fields
          if (!bookData.title) {
            throw new Error(`Row ${rowNumber}: Title is required`);
          }

          // If no author is provided, try to fetch from API using ISBN
          if (!bookData.author && bookData.isbn) {
            try {
              const coverData = await this.fetchBookCover(bookData.isbn);
              if (coverData && coverData.source === 'google') {
                // Try to extract author from Google Books API response
                const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${bookData.isbn}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.items && data.items[0] && data.items[0].volumeInfo) {
                    const volumeInfo = data.items[0].volumeInfo;
                    if (volumeInfo.authors && volumeInfo.authors.length > 0) {
                      bookData.author = volumeInfo.authors.join(', ');
                    }
                    if (volumeInfo.publishedDate) {
                      const year = new Date(volumeInfo.publishedDate).getFullYear();
                      if (!isNaN(year)) {
                        bookData.publishedYear = year;
                      }
                    }
                    if (volumeInfo.publisher) {
                      bookData.publisher = volumeInfo.publisher;
                    }
                    if (volumeInfo.pageCount) {
                      bookData.pages = volumeInfo.pageCount;
                    }
                    if (volumeInfo.description) {
                      bookData.description = volumeInfo.description;
                    }
                  }
                }
              }
            } catch (error) {
              console.log(`Could not fetch additional data for ${bookData.isbn}`);
            }
          }

          // Set defaults for missing fields
          bookData.author = bookData.author || 'Unknown Author';
          bookData.price = bookData.price || 19.99;
          bookData.condition = bookData.condition || 'New';
          bookData.stock = bookData.stock || 10;
          bookData.language = bookData.language || 'English';
          bookData.description = bookData.description || `${bookData.title} - A comprehensive book in our collection.`;

          // Get category ID
          let categoryId = 1; // Default to first category
          if (bookData.category) {
            const foundCategoryId = categoryMap.get(bookData.category.toLowerCase());
            if (foundCategoryId) {
              categoryId = foundCategoryId;
            }
          }

          // Fetch book cover image if ISBN is provided
          let imageUrl = null;
          if (bookData.isbn) {
            console.log(`Fetching cover for ISBN: ${bookData.isbn}`);
            const coverData = await this.fetchBookCover(bookData.isbn);
            if (coverData) {
              console.log(`Found cover from ${coverData.source} for ISBN: ${bookData.isbn}`);
              imageUrl = await this.downloadAndSaveImage(coverData.imageUrl, bookData.isbn);
              if (imageUrl) {
                console.log(`Downloaded and saved cover: ${imageUrl}`);
              }
            } else {
              console.log(`No cover found for ISBN: ${bookData.isbn}`);
            }
          }

          // Create book object
          const insertBook: InsertBook = {
            title: bookData.title,
            author: bookData.author,
            isbn: bookData.isbn || null,
            price: bookData.price.toString(),
            categoryId,
            condition: bookData.condition || 'Good',
            description: bookData.description || null,
            publisher: bookData.publisher || null,
            publishedYear: bookData.publishedYear || null,
            pages: bookData.pages || null,
            language: bookData.language || 'English',
            stock: bookData.stock || 1,
            featured: bookData.featured || false,
            imageUrl: imageUrl || null
          };

          // Save to database
          const createdBook = await storage.createBook(insertBook);
          results.success++;
          
          console.log(`✅ Successfully imported: ${bookData.title} by ${bookData.author}`);
          console.log(`   Book ID: ${createdBook.id}, ISBN: ${bookData.isbn || 'N/A'}, Price: $${bookData.price}`);

        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : `Row ${rowNumber}: Unknown error`;
          results.errors.push(errorMsg);
          console.error(`Failed to import row ${rowNumber}:`, error);
        }
      }

    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error occurred');
      console.error('Import failed:', error);
    }

    return results;
  }
}