export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  genre: string;
  rating: number;
  reviewCount: number;
  publishedDate?: string;
  pageCount?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  savedBooks: string[]; // IDs of books in library
  readingHistory: string[]; // IDs of books read
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore Timestamp or string
}
