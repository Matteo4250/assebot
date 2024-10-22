const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');

const PRONOS_LOCK_FILE = path.join(__dirname, '..', '..', 'data', 'pronos_lock.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock_pronos')
        .setDescription('Bloque les pronostics pour le match en cours')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async run(interaction) {
        try {
            // Mettre à jour l'état de verrouillage
            const lockStatus = { locked: true };
            await fs.writeFile(PRONOS_LOCK_FILE, JSON.stringify(lockStatus, null, 2));

            await interaction.reply({ content: 'Les pronostics ont été bloqués pour le match en cours.', ephemeral: true });
        } catch (error) {
            console.error('Erreur lors du verrouillage des pronostics:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors du blocage des pronostics.', ephemeral: true });
        }
    },
};
