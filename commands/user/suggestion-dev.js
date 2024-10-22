const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

// L'ID du développeur qui recevra les suggestions
const DEVELOPER_ID = '612216978517655553'; // Remplacez par l'ID réel
// L'ID du canal pour les suggestions en discussion avec l'admin
const ADMIN_DISCUSSION_CHANNEL_ID = '1276861952668205178'; // Remplacez par l'ID réel

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Envoyer une suggestion au développeur')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Votre suggestion pour le développeur')
                .setRequired(true)),

    async run(interaction) {
        const suggestion = interaction.options.getString('suggestion');
        const user = interaction.user;

        // Créer un embed pour la confirmation à l'utilisateur
        const userEmbed = new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle('💡 Suggestion Envoyée')
            .setDescription('Votre suggestion a été envoyée avec succès au développeur. Merci de votre contribution !')
            .addFields(
                { name: 'Votre suggestion', value: suggestion }
            )
            .setFooter({ text: 'Merci pour votre feedback !', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Créer un embed pour le développeur
        const devEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🔔 Nouvelle Suggestion')
            .setDescription(`Une nouvelle suggestion a été reçue de ${user.tag}`)
            .addFields(
                { name: 'Suggestion', value: suggestion },
                { name: "ID de l'utilisateur", value: user.id }
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: 'Suggestion reçue via la commande /suggestion', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Créer les boutons
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('accept_suggestion')
                    .setLabel('Accepter')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('pending_suggestion')
                    .setLabel('En attente')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('discuss_suggestion')
                    .setLabel('Discussion avec admin')
                    .setStyle(ButtonStyle.Primary)
            );

        try {
            // Envoyer la suggestion au développeur avec les boutons
            const developer = await interaction.client.users.fetch(DEVELOPER_ID);
            const devMessage = await developer.send({ embeds: [devEmbed], components: [buttons] });

            // Répondre à l'utilisateur
            await interaction.reply({ embeds: [userEmbed], ephemeral: true });

            // Collecter les interactions de bouton
            const collector = devMessage.createMessageComponentCollector({ time: 604800000 }); // 7 jours

            collector.on('collect', async i => {
                if (i.user.id === DEVELOPER_ID) {
                    switch (i.customId) {
                        case 'accept_suggestion':
                            await user.send('Votre suggestion a été acceptée ! Merci pour votre contribution.');
                            break;
                        case 'pending_suggestion':
                            await user.send('Votre suggestion est en attente de traitement. Nous vous tiendrons informé.');
                            break;
                        case 'discuss_suggestion':
                            const adminChannel = await interaction.client.channels.fetch(ADMIN_DISCUSSION_CHANNEL_ID);
                            if (adminChannel && adminChannel.type === ChannelType.GuildText) {
                                await adminChannel.send({ embeds: [devEmbed], content: 'Cette suggestion est en discussion.' });
                            }
                            break;
                    }
                    await i.update({ components: [] });
                    collector.stop();
                }
            });
        } catch (error) {
            console.error("Erreur lors de l'envoi de la suggestion:", error);
            await interaction.reply({ content: "Une erreur est survenue lors de l'envoi de votre suggestion. Veuillez réessayer plus tard.", ephemeral: true });
        }
    },
};