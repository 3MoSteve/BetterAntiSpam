require("./Backend/server")().then(() => {
    require("./Bot/bot");  
}).catch(e =>{ throw e; })
