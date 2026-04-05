import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { BookDetails } from './pages/BookDetails';
import { Upload } from './pages/Upload';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-gray-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/book/:id" element={<BookDetails />} />
            <Route path="/library" element={<div className="p-20 text-center">Library Page (Coming Soon)</div>} />
            <Route path="/profile" element={<div className="p-20 text-center">Profile Page (Coming Soon)</div>} />
          </Routes>
        </main>
        
        <footer className="border-t bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                <span>Lumina</span>
              </div>
              <p className="text-sm text-gray-500">
                © 2026 Lumina Books. All rights reserved. Built with Gemini AI.
              </p>
              <div className="flex gap-6 text-sm font-medium text-gray-600">
                <a href="#" className="hover:text-indigo-600">Privacy</a>
                <a href="#" className="hover:text-indigo-600">Terms</a>
                <a href="#" className="hover:text-indigo-600">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
