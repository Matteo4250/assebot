const { readdirSync } = require("fs");

    module.exports = client => {
        let count = 0;
        const dirsEvents = readdirSync("./events/");

        for(const dirs of dirsEvents) {
        const filesDirs = readdirSync(`./events/${dirs}/`).filter(f => f.endsWith(".js"));
            for(const files of filesDirs) {
    const event = require(`../events/${dirs}/${files}`);
        client.on(event.name, (...args) => event.run(client, ...args));
        count++;
        };
};
    console.log(`[Events] => ${count} logged events`)
};