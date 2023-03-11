import http from 'http';
import fs from "fs";
import path from "path";
import mime from 'mime';
import chatServer from "./lib/chatServer.js";

var cache = {};

function send404(response) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("Error 404: resource not found.");
    response.end();
}

function sendFile(response, filePath, fileContents) {
    response.writeHead(
        200,
        { "Content-Type": mime.getType(path.basename(filePath)) }
    );
    response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
        sendFile(response, absPath, cache[absPath])
    } else {
        fs.readFile(absPath, function (err, data) {
            if (err) {
                send404(response);
            } else {
                cache[absPath] = data;
                sendFile(response, absPath, data);
            }
        });
    }
}
const server = http.createServer(function (req, res) {
    let filePath = false;

    if (req.url == "/") {
        filePath = "public/index.html";
    } else {
        filePath = "public" + req.url;
    }

    const absPath = "./" + filePath;
    serveStatic(res, cache, absPath)
});

server.listen(3000, function() {
    console.log("Server running at http://localhost:3000/")
})

chatServer.listen(server);
