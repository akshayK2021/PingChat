import { useState } from "react";
import { Navigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [redirectTOMainPanel, setRedirectedToMainPanel] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (username.trim() !== "") {
      localStorage.setItem("username", username);
      alert("Username stored in local storage");
      setRedirectedToMainPanel(true);
    } else {
      alert("Please enter a valid username");
    }
  };

  const handleChange = (event) => {
    setUsername(event.target.value);
  };

  if (redirectTOMainPanel) {
    return <Navigate to="/mainPanel" />;
  }

  return (
    <div 
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center overflow-hidden" 
      style={{ backgroundImage: "url('/images/login.jpg')" }}
    >
      <div className="absolute inset-0 bg-black opacity-70"></div>
      <div className="relative w-full max-w-md p-8 space-y-8 bg-white bg-opacity-95 rounded-lg shadow-lg animate-fadeIn">
        <div className="flex flex-col items-center">
          <div className="bg-blue-500 p-4 rounded-full shadow-lg mb-4 animate-bounce">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 9 4-18 3 9h4" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-center text-blue-600 mb-2">PingChat</h1>
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-4">Login</h2>
          <p className="text-center text-gray-600 mb-8">
            Connect with friends and the world around you on PingChat. Share moments, send messages, and stay connected.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label className="mb-2 text-lg font-medium text-gray-800" htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:scale-105">
            Login
          </button>
        </form>
      </div>
      {/* Snowflake elements */}
      {[...Array(50)].map((_, index) => (
        <div
          key={index}
          className="absolute w-1 h-1 bg-white rounded-full snowflake"
          style={{
            top: `${Math.random() * 100}%`, // Randomize initial vertical position
            left: `${Math.random() * 100}%`, // Randomize initial horizontal position
            animationDelay: `${Math.random() * 8}s`, // Randomize animation delay for each snowflake
          }}
        ></div>
      ))}
    </div>
  );
}
