const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const GroupChatMessage = require("./dbSchema/GroupChatMessage");
const OneOnOneChatMessage = require("./dbSchema/OneOnOneChatMessage");
const Redis=require("ioredis")
require("dotenv").config()
const redisUrl=process.env.REDIS_URL

const publisher=new Redis(redisUrl)
const subscriber=new Redis(redisUrl)

const cacheClient = new Redis(redisUrl);






publisher.on("error", function(error) {
  console.error("Redis Error:", error);
});

subscriber.on("error", function(error) {
  console.error("Redis Error:", error);
});

cacheClient.on("error", function(error) {
  console.error("Redis Error:", error);
});



const app = express();

app.use(cors({
  origin: "*"
}));

mongoose.connect(`${process.env.DB_URL}`).then(() => {
  console.log("Connected to Mongodb");
}).catch(err => {
  console.error("Error connecting to mongodb", err.message);
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true
  }
});

const users = {};
let messagesToInsert = { group: [], private: [] };

io.on('connection', (socket) => {
  console.log("New user connected ", socket.id);
  users[socket.id] = socket;
  socket.on("setUsername", (username) => {
    users[username] = socket;
  });

  socket.on('message', async (data) => {
    console.log("message",data)
  await   publisher.publish("chat-messages",JSON.stringify(data));

   
  });

  socket.on('privateMessage', async (data) => {
    console.log(data);
   await  publisher.publish("chat-messages",JSON.stringify(data))
 
  
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    delete users[socket.id];
  });
});


 subscriber.subscribe("chat-messages")

subscriber.on("message",async function (channel,message){
  console.log("Inside the sub")
  if (channel === "chat-messages") {
    console.log("Inside-channel")
    const data = JSON.parse(message);
    await processMessage(data);
  }
})


const processMessage=async(data)=>{
  
  try{
    console.log("data",data)
    if(data.username!=='group-chat'){
      
      const messageData = {
        senderId: data.senderId,
        receiverId: data.username,
        content: data.content,
        createdAt:new Date()
      };
      const privateMessage = new OneOnOneChatMessage(messageData);
     // await privateMessage.save();
      const receiverSocket = users[data.username];
     
      
      if (receiverSocket) {
        console.log("Emiiited to private")
        messagesToInsert.private.push(privateMessage);
      addMessageToCache(data.username,messageData)
        

        receiverSocket.emit("privateMessage", privateMessage);

      } else {
        console.log("User is offline", data.username);
      }
      
     
    }
    else{
      console.log("INside group")
      const groupMessage = new GroupChatMessage({
        senderId: data.senderId,
        content: data.content,
        createdAt:new Date()
      });
      
   //   await groupMessage.save();
   addMessageToCache(data.senderId,groupMessage)
   messagesToInsert.group.push(groupMessage)
      io.emit('message', groupMessage);


    }

  }catch(err){
    console.error("Error processing message:", err);

  }
}


setInterval(async () => {
  try {
    if (messagesToInsert.group.length > 0) {
      await GroupChatMessage.insertMany(messagesToInsert.group);
      messagesToInsert.group = [];
      console.log("Batch group message insertion completed");
    }

    if (messagesToInsert.private.length > 0) {
      await OneOnOneChatMessage.insertMany(messagesToInsert.private);
      messagesToInsert.private = [];
      console.log("Batch private message insertion completed");
    }

    // Optionally clear Redis cache
    cacheClient.flushall((err, reply) => {
      if (err) {
        console.error("Error clearing Redis cache:", err);
      } else {
        console.log("Redis cache cleared");
      }
    });
  } catch (error) {
    console.error("Error performing batch insertion or clearing cache:", error);
  }
}, 10000);


const addMessageToCache = async (username, message) => {
  try {
    // Retrieve the cached data for the username
    const cachedData = await cacheClient.get(username);
    let data;

    if (cachedData) {
      // Parse the cached data
      data = JSON.parse(cachedData);
    } else {
      // Initialize the data structure if there's no cached data
      return;
      data = {
        'group-chat': [],
      
      };
    }

    // Add the new message to the appropriate list
    if (!message.receiverId) {
      // Add to group chat list
      data['group-chat'].push(message);
      console.log("Inside updating",data['group-chat'])
    } else {
      // Add to private message list
      const otherUser = message.senderId === username ? message.receiverId : message.senderId;
      if (!data[otherUser]) {
        return
      }
      data[otherUser].push(message);
    }

    // Update the cache with the modified data
    await cacheClient.set(username, JSON.stringify(data), 'EX', 3600); // Cache for 1 hour

    console.log(`Updated cache for ${username}:`, data);
  } catch (error) {
    console.error(`Error updating cache for ${username}:`, error);
  }
};





app.get("/api/chat/:username", async (req, res) => {
  try {
    const username = req.params.username;
    console.log("username is", username);

    // Check cache first
    cacheClient.get(username, async (err, cachedData) => {
      if (err) {
        console.error("Redis Error:", err);
        res.status(500).json({ err: "Internal issue" });
        return;
      }

      if (cachedData) {
        console.log("Serving from cache",cachedData);
        res.json(JSON.parse(cachedData));
      } else {
        console.log("Fetching from MongoDB");
        const groupChatMessage = await GroupChatMessage.find().sort({ createdAt: 1 }).exec();
        const oneOnOneChatMessage = await OneOnOneChatMessage.find({
          $or: [{ senderId: username }, { receiverId: username }]
        }).sort({ createdAt: 1 }).exec();

        const result = {
          'group-chat': groupChatMessage
        };
        oneOnOneChatMessage.forEach(message => {
          const key = message.senderId === username ? message.receiverId : message.senderId;
          if (!result[key]) {
            result[key] = [];
          }
          result[key].push(message);
        });

        // Cache the result
        cacheClient.set(username, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
        res.json(result);
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: "Internal issue" });
  }
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
