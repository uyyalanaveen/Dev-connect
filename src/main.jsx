import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@fontsource/poppins/700.css';
// import '@fontsource/poppins';
import { createBrowserRouter,RouterProvider,Navigate } from 'react-router-dom'
import Layout from '../Layout.jsx'
import Hero from './pages/Hero/Hero.jsx'
import Signup from './pages/Authentication/Signup.jsx';
import Login from './pages/Authentication/Login.jsx'
import AuthRoute from './components/AuthRoute.jsx' // Import AuthRoute
import { isAuthenticated } from './utility/auth.js'; // Import auth utility
import Home from './pages/Home/Home.jsx';
import Contact from './pages/contact/Contact.jsx';
import Forgetpassword from './pages/Authentication/Forgetpassword.jsx';
import Features from './pages/features/Features.jsx';
// import SetNewPaaword from './pages/Authentication/SetNewPaaword.jsx';



const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: isAuthenticated() ? <Navigate to="/home" /> : <Hero />, // Redirect to `/home` if authenticated
      },
      {
        path: '/login',
        element: isAuthenticated() ? <Navigate to="/home" /> : <Login />,
      },
      {
        path: '/signup',
        element: isAuthenticated() ? <Navigate to="/home" /> : <Signup />,
      },
      {
        path: '/reset-password',
        element: isAuthenticated() ? <Navigate to="/home" /> : <Forgetpassword />,
      },
      {
        path: '/features',  
        element: <Features />,  
      },
      {
        path: '/contact',
        element: <Contact />,
      },
      {
        path: '/home',
        element: <AuthRoute><Home /></AuthRoute>, // Auth-protected route
      },
    ],
  },
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);