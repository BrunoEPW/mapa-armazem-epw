import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {/* Logo marca d'água no canto superior esquerdo */}
      <div className="fixed top-4 left-4 z-10 opacity-50">
        <img 
          src="/lovable-uploads/ce6ad3d6-6728-414c-b327-428c5cd38f81.png" 
          alt="EPW Logo" 
          className="h-8 sm:h-10"
        />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <button 
          onClick={() => navigate('/')} 
          className="text-blue-500 hover:text-blue-700 underline cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
