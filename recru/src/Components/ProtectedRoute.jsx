import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useContext(AuthContext);
  
  if (loading) return <div className="p-10">Loading...</div>;
  
  if (!isLoggedIn) {
    // Session nahi hai to login pe bhejo
    return <Navigate to="/login" replace />;
  }
  return children;
}