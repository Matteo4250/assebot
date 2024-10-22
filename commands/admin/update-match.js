
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { scheduleReminders } = require('../../matchReminders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-match')
        .setDescription('Mettre à jour les informations du match courant')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('equipe_adverse')
                .setDescription('Nom de l\'équipe adverse')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('cote_adverse')
                .setDescription('Cote de l\'équipe adverse')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('cote_asse')
                .setDescription('Cote de l\'ASSE')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('cote_match_nul')
                .setDescription('Cote du match nul')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('date_heure')
                .setDescription('Date et heure du match (format: YYYY-MM-DD HH:mm)')
                .setRequired(true)),

    async run(interaction) {
        try {
            const opponent = interaction.options.getString('equipe_adverse');
            const oddsOpponent = interaction.options.getNumber('cote_adverse');
            const oddsAsse = interaction.options.getNumber('cote_asse');
            const oddsDraw = interaction.options.getNumber('cote_match_nul');
            const matchTime = new Date(interaction.options.getString('date_heure'));

            const matchData = {
                id: Date.now().toString(),
                opponent: opponent,
                odds: {
                    opponent: oddsOpponent,
                    asse: oddsAsse,
                    draw: oddsDraw
                },
                matchTime: matchTime.toISOString()
            };

            const filePath = path.join(__dirname, '..', '..', 'data', 'current_match.json');
            await fs.writeFile(filePath, JSON.stringify(matchData, null, 2));

            // Reprogrammer les rappels
            await scheduleReminders(interaction.client);

            await interaction.reply({ content: 'Les informations du match courant ont été mises à jour avec succès !', ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du match :', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la mise à jour du match.', ephemeral: true });
        }
    },
};
