
let Chat = function(socket) {
    const context = this;
    context.socket = socket;
}

Chat.prototype.sendMessage = function(room, text) {
    var message = {
        room: room,
        text: text
    }
    context.socket.emit("message", message);
}

Chat.prototype.changeRoom = function(room) {
    context.socket.emit("join", {
        newRoom: room
    });
}

Chat.prototype.processCommand = function(command) {
    var words = command.split(" ");
    var command = words[0].substring(1, words[0].length).toLowerCase();

    var message = false;
    switch(command) {
        case "join":
            words.shift();
            var room = words.join(" ");
            context.changeRoom(room);
            break;
        case "nick":
            words.shift();
            var name = words.join(" ");
            context.socket.emit("nameAttempt", name);
            break;
        default:
            message = "Unrecognized command.";
            break;
    }
    return message;
}