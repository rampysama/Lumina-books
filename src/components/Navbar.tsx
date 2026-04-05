import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Search, User, LogIn, LogOut, Library, PlusCircle } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signIn, logOut } from '../lib/firebase';
import { cn } from '../lib/utils';

export function Navbar() {
  const [user] = useAuthState(auth);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-sepia-200 bg-sepia-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-2xl font-serif font-bold tracking-tight text-sepia-900">
          <Book className="h-8 w-8 text-book-green" />
          <span>Lumina</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/search" className="text-sepia-800 hover:text-book-green transition-colors">
            <Search className="h-6 w-6" />
          </Link>
          {user ? (
            <>
              <Link to="/upload" className="flex items-center gap-1 text-sepia-800 hover:text-book-green transition-colors">
                <PlusCircle className="h-6 w-6" />
                <span className="hidden lg:inline font-medium">Upload</span>
              </Link>
              <Link to="/library" className="text-sepia-800 hover:text-book-green transition-colors">
                <Library className="h-6 w-6" />
              </Link>
              <Link to="/profile" className="text-sepia-800 hover:text-book-green transition-colors">
                <User className="h-6 w-6" />
              </Link>
              <button
                onClick={logOut}
                className="flex items-center gap-2 rounded-full bg-sepia-100 px-4 py-2 text-sm font-medium text-sepia-800 hover:bg-sepia-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={signIn}
              className="flex items-center gap-2 rounded-full bg-book-green px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 transition-all shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
