const { SlashCommandBuilder } = require('@discordjs/builders');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas');
const { loadImage } = require('canvas');

// Liste des joueurs
const joueurs = [
    { id: 1, nom: "Brice Maubleu", poste: "Gardien", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/defaut.png" },
    { id: 16, nom: "Boubacar Fall", poste: "Gardien", nationalite: "Sénégal", photoUrl: "https://www.asse.fr/img/effectifs/fall-221637029.png" },
    { id: 30, nom: "Gautier Larsonneur", poste: "Gardien", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/larsonneur-759246975.png" },
    { id: 3, nom: "Mickaël Nadé", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/nade-402370011.png" },
    { id: 5, nom: "Yunis Abdelhamid", poste: "Défenseur", nationalite: "Maroc", photoUrl: "https://www.asse.fr/img/effectifs/abdelhamid-82452049.png" },
    { id: 8, nom: "Dennis Appiah", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/appiah-1111702980.png" },
    { id: 17, nom: "Pierre Cornud", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/defaut.png" },
    { id: 19, nom: "Léo Pétrot", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/petrot-1832957253.png" },
    { id: 21, nom: "Dylan Batubinsika", poste: "Défenseur", nationalite: "RD Congo", photoUrl: "https://www.asse.fr/img/effectifs/batubinsika-1265457123.png" },
    { id: 23, nom: "Anthony Briançon", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/briancon-1001586751.png" },
    { id: 27, nom: "Yvann Maçon", poste: "Défenseur", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/macon-1859844184.png" },
    { id: 4, nom: "Pierre Ekwah", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/defaut.png" },
    { id: 6, nom: "Benjamin Bouchouari", poste: "Milieu", nationalite: "Maroc", photoUrl: "https://www.asse.fr/img/effectifs/bouchouari-1703096938.png" },
    { id: 7, nom: "Thomas Monconduit", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/monconduit-172106056.png" },
    { id: 10, nom: "Florian Tardieu", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/tardieu-1563492676.png" },
    { id: 14, nom: "Louis Mouton", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/mouton-1633862482.png" },
    { id: 18, nom: "Mathieu Cafaro", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/cafaro-821264502.png" },
    { id: 18, nom: "Mathieu Cafaro", poste: "Attaquant", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/cafaro-821264502.png" },
    { id: 26, nom: "Lamine Fomba", poste: "Milieu", nationalite: "France", photoUrl: "https://www.asse.fr/img/effectifs/fomba-1170236477.png" },
    { id: 28, nom: "Igor Miladinovic", poste: "Milieu", nationalite: "Serbie", photoUrl: "https://www.asse.fr/img/effectifs/defaut.png" },
    { id: 29, nom: "Aïmen Moueffek", poste: "Milieu", nationalite: "Maroc", photoUrl: "https://www.asse.fr/img/effectifs/moueffek-249495477.png" },
    { id: 9, nom: "Ibrahim Sissoko", poste: "Attaquant", nationalite: "Mali", photoUrl: "https://www.asse.fr/img/effectifs/sissoko-2061313537.png" },
    { id: 11, nom: "Ben Old", poste: "Attaquant", nationalite: "Nouvelle-Zélande", photoUrl: "https://www.asse.fr/img/effectifs/old-1425172964.png" },
    { id: 20, nom: "Augustine Boakye", poste: "Attaquant", nationalite: "Ghana", photoUrl: "https://www.asse.fr/img/effectifs/boakye-627964955.png" },
    { id: 22, nom: "Zuriko Davitashvili", poste: "Attaquant", nationalite: "Géorgie", photoUrl: "https://www.asse.fr/img/effectifs/davitashvili-1894953427.png" },
    { id: 25, nom: "Ibrahima Wadji", poste: "Attaquant", nationalite: "Sénégal", photoUrl: "https://www.asse.fr/img/effectifs/wadji-1246772103.png" },
    { id: 32, nom: "Lucas Stassin", poste: "Attaquant", nationalite: "Belgique", photoUrl: "https://www.asse.fr/img/effectifs/defaut.png" }
];
function getChoicesByPoste(poste) {
    return joueurs
        .filter(joueur => joueur.poste === poste)
        .map(joueur => ({ name: joueur.nom, value: joueur.nom }));
}

async function generateXIImage(xi) {
    const canvas = Canvas.createCanvas(2400, 3200);
    const ctx = canvas.getContext('2d');

    // Fond du terrain
    const gradient = ctx.createLinearGradient(0, 0, 0, 3200);
    gradient.addColorStop(0, '#2e8b57');
    gradient.addColorStop(1, '#228b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2400, 3200);

    // Dessiner le terrain
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 6;
    ctx.strokeRect(100, 100, 2200, 3000);
    ctx.beginPath();
    ctx.moveTo(100, 1600);
    ctx.lineTo(2300, 1600);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1200, 1600, 240, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1200, 1600, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeRect(600, 100, 1200, 600);
    ctx.strokeRect(900, 100, 600, 200);
    ctx.beginPath();
    ctx.arc(1200, 500, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeRect(600, 2500, 1200, 600);
    ctx.strokeRect(900, 2900, 600, 200);
    ctx.beginPath();
    ctx.arc(1200, 2700, 8, 0, Math.PI * 2);
    ctx.fill();
    const cornerRadius = 60;
    ctx.beginPath();
    ctx.arc(100, 100, cornerRadius, 0, Math.PI/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2300, 100, cornerRadius, Math.PI/2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(2300, 3100, cornerRadius, Math.PI, 3*Math.PI/2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(100, 3100, cornerRadius, 3*Math.PI/2, 2*Math.PI);
    ctx.stroke();

    // Définir les positions pour chaque poste (4-3-3 formation)
    const positions = [
        { x: 1200, y: 2900 },  // Gardien
        { x: 500, y: 2400 },   // Défenseur 1 
        { x: 900, y: 2500 },   // Défenseur 2
        { x: 1500, y: 2500 },  // Défenseur 3
        { x: 1900, y: 2400 },  // Défenseur 4 
        { x: 800, y: 1800 },   // Milieu 1
        { x: 1200, y: 1900 },  // Milieu 2
        { x: 1600, y: 1800 },  // Milieu 3
        { x: 600, y: 900 },    // Attaquant 1
        { x: 1200, y: 700 },   // Attaquant 2
        { x: 1800, y: 900 }    // Attaquant 3
    ];

    // Placer les joueurs sur le terrain
    for (let i = 0; i < xi.length; i++) {
        const joueur = xi[i];
        const position = positions[i];

        try {
            const img = await loadImage(joueur.photoUrl);
            const size = 350;
            ctx.save();
            ctx.beginPath();
            ctx.arc(position.x, position.y, size/2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Calculer les dimensions pour préserver le ratio d'aspect
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;
            let drawX = position.x - size/2;
            let drawY = position.y - size/2;

            if (aspectRatio > 1) {
                // Image plus large que haute
                drawHeight = size / aspectRatio;
                drawY = position.y - drawHeight/2;
            } else {
                // Image plus haute que large
                drawWidth = size * aspectRatio;
                drawX = position.x - drawWidth/2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();

            // Dessiner le cercle blanc autour de l'image
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(position.x, position.y, size/2 + 3, 0, Math.PI * 2);
            ctx.stroke();

            // Écrire le nom du joueur
            ctx.fillStyle = 'white';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(joueur.nom, position.x, position.y + size/2 + 50);
        } catch (error) {
            console.error(`Erreur lors du chargement de l'image pour ${joueur.nom}:`, error);
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(position.x, position.y, 110, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    return canvas.toBuffer();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xi_depart')
        .setDescription('Générer le XI de départ et une image avec les photos officielles')
        .addStringOption(option => 
            option.setName('gardien')
                .setDescription('Nom du gardien')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Gardien')))
        .addStringOption(option => 
            option.setName('defenseur_central_gauche')
                .setDescription('Nom du défenseur central gauche')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Défenseur')))
        .addStringOption(option => 
            option.setName('defenseur_central_droit')
                .setDescription('Nom du défenseur central droit')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Défenseur')))
        .addStringOption(option => 
            option.setName('arriere_gauche')
                .setDescription('Nom de l\'arrière gauche')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Défenseur')))
        .addStringOption(option => 
            option.setName('arriere_droit')
                .setDescription('Nom de l\'arrière droit')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Défenseur')))
        .addStringOption(option => 
            option.setName('milieu_defensif')
                .setDescription('Nom du milieu défensif')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Milieu')))
        .addStringOption(option => 
            option.setName('milieu_gauche')
                .setDescription('Nom du milieu gauche')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Milieu')))
        .addStringOption(option => 
            option.setName('milieu_droit')
                .setDescription('Nom du milieu droit')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Milieu')))
        .addStringOption(option => 
            option.setName('ailier_gauche')
                .setDescription('Nom de l\'ailier gauche')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Attaquant')))
        .addStringOption(option => 
            option.setName('attaquant_centre')
                .setDescription('Nom de l\'attaquant centre')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Attaquant')))
        .addStringOption(option => 
            option.setName('ailier_droit')
                .setDescription('Nom de l\'ailier droit')
                .setRequired(true)
                .addChoices(...getChoicesByPoste('Attaquant'))),

                async run(interaction) {

                    const AUTHORIZED_CHANNEL_ID = '1186717933527900160'; // Remplacez par l'ID réel du salon

        // Vérifiez si la commande est utilisée dans le bon salon
        if (interaction.channelId !== AUTHORIZED_CHANNEL_ID) {
            return await interaction.reply({
                content: `Cette commande ne peut être utilisée que dans le salon <#${AUTHORIZED_CHANNEL_ID}>`,
                ephemeral: true
            });
        }


                    await interaction.deferReply(); // Déclenche un accusé de réception
                
                    // Récupérer les joueurs sélectionnés
                    const selectedPlayers = [
                        { nom: interaction.options.getString('gardien'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('gardien')).photoUrl },
                        { nom: interaction.options.getString('defenseur_central_gauche'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('defenseur_central_gauche')).photoUrl },
                        { nom: interaction.options.getString('defenseur_central_droit'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('defenseur_central_droit')).photoUrl },
                        { nom: interaction.options.getString('arriere_gauche'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('arriere_gauche')).photoUrl },
                        { nom: interaction.options.getString('arriere_droit'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('arriere_droit')).photoUrl },
                        { nom: interaction.options.getString('milieu_defensif'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('milieu_defensif')).photoUrl },
                        { nom: interaction.options.getString('milieu_gauche'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('milieu_gauche')).photoUrl },
                        { nom: interaction.options.getString('milieu_droit'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('milieu_droit')).photoUrl },
                        { nom: interaction.options.getString('ailier_gauche'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('ailier_gauche')).photoUrl },
                        { nom: interaction.options.getString('attaquant_centre'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('attaquant_centre')).photoUrl },
                        { nom: interaction.options.getString('ailier_droit'), photoUrl: joueurs.find(j => j.nom === interaction.options.getString('ailier_droit')).photoUrl }
                    ];
                
                    try {
                        const imageBuffer = await generateXIImage(selectedPlayers);
                        const attachment = new AttachmentBuilder(imageBuffer, { name: 'xi_depart.png' });
                
                        // Création de l'embed
                        const embed = new EmbedBuilder()
                            .setTitle(`Voici ton XI de départ !`)
                            .setImage('attachment://xi_depart.png')
                            .setColor('#1F8B4C')
    .setFooter({ 
        text: 'Votre XI de départ.', 
        iconURL: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3e/AS_Saint-Etienne-logo_2022.svg/1642px-AS_Saint-Etienne-logo_2022.svg.png'  // Remplacez par l'URL de l'icône de votre bot
    })
    .setTimestamp();
                
                        await interaction.editReply({  content: `Voici le 11 de départ de <@${interaction.user.id}> :`, embeds: [embed], files: [attachment] });
                    } catch (error) {
                        console.error('Erreur lors de la génération de l\'image ou de l\'envoi de la réponse:', error);
                        await interaction.editReply({ content: 'Une erreur est survenue lors de la génération du XI.', ephemeral: true });
                    }
                }
            }