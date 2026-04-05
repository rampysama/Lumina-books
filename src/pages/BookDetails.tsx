import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, MessageSquare, Share2, Bookmark, ArrowLeft, Send, FileText, Loader2, Download } from 'lucide-react';
import { Book, Review } from '../types';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      setLoading(true);
      const path = `books/${id}`;
      try {
        const docRef = doc(db, 'books', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() } as Book);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();

    const reviewsPath = 'reviews';
    const q = query(
      collection(db, reviewsPath), 
      where('bookId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(revs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, reviewsPath);
    });

    return () => unsubscribe();
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !auth.currentUser || !id) return;

    setSubmitting(true);
    const reviewsPath = 'reviews';
    try {
      await addDoc(collection(db, reviewsPath), {
        bookId: id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous Reader',
        userPhoto: auth.currentUser.photoURL || '',
        rating,
        comment: newReview,
        createdAt: serverTimestamp(),
      });
      setNewReview('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, reviewsPath);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-book-green" />
    </div>
  );
  
  if (!book) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h2 className="text-3xl font-serif font-bold text-sepia-900">Volume not found</h2>
      <p className="mt-4 text-sepia-800/60 font-serif italic">This particular manuscript seems to have vanished from our records.</p>
      <Link to="/" className="mt-8 inline-block text-book-green font-bold underline underline-offset-4">Return to Library</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <button 
        onClick={() => navigate(-1)}
        className="mb-12 flex items-center gap-3 text-sepia-800/60 hover:text-book-green transition-colors font-serif italic"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Return to the Archives</span>
      </button>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        {/* Left: Book Cover & Actions */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="aspect-[2/3] overflow-hidden rounded-lg bg-sepia-100 shadow-2xl ring-8 ring-sepia-50"
            >
              <img
                src={book.thumbnail}
                alt={book.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            <div className="space-y-4">
              <button className="flex w-full items-center justify-center gap-3 rounded-md bg-book-green py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-opacity-90">
                <FileText className="h-6 w-6" />
                Read Offline
              </button>
              <button className="flex w-full items-center justify-center gap-3 rounded-md border-2 border-sepia-200 bg-white py-4 text-lg font-bold text-sepia-900 transition-all hover:bg-sepia-50">
                <Share2 className="h-6 w-6" />
                Share Volume
              </button>
            </div>
          </div>
        </div>

        {/* Right: Details & Reviews */}
        <div className="lg:col-span-8">
          <div className="border-b border-sepia-200 pb-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-sepia-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-sepia-800">
                  {book.genre}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-serif font-bold text-sepia-900">{book.rating || 4.5}</span>
                  <span className="text-sepia-800/40 font-serif italic ml-1">({reviews.length} reflections)</span>
                </div>
              </div>
              
              <h1 className="mb-4 text-5xl font-serif font-bold text-sepia-900 leading-tight">{book.title}</h1>
              <p className="mb-10 text-2xl font-serif italic text-sepia-800/60">by {book.author}</p>
              
              <div className="prose prose-sepia max-w-none">
                <h3 className="text-xl font-serif font-bold text-sepia-900 mb-4">Synopsis</h3>
                <p className="text-lg leading-relaxed text-sepia-800 font-serif italic">
                  {book.description}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16 space-y-12">
            <div className="flex items-center gap-3 border-b border-sepia-200 pb-4">
              <MessageSquare className="h-8 w-8 text-book-red" />
              <h2 className="text-3xl font-serif font-bold text-sepia-900">Reader Reflections</h2>
            </div>

            {/* Add Review */}
            {auth.currentUser ? (
              <form onSubmit={handleAddReview} className="rounded-xl border border-sepia-200 bg-white p-8 shadow-sm">
                <h3 className="mb-6 text-xl font-serif font-bold text-sepia-900">Leave your mark</h3>
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-sm font-bold text-sepia-800/60 uppercase tracking-widest">Rating:</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`transition-all hover:scale-110 ${s <= rating ? 'text-amber-500' : 'text-sepia-200'}`}
                      >
                        <Star className={`h-8 w-8 ${s <= rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Share your thoughts on this volume..."
                  rows={4}
                  className="mb-6 w-full rounded-lg border-2 border-sepia-100 bg-sepia-50/30 p-4 font-serif text-lg focus:border-book-red focus:outline-none focus:ring-4 focus:ring-sepia-100"
                />
                <button
                  type="submit"
                  disabled={submitting || !newReview.trim()}
                  className="rounded-md bg-book-red px-10 py-3 font-bold text-white shadow-lg transition-all hover:bg-opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Reflection"}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-sepia-200 bg-sepia-50/50 p-8 text-center italic font-serif text-sepia-800/60">
                Please sign in to share your reflections on this volume.
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-10">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="relative border-l-4 border-sepia-200 pl-8 py-2">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}`}
                          alt={review.userName}
                          className="h-12 w-12 rounded-full border-2 border-sepia-100"
                        />
                        <div>
                          <p className="font-serif font-bold text-sepia-900">{review.userName}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? 'fill-current text-amber-500' : 'text-sepia-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-serif italic text-sepia-800/40">
                        {review.createdAt?.toDate?.() ? review.createdAt.toDate().toLocaleDateString() : review.createdAt}
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed text-sepia-800 font-serif italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center font-serif italic text-sepia-800/40">
                  No reflections yet. Be the first to share your thoughts.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
