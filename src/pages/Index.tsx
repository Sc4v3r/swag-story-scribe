import { Navigate } from 'react-router-dom';

const Index = () => {
  // This will redirect to the auth flow or dashboard based on auth state
  return <Navigate to="/auth" replace />;
};

export default Index;
