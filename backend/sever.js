
const axios = (require("axios").default).create({
    baseURL: "https://www.google.com/recaptcha/api"
});
const express = require("express");
const { GOOGLE_RECAPTCHA_SECRET_KEY, GOOGLE_RECAPTCHA_SITE_KEY } = require("../config");
const { Emitter } = require("../Connection/Connection");
const app = express();

app.use("/static", express.static(__dirname + "/static"));


app.get("/sitekey", (req, res) => {
    res.send(GOOGLE_RECAPTCHA_SITE_KEY);
})

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/verify", express.json(), (req, res) => {
    const { response, code, user, guild } = req.body;
    if(!response || !code || !user || !guild) return res.status(400).json({ error: true, message: "Google-recaptcha response, user id, guild id and the activitation code are required!" });

    axios.post("/siteverify", {}, {  params: { secret: GOOGLE_RECAPTCHA_SECRET_KEY, response } }).then(({ data }) => {
        if (data.success) {
            Emitter.emit("active", guild, user, code, (message) => {
                if (message === true) {
                    res.status(200).json({ success: !0 });
                } else {
                    res.status(400).json({ error: true, message })
                }
            })
        } else {
            if (data["error-codes"]?.[0] == "invalid-input-response") {
                res.status(400).json({ error: true, message: "Invalid Google-recaptcha response." });
            } else {
                res.status(400).json({ error: true, message: data["error-codes"].join(", ") })
            }
        }
    });
})
module.exports = () => new Promise((resolve, reject) => {
    
    app.listen(80, () => {
        console.log (`The server is ready!`);
        resolve();
    });

})
