import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@fontsource/poppins";
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Layout from '../Layout.jsx'
import Hero from './pages/Hero/Hero.jsx'
import Signup from './pages/Authentication/Signup.jsx';
import Login from './pages/Authentication/Login.jsx'
import AuthRoute from './components/AuthRoute.jsx' 
import { isAuthenticated } from './utility/auth.js'; 
import Home from './pages/Home/Home.jsx';
import Contact from './pages/contact/Contact.jsx';
import Forgetpassword from './pages/Authentication/Forgetpassword.jsx';
import Features from './pages/features/Features.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import UserSearch from './pages/Profile/UserSearch.jsx';
import UpdateProfilePage from './pages/Profile/UpdateProfile.jsx';
import Room from './pages/Rooms/Room.jsx';
import Chatbot from './pages/Home/Chatbot.jsx';



const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: isAuthenticated() ? <Navigate to="/home" /> : <Hero />, 
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
        element:  <AuthRoute><Home /></AuthRoute> , 
      },
      {
        path: '/profile/:id',
        element:
          (
            <AuthRoute>
              <ProfilePage />
            </AuthRoute>
          )
      },
      {
        path:'/search-users',
        element:<AuthRoute><UserSearch /></AuthRoute>
      },
      {
        path:'/update-profile',
        element: <AuthRoute><UpdateProfilePage /></AuthRoute>
      },
      {
        path : '/room/:id',
        element: <AuthRoute><Room /></AuthRoute>
      },
      {
        path:'/chat',
        element:<Chatbot />
      }
    ],
  },
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);