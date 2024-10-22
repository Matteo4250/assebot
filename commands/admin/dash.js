const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

const LISTINGS_FILE = path.join(__dirname, '..', '..', 'data', 'listings.json');

async function loadListings() {
    try {
        const data = await fs.readFile(LISTINGS_FILE, 'utf8');
        const listings = JSON.parse(data);
        for (const [messageId, listing] of Object.entries(listings)) {
            if (!listing.channelId || !listing.messageId) {
                console.error(`Listing ${messageId} is missing channel or message information`);
            }
        }
        return listings;
    } catch (error) {
        console.error('Error loading listings:', error);
        return {};
    }
}

async function saveListing(messageId, channelId, listingData) {
    const listings = await loadListings();
    listings[messageId] = { ...listingData, channelId, messageId };
    await fs.writeFile(LISTINGS_FILE, JSON.stringify(listings, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Gérer les ventes en cours (Admin seulement)'),
    
    async run(interaction) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: "Vous n'avez pas la permission d'utiliser cette commande.", ephemeral: true });
        }

        let listings = await loadListings();
        let ongoingListings = Object.entries(listings).filter(([messageId, listing]) => {
            if (!listing.channelId || !listing.messageId) {
                console.error(`Listing ${messageId} is missing channel or message information`);
                return false;
            }
            return listing.statut !== '🔴 Vendue';
        });

        const itemsPerPage = 5;
        let currentPage = 0;

        const generateEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedListings = ongoingListings.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Dashboard de Gestion des Ventes')
                .setDescription('Voici la liste des ventes en cours. Utilisez les boutons pour gérer chaque vente.')
                .setFooter({ text: `Page ${page + 1}/${Math.ceil(ongoingListings.length / itemsPerPage)} | Total: ${ongoingListings.length} ventes` });

            paginatedListings.forEach(([messageId, listing], index) => {
                embed.addFields({
                    name: `📌 Vente #${start + index + 1} - ${listing.match}`,
                    value: [
                        `👤 Vendeur: <@${listing.sellerId}>`,
                        `🏷️ Prix: ${listing.prix}€`,
                        `🎫 Places: ${listing.placesDisponibles}/${listing.nombrePlaces}`,
                        `📍 Emplacement: ${listing.emplacement}`,
                        `🔹 Statut: ${listing.statut}`
                    ].join('\n'),
                    inline: false
                });
            });

            return embed;
        };

        const generateRows = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedListings = ongoingListings.slice(start, end);

            const rows = [];

            paginatedListings.forEach(([messageId, _], index) => {
                const row1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`view_${messageId}`)
                            .setLabel(`📋 Détails #${start + index + 1}`)
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId(`sold_${messageId}`)
                            .setLabel(`💰 Marquer vendu #${start + index + 1}`)
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId(`edit_price_${messageId}`)
                            .setLabel(`✏️ Modifier prix #${start + index + 1}`)
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId(`delete_${messageId}`)
                            .setLabel(`🗑️ Supprimer #${start + index + 1}`)
                            .setStyle(ButtonStyle.Danger)
                    );

                rows.push(row1);
            });

            const navigationRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('◀️ Précédent')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Suivant ▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(end >= ongoingListings.length),
                    new ButtonBuilder()
                        .setCustomId('refresh')
                        .setLabel('🔄 Actualiser')
                        .setStyle(ButtonStyle.Secondary)
                );

            rows.push(navigationRow);
            return rows;
        };

        const updateMessage = async () => {
            await interaction.editReply({
                embeds: [generateEmbed(currentPage)],
                components: generateRows(currentPage)
            });
        };

        try {
            const message = await interaction.reply({ 
                embeds: [generateEmbed(currentPage)], 
                components: generateRows(currentPage), 
                fetchReply: true 
            });

            const collector = message.createMessageComponentCollector({ time: 600000 });

            collector.on('collect', async i => {
                if (!i.isButton() && !i.isModalSubmit()) return;

                try {
                    if (i.customId === 'previous') {
                        currentPage = Math.max(0, currentPage - 1);
                        await updateMessage();
                    } else if (i.customId === 'next') {
                        currentPage = Math.min(Math.floor((ongoingListings.length - 1) / itemsPerPage), currentPage + 1);
                        await updateMessage();
                    } else if (i.customId === 'refresh') {
                        listings = await loadListings();
                        ongoingListings = Object.entries(listings).filter(([_, listing]) => listing.statut !== '🔴 Vendue');
                        await updateMessage();
                    } else {
                        const [action, messageId] = i.customId.split('_');

                        switch(action) {
                            case 'sold':
                                listings[messageId].statut = '🔴 Vendue';
                                listings[messageId].placesDisponibles = 0;
                                await saveListing(messageId, listings[messageId].channelId, listings[messageId]);
                                
                                const originalChannel = await interaction.client.channels.fetch(listings[messageId].channelId);
                                const originalMessage = await originalChannel.messages.fetch(messageId);
                                
                                const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                                    .spliceFields(4, 1, { name: '🔵 Statut :', value: '🔴 Vendue', inline: true })
                                    .spliceFields(3, 1, { name: '🎫 Nombre de places :', value: `0/${listings[messageId].nombrePlaces}`, inline: true });
                                
                                await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
                                
                                await i.reply({ content: `La vente pour le match "${listings[messageId].match}" a été marquée comme vendue.`, ephemeral: true });
                                await updateMessage();
                                break;

                            case 'edit_price':
                                const modal = new ModalBuilder()
                                    .setCustomId(`edit_price_modal_${messageId}`)
                                    .setTitle('Modifier le prix');
                                
                                const priceInput = new TextInputBuilder()
                                    .setCustomId('new_price')
                                    .setLabel("Nouveau prix")
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true);

                                const actionRow = new ActionRowBuilder().addComponents(priceInput);
                                modal.addComponents(actionRow);

                                await i.showModal(modal);
                                break;

                            case 'delete':
                                delete listings[messageId];
                                await saveListing(messageId, listings[messageId].channelId, listings[messageId]);
                                ongoingListings = ongoingListings.filter(([id]) => id !== messageId);
                                await i.reply({ content: `La vente pour le match "${listings[messageId].match}" a été supprimée.`, ephemeral: true });
                                await updateMessage();
                                break;

                            case 'view':
                                const listing = listings[messageId];
                                const detailEmbed = new EmbedBuilder()
                                    .setColor('#0099ff')
                                    .setTitle(`Détails de la vente - Match: ${listing.match}`)
                                    .addFields(
                                        { name: 'Vendeur', value: `<@${listing.sellerId}>`, inline: true },
                                        { name: 'Statut', value: listing.statut, inline: true },
                                        { name: 'Prix', value: `${listing.prix}€`, inline: true },
                                        { name: 'Emplacement', value: listing.emplacement, inline: true },
                                        { name: 'Places disponibles', value: `${listing.placesDisponibles}/${listing.nombrePlaces}`, inline: true },
                                        { name: 'Transaction', value: listing.transactionText, inline: true },
                                        { name: 'Date de création', value: new Date(listing.createdAt).toLocaleString(), inline: false }
                                    )
                                    .setImage(listing.preuveUrl);
                                await i.reply({ embeds: [detailEmbed], ephemeral: true });
                                break;
                        }
                    }

                    if (i.isModalSubmit() && i.customId.startsWith('edit_price_modal_')) {
                        const messageId = i.customId.split('_')[3];
                        const newPrice = i.fields.getTextInputValue('new_price');
                        if (isNaN(newPrice) || newPrice <= 0) {
                            await i.reply({ content: "Le prix doit être un nombre positif.", ephemeral: true });
                            return;
                        }
                        listings[messageId].prix = parseFloat(newPrice);
                        await saveListing(messageId, listings[messageId].channelId, listings[messageId]);
                        
                        const originalChannel = await interaction.client.channels.fetch(listings[messageId].channelId);
                        const originalMessage = await originalChannel.messages.fetch(messageId);
                        
                        const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                            .spliceFields(2, 1, { name: '💰 Prix :', value: `${newPrice} €`, inline: true });
                        
                        await originalMessage.edit({ embeds: [updatedEmbed] });
                        
                        await i.reply({ content: `Le prix de la vente a été mis à jour à ${newPrice}€.`, ephemeral: true });
                        await updateMessage();
                    }
                } catch (error) {
                    console.error(`Error handling action ${i.customId}:`, error);
                    await i.reply({ content: 'Une erreur est survenue lors du traitement de l\'action.', ephemeral: true });
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] });
            });
        } catch (error) {
            console.error('Error running dashboard command:', error);
            await interaction.reply({ content: 'Une erreur est survenue lors de l\'affichage du dashboard.', ephemeral: true });
        }
    },
};
