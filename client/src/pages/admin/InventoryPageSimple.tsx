import React from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book } from "@/types";

interface BooksResponse {
  books: Book[];
  total: number;
}

export default function InventoryPageSimple() {
  console.log('Simple inventory page loading...');

  const { data: booksResponse, isLoading, error } = useQuery<BooksResponse>({
    queryKey: ["/api/books"],
    retry: false,
  });

  console.log('Query result:', { isLoading, error, booksResponse });

  const books = booksResponse?.books || [];
  const totalBooks = booksResponse?.total || 0;

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bookerly font-bold text-base-black mb-6">
          Inventory Management (Simple Test)
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Books ({totalBooks})</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-red-600 p-4">
                Error: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            )}
            
            {isLoading && (
              <div className="p-4">Loading books...</div>
            )}

            {!isLoading && !error && books.length === 0 && (
              <div className="p-4 text-gray-500">No books found</div>
            )}

            {!isLoading && !error && books.length > 0 && (
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.id} className="border p-4 rounded">
                    <h3 className="font-semibold">{book.title}</h3>
                    <p className="text-gray-600">{book.author}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge>{book.condition}</Badge>
                      {book.binding && <Badge variant="outline">{book.binding}</Badge>}
                      <Badge variant="secondary">${book.price}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}