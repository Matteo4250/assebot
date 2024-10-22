const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserRanking, getWeeklyRanking, getMonthlyRanking } = require('../../models/UserRanking');

const TIERS = [
    { name: 'Bronze', threshold: 0, emoji: '🥉' },
    { name: 'Silver', threshold: 100, emoji: '🥈' },
    { name: 'Gold', threshold: 500, emoji: '🥇' },
    { name: 'Platinum', threshold: 1000, emoji: '💎' },
    { name: 'Diamond', threshold: 2000, emoji: '🏆' }
];

function getUserTier(points) {
    for (let i = TIERS.length - 1; i >= 0; i--) {
        if (points >= TIERS[i].threshold) {
            return TIERS[i];
        }
    }
    return TIERS[0];
}

function getProgressBar(points) {
    const tier = getUserTier(points);
    const nextTier = TIERS[TIERS.indexOf(tier) + 1] || tier;
    const progress = (points - tier.threshold) / (nextTier.threshold - tier.threshold);
    const filledSquares = Math.floor(progress * 10);
    return '▓'.repeat(filledSquares) + '░'.repeat(10 - filledSquares);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Affiche le classement des pronostiqueurs.')
        .addStringOption(option =>
            option.setName('période')
                .setDescription('Choisissez la période pour le classement')
                .setRequired(true)
                .addChoices(
                    { name: 'Global', value: 'global' }
                )),
    async run(interaction) {
        try {
            const period = interaction.options.getString('période');
            let leaderboard;
            let title;

            switch (period) {
                case 'weekly':
                    leaderboard = await getWeeklyRanking();
                    title = '🏆 Classement Hebdomadaire';
                    break;
                case 'monthly':
                    leaderboard = await getMonthlyRanking();
                    title = '🏆 Classement Mensuel';
                    break;
                default:
                    leaderboard = await getUserRanking();
                    title = '🏆 Classement Global';
            }

            if (Object.keys(leaderboard).length === 0) {
                await interaction.reply({ content: 'Le classement est actuellement vide.', ephemeral: true });
                return;
            }

            const sortedLeaderboard = Object.entries(leaderboard)
                .map(([userId, userData]) => ({ userId, username: userData.username, points: userData.points }))
                .sort((a, b) => b.points - a.points);

            const top10 = sortedLeaderboard.slice(0, 10);
            let leaderboardContent = '';
            top10.forEach((user, index) => {
                const tier = getUserTier(user.points);
                leaderboardContent += `${index + 1}. ${tier.emoji} **${user.username}** - ${user.points} pts\n`;
            });

            const userRank = sortedLeaderboard.findIndex(user => user.userId === interaction.user.id);
            let userRankInfo = '';
            if (userRank !== -1) {
                const user = sortedLeaderboard[userRank];
                const tier = getUserTier(user.points);
                const nextTier = TIERS[TIERS.indexOf(tier) + 1] || tier;
                userRankInfo = `Rang : **#${userRank + 1}**\nPoints : **${user.points}**\nNiveau : ${tier.emoji} ${tier.name}\n`;
                userRankInfo += `Progression : ${getProgressBar(user.points)} (${user.points - tier.threshold}/${nextTier.threshold - tier.threshold})`;
            } else {
                userRankInfo = "Vous n'êtes pas encore dans le classement. Participez pour apparaître !";
            }

            const embed = new EmbedBuilder()
                .setColor('#1F8B4C')
                .setTitle(title)
                .setDescription(`Voici le top 10 des meilleurs pronostiqueurs !`)
                .addFields(
                    { name: '🏅 Top 10', value: leaderboardContent, inline: false },
                    { name: '\u200B', value: '\u200B' },
                    { name: '🔍 Votre position', value: userRankInfo, inline: false },
                    { name: '🏅 Niveaux', value: TIERS.map(tier => `${tier.emoji} ${tier.name}: ${tier.threshold}+ points`).join('\n'), inline: false}
                )
                .setThumbnail('https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/AS_Saint-Etienne-logo_2022.svg/1642px-AS_Saint-Etienne-logo_2022.svg.png')
                .setFooter({
                    text: 'Continuez à participer pour améliorer votre classement !',
                    iconURL: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/AS_Saint-Etienne-logo_2022.svg/1642px-AS_Saint-Etienne-logo_2022.svg.png'
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la récupération du classement :', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de la récupération du classement.', ephemeral: true });
        }
    },
};