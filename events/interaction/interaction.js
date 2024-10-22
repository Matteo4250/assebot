const { Events, InteractionType } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async run(client, interaction) {
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.run(interaction);
      } catch (error) {
        console.error(error);
        let errorMessage = 'Une erreur s\'est produite lors de l\'exécution de cette commande !';
        
        if (error.message.includes('InteractionAlreadyReplied')) {
          errorMessage = 'Cette interaction a déjà été traitée.';
        } else if (error.message.includes('Cannot read properties of null')) {
          errorMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
        }
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(console.error);
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
        }
      }
    }
  }
};