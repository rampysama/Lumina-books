import React from 'react';
import { motion } from 'motion/react';
import { Star, Plus, Check } from 'lucide-react';
import { Book } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface BookCardProps {
  book: Book;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function BookCard({ book, isSaved, onToggleSave, onClick }: BookCardProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (onClick) {
      onClick(book.id);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-sepia-200 bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <div 
        className="aspect-[2/3] w-full cursor-pointer overflow-hidden bg-sepia-100"
        onClick={handleClick}
      >
        <img
          src={book.thumbnail || `https://picsum.photos/seed/${book.id}/400/600`}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-sepia-900/0 transition-colors group-hover:bg-sepia-900/10" />
      </div>
      
      <div className="flex flex-1 flex-col p-5 bg-white">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-book-green/80">{book.genre}</span>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
            <Star className="h-3 w-3 fill-current" />
            <span>{book.rating || 4.5}</span>
          </div>
        </div>
        
        <h3 
          className="mb-1 cursor-pointer font-serif text-lg font-bold leading-tight text-sepia-900 line-clamp-2 hover:text-book-green transition-colors"
          onClick={handleClick}
        >
          {book.title}
        </h3>
        <p className="mb-4 text-xs font-medium text-sepia-800/60 italic">{book.author}</p>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(book.id);
          }}
          className={cn(
            "mt-auto flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-xs font-bold transition-all border",
            isSaved 
              ? "bg-sepia-50 text-sepia-800 border-sepia-200 hover:bg-sepia-100" 
              : "bg-book-green text-white border-transparent hover:bg-opacity-90 shadow-sm"
          )}
        >
          {isSaved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>In Library</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Add to Library</span>
            </>
          )}
        </button>
      </div>
      
      {/* Book spine effect */}
      <div className="absolute left-0 top-0 h-full w-1 bg-black/5" />
    </motion.div>
  );
}
