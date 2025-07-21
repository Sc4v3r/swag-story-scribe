import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to stories page which is now public
  return <Navigate to="/stories" replace />;
};

export default Index;
