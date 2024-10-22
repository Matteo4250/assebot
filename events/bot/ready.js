const { Events, ActivityType } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  async run(client) {
    client.application.commands.set(Array.from(client.commands.values()).map(command => command.data)).then(() => console.log("[SlashCommands] Les commandes Slash ont été enregistrées avec succès"));
    
    console.log(`[Bot] => ${client.user.username} est en ligne`);

    client.on('ready', async () => {
      const commands = client.application.commands.cache.map(cmd => cmd.name);
      console.log(`Commandes enregistrées : ${commands.join(', ')}`);

    });
  }
};