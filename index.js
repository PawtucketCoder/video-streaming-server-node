const express = require("express");
const multer = require("multer"); // Multer for handling file uploads
const app = express();
const fs = require("fs");
const path = require("path");

app.use(express.static(__dirname));
app.use(express.json());

const storage = multer.diskStorage({
    destination: "videos", // Destination folder for storing uploaded videos
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/video/:filename", function (req, res) {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }

    const videoFilename = req.params.filename;
    const videoPath = path.join("videos", videoFilename); // Assuming video files are in the "videos" folder
    const videoSize = fs.statSync(videoPath).size;

    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);

    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

app.post("/upload", upload.single("videoFile"), function (req, res) {
    res.status(200).send("File uploaded successfully");
});

app.listen(8000, function () {
    console.log("Listening on port 8000!");
});
