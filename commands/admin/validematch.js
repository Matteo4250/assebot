const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const PRONOS_FILE = path.join(__dirname, '..', '..', 'data', 'pronos.json');
const MATCH_FILE = path.join(__dirname, '..', '..', 'data', 'current_match.json');
const LEADERBOARD_FILE = path.join(__dirname, '..', '..', 'data', 'leaderboard.json');
const PLAYERS_FILE = path.join(__dirname, '..', '..', 'data', 'players.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('validate_match')
        .setDescription('Valider le match et attribuer les points')
        .addNumberOption(option =>
            option.setName('score_asse')
                .setDescription('Score de l\'ASSE')
                .setRequired(true))
        .addNumberOption(option =>
            option.setName('score_adversaire')
                .setDescription('Score de l\'adversaire')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(interaction) {
        const scoreASSE = interaction.options.getNumber('score_asse');
        const scoreAdversaire = interaction.options.getNumber('score_adversaire');

        try {
            // Lire les fichiers
            const matchData = await fs.readFile(MATCH_FILE, 'utf8');
            const leaderboardData = await fs.readFile(LEADERBOARD_FILE, 'utf8').catch(() => '{}');
            const playersData = await fs.readFile(PLAYERS_FILE, 'utf8');

            let match = JSON.parse(matchData);
            let leaderboard = JSON.parse(leaderboardData);
            const players = JSON.parse(playersData);

            // Vérifier si le match est déjà validé
            if (match.isValidated) {
                await interaction.reply({ content: 'Ce match a déjà été validé.', ephemeral: true });
                return;
            }

            // Sélection des buteurs un par un
            const selectedScorers = [];
            let remainingGoals = scoreASSE;

            const initialEmbed = new EmbedBuilder()
                .setColor('#1F8B4C')
                .setTitle('⚽ Validation du match')
                .setDescription(`Score final : ASSE ${scoreASSE} - ${scoreAdversaire} ${match.opponent}\nVeuillez sélectionner les buteurs.`);

            await interaction.reply({ embeds: [initialEmbed], ephemeral: true });
            await askForScorer(interaction, players, selectedScorers, remainingGoals, match, leaderboard, scoreASSE, scoreAdversaire);

        } catch (error) {
            console.error('Erreur lors de la validation du match:', error);
            await interaction.followUp({ content: 'Une erreur est survenue lors de la validation du match.', ephemeral: true });
        }
    },
};

async function askForScorer(interaction, players, selectedScorers, remainingGoals, match, leaderboard, scoreASSE, scoreAdversaire) {
    if (remainingGoals === 0) {
        await validateMatch(interaction, match, leaderboard, scoreASSE, scoreAdversaire, selectedScorers);
        return;
    }

    const selectScorer = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('scorer')
                .setPlaceholder(`Choisissez le buteur ${selectedScorers.length + 1}`)
                .addOptions(players.players.map(player => ({
                    label: player,
                    value: player,
                })))
        );

    const embedScorer = new EmbedBuilder()
        .setColor('#1F8B4C')
        .setTitle('⚽ Sélection des buteurs')
        .setDescription(`Choisissez le buteur **${selectedScorers.length + 1}** (${remainingGoals} but(s) restant(s)):`)
        .addFields(
            { name: 'Buteurs sélectionnés', value: selectedScorers.join(', ') || 'Aucun pour le moment', inline: false }
        );

    const message = await interaction.editReply({ embeds: [embedScorer], components: [selectScorer] });

    try {
        const response = await message.awaitMessageComponent({ 
            componentType: ComponentType.StringSelect, 
            filter: i => i.customId === 'scorer' && i.user.id === interaction.user.id, 
            time: 60000 
        });

        await response.deferUpdate();
        const selectedScorer = response.values[0];
        selectedScorers.push(selectedScorer);
        remainingGoals--;
        
        await askForScorer(interaction, players, selectedScorers, remainingGoals, match, leaderboard, scoreASSE, scoreAdversaire);
    } catch (error) {
        if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
            const embedTimeout = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⏳ Temps écoulé')
                .setDescription("La validation du match a été annulée.");
            await interaction.followUp({ embeds: [embedTimeout], ephemeral: true });
        } else {
            console.error('Erreur lors de la sélection du buteur:', error);
            const embedError = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription("Une erreur s'est produite. Veuillez réessayer.");
            await interaction.followUp({ embeds: [embedError], ephemeral: true });
        }
    }
}


async function validateMatch(interaction, match, leaderboard, scoreASSE, scoreAdversaire, selectedScorers) {
    try {
        // Calculer les points pour chaque pronostic
        const pronosData = await fs.readFile(PRONOS_FILE, 'utf8');
        const pronos = JSON.parse(pronosData);

        for (const prono of pronos) {
            if (prono.matchId === match.id) {
                let points = 0;
                const pronoResult = prono.homeScore > prono.opponentScore ? 'victoire' : 
                                    prono.homeScore < prono.opponentScore ? 'défaite' : 'nul';
                const matchResult = scoreASSE > scoreAdversaire ? 'victoire' : 
                                    scoreASSE < scoreAdversaire ? 'défaite' : 'nul';
                const scoreExact = prono.homeScore === scoreASSE && prono.opponentScore === scoreAdversaire;
                const correctResult = pronoResult === matchResult;
                const correctButeurs = prono.scorers.some(scorer => selectedScorers.includes(scorer));

                // Attribution des points selon les règles définies
                if (scoreExact && correctButeurs && prono.scorers.length === selectedScorers.length && pronoResult !== 'nul') {
                    points = 5;
                } else if (correctResult && correctButeurs && pronoResult !== 'nul') {
                    points = 4;
                } else if (scoreExact) {
                    points = 3;
                } else if (correctResult || (pronoResult === 'victoire' && matchResult === 'victoire' && correctButeurs)) {
                    points = 2;
                } else if (!correctResult && correctButeurs) {
                    points = 1;
                }

                // Mettre à jour le leaderboard
                if (!leaderboard[prono.userId]) {
                    leaderboard[prono.userId] = { username: prono.username, points: 0 };
                }
                leaderboard[prono.userId].points += points;

                console.log(`Points attribués à ${prono.username}: ${points}`);
            }
        }

        // Marquer le match comme validé
        match.isValidated = true;
        await fs.writeFile(MATCH_FILE, JSON.stringify(match, null, 2));

        // Sauvegarder le leaderboard mis à jour
        await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));

        const finalEmbed = new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle('✅ Match validé')
            .setDescription(`Le match a été validé et les points ont été attribués !`)
            .addFields(
                { name: 'Score final', value: `ASSE ${scoreASSE} - ${scoreAdversaire} ${match.opponent}`, inline: true },
                { name: 'Buteurs', value: selectedScorers.join(', ') || 'Aucun', inline: true }
            );

        await interaction.editReply({ embeds: [finalEmbed], components: [] });
    } catch (error) {
        console.error('Erreur lors de la validation finale du match:', error);
        await interaction.followUp({ content: 'Une erreur est survenue lors de la validation finale du match.', ephemeral: true });
    }
}