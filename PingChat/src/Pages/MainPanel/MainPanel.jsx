import { useContext, useEffect, useState } from "react";
import { ChatContext } from "../../context/ChatContext";
import io from "socket.io-client";

export default function MainPanel() {
  const { api } = useContext(ChatContext);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);

  const [totalMessages, setTotalMessages] = useState({ "group-chat": [] });
  const [currentUser, setCurrentUser] = useState("group-chat");
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  const [myUsername, setMyUsername] = useState("");
  const [newUserSocket, setNewUserSocket] = useState("");

  const handleReceivedMessages = (message) => {
    console.log("message is",message)
    setTotalMessages((prev) => ({
      ...prev,
      "group-chat": [...(prev["group-chat"] || []), message],
    }));
  };

  const handleReceivedMessagesPrivate = (message) => {
    console.log("IN private",message)
    setTotalMessages((prev) => ({
      ...prev,
      [message.senderId]: [...(prev[message.senderId] || []), message],
    }));
  };

  const sendMessage = () => {
    if(currentUser !== 'group-chat'){
      setTotalMessages((prev) => ({
        ...prev,
        [currentUser]: [
          ...(prev[currentUser] || []),
          { senderId: myUsername, content: newMessage }
        ],
      }));
    }
    if (newMessage.trim() !== "" && socket) {
      const message = {
        senderId: myUsername,
        content: newMessage,
        username: currentUser,
      };
      currentUser === "group-chat"
        ? socket.emit("message", message)
        : socket.emit("privateMessage", message);
   
      setNewMessage("");
    }
  };

  const addChatUser = () => {
    if (newUserSocket.trim() !== "") {
      setTotalMessages((prev) => ({
        ...prev,
        [newUserSocket]: [],
      }));
      setNewUserSocket("");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("username") === null) {
      window.location.href = "/";
    }
    const newSocket = io(api);
    setSocket(newSocket);
    const username = localStorage.getItem("username");
    setMyUsername(username);
    newSocket.on("message", handleReceivedMessages);
    newSocket.on("privateMessage", handleReceivedMessagesPrivate);
    newSocket.on("connect", () => {
  
      newSocket.emit("setUsername", username);
    });

  const fetchChatData = async (username) => {
    try {
      const res = await fetch(`${api}/api/chat/${username}`);
      const data = await res.json();
      setTotalMessages(data);
    } catch (err) {
      console.error("Error fetching chat data:", err);
    }
  };

    if (!initialDataFetched) {
      fetchChatData(username);
      setInitialDataFetched(true);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [api,initialDataFetched]);


  return (
    <div className="w-screen -full flex justify-center items-center bg-gray-100 ">
      <div className="min-w-[100vw]  min-h-[100vh] max-w-6xl max-h-screen  overflow-hidden shadow-lg bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-500 text-white">
          <h1 className="text-3xl font-semibold">PingChat</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Logged in as: {myUsername}</span>
            <button
              className="text-sm border border-white px-2 py-1 rounded-lg hover:bg-white hover:text-blue-500 transition duration-300"
              onClick={() => {
                localStorage.removeItem("username");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        </div>
        {/* Chat area */}
        <div className="flex flex-grow overflow-hidden">
          {/* Users list */}
          <div className="w-1/5 bg-gray-100 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">Chat Users</h2>
            <div className="space-y-2 h-[75vh] overflow-y-scroll">
              {Object.keys(totalMessages).map((user, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md cursor-pointer hover:bg-gray-200 ${
                    currentUser === user ? "bg-blue-200" : ""
                  }`}
                  onClick={() => setCurrentUser(user)}
                >
                  {user}
                </div>
              ))}
            </div>
            <div className="mt-5 itmes ">
              <input
                type="text"
                placeholder="Enter receiver's Username"
                className="w-full border border-gray-300 rounded-md px-3 py-1 focus:outline-none"
                value={newUserSocket}
                onChange={(e) => setNewUserSocket(e.target.value)}
              />
              <button
                className="mt-2 w-full bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition duration-300"
                onClick={addChatUser}
              >
                Add User
              </button>
            </div>
          </div>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto min-h-screen border-2 border-gray-400">
            <div className="flex flex-col-reverse space-y-4 space-y-reverse  overflow-y-scroll h-[79vh] ">
              {totalMessages[currentUser] &&
                totalMessages[currentUser].slice().reverse().map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.senderId === myUsername
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-md ${
                        message.senderId === myUsername
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="block font-bold mb-1">
                        {message.senderId === myUsername ? "You" : message.senderId}:
                      </span>
                      {message.content}
                    </div>
                  </div>
                ))}
            </div>
             {/* Input area */}
        <div className="px-4 py-2 bg-gray-100 border border-gray-200  rounded-lg   mt-8">
          <div className="flex items-center">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-double"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              className="ml-4 bg-blue-500 text-white px-4 py-2  rounded-md hover:bg-blue-600 transition duration-300"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
          </div>
          
        </div>
       
      </div>
    </div>
  );
}
