import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Project from "../screens/Project";
import Home from "../screens/Home";
import UserAuth from "../auth/UserAuth";
import Preview from "../screens/Preview";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <UserAuth>
              <Home />
            </UserAuth>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/project" element={<UserAuth><Project /></UserAuth>} />

        <Route
          path="/preview/:id"
          element={
            <UserAuth>
              <Preview />
            </UserAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;


// // src/routes/AppRoutes.jsx
// import React from "react";
// import { Route, BrowserRouter, Routes, Navigate } from "react-router-dom";
// import Login from "../screens/Login";
// import Register from "../screens/Register";
// import Project from "../screens/Project";
// import Home from "../screens/Home";
// import UserAuth from "../auth/UserAuth";
// import Preview from "../screens/Preview";
// import { UserProvider } from "../context/user.context";

// const AppRoutes = () => {
//   return (
//     <BrowserRouter>
//       <UserProvider>
//         <Routes>
//           {/* Public Routes */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
          
//           {/* Protected Routes */}
//           <Route path="/" element={
//             <UserAuth>
//               <Home />
//             </UserAuth>
//           } />
          
//            {/* THIS IS THE CRITICAL FIX - Add a redirect for /project */}
//           {/* <Route path="/project" element={<Navigate to="/" replace />} />  */}
          
//           <Route 
//             path="/project/:id" 
//             element={
//               <UserAuth>
//                 <Project />
//               </UserAuth>
//             } 
//           />
                
//           <Route
//             path="/preview/:id"
//             element={
//               <UserAuth>
//                 <Preview />
//               </UserAuth>
//             }
//           />
          
//           {/* Fallback route */}
//           <Route path="*" element={
//             <div className="p-8">
//               <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
//               <p className="mt-4">The page you're looking for doesn't exist.</p>
//             </div>
//           } />
//         </Routes>
//       </UserProvider>
//     </BrowserRouter>
//   );
// };

// export default AppRoutes;