// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { UserContext } from "../context/user.context";

// const UserAuth = ({ children }) => {
//   const { user } = useContext(UserContext);
//   const [loading, setLoading] = useState(true);
//   const token = localStorage.getItem("token");
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (user) {
//       setLoading(false);
//     }

//     if (!token) {
//       navigate("/login");
//     }

//     if (!user) {
//       navigate("/login");
//     }
//   }, []);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return <>{children}</>;
// };

// export default UserAuth;



// import React, { useContext, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { UserContext } from "../context/user.context";

// const UserAuth = ({ children }) => {
//   const { user, loading } = useContext(UserContext);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!loading && !user) {
//       navigate("/login");
//     }
//   }, [user, loading, navigate]);

//   if (loading) {
//     return <div className="p-4">Authenticating...</div>;
//   }

//   return <>{children}</>;
// };

// export default UserAuth;

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/user.context";

const UserAuth = ({ children }) => {
  const { user, loading } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      if (!user) {
        // Don't redirect if already on login page
        if (location.pathname !== '/login' && location.pathname !== '/register') {
          navigate("/login");
        }
      }
      setChecked(true);
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading while checking auth
  if (loading || !checked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  // If user exists OR we're on a public page, render children
  if (user || location.pathname === '/login' || location.pathname === '/register') {
    return <>{children}</>;
  }

  // Fallback (should never reach here due to redirect)
  return null;
};

export default UserAuth;
