import { Server } from "socket.io";

let io = new Server();
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
    let name = "Guest" + guestNumber;
    nickNames[socket.id] = name;
    socket.emit("nameResult", {
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit("joinResult", {room: room});
    socket.broadcast.to(room).emit("message", {
        text: nickNames[socket.id] + " has joined " + room + " ."
    });

    let usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length > 1) {
        let usersInRoomSummary = "Users currently in " + room + ": ";
        for (let index in usersInRoom) {
            let userSocketId = usersInRoom[index].id;
            if (userSocketId != socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ", ";
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += ".";
        socket.emit("message", {text: usersInRoomSummary});
    }
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on("nameAttempt", function(name) {
        if (name.indexOf("Guest") == 0) {
            socket.emit("nameResult", {
                success: false,
                message: "Names cannot begin with 'Guest'. "
            });
        } else {
            if (namesUsed.indexOf(name) == -1) {
                let previousName = nickNames[socket.id];
                let previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];

                socket.emit("nameResult", {
                    success: true,
                    name: name 
                });
                socket.broadcast.to(currentRoom[socket.id]).emit("message", {
                    text: previousName + " is now known as " + name + "."
                });
            } else {
                socket.emit("nameResult", {
                    success: false,
                    message: "That name is already in use."
                })
            }
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on("message", function(message) {
        socket.broadcast.to(message.room).emit("message", {
            text: nickNames[socket.id] + ": " + message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on("join", function(room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

function handleClientDisconnection(socket) {
    socket.on("disconnect", function(room) {
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
}

const chatServer = {

    listen: function (server) {
        io.listen(server);
        io.on("connection", function (socket) {
            guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

            joinRoom(socket, "Lobby");
            handleMessageBroadcasting(socket, nickNames);
            handleNameChangeAttempts(socket, nickNames, namesUsed);
            handleRoomJoining(socket);

            socket.on("rooms", function () {
                socket.emit("rooms", io.sockets.adapter.rooms);
            });

            handleClientDisconnection(socket, nickNames, namesUsed);
        });
    },
}

export default chatServer;