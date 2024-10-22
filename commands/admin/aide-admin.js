const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aide-admin')
        .setDescription('Affiche une liste des commandes de modération et de pronostics disponibles pour les administrateurs')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🛠️ Aide - Commandes Admin')
            .setDescription('Voici une liste des commandes de modération et de pronostics disponibles. Utilisez les boutons ci-dessous pour naviguer entre les différentes catégories.')
            .setColor('#1F8B4C')
            .addFields(
                { name: '🔨 Sanctions', value: '`/moderate ban`, `/moderate kick`, `/moderate mute`, `/moderate tempmute`, `/moderate tempban`, `/moderate unban`, `/moderate warn`, `/moderate clearwarns`' },
                { name: '🧹 Gestion des messages', value: '`/moderate purge`, `/moderate slowmode`' },
                { name: '🔒 Gestion des canaux', value: '`/moderate lock`, `/moderate unlock`' },
                { name: '📊 Informations', value: '`/moderate warnsee`, `/moderate bansee`' },
                { name: '📢 Autres', value: '`/moderate report`, `/moderate unmute`' },
                { name: '🏆 Pronostics', value: '`/unlock_pronos`, `/validate_match`, `/update-match`, `/pronostic results`' }
            )
            .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('sanctions')
                    .setLabel('Sanctions')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('messages')
                    .setLabel('Messages')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('channels')
                    .setLabel('Canaux')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('info')
                    .setLabel('Informations')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('pronostics')
                    .setLabel('Pronostics')
                    .setStyle(ButtonStyle.Primary)
            );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = i => i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const newEmbed = new EmbedBuilder()
            .setColor('#1F8B4C')
                .setFooter({ text: `Demandé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            switch (i.customId) {
                case 'sanctions':
                    newEmbed.setTitle('🔨 Commandes de Sanctions')
                        .setDescription('Détails sur les commandes de sanctions :')
                        .addFields(
                            { name: '/moderate ban', value: 'Bannir un utilisateur du serveur.' },
                            { name: '/moderate kick', value: 'Expulser un utilisateur du serveur.' },
                            { name: '/moderate mute', value: 'Rendre muet un utilisateur.' },
                            { name: '/moderate tempmute', value: 'Rendre muet un utilisateur temporairement.' },
                            { name: '/moderate tempban', value: 'Bannir un utilisateur temporairement.' },
                            { name: '/moderate unban', value: 'Débannir un utilisateur.' },
                            { name: '/moderate warn', value: 'Donner un avertissement à un utilisateur.' },
                            { name: '/moderate clearwarns', value: 'Effacer les avertissements d\'un utilisateur.' }
                        );
                    break;
                case 'messages':
                    newEmbed.setTitle('🧹 Commandes de Gestion des Messages')
                        .setDescription('Détails sur les commandes de gestion des messages :')
                        .addFields(
                            { name: '/moderate purge', value: 'Supprimer un certain nombre de messages dans un canal.' },
                            { name: '/moderate slowmode', value: 'Définir le mode lent pour un canal.' }
                        );
                    break;
                case 'channels':
                    newEmbed.setTitle('🔒 Commandes de Gestion des Canaux')
                        .setDescription('Détails sur les commandes de gestion des canaux :')
                        .addFields(
                            { name: '/moderate lock', value: 'Verrouiller un canal pour empêcher les messages.' },
                            { name: '/moderate unlock', value: 'Déverrouiller un canal pour permettre les messages.' }
                        );
                    break;
                case 'info':
                    newEmbed.setTitle('📊 Commandes d\'Informations')
                        .setDescription('Détails sur les commandes d\'informations :')
                        .addFields(
                            { name: '/moderate warnsee', value: 'Voir les avertissements d\'un utilisateur.' },
                            { name: '/moderate bansee', value: 'Voir les bannissements actifs sur le serveur.' }
                        );
                    break;
                case 'pronostics':
                    newEmbed.setTitle('🏆 Commandes de Pronostics')
                        .setDescription('Détails sur les commandes de pronostics :')
                        .addFields(
                            { name: '/unlock_pronos', value: 'Débloque les pronostics pour le match en cours' },
                            { name: '/validate_match', value: 'Soumet le résultat du match en cours et ' },
                            { name: '/update-match', value: "Mettre à jour les informations du match courant. (Attention date et heure comme ceci [mettre les tirets] : année-mois-jour Heure:Minute [2024-12-25 12:00]" }
                        );
                    break;
            }

            await i.update({ embeds: [newEmbed], components: [row] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: 'Le temps pour interagir avec les boutons est écoulé.', components: [] });
            }
        });
    }
};