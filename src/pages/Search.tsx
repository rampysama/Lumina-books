import React, { useState } from 'react';
import { Search as SearchIcon, Loader2, Sparkles } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { Book } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'books'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const allBooks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Book[];
      
      const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.genre.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(filtered);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-serif font-bold text-sepia-900">The Archives</h1>
        <p className="text-xl text-sepia-800/60 font-serif italic">Search through your personal collection of digital volumes.</p>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mb-20 max-w-3xl">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or genre..."
            className="w-full rounded-lg border-2 border-sepia-200 bg-white px-8 py-5 pl-16 text-lg shadow-sm transition-all focus:border-book-green focus:outline-none focus:ring-4 focus:ring-sepia-100 font-serif"
          />
          <SearchIcon className="absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-sepia-300" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-book-green px-8 py-2.5 font-bold text-white transition-all hover:bg-opacity-90 disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : !loading && searchQuery && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Sparkles className="mb-6 h-16 w-16 text-sepia-200" />
          <h3 className="text-2xl font-serif font-bold text-sepia-900">No volumes found</h3>
          <p className="text-sepia-800/60 font-serif italic">The archives do not seem to contain that particular title.</p>
        </div>
      )}
    </div>
  );
}
