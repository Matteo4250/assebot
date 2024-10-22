const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diffusion')
        .setDescription('Configurer et partager les liens de diffusion pour le match.')
        .addStringOption(option =>
            option.setName('adversaire')
                .setDescription('Nom de l\'équipe adverse')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('heure')
                .setDescription('Heure du match (format HH:MM)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('lien1')
                .setDescription('Premier lien de diffusion')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('lien2')
                .setDescription('Deuxième lien de diffusion (optionnel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('lien3')
                .setDescription('Troisième lien de diffusion (optionnel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('lien4')
                .setDescription('Quatrième lien de diffusion (optionnel)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('lien5')
                .setDescription('Cinquième lien de diffusion (optionnel)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async run(interaction) {
        const adversaire = interaction.options.getString('adversaire');
        const heure = interaction.options.getString('heure');
        const coteASSE = interaction.options.getString('cote_asse');
        const coteNul = interaction.options.getString('cote_nul');
        const coteAdversaire = interaction.options.getString('cote_adversaire');
        const lien1 = interaction.options.getString('lien1');
        const lien2 = interaction.options.getString('lien2');
        const lien3 = interaction.options.getString('lien3');
        const lien4 = interaction.options.getString('lien4');
        const lien5 = interaction.options.getString('lien5');

        let liens = `🔗 [Lien 1](${lien1})`;
        if (lien2) liens += `\n🔗 [Lien 2](${lien2})`;
        if (lien3) liens += `\n🔗 [Lien 3](${lien3})`;
        if (lien4) liens += `\n🔗 [Lien 4](${lien4})`;
        if (lien5) liens += `\n🔗 [Lien 5](${lien5})`;

        const embed = new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle(`🏆 ASSE vs ${adversaire} 🏆`)
            .setDescription(`
🟢⚪ **AS Saint-Étienne** vs **${adversaire}**
━━━━━━━━━━━━━━━━━━━━━━━━
⏰ **Heure du match:** ${heure}


📺 **Liens de diffusion:**
${liens}
            `)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/AS_Saint-Etienne-logo_2022.svg/1642px-AS_Saint-Etienne-logo_2022.svg.png')
            .setFooter({ 
                text: 'Allez les Verts ! | Utilisez /aide pour plus d\'infos', 
                iconURL: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/AS_Saint-Etienne-logo_2022.svg/1642px-AS_Saint-Etienne-logo_2022.svg.png'
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};