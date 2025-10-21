import { Navigate } from 'react-router-dom';

/**
 * Promotions page now redirects to the unified Advertising page
 * This maintains backward compatibility for existing routes
 */
const Promotions = () => {
  return <Navigate to="/advertising" replace />;
};

export default Promotions;