const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Chemins vers les fichiers JSON
const PRONOS_FILE = path.join(__dirname, '..', '..', 'data', 'pronos.json');
const MATCH_FILE = path.join(__dirname, '..', '..', 'data', 'current_match.json');

// Variable pour stocker le match actuel
let currentMatch = null;
let lastMatchUpdateTime = 0;

async function loadCurrentMatch() {
    try {
        const data = await fs.readFile(MATCH_FILE, 'utf8');
        const matchData = JSON.parse(data);
        currentMatch = matchData;
        lastMatchUpdateTime = Date.now();
    } catch (error) {
        console.error('Erreur lors du chargement du match actuel:', error);
        currentMatch = null;
    }
}

async function checkAndUpdateMatch() {
    const currentTime = Date.now();
    if (currentTime - lastMatchUpdateTime > 60000) { // Vérifier toutes les minutes
        await loadCurrentMatch();
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('all_pronos')
        .setDescription('Affiche tous les pronostics soumis pour le match en cours'),
    async run(interaction) { 
        await checkAndUpdateMatch();

        if (!currentMatch) {
            const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('❌ Aucun match programmé')
            .setDescription("Il n'y a pas de match actuellement programmé.")
            .addFields(
                { name: '📅 Prochain match', value: "Consultez le calendrier du club pour plus d'informations.", inline: false },
                { name: '🔔 Restez informé', value: "Un message sera envoyé lorsqu'un nouveau match sera programmé.", inline: false }
            )
            .setFooter({ text: "Utilisez /aide pour plus d'informations sur les commandes disponibles." })
            .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            const pronosData = await fs.readFile(PRONOS_FILE, 'utf8');
            const pronos = JSON.parse(pronosData);

          
            const matchPronos = pronos.filter(p => p.matchId === currentMatch.id);

            if (matchPronos.length === 0) {
                const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('📊 Aucun pronostic soumis')
                .setDescription(`Aucun pronostic n'a encore été soumis pour le match contre ${opponent}.`)
                .addFields(
                    { name: '⏳ Temps restant', value: 'Il est encore temps de soumettre votre pronostic !', inline: false },
                    { name: '🎮 Comment participer', value: 'Utilisez la commande /prono pour soumettre votre pronostic.', inline: false }
                )
                .setFooter({ text: 'Participez et tentez de remporter des points !' })
                .setTimestamp();
        
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }

            const itemsPerPage = 15;
            const pages = Math.ceil(matchPronos.length / itemsPerPage);

            const generateEmbed = (page) => {
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageItems = matchPronos.slice(start, end);

                return new EmbedBuilder()
                .setColor('#1F8B4C')
        .setTitle(`📊 Pronostics: ASSE vs ${currentMatch.opponent}`)
        .setDescription(`Voici les pronostics soumis pour le match à venir. Bonne chance à tous !`)
        .addFields(
            { name: '🗓️ Date du match', value: new Date(currentMatch.matchTime).toLocaleString('fr-FR'), inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '📈 Pronostics', value: pageItems.map(p => `**${p.username}**: ${p.homeScore}-${p.opponentScore} ${p.scorers.length ? `(⚽ ${p.scorers.join(', ')})` : ''}`).join('\n') }
        )
        .setFooter({ text: ` • Utilisez les boutons pour naviguer` })
        .setTimestamp();
}


            let currentPage = 1;
            const embed = generateEmbed(currentPage);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('Précédent')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Suivant')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === pages)
                );

            const message = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: "Vous ne pouvez pas utiliser ces boutons.", ephemeral: true });
                }

                if (i.customId === 'previous') {
                    currentPage--;
                } else if (i.customId === 'next') {
                    currentPage++;
                }


                // bouton
                const newEmbed = generateEmbed(currentPage);
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Précédent')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Suivant')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === pages)
                    );

                await i.update({ embeds: [newEmbed], components: [newRow] });
            });

            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous')
                            .setLabel('Précédent')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Suivant')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    );
                interaction.editReply({ components: [disabledRow] });
            });

        } catch (error) {
            console.error('Erreur lors de la lecture des pronostics:', error);
            const embedError = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erreur')
            .setDescription("Une erreur s'est produite lors de la récupération des pronostics.")
            .addFields(
                { name: '🔄 Que faire ?', value: 'Veuillez réessayer dans quelques instants.', inline: false },
                { name: '📞 Support', value: 'Si le problème persiste, contactez un administrateur.', inline: false }
            )
            .setFooter({ text: 'Nous nous excusons pour la gêne occasionnée.' })
            .setTimestamp();
            await interaction.reply({ embeds: [embedError], ephemeral: true });
        }
    },
};
