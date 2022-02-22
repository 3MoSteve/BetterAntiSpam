const { TOKEN, PREFIX, domain } = require("../config");

const { Client, MessageEmbed, Permissions } = require("discord.js");
const { data, saveData, Emitter } = require("../Connection/Connection");
const client = new Client({ intents: ["GUILDS", "GUILD_MEMBERS", "DIRECT_MESSAGES", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"] });


client.on("ready", () => {
    console.log("The bot is ready!");   
    
    
});


client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot || !message.content.startsWith(PREFIX)) return;
    const [ command, ...args ] = message.content.slice(PREFIX.length).split(/ +/);

    if (command === "setup") {
        if (!data[message.guild.id]) {
            data[message.guild.id] = {
                role: null,
                role2: null,
                guild: message.guild.id,
                status: !1,
                links: []
            }
        }

        const msg = await message.channel.send("Do you want to turn the Protection on or off?");
        const reactions = ["✅","❎"]
        for (const r of reactions) await msg.react(r);
        let collector = msg.createReactionCollector({ filter: (r, u) => u.id == message.author.id && reactions.includes(r.emoji.name), max: 1,time: 60E3 });
        collector.on("collect", async (r, u) => {
            if (r.emoji.name == reactions[1]) {
                data[message.guild.id].status = !1;
                saveData();
                msg.edit("Alright!");

            } else {
                data[message.guild.id].status = !0;
                try {
                    await msg.edit("Please mention now the activated role..");
                    let collector = await message.channel.awaitMessages({ 
                        filter: (m) => m.mentions.roles.size && m.author.id == message.author.id,
                        max: 1
                    });
                    let active;
                    data[message.guild.id].role = (active = collector.first().mentions.roles.first()).id;
                    await msg.edit("Please mention now a role for non-activated members..");
                    collector = await message.channel.awaitMessages({ 
                        filter: (m) => m.mentions.roles.size && m.author.id == message.author.id,
                        max: 1
                    });
                    data[message.guild.id].role2 = collector.first().mentions.roles.first().id;
                    saveData();
                    msg.edit("Alright, you are now done :smiley:!");
                    message.guild.channels.cache.forEach(channel => {
                        if (new Permissions(channel.permissionsFor(message.guild.roles.everyone.id)).has("VIEW_CHANNEL")) {
                            channel.permissionOverwrites.edit(message.guild.roles.everyone.id, { VIEW_CHANNEL: !1 });
                            channel.permissionOverwrites.create(active.id, { VIEW_CHANNEL: !0 })
                        }
                    })
                }catch(e) {
                    msg.delete().catch(_=>!1);
                }
            }
        });
        collector.on("end", () => {
            
            msg.reactions.removeAll().catch(_=>!1);
        });
        collector.on("dispose", () => {
            msg.delete().catch(_=>!1);
        })

    }
});

client.on("guildMemberAdd", (member) => {
    let gData = (data[member.guild.id]?.status && data[member.guild.id]);
    if (!gData) return;
    member.roles.add(gData.role2);
    let link = gData.links.find(u => u.user == member.id)?.link;
    if (!link) {
        let code = Buffer.from(`${Date.now()}${member.id}${member.guild.id}`).toString("hex");
    link = `${domain}/?code=${code}&guild=${member.guild.id}&user=${member.id}`

    gData.links.push({
        code,
        user: member.id,
        link
    });
    saveData();
}
    const embed = new MessageEmbed()
    .setTitle("Verification")
    .setThumbnail(member.guild.iconURL({dynamic: !0 })||member.user.displayAvatarURL({ dynamic: !0 }))
    .setDescription(`Thanks for joining our server [ **${member.guild.name}** ]
To prevent Spam Accounts in our server, you have to verify yourself first.
[Click Here](${link}) to verify yourself.`)
.setTimestamp()
member.send({ embeds: [ embed ]});

})

Emitter.on("active", async (gID, uID, code, callback) => {
    let gData = (data[gID]?.status && data[gID]);
    if (!gData) return callback("We don't have data for your sever! please setup the bot first!");
    let guild = await client.guilds.fetch(gID);
    let member = guild && await guild.members.fetch(uID);
    if (!guild || !member) return callback(`Invalid guild or member id!`);
    let Lindex = gData.links.map(u => `${u.code}${u.user}`).indexOf(`${code}${uID}`);
    if (Lindex < 0) return callback("Invalid link!");
    member.roles.remove(gData.role2);
    member.roles.add(gData.role);
    gData.links.splice(Lindex, 1);
    saveData();
    callback(!0);
});


client.login(TOKEN);
