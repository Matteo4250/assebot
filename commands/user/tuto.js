const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tuto')
        .setDescription('Affiche un tutoriel vidéo pour aider les utilisateurs'),

    async run(interaction) {
        // Création de l'embed
        const tutorialEmbed = new EmbedBuilder()
            .setTitle('🎥 Tutoriel Vidéo')
            .setDescription('Voici un tutoriel vidéo pour vous montrer comment faire:')
            .setColor('#1F8B4C')
            .addFields(
                { name: 'Instructions', value: 'Cliquez sur la vidéo pour apprendre à effectuer un pronostic.' }
            )
            .setFooter({ text: 'Utilisez ce tutoriel pour apprendre comment faire un prono.' });

        // Envoi du message classique et de l'embed dans une seule réponse
        await interaction.reply({
            content: 'https://cdn.discordapp.com/attachments/1186717976599220275/1274265094301286440/RPReplay_Final1723878697.mov?ex=66cad9d9&is=66c98859&hm=5f89ec19d7300da4af5176ae3d4f0542df2611abaa293c3b3e8ee0271f44a53c&',
            embeds: [tutorialEmbed]
        });
    }
};
