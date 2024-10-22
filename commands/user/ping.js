const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche le temps de latence du bot'),

    async run(interaction) {
        // Calcul du temps de latence
        const sent = await interaction.reply({ content: 'Calcul en cours...', fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Création de l'embed
        const pingEmbed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setColor('#1F8B4C')
            .addFields(
                { name: 'Latence du bot', value: `${latency}ms`, inline: true },
                { name: 'Latence de l\'API', value: `${apiLatency}ms`, inline: true }
            )
            .setFooter({ text: 'Commande /ping' });

        // Mise à jour du message original avec l'embed
        await interaction.editReply({ content: null, embeds: [pingEmbed] });
    }
};
