import React, { useState, useEffect } from "react";
import { Menu, X, User, LogOut, Home, Search, MessageSquare } from "lucide-react";
import { MdFeaturedPlayList } from "react-icons/md";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return setLoading(false);

        const response = await fetch("https://dev-conncet-backend.onrender.com/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user");

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

  const handleSignOut = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("user");
    window.location.href = "/login";
  };

  const NavItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Features", href: "/features", icon: <MdFeaturedPlayList className="h-5 w-5" /> },
    { name: "Search", href: "/search-users", icon: <Search className="h-5 w-5" /> },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-xl font-bold">D</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">
              DevConnect
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {NavItems.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                className="flex items-center space-x-2 text-gray-300 hover:text-white hover:scale-105 transition-all duration-200"
              >
                {icon}
                <span>{name}</span>
              </a>
            ))}

            {!loading && (
              user ? (
                <div className="flex items-center space-x-4">
                  <div
                    className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => (window.location.href = "/update-profile")}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <span className="font-medium">{user.fullname}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <a href="/login" className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors">
                  Login
                </a>
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NavItems.map(({ name, href, icon }) => (
              <a
                key={name}
                href={href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                {icon}
                <span>{name}</span>
              </a>
            ))}

            {!loading && user && (
              <>
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="font-medium">{user.fullname}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-3 py-2 w-full text-left text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
