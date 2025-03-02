import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Home, Search, MessageSquare, Bell } from "lucide-react";
import { MdFeaturedPlayList } from "react-icons/md";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return setLoading(false);
        
        const response = await fetch("https://devconnect-backend-6opy.onrender.com/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user");
        console.log(token)
        const data = await response.json();
        setUser(data.data.user);
        sessionStorage.setItem("user", JSON.stringify(data.data.user));
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const NavItems = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Features", path: "/features", icon: <MdFeaturedPlayList className="h-5 w-5" /> },
    { name: "Search", path: "/search-users", icon: <Search className="h-5 w-5" /> },
    // { name: "Messages", path: "/messages", icon: <MessageSquare className="h-5 w-5" /> },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:from-blue-600 group-hover:to-indigo-700 transition-all duration-300">
              <span className="text-xl font-bold">D</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text group-hover:from-blue-300 group-hover:to-indigo-400 transition-all duration-300">
              DevConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {NavItems.map(({ name, path, icon }) => (
              <Link
                key={name}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
                  isActive(path)
                    ? "bg-gray-700/70 text-white font-medium"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                {icon}
                <span>{name}</span>
              </Link>
            ))}

            {!loading && (
              user ? (
                <div className="flex items-center pl-4 border-l border-gray-700 ml-2">
                  {/* Notifications
                  <button className="p-2 rounded-full hover:bg-gray-800 transition-colors mr-2 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                  </button> */}
                  
                  {/* User Menu */}
                  <div className="relative group">
                    <Link
                      to="/update-profile"
                      className="flex items-center space-x-3 px-3 py-1.5 rounded-full bg-gray-800/80 hover:bg-gray-700 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <span className="font-medium">{user.fullname?.split(' ')[0]}</span>
                    </Link>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                      <Link to="/update-profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        Your Profile
                      </Link>
                      {/* <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                        Dashboard
                      </Link> */}
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="px-4 py-2 rounded-md text-white hover:bg-gray-700 transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors shadow-md">
                    Sign up
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NavItems.map(({ name, path, icon }) => (
              <Link
                key={name}
                to={path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  isActive(path)
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                {icon}
                <span>{name}</span>
              </Link>
            ))}

            {!loading && user && (
              <>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <Link 
                    to="/update-profile"
                    className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-700"
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium block">{user.fullname}</span>
                      <span className="text-sm text-gray-400">View profile</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-3 py-2 w-full text-left rounded-md text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors mt-1"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
            
            {!loading && !user && (
              <div className="border-t border-gray-700 pt-2 mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="px-3 py-2 rounded-md text-center hover:bg-gray-700 transition-colors border border-gray-700">
                  Log in
                </Link>
                <Link to="/signup" className="px-3 py-2 rounded-md text-center bg-blue-600 hover:bg-blue-700 transition-colors">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;