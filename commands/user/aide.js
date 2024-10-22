const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path'); // Pour gérer les chemins des fichiers
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Affiche la liste des commandes disponibles')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async run(interaction) {
    const commandsPath = path.join(__dirname, '../user');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const commandDescriptions = commandFiles.map(file => {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      return { name: `/${command.data.name}`, value: command.data.description };
    });

    const embed = new EmbedBuilder()
    .setColor('#1F8B4C')
      .setTitle('📚 Guide des Commandes - Bot de Pronostics ASSE')
      .setDescription('Voici une liste de toutes les commandes disponibles pour les utilisateurs réguliers.')
      .setThumbnail('https://example.com/asse-logo.png')
      .addFields(commandDescriptions)
      .addFields(
        { name: '\u200B', value: '🏆 __Système de Points__' },
        { name: '5️⃣ points', value: 'Score exact + tous les buteurs (Cote Victoire: 2, Cote Défaite: 3.75)', inline: true },
        { name: '4️⃣ points', value: 'Score exact + 1 buteur OU Défaite sans but ASSE (Cote Victoire: 2, Cote Défaite: 3.75)', inline: true },
        { name: '3️⃣ points', value: 'Égalité sans but ASSE (Cote Nul: 3.5) OU Score exact', inline: true },
        { name: '2️⃣ points', value: 'Victoire ASSE (mauvais score) + 1 bon buteur (Cote Victoire: 2, Cote Défaite: 3.75)', inline: true },
        { name: '1️⃣ point', value: 'Bon(s) buteur(s) mais mauvais score', inline: true },
        { name: '0️⃣ point', value: 'Aucun critère respecté', inline: true }
      )
      .setFooter({ text: 'Bot de Pronostics ASSE | Que le meilleur gagne! 🍀', iconURL: 'https://cdn.discordapp.com/attachments/1117185595643539607/1276865390504312893/ASSE-EVECT-asse-logo-591343867.png?ex=66cb1510&is=66c9c390&hm=f2db561ee19c2fb06534ec67b6e6161e3d23ef617089bba3715d5802f02074a3&' })
      .setTimestamp();



    // Répondre avec l'embed et les boutons
    await interaction.reply({ embeds: [embed], ephemeral: true });

  
  }
};
