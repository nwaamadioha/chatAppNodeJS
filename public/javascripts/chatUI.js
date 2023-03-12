
function divEscapedContentElement(message) {
    /**Sanitize and display untrusted text */
    return $("<div></div>").text(message);
}

function divSystemContentElement(message) {
    /**Display trusted content created by the system */
    return $("<div></div>").html("<i>" + message + "</i>");
}

function processUserInput(chatApp, socket) {
    /**Process user input */
    var message = $("#send-message").val();
    var systemMessage;

    if (message.charAt(0) == "/") {
        systemMessage = chatApp.processCommand(message);
        if (systemMessage) {
            $("#messages").append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($("#room").text(), message);
        $("#messages").append(divEscapedContentElement(message));
        $("#messages").scrollTop($("#messages").prop("scrollHeight"));
    }

    $("#send-message").val("");
}

//HANDLE CLIENT-SIDE INITIATION OF SOCKET.IO EVENT HANDLING
var socket = io.connect();

$(document).ready(function() {
    var chatApp = new Chat(socket);

    //DISPLAY RESULTS OF NAME-CHANGE ATTEMPT
    socket.on("nameResult", function(result) {
        var message;

        if (result.success) {
            message = "You are now known as " + result.name + ".";
        } else {
            message = result.message;
        }
        $("#messages").append(divSystemContentElement(message));
    });

    //DISPLAY RESULTS OF A ROOM CHANGE
    socket.on("joinResult", function(result) {
        $("#room").text(result.room);
        $("#messages").append(divSystemContentElement("Room changed."));
    });

    //DISPLAY RECEIVED MESSAGES
    socket.on("message", function(message) {
        var newElement = $("<div></div>").text(message.text);
        $("#messages").append(newElement);
    });

    //DISPLAY LIST OF ROOMS AVAILABLE
    socket.on("rooms", function(rooms) {
        $("#room-list").empty();

        for (var room in rooms) {
            room = room.substring(1, room.length);
            if (room != "") {
                $("#room-list").append(divEscapedContentElement(room))
            }
        }

        //ALLOW CLICK OF A ROOM NAME TO CHANGE THAT ROOM
        $("#room-list div").click(function() {
            chatApp.processCommand("/join" + $(this).text());
            $("#send-message").focus();
        });
    });

    //REQUEST LIST OF ROOMS AVAILABLE INTERMITTENTLY
    setInterval(function() {
        socket.emit("rooms");
    }, 1000);

    $("#send-message").focus();

    //ALLOW SUBMITTING THE FORM TO SEND A CHAT MESSAGE
    $("#send-form").submit(function() {
        processUserInput(chatApp, socket);
        return false;
    });
});