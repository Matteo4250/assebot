const { readdirSync } = require('fs');

module.exports = client => {
    let count = 0;
    client.commands = new Map(); // Initialize the commands map

    const dirsCommands = readdirSync("./commands/");

    for (const dirs of dirsCommands) {
        const filesDirs = readdirSync(`./commands/${dirs}/`).filter(f => f.endsWith(".js"));
        for (const files of filesDirs) {
            const command = require(`../commands/${dirs}/${files}`);
            client.commands.set(command.data.name, command);
            count++;
        }
    }
    console.log(`[Commands] => ${count} logged commands`);
};
