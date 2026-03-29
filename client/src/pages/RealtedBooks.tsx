import BookCarousel from "@/components/BookCarousel";
import { Book } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

function RelatedBooks({
  currentBookId,
  categoryId,
  author,
}: {
  currentBookId: number;
  categoryId: number | null | undefined;
  author: string;
}) {
  // Fetch books from the same category
  const { data: byCategoryData, isLoading: catLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books", "related-category", categoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "12" });
      if (categoryId) params.set("categoryId", String(categoryId));
      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch books by the same author (via search)
  const { data: byAuthorData, isLoading: authorLoading } = useQuery<{ books: Book[]; total: number }>({
    queryKey: ["/api/books", "related-author", author],
    queryFn: async () => {
      const params = new URLSearchParams({ search: author, limit: "12" });
      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!author,
    staleTime: 5 * 60 * 1000,
  });

  const relatedByCategory = (byCategoryData?.books ?? []).filter((b) => b.id !== currentBookId);
  const relatedByAuthor = (byAuthorData?.books ?? []).filter((b) => b.id !== currentBookId);

  if (!catLoading && !authorLoading && relatedByCategory.length === 0 && relatedByAuthor.length === 0) {
    return null;
  }

  return (
    <div className="">
      {/* More by same category */}
      {(catLoading || relatedByCategory.length > 0) && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-base-black mb-4">More in this Category</h2>
          <BookCarousel books={relatedByCategory} isLoading={catLoading} showEmptyBrowseButton={false} />
        </section>
      )}

      {/* More by same author */}
      {(authorLoading || relatedByAuthor.length > 0) && (
        <section>
          <h2 className="text-xl font-bold text-base-black mb-4">More by {author}</h2>
          <BookCarousel books={relatedByAuthor} isLoading={authorLoading} showEmptyBrowseButton={false} />
        </section>
      )}
    </div>
  );
}

export default RelatedBooks;