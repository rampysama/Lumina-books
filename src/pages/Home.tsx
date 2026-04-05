import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, BookOpen, Users, TrendingUp, Library } from 'lucide-react';
import { getPersonalizedRecommendations } from '../lib/gemini';
import { BookCard } from '../components/BookCard';
import { Book } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, getDocFromServer, doc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export function Home() {
  const [user] = useAuthState(auth);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Test connection on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  const addSampleBook = async () => {
    if (!user) return;
    const path = 'books';
    try {
      await addDoc(collection(db, path), {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        description: "A classic novel about the American Dream in the 1920s, exploring themes of wealth, class, and unrequited love.",
        thumbnail: "https://picsum.photos/seed/gatsby/400/600",
        rating: 4.5,
        reviewCount: 128,
        userId: user.uid,
        createdAt: serverTimestamp(),
        pageCount: 180,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  useEffect(() => {
    if (!user) {
      setMyBooks([]);
      setIsInitializing(false);
      return;
    }

    const path = 'books';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setMyBooks(books);
      setIsInitializing(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  // Auto-add sample book if library is empty on first load
  useEffect(() => {
    if (!isInitializing && user && myBooks.length === 0) {
      // Only add if we've confirmed it's empty and not just loading
      // We use a small delay to ensure it's truly empty
      const timer = setTimeout(() => {
        if (myBooks.length === 0) {
          addSampleBook();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, user, myBooks.length]);

  useEffect(() => {
    if (myBooks.length === 0) return;

    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        const history = myBooks.slice(0, 3).map(b => b.title);
        const genres = Array.from(new Set(myBooks.map(b => b.genre)));
        const recs = await getPersonalizedRecommendations(history, genres);
        setRecommendations(recs);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [myBooks.length]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-sepia-900 py-24 text-sepia-50">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-book-green blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-book-red blur-3xl" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-30" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-5xl font-serif font-bold tracking-tight sm:text-7xl"
          >
            Your Personal <span className="text-sepia-300 italic">Sanctuary</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mb-12 max-w-2xl text-xl text-sepia-200 font-serif italic"
          >
            "A room without books is like a body without a soul." — Cicero
          </motion.p>
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-md bg-sepia-100 px-10 py-4 text-lg font-bold text-sepia-900 shadow-xl transition-all hover:scale-105 hover:bg-white"
            >
              Enter the Library
            </button>
            <Link 
              to="/upload"
              className="rounded-md border-2 border-sepia-100 px-10 py-4 text-lg font-bold text-sepia-100 transition-colors hover:bg-sepia-100 hover:text-sepia-900"
            >
              Add New Volume
            </Link>
          </div>
        </div>
      </section>

      {/* My Catalogue */}
      <section id="catalogue" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between border-b border-sepia-200 pb-4">
          <div className="flex items-center gap-3">
            <Library className="h-8 w-8 text-book-green" />
            <h2 className="text-3xl font-serif font-bold text-sepia-900">The Collection</h2>
          </div>
          <span className="text-sm font-serif italic text-sepia-800/60">{myBooks.length} Volumes Cataloged</span>
        </div>
        
        {myBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {myBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sepia-200 bg-white/50 py-24 text-center">
            <BookOpen className="mb-6 h-16 w-16 text-sepia-200" />
            <h3 className="text-2xl font-serif font-bold text-sepia-900">The shelves are waiting...</h3>
            <p className="mb-8 max-w-md text-sepia-800/60 font-serif italic">Your personal AI-powered library begins with your first upload. Let Lumina organize your digital sanctuary.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/upload" className="rounded-md bg-book-green px-8 py-3 font-bold text-white shadow-lg hover:bg-opacity-90 transition-all">
                Upload First Volume
              </Link>
              <button 
                onClick={addSampleBook}
                className="rounded-md border-2 border-book-green px-8 py-3 font-bold text-book-green hover:bg-book-green hover:text-white transition-all"
              >
                Add Sample Book
              </button>
            </div>
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      {myBooks.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-center gap-3 border-b border-sepia-200 pb-4">
            <Sparkles className="h-8 w-8 text-amber-600" />
            <h2 className="text-3xl font-serif font-bold text-sepia-900">Curated for You</h2>
          </div>
          
          {loadingRecs ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl bg-sepia-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative rounded-xl border border-sepia-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="absolute -left-1 top-4 h-12 w-2 bg-book-red rounded-r-sm" />
                  <h3 className="mb-2 font-serif text-xl font-bold text-sepia-900 group-hover:text-book-red transition-colors">{rec.title}</h3>
                  <p className="mb-4 text-sm font-bold text-sepia-800/60 uppercase tracking-widest">{rec.author}</p>
                  <p className="text-base leading-relaxed text-sepia-800 italic font-serif">"{rec.reason}"</p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Community Stats */}
      <section className="bg-sepia-100/50 py-20 border-y border-sepia-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-white p-5 text-book-green shadow-sm">
                <BookOpen className="h-10 w-10" />
              </div>
              <div className="text-4xl font-serif font-bold text-sepia-900">1.2M+</div>
              <div className="text-sepia-800/60 font-serif italic">Volumes in the Great Library</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-white p-5 text-book-green shadow-sm">
                <Users className="h-10 w-10" />
              </div>
              <div className="text-4xl font-serif font-bold text-sepia-900">500K+</div>
              <div className="text-sepia-800/60 font-serif italic">Fellow Bibliophiles</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 rounded-full bg-white p-5 text-book-green shadow-sm">
                <Sparkles className="h-10 w-10" />
              </div>
              <div className="text-4xl font-serif font-bold text-sepia-900">10M+</div>
              <div className="text-sepia-800/60 font-serif italic">AI-Curated Journeys</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
