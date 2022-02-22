

function parseSearch(str) {
    let obj = {};
    str = str.slice(1).match(/([\w+]+)\=([\w+]+)/g);
    for (const a of str) {
        let [k,v] = a.split("=");
        obj[k]=v;   
    } 
    return obj;
}
window.addEventListener("load", async function () {

    let sitekey = await (await this.fetch("/sitekey", { method: "GET" })).text();
    console.log(sitekey);
    const { code, user, guild } = parseSearch(this.location.href);
    let result = this.document.querySelector("#result");
    if (!code || !user || !guild) {
        return result.innerHTML = `<div class="cont" id="invalidCode">
        <h1>Invalid Link!</h1>
        <span class="error">In the link must the Guild ID, User ID & the Activitation code provided!</span>
    </div>`;
    }

    

    result.innerHTML = `
    <form action="?" method="POST">
        <h1>Verify yourself in the server</h1>
        <span>To verify yourself, please solve the googleRecaptcha to prove that you are a Human!</span>
        
        <div id="googleRecaptcha"></div>

    </form>`;
    
    function verifyCallback(response) {
        fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ response, user, guild, code })
        }).then(async res => {
            let json = await res.json();
            if (json.error) {
                alert(json.message);
            } else {
                alert("You have been successfully verified in the server!");
            }
        })
    }
    
    grecaptcha.render('googleRecaptcha', {
        sitekey,
        'callback' : verifyCallback,
        'theme' : 'dark'
      });


});
