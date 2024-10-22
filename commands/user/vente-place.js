const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const Discord = require("discord.js")
const fs = require('fs').promises;
const path = require('path');
const { saveListing } = require('../../models/listingUtils'); 

const RATINGS_FILE = path.join(__dirname, '..', '..', 'data', 'ratings.json');
const MODERATION_CHANNEL_ID = '1220457910094532619'; // Replace with actual channel ID
const RESERVATION_TIMEOUT = 3600000; // 1 hour in milliseconds
let currentBuyer = null;
async function loadRatings() {
    try {
        const data = await fs.readFile(RATINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

async function saveRatings(ratings) {
    await fs.writeFile(RATINGS_FILE, JSON.stringify(ratings, null, 2));
}

async function getUserRating(userId) {
    const ratings = await loadRatings();
    const userRatings = ratings[userId] || [];
    if (userRatings.length === 0) return null;
    return userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length;
}

async function addUserRating(userId, rating) {
    const ratings = await loadRatings();
    if (!ratings[userId]) ratings[userId] = [];
    ratings[userId].push(rating);
    await saveRatings(ratings);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vente-place')
        .setDescription('Publier une annonce de vente de place.')
        .addStringOption(option =>
            option.setName('match')
                .setDescription('Le match pour lequel la place est vendue')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('emplacement')
                .setDescription('L\'emplacement de la place')
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName('prix')
                .setDescription('Le prix de la place')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('nombre_places')
                .setDescription('Nombre de places disponibles')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('transaction')
                .setDescription('Moyen de transaction possible (en ligne / sur place)')
                .addChoices(
                    { name: 'En ligne', value: 'en_ligne' },
                    { name: 'Sur place', value: 'sur_place' },
                    { name: 'Les deux', value: 'les_deux' }
                )
                .setRequired(true)
        )
        .addAttachmentOption(option =>
            option.setName('preuve')
                .setDescription('Photo de la place (preuve de vente en cachant le QR Code)')
                .setRequired(true)
        ),
    
    async run(interaction) {
        const match = interaction.options.getString('match');
        const emplacement = interaction.options.getString('emplacement');
        const prix = interaction.options.getNumber('prix');
        const nombrePlaces = interaction.options.getInteger('nombre_places');
        const transaction = interaction.options.getString('transaction');
        const preuve = interaction.options.getAttachment('preuve');
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        // Check if channel is null
        if (!channel) {
            return interaction.reply({ content: "Je ne peux pas trouver le canal approprié pour envoyer ce message. Veuillez réessayer ou contacter un administrateur.", ephemeral: true });
        }

        // Check permissions only if channel exists
        if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "Je n'ai pas la permission d'envoyer des messages dans ce canal.", ephemeral: true });
        }

        let placesDisponibles = nombrePlaces;

        actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('reserve')
                    .setLabel('🛒 Réserver une place')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('contact')
                    .setLabel('✉️ Contacter le vendeur')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('vendue')
                    .setLabel('❌ Marquer comme vendu')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('signaler')
                    .setLabel('🚩 Signaler')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('update_places')
                    .setLabel('🔄 Mettre à jour le nombre de places')
                    .setStyle(ButtonStyle.Secondary)
            );
            

        let statut = '🟢 Disponible';
        let reservationTimeout;

        const transactionText = {
            'en_ligne': 'En ligne',
            'sur_place': 'Sur place',
            'les_deux': 'En ligne / Sur place'
        }[transaction];

        const userRating = await getUserRating(interaction.user.id);

        const venteEmbed = new EmbedBuilder()
        .setColor('#1F8B4C')
        .setTitle('🎟️ Vente de place')
        .setDescription('**Détails de la vente de place**')
        .addFields(
            { name: '⚽ Match :', value: match, inline: true },
            { name: '📍 Emplacement :', value: emplacement, inline: true },
            { name: '💰 Prix :', value: `${prix} €`, inline: true },
            { name: '🎫 Nombre de places :', value: `${placesDisponibles}/${nombrePlaces}`, inline: true },
            { name: '💳 Moyen de transaction :', value: transactionText, inline: true },
            { name: '🔵 Statut :', value: statut, inline: true },
            { name: '👤 Vendeur :', value: `<@${interaction.user.id}>`, inline: true },
            { name: '⭐ Note du vendeur :', value: userRating ? `${userRating.toFixed(1)}/5` : 'Pas encore noté', inline: true }
        )
        .setImage(preuve.url)
        .setFooter({ text: 'Preuve de vente (QR Code caché)', iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

        const message = await channel.send({ embeds: [venteEmbed], components: [actionRow] });
        const channelId = channel.id;

        const listingData = {
            sellerId: interaction.user.id,
            channelId: interaction.channelId,
            match,
            emplacement,
            prix,
            nombrePlaces,
            placesDisponibles: nombrePlaces,
            transactionText,
            statut: '🟢 Disponible',
            preuveUrl: preuve.url,
            createdAt: Date.now(),
            currentBuyer: null,
            reservationTime: null
        };
        
        await saveListing(message.id, listingData);
        


        await interaction.reply({ content: `Annonce publiée dans ${channel}!`, ephemeral: true });

        const filter = i => ['reserve', 'contact', 'vendue', 'signaler'].includes(i.customId);
        const collector = message.createMessageComponentCollector({ filter, time: 0 });

        collector.on('collect', async i => {
            switch (i.customId) {
                case 'reserve':
                    if (statut !== '🟢 Disponible') {
                        return i.reply({ content: "Désolé, cette place n'est plus disponible.", ephemeral: true });
                    }
                    statut = '🟡 En cours d\'achat';
                    currentBuyer = i.user; // Store the current buyer
                    venteEmbed.spliceFields(4, 1, { name: '🔵 Statut :', value: statut, inline: true });
                    await message.edit({ embeds: [venteEmbed] });

                    // Update the actionRow
                    const updatedActionRow = new ActionRowBuilder(actionRow.toJSON());
                    const contactButton = updatedActionRow.components.find(c => c.data.custom_id === 'contact');
                    if (contactButton) {
                        contactButton.setDisabled(true);
                    }
                    await message.edit({ components: [updatedActionRow] });

                    const reservationEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('🎟️ Réservation de place')
                        .setDescription(`**${i.user.username}** a réservé votre place nommée "${emplacement}".`)
                        .addFields(
                            { name: 'Emplacement', value: emplacement, inline: true },
                            { name: 'Prix', value: `${prix} €`, inline: true },
                            { name: 'Acheteur', value: `<@${i.user.id}>`, inline: true },
                            { name: 'Temps restant', value: '1 heure', inline: true }
                        )
                        .setTimestamp();

                    await interaction.user.send({ embeds: [reservationEmbed] });
                    await i.reply({ content: 'Vous avez réservé une place. Le vendeur sera informé. Vous avez 1 heure pour finaliser l\'achat.', ephemeral: true });

                    clearTimeout(reservationTimeout);
                   reservationTimeout = setTimeout(async () => {
    if (statut === '🟡 En cours d\'achat') {
        statut = '🟢 Disponible';
        currentBuyer = null; // Reset the current buyer
        venteEmbed.spliceFields(4, 1, { name: '🔵 Statut :', value: statut, inline: true });
        
        // Fetch the message again to get the latest version
        const updatedMessage = await message.fetch().catch(() => null);
        if (updatedMessage) {
            const updatedActionRow = ActionRowBuilder.from(updatedMessage.components[0]);
            const contactButton = updatedActionRow.components.find(c => c.data.custom_id === 'contact');
            if (contactButton) {
                contactButton.setDisabled(false);
            }
            await updatedMessage.edit({ embeds: [venteEmbed], components: [updatedActionRow] });
        }

        await i.user.send('Votre réservation pour la place a expiré. La place est de nouveau disponible.');
        await interaction.user.send(`La réservation de ${i.user.username} pour la place "${emplacement}" a expiré. La place est de nouveau disponible.`);
    }
}, RESERVATION_TIMEOUT);
                    break;

                case 'contact':
                    if (currentBuyer) {
                        return i.reply({ content: 'Désolé, cette place est actuellement réservée.', ephemeral: true });
                    }
                    await i.reply({ content: 'Vous avez contacté le vendeur. Veuillez attendre sa réponse.', ephemeral: true });

                    const contactEmbed = new EmbedBuilder()
                        .setColor('#1F8B4C')
                        .setTitle('✉️ Demande de contact')
                        .setDescription(`**${i.user.username}** souhaite vous contacter pour la place "${emplacement}".`)
                        .addFields(
                            { name: 'Emplacement', value: emplacement, inline: true },
                            { name: 'Intéressé', value: `<@${i.user.id}>`, inline: true }
                        )
                        .setTimestamp();

                    await interaction.user.send({ embeds: [contactEmbed] });
                    break;

                case 'vendue':
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: 'Seul le vendeur peut marquer la place comme vendue.', ephemeral: true });
                    }
                    statut = '🔴 Vendue';
                    venteEmbed.spliceFields(4, 1, { name: '🔵 Statut :', value: statut, inline: true });
                    await message.edit({ embeds: [venteEmbed], components: [] });
                    await i.reply({ content: 'La place a été marquée comme vendue.', ephemeral: true });

                    // Send rating questionnaire to the buyer
                    if (currentBuyer) {
                        const ratingEmbed = new EmbedBuilder()
                            .setColor('#FFD700')
                            .setTitle('⭐ Évaluation du vendeur')
                            .setDescription(`Merci d'avoir acheté la place "${emplacement}". Veuillez évaluer votre expérience avec le vendeur.`)
                            .addFields(
                                { name: 'Vendeur', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Emplacement', value: emplacement, inline: true },
                                { name: 'Prix', value: `${prix} €`, inline: true }
                            );

                        const ratingRow = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('rate_1')
                                    .setLabel('⭐')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('rate_2')
                                    .setLabel('⭐⭐')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('rate_3')
                                    .setLabel('⭐⭐⭐')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('rate_4')
                                    .setLabel('⭐⭐⭐⭐')
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId('rate_5')
                                    .setLabel('⭐⭐⭐⭐⭐')
                                    .setStyle(ButtonStyle.Secondary)
                            );

                        const buyerMessage = await currentBuyer.send({ embeds: [ratingEmbed], components: [ratingRow] });

                        const ratingFilter = i => i.customId.startsWith('rate_');
                        const ratingCollector = buyerMessage.createMessageComponentCollector({ filter: ratingFilter, time: 86400000 }); // 24 hours

                        ratingCollector.on('collect', async i => {
                            const rating = parseInt(i.customId.split('_')[1]);
                            await addUserRating(interaction.user.id, rating);
                            await i.update({ content: `Merci pour votre évaluation de ${rating} étoiles!`, components: [] });
                        });
                    }

                    currentBuyer = null; // Reset the current buyer
                    break;

                case 'signaler':
                    const moderationChannel = await interaction.client.channels.fetch(MODERATION_CHANNEL_ID);
                    if (moderationChannel) {
                        const signalementEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🚩 Signalement de vente')
                            .setDescription(`Une vente a été signalée par <@${i.user.id}>`)
                            .addFields(
                                { name: 'Vendeur', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Emplacement', value: emplacement, inline: true },
                                { name: 'Prix', value: `${prix} €`, inline: true }
                            )
                            .setTimestamp();
                        await moderationChannel.send({ embeds: [signalementEmbed] });
                        await i.reply({ content: 'Votre signalement a été envoyé aux modérateurs pour examen.', ephemeral: true });
                    } else {
                        await i.reply({ content: 'Désolé, impossible d\'envoyer le signalement. Veuillez contacter un administrateur.', ephemeral: true });
                    }
                    break;
                    case 'update_places':
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: 'Seul le vendeur peut mettre à jour le nombre de places.', ephemeral: true });
                    }
                    
                    const modal = new Discord.ModalBuilder()
                        .setCustomId('update_places_modal')
                        .setTitle('Mettre à jour le nombre de places');

                    const placesVenduesInput = new Discord.TextInputBuilder()
                        .setCustomId('places_vendues')
                        .setLabel("Nombre de places vendues")
                        .setStyle(Discord.TextInputStyle.Short)
                        .setRequired(true);

                    const firstActionRow = new Discord.ActionRowBuilder().addComponents(placesVenduesInput);
                    modal.addComponents(firstActionRow);

                    await i.showModal(modal);

                    const submitted = await i.awaitModalSubmit({ time: 60000 }).catch(error => {
                        console.error(error);
                        return null;
                    });

                    if (submitted) {
                        const placesVendues = parseInt(submitted.fields.getTextInputValue('places_vendues'));
                        if (isNaN(placesVendues) || placesVendues < 0 || placesVendues > nombrePlaces) {
                            return submitted.reply({ content: 'Nombre de places invalide.', ephemeral: true });
                        }

                        placesDisponibles = nombrePlaces - placesVendues;
                        venteEmbed.spliceFields(3, 1, { name: '🎫 Nombre de places :', value: `${placesDisponibles}/${nombrePlaces}`, inline: true });
                        
                        if (placesDisponibles === 0) {
                            statut = '🔴 Vendue';
                            venteEmbed.spliceFields(5, 1, { name: '🔵 Statut :', value: statut, inline: true });
                            await message.edit({ embeds: [venteEmbed], components: [] });
                        } else {
                            await message.edit({ embeds: [venteEmbed] });
                        }

                        await submitted.reply({ content: `Le nombre de places a été mis à jour. Il reste ${placesDisponibles} place(s) disponible(s).`, ephemeral: true });
                    }
                    break;

                    listingData.statut = statut;
                    listingData.placesDisponibles = placesDisponibles;
                    await saveListing(message.id, listingData);
            }
        });
    }
};