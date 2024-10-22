const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qui')
        .setDescription('Sondage pour savoir qui sera sur Discord ou Telegram')
        .addIntegerOption(option =>
            option.setName('duree')
                .setDescription('Durée du sondage en minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1440))
        .addStringOption(option =>
            option.setName('match')
                .setDescription('Match ou événement concerné')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Question supplémentaire pour le sondage')
                .setRequired(false)),

    async run(interaction) {
        const duree = interaction.options.getInteger('duree');
        const match = interaction.options.getString('match');
        const questionSupplementaire = interaction.options.getString('question');

        const votes = new Map();
        let discordVotes = 0;
        let telegramVotes = 0;
        let undecidedVotes = 0;

        function createEmbed() {
            const embed = new EmbedBuilder()
                .setColor('#1F8B4C')
                .setTitle(`📊 Sondage : Où serez-vous connecté pour ${match} ?`)
                .setDescription('Cliquez sur l\'un des boutons ci-dessous pour indiquer où vous serez connecté.')
                .addFields(
                    { name: 'Durée du sondage', value: `${duree} minute${duree > 1 ? 's' : ''}`, inline: true },
                    { name: 'Fin du sondage', value: '.', inline: true },
                    { name: 'Discord', value: `${discordVotes} personne${discordVotes > 1 ? 's' : ''}`, inline: true },
                    { name: 'Telegram', value: `${telegramVotes} personne${telegramVotes > 1 ? 's' : ''}`, inline: true },
                    { name: 'Indécis', value: `${undecidedVotes} personne${undecidedVotes > 1 ? 's' : ''}`, inline: true },
                    { name: 'Participants totaux', value: `${votes.size}`, inline: true },
                    { name: 'Diffuseurs Discord nécessaires', value: `${Math.ceil(discordVotes / 50)} diffuseur${Math.ceil(discordVotes / 50) > 1 ? 's' : ''}`, inline: true }
                );

            if (questionSupplementaire) {
                embed.addFields({ name: 'Question supplémentaire', value: questionSupplementaire });
            }

            return embed;
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('discord')
                    .setLabel('Discord')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('telegram')
                    .setLabel('Telegram')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('undecided')
                    .setLabel('Je ne sais pas encore')
                    .setStyle(ButtonStyle.Danger)
            );

        const message = await interaction.reply({ embeds: [createEmbed()], components: [row], fetchReply: true });

        const filter = i => ['discord', 'telegram', 'undecided'].includes(i.customId);
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: duree * 60000 });

        collector.on('collect', async i => {
            const userId = i.user.id;
            const previousVote = votes.get(userId);

            if (previousVote) {
                if (previousVote === 'discord') discordVotes--;
                else if (previousVote === 'telegram') telegramVotes--;
                else if (previousVote === 'undecided') undecidedVotes--;
            }

            votes.set(userId, i.customId);
            if (i.customId === 'discord') discordVotes++;
            else if (i.customId === 'telegram') telegramVotes++;
            else if (i.customId === 'undecided') undecidedVotes++;

            await message.edit({ embeds: [createEmbed()] });

            if (previousVote) {
                await i.reply({ content: `Votre vote a été changé de ${previousVote} à ${i.customId}.`, ephemeral: true });
            } else {
                await i.reply({ content: `Votre vote pour ${i.customId} a été pris en compte.`, ephemeral: true });
            }
        });

        collector.on('end', async () => {
            const discordUsers = [...votes].filter(([, value]) => value === 'discord').map(([key]) => `<@${key}>`);
            const telegramUsers = [...votes].filter(([, value]) => value === 'telegram').map(([key]) => `<@${key}>`);
            const undecidedUsers = [...votes].filter(([, value]) => value === 'undecided').map(([key]) => `<@${key}>`);

            const resultsEmbed = createEmbed()
                .setTitle(`📊 Résultats du sondage pour ${match}`)
                .setDescription('Voici les résultats finaux du sondage :')
                .addFields(
                    { name: 'Participants Discord', value: discordUsers.join(', ') || 'Aucun', inline: false },
                    { name: 'Participants Telegram', value: telegramUsers.join(', ') || 'Aucun', inline: false },
                    { name: 'Participants indécis', value: undecidedUsers.join(', ') || 'Aucun', inline: false }
                );

            await interaction.followUp({ embeds: [resultsEmbed], components: [] });
        });
    },
};