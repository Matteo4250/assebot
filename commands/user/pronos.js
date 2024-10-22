const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Chemins vers les fichiers JSON
const PRONOS_FILE = path.join(__dirname, '..', '..', 'data', 'pronos.json');
const PLAYERS_FILE = path.join(__dirname, '..', '..', 'data', 'players.json');
const MATCH_FILE = path.join(__dirname, '..', '..', 'data', 'current_match.json');
const PRONOS_LOCK_FILE = path.join(__dirname, '..', '..', 'data', 'pronos_lock.json');

// Map pour suivre les utilisateurs en train de faire un pronostic
const activeUsers = new Map();

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

async function isPronosLocked() {
    try {
        const data = await fs.readFile(PRONOS_LOCK_FILE, 'utf8');
        const lockStatus = JSON.parse(data);
        return lockStatus.locked || false;
    } catch (error) {
        console.error('Erreur lors de la vérification du verrouillage des pronostics:', error);
        return false;
    }
}

async function handleNewPronostic(client, user) {
    try {
        const pronosData = await fs.readFile(PRONOS_FILE, 'utf-8');
        const pronos = JSON.parse(pronosData);
        
        // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        
        // Compter le nombre de pronostics pour aujourd'hui
        const todayPronosCount = pronos.filter(prono => prono.timestamp.startsWith(today)).length;
        
        // Annoncer le nouveau pronostic
        await announcePrediction(client, user, todayPronosCount);
    } catch (error) {
        console.error('Erreur lors de l\'annonce du pronostic:', error);
    }
}

async function announcePrediction(client, user, pronosticCount) {
    const channel = client.channels.cache.get('1276861952668205178'); // Remplacez par l'ID réel du canal
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('#1F8B4C')
        .setTitle('🎉 Nouveau Pronostic !')
        .setDescription(`**${user.username}** vient de réaliser un pronostic.`)
        .addFields(
            { name: 'Pronostic du jour', value: `C'est le **${pronosticCount}ème** pronostic du jour.`, inline: true },
        )
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pronos')
        .setDescription('Faire un pronostic pour le match en cours'),
    async run(interaction) {
        await checkAndUpdateMatch();

        // Vérification si les pronostics sont verrouillés
        const locked = await isPronosLocked();
        if (locked) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Pronostics Verrouillés')
                .setDescription("Les pronostics sont actuellement verrouillés pour ce match.");
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (!currentMatch) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription("Aucun match n'est actuellement programmé.");
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const userId = interaction.user.id;

        // Vérifier le nombre de pronostics de l'utilisateur
        try {
            const pronosData = await fs.readFile(PRONOS_FILE, 'utf8');
            const pronos = JSON.parse(pronosData);
            const userPronos = pronos.filter(p => p.userId === userId && p.matchId === currentMatch.id);
            if (userPronos.length >= 30) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🚫 Limite atteinte')
                    .setDescription("Vous avez déjà fait 30 pronostics pour ce match.");
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        } catch (error) {
            // Le fichier n'existe pas encore ou est vide, on continue
        }

        if (activeUsers.has(userId)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⚠️ Pronostic en cours')
                .setDescription("Vous êtes déjà en train de faire un pronostic.");
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        activeUsers.set(userId, true);

        // Charger la liste des joueurs depuis le fichier JSON
        let assePlayers;
        try {
            const playersData = await fs.readFile(PLAYERS_FILE, 'utf8');
            const playersJson = JSON.parse(playersData);
            assePlayers = playersJson.players;
        } catch (error) {
            console.error('Erreur lors du chargement de la liste des joueurs:', error);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Erreur')
                .setDescription("Une erreur s'est produite lors du chargement de la liste des joueurs. Veuillez réessayer plus tard.");
            await interaction.reply({ embeds: [embed], ephemeral: true });
            activeUsers.delete(userId);
            return;
        }

        const selectOpponentScore = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('opponent_score')
                    .setPlaceholder(`Score de ${currentMatch.opponent}`)
                    .addOptions(Array.from({ length: 10 }, (_, i) => ({
                        label: i.toString(),
                        value: i.toString(),
                    })))
            );

        const embed = new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle('⚽ Pronostic')
            .setDescription(`Choisissez le score de **${currentMatch.opponent}** :`);

        const message = await interaction.reply({ embeds: [embed], components: [selectOpponentScore], ephemeral: true, fetchReply: true });

        const filter = i => i.customId === 'opponent_score' && i.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter, time: 120000 });

        collector.on('collect', async i => {
            const opponentScore = parseInt(i.values[0]);
            
            const selectHomeScore = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('home_score')
                        .setPlaceholder(`Score de l'ASSE`)
                        .addOptions(Array.from({ length: 10 }, (_, i) => ({
                            label: i.toString(),
                            value: i.toString(),
                        })))
                );

            const embedHomeScore = new EmbedBuilder()
                .setColor('#1F8B4C')
                .setTitle('⚽ Pronostic')
                .setDescription("Choisissez le score de **l'ASSE** :");

            await i.update({ embeds: [embedHomeScore], components: [selectHomeScore] });

            const homeCollector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, filter: i => i.customId === 'home_score' && i.user.id === interaction.user.id, time: 120000 });

            homeCollector.on('collect', async i => {
                const homeScore = parseInt(i.values[0]);
                
                // Sélection des buteurs un par un
                const selectedScorers = [];
                let remainingGoals = homeScore;

                const askForScorer = async (i) => {
                    if (remainingGoals === 0) {
                        // Tous les buts ont été attribués
                        await savePronostic(interaction, currentMatch, opponentScore, homeScore, selectedScorers);
                        return;
                    }

                    const selectScorer = new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                                .setCustomId('scorer')
                                .setPlaceholder(`Choisissez le buteur ${selectedScorers.length + 1}`)
                                .addOptions(assePlayers.map(player => ({
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

                    await i.update({ embeds: [embedScorer], components: [selectScorer] });

                    try {
                        const response = await message.awaitMessageComponent({ 
                            componentType: ComponentType.StringSelect, 
                            filter: i => i.customId === 'scorer' && i.user.id === interaction.user.id, 
                            time: 60000 
                        });

                        const selectedScorer = response.values[0];
                        selectedScorers.push(selectedScorer);
                        remainingGoals--;
                        await askForScorer(response); // Pass the updated interaction (response) to the recursive call
                    } catch (error) {
                        if (error.code === 'INTERACTION_COLLECTOR_ERROR') {
                            const embedTimeout = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('⏳ Temps écoulé')
                                .setDescription("Votre pronostic a été annulé.");
                            await interaction.followUp({ embeds: [embedTimeout], ephemeral: true });
                            activeUsers.delete(userId);
                        } else {
                            console.error('Erreur lors de la sélection du buteur:', error);
                            const embedError = new EmbedBuilder()
                                .setColor('#FF0000')
                                .setTitle('❌ Erreur')
                                .setDescription("Une erreur s'est produite. Veuillez réessayer.");
                            await interaction.followUp({ embeds: [embedError], ephemeral: true });
                        }
                    }
                };

                await askForScorer(i); // Pass the interaction to the function
            });

            homeCollector.on('end', collected => {
                if (collected.size === 0) {
                    const embedTimeout = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⏳ Temps écoulé')
                        .setDescription("Votre pronostic a été annulé.");
                    interaction.followUp({ embeds: [embedTimeout], ephemeral: true });
                }
                activeUsers.delete(userId);
            });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                const embedTimeout = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏳ Temps écoulé')
                    .setDescription("Votre pronostic a été annulé.");
                interaction.followUp({ embeds: [embedTimeout], ephemeral: true });
            }
            activeUsers.delete(userId);
        });
    },
};

async function savePronostic(interaction, currentMatch, opponentScore, homeScore, selectedScorers) {
    try {
        const pronostic = {
            userId: interaction.user.id,
            username: interaction.user.username,
            matchId: currentMatch.id,
            opponent: currentMatch.opponent,
            opponentScore: opponentScore,
            homeScore: homeScore,
            scorers: selectedScorers,
            timestamp: new Date().toISOString()
        };

        let pronos = [];
        try {
            const data = await fs.readFile(PRONOS_FILE, 'utf8');
            pronos = JSON.parse(data);
        } catch (error) {
            // Le fichier n'existe pas encore ou est vide
        }

        // Supprimer l'ancien pronostic pour ce match si l'utilisateur en a déjà fait un
        pronos = pronos.filter(p => !(p.userId === interaction.user.id && p.matchId === currentMatch.id));

        // Ajouter le nouveau pronostic
        pronos.push(pronostic);
        await fs.writeFile(PRONOS_FILE, JSON.stringify(pronos, null, 2));

        const embedSuccess = new EmbedBuilder()
            .setColor('#1F8B4C')
            .setTitle('✅ Pronostic enregistré')
            .setDescription(`Votre pronostic pour le match contre **${currentMatch.opponent}** a été enregistré !`)
            .addFields(
                { name: 'Score', value: `ASSE ${homeScore} - ${opponentScore} ${currentMatch.opponent}`, inline: true },
                { name: 'Buteurs', value: selectedScorers.join(', ') || 'Aucun', inline: true },
                { name: 'Date et heure', value: new Date().toLocaleString('fr-FR'), inline: false }
            )
            .setFooter({ text: 'Merci de votre participation !' });

        await interaction.followUp({ embeds: [embedSuccess], ephemeral: true });

        // Retirer l'utilisateur de la liste des utilisateurs actifs
        activeUsers.delete(interaction.user.id);

        // Annonce le nouveau pronostic
        await handleNewPronostic(interaction.client, interaction.user);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du pronostic:', error);
        const embedError = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Erreur')
            .setDescription("Une erreur s'est produite lors de l'enregistrement de votre pronostic. Veuillez réessayer.");
        await interaction.followUp({ embeds: [embedError], ephemeral: true });
    }
}
