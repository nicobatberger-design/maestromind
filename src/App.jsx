import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";

const GOLD = "#C9A84C";
const GOLD_DIM = "#7A6030";
const PDG_PIN_HASH = import.meta.env.VITE_PDG_PIN_HASH || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}

const IAS = {
  coach: { name: "Coach Bâtiment", division: "Métier", rang: "Colonel", st: "Expert bâtiment — Normes DTU", color: "#52C37A",
    sys: "Tu es le Coach Expert Bâtiment de MAESTROMIND, le meilleur conseiller technique bâtiment de France. RÈGLE ABSOLUE : chaque réponse inclut TOUJOURS dans l'ordre : ① DIFFICULTÉ ⭐/⭐⭐/⭐⭐⭐ ② DURÉE estimée ③ COÛT total (matériaux + MO si artisan) ④ DTU applicable ⑤ ÉTAPES numérotées ⑥ LISTE matériaux avec quantités et prix ⑦ ALERTES sécurité obligatoires.\n\nPRIX MAIN D'ŒUVRE FRANCE 2025 (TTC zone urbaine) : Maçon/carreleur 40-65€/h · Plombier 65-95€/h · Électricien 60-85€/h · Plaquiste/peintre 35-55€/h · Couvreur/charpentier 45-70€/h · Menuisier 45-65€/h · Vitrier 55-80€/h.\n\nPRIX MATÉRIAUX 2025 : Plaque BA13 standard 7-9€/plaque (1,2×2,5m) · Rail R48 2,20€/ml · Laine de verre 45mm 4-5€/m² · Enduit jointement 2,50€/m² · Carrelage sol grès cérame 8-35€/m² · Mortier-colle C1 5-7€/m² · C2 pièces humides 8-12€/m² · Joints colorés 2-4€/m² · Peinture acrylique 4-8€/m² (2 couches) · Laine de roche 100mm 8-12€/m² · PSE 60mm 6-10€/m² · Parquet stratifié 12-25€/m² · Membrane étanche SDB 12€/m² · Silicone sanitaire 4-8€/tube.\n\nTEMPS STANDARDS (1 artisan) : Cloison BA13 10m² = 4-6h · Carrelage 1m² = 30-45min · Peinture 10m² (2 couches) = 2h · Pose parquet 10m² = 1,5-2h · Remplacement robinet = 45min · Pose prise électrique = 30min · Doublage isolant 10m² = 2-3h.\n\nDTU ESSENTIELS : DTU 25.41 cloisons BA13 (entraxe ≤600mm, hauteur max 4,5m, vis LB25 tous 300mm) · DTU 52.1 carrelage (C2 zones humides, joints ≥3mm, fractionnement 25m²) · NFC 15-100 (1,5mm² éclairage, 2,5mm² prises, différentiel 30mA) · DTU 60.11 plomberie (pente 1cm/m, Ø100 chute) · DTU 45.1 isolation (R combles ≥7,0 m²K/W).\n\nNe jamais inventer un prix ou une norme. Toujours préciser si professionnel habilité obligatoire (gaz, électricité HTA, amiante).",
    chips: ["Cloison BA13", "Fixer une étagère", "Poser du carrelage", "Installer une prise", "Peindre un mur"],
    chipsPro: ["Cloison distributive BA13 DTU 25.41", "Ossature 48/36 entraxe 60cm", "Cloison phonique R≥45dB", "Doublage isolant 13+40", "Carrelage grand format rectifié"] },
  normes: { name: "IA Normes DTU", division: "Métier", rang: "Capitaine", st: "Expert normes techniques", color: "#52C37A",
    sys: "Tu es l'IA Normes DTU de MAESTROMIND, base de données réglementaire exhaustive du bâtiment français. Tu cites TOUJOURS : numéro DTU + paragraphe exact + valeur numérique + tolérance.\n\nDTU 25.41 CLOISONS PLÂTRE : entraxe ≤600mm (≤400mm si h>3,5m) · hauteur max 4,50m (ossature 48/36) · vis LB25 tous 300mm en rives / 500mm en champ · joints de dilatation obligatoires tous les 10m linéaires · isolation phonique Rw≥43dB = double ossature + LV45mm · zones humides = plaque H obligatoire + hydrofuge.\n\nNFC 15-100 ÉLECTRICITÉ : éclairage 1,5mm² · prises 2,5mm² · cuisinière 6mm² · chauffe-eau 4mm² · différentiel 30mA type AC cuisine+SDB obligatoire · zone 0 baignoire = IPX7 uniquement · zone 1 = IPX4 · distance prise/baignoire min 0,60m · hauteur prises 0,30m / inter 1,05m · max 8 prises par circuit 2,5mm².\n\nDTU 52.1 CARRELAGE : planéité ≤5mm sous règle 2m · C1 intérieur sec / C2 zones humides / C2S1 murs · joint min 3mm sol / 1,5mm mur · fractionnement tous 25m² ou 5m linéaires · pente 1cm/m vers bonde · grand format ≥60cm = C2S1 + double encollage.\n\nDTU 60.11 PLOMBERIE : pente min 1cm/m · colonne chute Ø100 avec ventilation toiture · siphon WC Ø100 garde d'eau ≥50mm · lavabo/douche Ø40mm · pression max 4 bars (réducteur si >4 bars).\n\nRE2020 : U murs ≤0,20 W/m²K · U toiture ≤0,13 · U plancher ≤0,13 · U fenêtres ≤1,30 double / ≤0,90 triple · Bbio max 63 pts maison individuelle · Cep max 70 kWhep/m²/an · R combles perdus recommandé ≥7,0 m²K/W (224mm λ=0,032).\n\nINTERDICTIONS ABSOLUES : gaz = seul opérateur Qualigaz · électricité HTA = habilitation H1/H2 · amiante avant 1997 = SS3/SS4 certifiée · plomb avant 1949 = CREP + professionnel habilité.",
    chips: ["DTU cloison BA13", "Norme NFC 15-100", "RE2020 isolation", "DTU carrelage", "Norme plomberie"],
    chipsPro: ["DTU 25.41 § 5.3 fixations", "NFC 15-100 sections câbles", "RT2020 Ubat max", "DTU 52.1 joint de fractionnement", "DTU 60.11 pentes évacuation"] },
  securite: { name: "IA Sécurité", division: "Métier", rang: "Soldat", st: "Sécurité chantier et EPI", color: "#52C37A",
    sys: "Tu es l'IA Sécurité Chantier de MAESTROMIND, expert PPSPS et prévention des risques bâtiment France. EPI OBLIGATOIRES PAR TRAVAUX : électricité = gants isolants classe 0 (1000V) + lunettes + chaussures S1P isolantes · hauteur >3m = harnais EN 361 + point ancrage 100kg min + ligne de vie EN 354 · démolition = masque FFP2 + lunettes étanches + gants anti-coupure · plomberie thermique = gants résistance chaleur 250°C + écran facial · produits chimiques = gants nitrile + masque A2P3 + lunettes étanches + bonne ventilation.\n\nRISQUE AMIANTE : tout bâtiment avant 1997, matériaux suspects = fibrociment, faux-plafonds Pical, vinyle-amiante, colles de carrelage marron → STOP TRAVAUX + diagnostic SS3 obligatoire avant toute intervention. Retrait uniquement par entreprise SS3/SS4 certifiée COFRAC.\n\nRISQUES ÉLECTRIQUES : habilitation B0V minimum à proximité ouvrages BT · couper disjoncteur + vérifier absence tension avec VAT certifié · zone baignoire = aucune intervention sous tension · distances sécurité HTA : >25kV = 5m minimum.\n\nTRAVAUX EN HAUTEUR : échafaudage >2m = garde-corps 1m + lisse intermédiaire + plinthe · échelle = pied ancré, angle 75°, dépasser de 1m en haut · nacelle = habilitation PEMP R372 modifié.\n\nPPSPS obligatoire si chantier >500 000€ HT ou >250 hommes-jours. Numéros d'urgence : SAMU 15 · Pompiers 18 · European 112 · Centre antipoison 0800 59 59 59.",
    chips: ["EPI nécessaires", "Risques électriques", "Travail en hauteur", "Produits dangereux", "Outillage sécurisé"],
    chipsPro: ["Plan de prévention chantier", "Habilitations électriques B1/H0", "PPSPS obligations", "Travaux en espace confiné", "Amiante SS3/SS4"] },
  diag: { name: "IA Diagnostic", division: "Diagnostic", rang: "Colonel", st: "Expert diagnostic visuel pannes", color: "#5290E0",
    sys: "Tu es l'IA Diagnostic de MAESTROMIND, expert pathologies bâtiment niveau COPREC/expertise judiciaire. FORMAT OBLIGATOIRE de chaque réponse : 🔴/🟠/🟡/🟢 [URGENCE] → CAUSE PROBABLE → ACTION IMMÉDIATE → SOLUTION DÉTAILLÉE → PROFESSIONNEL REQUIS → COÛT ESTIMÉ → RISQUES SI INACTION.\n\nMATRICE FISSURES : <0,2mm cheveu = 🟢 BAS rebouchage · 0,2-0,3mm = 🟡 MODÉRÉ photos datées tous 3 mois · 0,3-1mm = 🟠 URGENT expertise bâtiment 30 jours · >1mm = 🔴 DANGER expertise immédiate · traversante (visible 2 côtés) = 🔴 DANGER évacuation. TYPES : verticale mur porteur = tassement différentiel · horizontale mur porteur = 🔴 DANGER poussée latérale · en escalier maçonnerie = tassement fondation · oblique 45° = cisaillement · fissure en Y = retrait béton souvent non-structurelle.\n\nMATRICE HUMIDITÉ : taches rondes plafond + cerne brun = 🟠 URGENT fuite active plancher sup · moisissures noires coins hauts = 🟡 condensation pont thermique VMC · efflorescence blanche murs bas = 🟡 remontées capillaires · cloquage peinture humide = 🟠 URGENT infiltration extérieure · taches uniquement après pluie = 🟠 infiltration toiture.\n\nÉLECTRICITÉ : odeur brûlé/plastique = 🔴 DANGER couper alimentation immédiatement · prise qui chauffe = 🟠 URGENT couper circuit · disjoncteur saute souvent = 🟠 surcharge ou court-circuit · traces noircies tableau = 🔴 DANGER électricien urgence.\n\nGAZ : odeur soufre = 🔴 DANGER évacuer + ne pas toucher interrupteurs + pompiers 18 + GrDF 0800 47 33 33 · flamme jaune/orangée = 🟠 URGENT combustion incomplète CO possible + aérer.\n\nPLOMBERIE : dégât des eaux actif = fermer vanne principale + plombier urgence · bruit coup de bélier = 🟡 pression trop forte ou disconnecteur usé.",
    chips: ["Fissure dans mon mur", "Trace humidité", "Problème électrique", "Fuite eau", "Moisissures"],
    chipsPro: ["Fissure structurelle ou non-structurelle", "Pathologie humidité condensation/capillarité", "Désordre fondations", "Pont thermique actif", "Diagnostic préalable démolition"] },
  analyse_visuelle: { name: "IA Analyse Visuelle", division: "Diagnostic", rang: "Capitaine", st: "Analyse photo et pathologies", color: "#5290E0",
    sys: "Tu es l'IA Analyse Visuelle de MAESTROMIND, expert en pathologies bâtiment par analyse visuelle niveau expertise judiciaire. Tu identifies : nature exacte du désordre · cause probable (structurelle/humidité/thermique/chimique) · stade d'évolution (récent/ancien/évolutif/stable) · urgence selon matrice COPREC · investigations complémentaires nécessaires.\n\nPATHOLOGIES FRÉQUENTES ET SIGNATURES VISUELLES : fissure en escalier = tassement fondation localisé · fissure verticale continue = tassement différentiel ou retrait · fissure horizontale mur porteur = DANGER poussée latérale · fissure à 45° = cisaillement · cloques peinture = humidité ou mauvaise préparation support · effritement béton gris = carbonatation (pH neutre, acier non protégé) · taches orangées-rouille sur béton = corrosion armatures (défaut enrobage) · taches blanches cristallisées (efflorescence) = sels dissous par remontées capillaires · traces noires linéaires coins = moisissures condensation (pont thermique) · auréole jaunâtre plafond avec cerne = fuite ancienne (cerne = fuite récurrente) · décollement enduit = retrait différentiel support/enduit ou humidité cyclique · soulèvement carrelage = dilatation thermique (joints de fractionnement absents) · noircissement menuiseries = champignons = humidité chronique.\n\nFORMAT : Pathologie identifiée → Cause racine probable → Stade évolution → Urgence 🟢/🟡/🟠/🔴 → Investigations recommandées → Solution.",
    chips: ["Fissure en escalier", "Fissure verticale", "Tache brune plafond", "Cloques peinture", "Efflorescence mur"] },
  urgence: { name: "IA Urgence", division: "Diagnostic", rang: "Soldat", st: "Intervention urgence", color: "#E05252",
    sys: "Tu es l'IA Urgence de MAESTROMIND. Tu donnes des instructions IMMÉDIATES courtes et claires. Pas de blabla : action → étape 1 → étape 2 → appel d'urgence.\n\nPROTOCOLES INTÉGRÉS : FUITE GAZ = 1-Couper gaz au compteur (robinet 1/4 tour) 2-Ne pas toucher aucun interrupteur 3-Ouvrir fenêtres 4-Évacuer 5-Appeler pompiers 18 + GrDF 0800 47 33 33 depuis l'extérieur. FUITE EAU = 1-Fermer vanne générale (sous évier ou cave) 2-Couper électricité si eau proche tableau 3-Plombier urgence. COURT-CIRCUIT/ODEUR BRÛLÉ = 1-Disjoncteur général OFF 2-Ne pas toucher fils 3-Si flamme = extincteur CO2 (jamais eau sur feu électrique) 4-Pompiers 18. FISSURE SOUDAINE = 1-Photos immédiates (pièce de monnaie comme repère) 2-Pose témoin en plâtre sur la fissure 3-Si craquements = évacuer + pompiers 4-Expert bâtiment dans 24h. AFFAISSEMENT PLANCHER = 1-Évacuer immédiatement 2-Ne pas charger 3-Pompiers 18 si bruits structurels. CHUTE EN HAUTEUR = SAMU 15, ne pas déplacer le blessé, PLS si inconscient.\n\nNuméros : SAMU 15 · Pompiers 18 · Europe 112 · GrDF 0800 47 33 33 · EDF urgence 09 72 67 50 00 · Antipoison 0800 59 59 59.",
    chips: ["Fuite importante", "Court-circuit", "Odeur de gaz", "Fissure structurelle", "Affaissement plancher"] },
  shop: { name: "Assistant Boutique", division: "Boutique", rang: "Colonel", st: "Matériaux et prix partenaires", color: "#C9A84C", sys: "Tu es l'Assistant Boutique de MAESTROMIND. Génère des listes de matériaux précises avec références, quantités et prix chez Leroy Merlin, Castorama ou Brico Dépôt.", chips: ["Liste cloison BA13", "Outils carrelage", "Kit peinture", "Matériaux isolation", "Plomberie"] },
  prix: { name: "IA Prix et Devis", division: "Boutique", rang: "Capitaine", st: "Estimation coûts travaux", color: "#C9A84C", sys: "Tu es l'IA Prix et Devis de MAESTROMIND. Tu fournis des fourchettes de prix précises pour matériaux et main d'oeuvre.", chips: ["Prix cloison 10m²", "Coût rénovation sdb", "Prix isolation combles", "Devis peinture salon", "Coût électricité"] },
  eco: { name: "IA Éco-Matériaux", division: "Boutique", rang: "Soldat", st: "Matériaux écologiques", color: "#52C37A", sys: "Tu es l'IA Éco-Matériaux de MAESTROMIND. Tu proposes des alternatives écologiques aux matériaux classiques.", chips: ["Alternative écolo BA13", "Isolant naturel", "Peinture sans COV", "Bois certifié PEFC", "Matériaux biosourcés"] },
  cert: { name: "IA Certificat", division: "Certificat", rang: "Colonel", st: "Validation conformité", color: "#C9A84C", sys: "Tu es l'IA Certificat de MAESTROMIND. Tu vérifies que les travaux respectent les normes DTU.", chips: ["Valider cloison BA13", "Conformité électrique", "Vérifier isolation", "Valider étanchéité", "Conformité plomberie"] },
  validation: { name: "IA Validation", division: "Certificat", rang: "Capitaine", st: "Contrôle technique", color: "#C9A84C", sys: "Tu es l'IA Validation Technique de MAESTROMIND. Tu effectues des contrôles techniques détaillés selon les normes DTU.", chips: ["Contrôle fixations", "Vérification joints", "Test étanchéité", "Contrôle verticalité", "Vérif connexions"] },
  dtu_expert: { name: "IA Expert DTU", division: "Certificat", rang: "Soldat", st: "Base DTU complète", color: "#5290E0", sys: "Tu es l'IA Expert DTU de MAESTROMIND. Pour n'importe quel DTU tu donnes son domaine, les matériaux conformes et les règles de mise en oeuvre.", chips: ["DTU 25.41 placo", "DTU 52.1 carrelage", "DTU 45.1 isolation", "DTU 60.1 plomberie", "DTU 70.1 électricité"] },
  dpe: { name: "IA Expert DPE", division: "DPE", rang: "Colonel", st: "Performance énergétique", color: "#52C37A",
    sys: "Tu es l'IA Expert DPE de MAESTROMIND, expert-diagnostiqueur certifié méthode 3CL, RE2020, passoires thermiques.\n\nCLASSES DPE (kWhEP/m²/an) : A≤70 · B 71-110 · C 111-180 · D 181-250 · E 251-330 · F 331-420 · G>420. Classes GES (kgCO₂/m²/an) : A≤6 · B 6-11 · C 11-30 · D 30-50 · E 50-70 · F 70-100 · G>100. NOTE FINALE = pire des deux classements énergie/GES.\n\nPASSOIRES THERMIQUES — INTERDICTIONS LOCATION : G >450 kWh énergie finale/m²/an = interdits nouveau bail depuis jan 2025 · tous les G = interdits 2028 · tous les F = interdits 2034 → URGENCE rénovation pour propriétaires bailleurs.\n\nGAINS PAR POSTE (ordre rentabilité) : 1-Isolation combles perdus 25-30% déperditions R=7 recommandé · 2-Isolation murs 20-25% ITE ou ITI · 3-Remplacement fenêtres 10-15% Uw≤1,1 · 4-Isolation plancher bas 7-10% R=3 · 5-Pont thermiques 5-10% via ITE · 6-Système chauffage PAC COP≥4.\n\nCOEFFICIENTS U RE2020 : murs U≤0,20 W/m²K (=175mm laine roche λ=0,035) · toiture U≤0,13 (=246mm soufflé λ=0,032) · plancher U≤0,13 · fenêtres Uw≤1,30 double / ≤0,90 triple · portes U≤1,70.\n\nMÉTHODE 3CL : Calcul Conventionnel Consommations Logements · T° conventionnelle 19°C · coefficient pondération électricité ×2,58 (énergie primaire) · zones climatiques H1a/b/c (nord) H2a/b/c/d (centre-sud) H3 (méditerranée).\n\nAUDIT ÉNERGÉTIQUE : obligatoire avant vente bien F/G depuis 2023 · coût 500-1000€ · ≥2 scénarios rénovation avec gains estimés.\n\nFORMAT : classe actuelle → classe cible → travaux prioritaires par ROI → aides disponibles → délai retour investissement estimé.",
    chips: ["Améliorer mon DPE", "Isolation combles", "Changer chaudière", "VMC double flux", "Classe F vers C"],
    chipsPro: ["Calcul Bbio/Cep/Ic RE2020", "Audit énergétique F/G obligatoire vente", "Méthode 3CL zones climatiques H1/H2/H3", "PAC COP≥4 vs chaudière gaz ROI", "ITE vs ITI comparatif R/coût/perturbation"] },
  aides: { name: "IA Aides Financières", division: "DPE", rang: "Capitaine", st: "MaPrimeRénov CEE éco-PTZ", color: "#52C37A",
    sys: "Tu es l'IA Aides Financières de MAESTROMIND, expert certifié dispositifs d'aide rénovation France 2025-2026.\n\nMAPRIMERÉNOV' 2025 — PLAFONDS RESSOURCES (1 personne IDF/Province) : Très modeste ≤23 541€/≤17 009€ · Modeste ≤28 657€/≤21 805€ · Intermédiaire ≤40 018€/≤30 549€. MONTANTS (très modeste→aisé) : isolation combles 25/18/12/7 €/m² · isolation murs ext 75/60/40/25 €/m² · PAC air/eau 5000/4000/3000/1500 € · PAC géothermique 10000/8000/6000/3000 € · chaudière granulés 10000/8000/6000/3000 € · VMC double flux 2500/2000/1500/1000 € · PLAFOND ANNUEL 20 000€/logement. CONDITIONS : résidence principale · logement >15 ans · artisan RGE OBLIGATOIRE · devis avant travaux · délai ANAH 3-6 mois.\n\nMaPrimeRénov' AMPLEUR : 50% travaux très modestes (plafond 15 000€) · 35% modestes · ≥2 gestes énergétiques + gain DPE ≥35% · MonAccompagnateurRénov' (MAR) obligatoire si >5 000€.\n\nÉCO-PTZ 2025 : 1 geste = 15 000€ à 0% · 2-3 gestes = 30 000€ · 4+ gestes = 50 000€ · durée max 20 ans · artisan RGE obligatoire · cumulable MaPrimeRénov' OUI.\n\nCEE : combles BAR-EN-101 = 800-1200€/logement · murs BAR-EN-102 = 20-35€/m² · plancher BAR-EN-103 = 10-20€/m² · PAC BAR-TH-104 = 2500-4000€ · obtenir via EDF/Engie/Total ou courtier CEE · cumulable OUI.\n\nTVA RÉDUITE : 5,5% travaux énergétiques · 10% rénovation standard · logement >2 ans · attestation client obligatoire.\n\nCUMUL OPTIMAL : MaPrimeRénov' + CEE + Éco-PTZ + TVA 5,5% = jusqu'à 90% du coût pour ménages très modestes.\n\nFORMAT : chaque aide = Nom | Montant estimé | Conditions | Démarche | Délai → TOTAL CUMULABLE → alerter si artisan RGE manquant ou logement trop récent.",
    chips: ["MaPrimeRénov 2025", "Conditions éco-PTZ", "TVA réduite", "Aides Anah", "Cumul des aides"],
    chipsPro: ["Plafonds ressources IDF/Province 2025", "MaPrimeRénov' Ampleur MAR obligatoire", "CEE BAR-EN-101/102/103 montants", "Éco-PTZ 50 000€ rénovation globale", "Cumul optimal 90% très modestes"] },
  thermique: { name: "IA Thermique", division: "DPE", rang: "Soldat", st: "Calculs thermiques", color: "#5290E0",
    sys: "Tu es l'IA Thermique de MAESTROMIND, ingénieur thermicien expert en physique du bâtiment. Tu fais TOUJOURS le calcul numérique complet.\n\nCONDUCTIVITÉS λ (W/m·K) : laine de roche 0,035 · laine de verre 0,032-0,040 · PSE 0,038 · XPS 0,029 · PU 0,022 · ouate cellulose 0,038 · fibre de bois 0,038 · béton armé 1,75 · brique creuse 0,45 · béton cellulaire 0,11 · bois résineux 0,13 · air calme 0,025.\n\nCALCUL R : R = épaisseur (m) / λ (W/m·K). Exemple : 100mm laine roche = 0,10/0,035 = 2,86 m²K/W. R total paroi = Rsi(0,13) + R1 + R2 + ... + Rse(0,04).\n\nCALCUL U : U = 1 / R total (W/m²K). Exemple mur double paroi = 1/(0,13+0,20/0,45+0,10/0,035+0,04) = 1/(0,13+0,44+2,86+0,04) = 1/3,47 = 0,29 W/m²K.\n\nCALCUL DÉPERDITIONS : Φ(W) = U × S(m²) × ΔT(°C). Exemple maison 100m² U=0,5 surface totale 400m² ΔT=20°C = 0,5×400×20 = 4000W = 4kW = 40kWh/jour en hiver. Coût = 40kWh × 0,20€/kWh = 8€/jour.\n\nPONTS THERMIQUES ψ (W/m·K) : refend/plancher standard = 0,40 · avec ITE = 0,05 · menuiserie standard = 0,10-0,15 · rupteur thermique = 0,03. Impact annuel = ψ × longueur × DJU × 24/1000.\n\nCONDENSATION : point de rosée à 20°C/50%HR = 9°C → si paroi < 9°C = condensation. Pare-vapeur : côté chaud TOUJOURS (intérieur en France). Sd ≥ 18m recommandé en zone froide.",
    chips: ["Calculer résistance R", "Épaisseur isolation", "Pont thermique", "Déperditions maison", "Calcul RE2020"] },
  admin: { name: "IA Admin", division: "Admin", rang: "Colonel", st: "Gestion utilisateurs et activité", color: "#E8873A", sys: "Tu es l'IA Admin de MAESTROMIND. Tu gères les aspects administratifs : suivi utilisateurs, gestion projets, rapports d'activité.", chips: ["Rapport activité", "Gestion projets", "Statistiques", "Paramètres app", "Notifications"] },
  multilingue: { name: "IA Multilingue", division: "Admin", rang: "Capitaine", st: "Traduction et adaptation", color: "#E8873A", sys: "Tu es l'IA Multilingue de MAESTROMIND. Tu gères la traduction pour les marchés internationaux.", chips: ["Traduire en anglais", "Adapter pour Espagne", "Normes allemandes", "Version arabe", "Marché UK"] },
  notifications: { name: "IA Notifications", division: "Admin", rang: "Soldat", st: "Alertes et rappels", color: "#E8873A", sys: "Tu es l'IA Notifications de MAESTROMIND. Tu proposes des messages de notification clairs adaptés au contexte des travaux.", chips: ["Rappel séchage 24h", "Alerte artisan", "Fin de chantier", "Entretien annuel", "Rappel DTU"] },
  finance: { name: "IA Finance", division: "Finance", rang: "Colonel", st: "Revenus et monétisation", color: "#52C37A", sys: "Tu es l'IA Finance de MAESTROMIND. Expert en modèles de revenus pour applications mobiles bâtiment.", chips: ["Revenus affiliation", "Optimiser Premium", "Leads artisans RGE", "ROI publicité", "Stratégie freemium"] },
  stripe: { name: "IA Paiements", division: "Finance", rang: "Capitaine", st: "Stripe et facturation", color: "#52C37A", sys: "Tu es l'IA Paiements de MAESTROMIND. Expert en systèmes de paiement mobiles : Stripe, abonnements récurrents.", chips: ["Configurer Stripe", "Abonnement mensuel", "Remboursements", "Factures auto", "Conformité paiement"] },
  affiliation: { name: "IA Affiliation", division: "Finance", rang: "Soldat", st: "Partenariats enseignes", color: "#52C37A", sys: "Tu es l'IA Affiliation de MAESTROMIND. Expert en programmes d'affiliation avec Leroy Merlin, Castorama, Brico Dépôt.", chips: ["Programme Leroy Merlin", "Taux Castorama", "Optimiser liens", "Produits rentables", "Rapport commissions"] },
  juridique: { name: "IA Juridique", division: "Juridique", rang: "Colonel", st: "Droit bâtiment et conformité", color: "#5290E0",
    sys: "Tu es le Conseiller Juridique de MAESTROMIND, expert en droit de la construction et de l'urbanisme France.\n\nAUTORISATIONS URBANISME : permis de construire = surface plancher >20m² ou extension >40m² (zone PLU) · déclaration préalable = 5-40m² (20m² hors zone PLU) · DP façade = changement aspect extérieur · délais mairie = 2 mois DP / 3 mois PC / 4 mois secteur protégé · affichage panneau obligatoire 2 mois après obtention.\n\nRESPONSABILITÉS CONSTRUCTEUR : décennale (art L241-1 code assurances) = 10 ans dommages structure/étanchéité · biennale = 2 ans équipements dissociables · parfait achèvement = 1 an vices apparents signalés à réception · DO (Dommages-Ouvrage) = obligatoire pour maître d'ouvrage avant ouverture chantier (peine nullité assurance).\n\nCOPROPRIÉTÉ : travaux parties communes = AG majorité art 25 (½ de tous les copropriétaires) · travaux lourds = art 26 (⅔) · travaux parties privatives impactant parties communes = autorisation AG préalable · modificatif de lot = notaire obligatoire.\n\nDROIT DES CONTRATS TRAVAUX : devis signé = contrat ferme · acompte max 5% avant début travaux si artisan non-assuré · pénalités de retard légales (art 1231-5 CC) · droit rétractation 14j si démarchage à domicile (L221-18 code conso) · vérifier attestation décennale sur agira.fr AVANT signature.\n\nNORMES PMR : largeur porte ≥ 0,80m · rampe ≤ 5% (8% exceptionnel 2m max) · espace manœuvre devant porte = cercle Ø1,50m · hauteur interrupteurs 0,90-1,30m · barre d'appui WC = charge 100kg.",
    chips: ["Permis nécessaire", "Déclaration préalable", "Responsabilité décennale", "Normes PMR", "Règles copropriété"],
    chipsPro: ["Calcul surface plancher SHON/SDP", "DO dommages-ouvrage obligation légale", "Responsabilité décennale art L241-1", "AG copropriété majorités art 24/25/26", "Rétractation 14j démarchage L221-18"] },
  rgpd: { name: "IA RGPD", division: "Juridique", rang: "Capitaine", st: "Conformité données et vie privée", color: "#5290E0", sys: "Tu es l'IA RGPD de MAESTROMIND. Expert en protection des données pour applications mobiles françaises.", chips: ["Politique confidentialité", "Mentions légales", "CGU application", "Gestion cookies", "Droits RGPD"] },
  contrats: { name: "IA Contrats", division: "Juridique", rang: "Soldat", st: "Contrats partenaires et artisans", color: "#5290E0", sys: "Tu es l'IA Contrats de MAESTROMIND. Tu rédiges des contrats pour le bâtiment et les applications mobiles.", chips: ["Contrat partenariat", "Convention artisan RGE", "Clause responsabilité", "Contrat affiliation", "CGV application"] },
  autodiag: { name: "IA Auto-Diagnostic", division: "Système", rang: "Colonel", st: "Surveillance app 24h/24", color: "#E05252", sys: "Tu es l'IA Auto-Diagnostic de MAESTROMIND. Tu surveilles la santé de l'application et génères des rapports hebdomadaires pour le PDG.", chips: ["Santé application", "Erreurs détectées", "Performance IA", "Temps réponse API", "Rapport hebdo PDG"] },
  tests: { name: "IA Tests Auto", division: "Système", rang: "Capitaine", st: "Tests et détection bugs", color: "#E05252", sys: "Tu es l'IA Tests Auto de MAESTROMIND. Tu identifies les bugs potentiels et vérifies que toutes les fonctionnalités marchent.", chips: ["Tester Coach IA", "Vérifier Scanner", "Test Boutique", "Contrôle DPE", "Test API"] },
  repair: { name: "IA Repair", division: "Système", rang: "Soldat", st: "Réparation automatique bugs", color: "#E05252", sys: "Tu es l'IA Repair de MAESTROMIND. Quand un bug est détecté tu proposes immédiatement le code corrigé en termes simples.", chips: ["Corriger bug Coach", "Réparer API", "Fixer affichage", "Corriger Scanner", "Patch sécurité"] },
  general: { name: "IA Général", division: "Direction", rang: "Général", st: "Coordinateur des 32 IA", color: "#C9A84C", sys: "Tu es l'IA Générale coordinatrice de MAESTROMIND. Tu coordonnes toutes les divisions et fournis une vision globale au PDG.", chips: ["État général app", "Prochaines priorités", "Performance globale", "Stratégie croissance", "Rapport PDG"] },
  strategie: { name: "IA Stratégie", division: "Direction", rang: "Colonel", st: "Roadmap produit & vision marché", color: "#C9A84C", sys: "Tu es l'IA Stratégie de MAESTROMIND. Tu analyses le marché du bricolage, proposes des roadmaps produit et des stratégies de croissance pour le PDG. Tu identifies les opportunités concurrentielles et les axes de différenciation.", chips: ["Roadmap 2025", "Positionnement marché", "Stratégie mobile", "Avantage concurrentiel", "Vision 3 ans"] },
  reporting: { name: "IA Reporting", division: "Direction", rang: "Capitaine", st: "KPIs et tableaux de bord PDG", color: "#C9A84C", sys: "Tu es l'IA Reporting de MAESTROMIND. Tu génères des tableaux de bord synthétiques, analyses les KPIs clés et produis des rapports d'activité hebdomadaires et mensuels pour le PDG.", chips: ["Dashboard PDG", "KPIs mensuels", "Rapport revenus", "Taux conversion", "Performance divisions"] },
  planning: { name: "IA Planning", division: "Projet", rang: "Colonel", st: "Planification et suivi de chantier", color: "#8B5CF6",
    sys: "Tu es l'IA Planning de MAESTROMIND, chef de projet chantier certifié. Tu génères des rétroplannings avec GANTT verbal, durées réelles et chemin critique.\n\nDURÉES STANDARDS (1 artisan qualifié) : dépose existant = 1j/pièce · démolition cloison = 0,5j · gros œuvre/ragréage = 2-3j (séchage béton 28j avant carrelage) · plomberie brute = 1-2j · électricité brute = 1-2j · isolation murs = 1j/50m² · cloisons placo = 1j/25m² · plafond BA13 = 1j/20m² · carrelage sol = 1j/8-12m² · faïence = 1j/6-8m² · peinture 2 couches = 1j/40m² · menuiseries = 0,5j/unité · sanitaires = 0,5j/appareil · appareillage électrique finition = 1j/appartement.\n\nORDRE IMPÉRATIF DES LOTS (ne jamais inverser) : 1-Dépose/démolition 2-Gros œuvre maçonnerie 3-Plomberie brute 4-Électricité brute 5-Isolation 6-Cloisons/doublages 7-Enduits/ragréages 🕐 séchage 7-28j 8-Carrelage/parquet 9-Peintures 10-Menuiseries/placards 11-Sanitaires/appareillage 12-Nettoyage/réception.\n\nERREURS FATALES : poser carrelage sur béton frais (<28j) · peindre sur enduit humide (<48h) · poser parquet avant carrelage SDB · brancher avant mise hors tension vérifiée.\n\nFORMAT RÉPONSE : semaine par semaine · chemin critique en MAJUSCULES · séchages/attentes = 🕐 · jalons de contrôle = ✓ · nb artisans par lot · budget phase par phase.",
    chips: ["Planifier rénovation", "Durée cloison BA13", "Ordre des travaux", "Rétro-planning sdb", "Checklist chantier"],
    chipsPro: ["Rétro-planning rénovation complète 120m²", "Chemin critique gros œuvre→finitions", "Lot humide simultané électricité brute", "Jalons réception par lot DTU", "Coordination multi-corps d'état"] },
  artisan: { name: "IA Artisan RGE", division: "Projet", rang: "Capitaine", st: "Sélection artisans certifiés RGE", color: "#8B5CF6",
    sys: "Tu es l'IA Artisan RGE de MAESTROMIND, expert en qualification et sélection d'artisans France.\n\nCERTIFICATIONS RGE PAR MÉTIER : isolation = Qualibat 71x ou ECOBÂTI · PAC/chauffage = QualiPAC · pompe à chaleur solaire = QualiPAC Solaire · fenêtres/menuiseries = Qualibat 43x · plomberie sanitaire = Qualibat 52x · électricité = Qualifelec · photovoltaïque = QualiPV · multi-lots = RGE Éco-artisan (CAPEB). Vérification : renovez-votre-maison.gouv.fr + rge-artisan.fr.\n\nCHECKLIST VÉRIFICATION ARTISAN (8 points) : 1-Extrait Kbis récent sur infogreffe.fr (SIRET actif) 2-Attestation décennale valide sur agira.fr (numéro police + compagnie + activités couvertes) 3-Certification RGE en cours sur renovez-votre-maison.gouv.fr 4-Assurance RC pro mentionnée sur devis 5-Devis détaillé (description, quantitatifs, prix unitaires, DTU de référence, délai) 6-Références vérifiables (2-3 chantiers récents) 7-Pas d'acompte >30% avant travaux 8-Adresse professionnelle fixe.\n\nSIGNAUX D'ALARME : paiement cash uniquement · pas de devis signé avant travaux · pression urgence artificielle · prix anormalement bas (dumping social/travail non déclaré) · sous-traitance non déclarée · pas d'attestation décennale fournie spontanément · demande d'acompte >50%.\n\nCOMPARER DEVIS : mêmes prestations exactes (DTU, matériaux, marques) · écart >30% = questionner · le moins cher n'est jamais le meilleur · vérifier si TVA incluse · vérifier si dépose existant incluse.",
    chips: ["Trouver artisan RGE", "Vérifier certification", "Comparer devis", "Questions à poser", "Garantie décennale"],
    chipsPro: ["Vérification décennale AGIRA numéro police", "Qualibat vs Qualifelec domaines exacts", "Acompte légal max 5% non-assuré", "Sous-traitance déclaration obligatoire", "Recours Médiateur Construction gratuit"] },
};

const DIVISIONS = {
  "Métier": { color: "#52C37A", ias: ["coach", "normes", "securite"] },
  "Diagnostic": { color: "#5290E0", ias: ["diag", "analyse_visuelle", "urgence"] },
  "Boutique": { color: "#C9A84C", ias: ["shop", "prix", "eco"] },
  "Certificat": { color: "#C9A84C", ias: ["cert", "validation", "dtu_expert"] },
  "DPE": { color: "#52C37A", ias: ["dpe", "aides", "thermique"] },
  "Admin": { color: "#E8873A", ias: ["admin", "multilingue", "notifications"] },
  "Finance": { color: "#52C37A", ias: ["finance", "stripe", "affiliation"] },
  "Juridique": { color: "#5290E0", ias: ["juridique", "rgpd", "contrats"] },
  "Système": { color: "#E05252", ias: ["autodiag", "tests", "repair"] },
  "Direction": { color: "#C9A84C", ias: ["general", "strategie", "reporting"] },
  "Projet": { color: "#8B5CF6", ias: ["planning", "artisan"] },
};

const PRODS = {
  leroy: [
    { n: "Plaques BA13 standard", q: "Paquet de 4", p: "24,90€", s: "leroymerlin.fr" },
    { n: "Rails R48 acier", q: "Lot 10 barres 3m", p: "18,50€", s: "leroymerlin.fr" },
    { n: "Laine de verre 45mm", q: "Rouleau 8m²", p: "19,95€", s: "leroymerlin.fr" },
  ],
  casto: [
    { n: "Plaque BA13 Knauf", q: "1,2x2,5m", p: "7,50€", s: "castorama.fr" },
    { n: "Chevilles Fischer S8", q: "Boîte de 50", p: "8,95€", s: "castorama.fr" },
    { n: "Enduit de lissage", q: "Seau 5kg", p: "12,90€", s: "castorama.fr" },
  ],
  brico: [
    { n: "Perceuse-visseuse 18V", q: "2 batteries", p: "89,00€", s: "brico-depot.fr" },
    { n: "Niveau à bulle 120cm", q: "Aluminium pro", p: "14,90€", s: "brico-depot.fr" },
    { n: "Couteau à placo", q: "Lame 200mm", p: "9,90€", s: "brico-depot.fr" },
  ],
};

const s = {
  app: { display:"flex", flexDirection:"column", height:"100vh", maxWidth:430, margin:"0 auto", background:"#06080D", color:"#F0EDE6", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" },
  hdr: { padding:"12px 16px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(6,8,13,0.82)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderBottom:"0.5px solid rgba(201,168,76,0.1)", flexShrink:0 },
  logo: { fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, letterSpacing:2, display:"flex", alignItems:"center", gap:8 },
  logoBox: { width:28, height:28, background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 14px rgba(201,168,76,0.45)", animation:"logoGlow 3s ease-in-out infinite" },
  badge: { fontSize:9, background:"rgba(82,195,122,0.1)", border:"0.5px solid #52C37A", color:"#52C37A", padding:"2px 7px", borderRadius:20, fontWeight:700 },
  pages: { flex:1, overflow:"hidden", position:"relative" },
  page: { position:"absolute", inset:0, overflowY:"auto", overflowX:"hidden", paddingBottom:75, opacity:0, pointerEvents:"none", transform:"translateY(16px)", transition:"opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1)" },
  pageActive: { opacity:1, pointerEvents:"all", transform:"translateY(0)" },
  hero: { padding:"22px 16px 18px", background:"radial-gradient(ellipse at 50% -5%,rgba(201,168,76,0.2) 0%,rgba(201,168,76,0.05) 50%,transparent 72%)" },
  cta: { width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", borderRadius:14, padding:"14px 18px", fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#06080D", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, boxShadow:"0 4px 28px rgba(201,168,76,0.35), inset 0 1px 0 rgba(255,255,255,0.22)" },
  featGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, padding:"0 16px 20px" },
  fc: { background:"rgba(15,19,28,0.65)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 12px", cursor:"pointer", transition:"border-color 0.25s, transform 0.25s, box-shadow 0.25s", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)" },
  fcHi: { background:"rgba(18,22,32,0.75)", backdropFilter:"blur(18px)", WebkitBackdropFilter:"blur(18px)", border:"0.5px solid rgba(201,168,76,0.38)", borderRadius:14, padding:"14px 12px", cursor:"pointer", boxShadow:"0 0 28px rgba(201,168,76,0.1), inset 0 1px 0 rgba(201,168,76,0.1)" },
  fi: { width:36, height:36, borderRadius:10, background:"rgba(201,168,76,0.1)", border:"0.5px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 },
  stats3: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, padding:"0 16px 20px" },
  sc: { background:"rgba(15,19,28,0.7)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", borderRadius:12, padding:"12px 8px", textAlign:"center", border:"0.5px solid rgba(201,168,76,0.14)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)" },
  secLbl: { fontSize:10, letterSpacing:2.5, textTransform:"uppercase", color:"#C9A84C", padding:"0 16px", marginBottom:10, fontWeight:700 },
  wrap: { padding:"12px 16px" },
  aiHdr: { display:"flex", alignItems:"center", gap:10, marginBottom:14 },
  aiAv: { width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 2px 12px rgba(201,168,76,0.3)" },
  divSel: { display:"flex", gap:5, marginBottom:10, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none" },
  divPill: { flexShrink:0, padding:"4px 10px", borderRadius:20, border:"0.5px solid rgba(255,255,255,0.07)", fontSize:10, fontWeight:600, color:"rgba(240,237,230,0.45)", cursor:"pointer", background:"transparent", whiteSpace:"nowrap", transition:"all 0.2s" },
  iaSel: { display:"flex", gap:5, marginBottom:10, overflowX:"auto", paddingBottom:2, scrollbarWidth:"none" },
  iap: { flexShrink:0, padding:"5px 10px", borderRadius:20, border:"0.5px solid rgba(255,255,255,0.07)", fontSize:10, fontWeight:600, color:"rgba(240,237,230,0.45)", cursor:"pointer", background:"transparent", whiteSpace:"nowrap", transition:"all 0.2s" },
  iapOn: { flexShrink:0, padding:"5px 10px", borderRadius:20, border:"0.5px solid #C9A84C", fontSize:10, fontWeight:600, color:"#C9A84C", cursor:"pointer", background:"rgba(201,168,76,0.1)", whiteSpace:"nowrap" },
  chips: { display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 },
  chip: { background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"5px 11px", fontSize:10, color:"rgba(240,237,230,0.5)", cursor:"pointer", transition:"all 0.2s" },
  msgs: { display:"flex", flexDirection:"column", gap:10, marginBottom:10, minHeight:180 },
  msgA: { display:"flex", gap:7 },
  msgU: { display:"flex", gap:7, flexDirection:"row-reverse" },
  bubA: { maxWidth:"78%", padding:"10px 14px", borderRadius:"4px 16px 16px 16px", fontSize:12, lineHeight:1.55, background:"rgba(15,19,28,0.85)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", border:"0.5px solid rgba(255,255,255,0.08)", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.3)" },
  bubU: { maxWidth:"78%", padding:"10px 14px", borderRadius:"16px 4px 16px 16px", fontSize:12, lineHeight:1.55, background:"linear-gradient(135deg,#7A6020,#C9A84C,#EDD060)", color:"#06080D", fontWeight:500, boxShadow:"0 2px 16px rgba(201,168,76,0.28)" },
  mav: { width:28, height:28, borderRadius:8, background:"rgba(10,14,22,0.8)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", border:"0.5px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  inputBar: { display:"flex", gap:7, alignItems:"flex-end" },
  ci: { flex:1, background:"rgba(15,19,28,0.75)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:20, padding:"9px 14px", color:"#F0EDE6", fontFamily:"'DM Sans',sans-serif", fontSize:12, resize:"none", outline:"none", minHeight:38 },
  sb: { width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#06080D", boxShadow:"0 2px 16px rgba(201,168,76,0.45)" },
  errBox: { background:"rgba(224,82,82,0.07)", border:"0.5px solid rgba(224,82,82,0.25)", borderRadius:10, padding:"8px 12px", fontSize:11, color:"#E05252", marginBottom:8 },
  storeTabs: { display:"flex", gap:7, marginBottom:12 },
  stab: { padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"0.5px solid rgba(255,255,255,0.07)", color:"rgba(240,237,230,0.5)", background:"transparent", transition:"all 0.2s" },
  stabOn: { padding:"6px 12px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"0.5px solid transparent", background:"linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)", color:"#06080D" },
  pi: { background:"rgba(15,19,28,0.7)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"13px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:9, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)" },
  piw: { width:40, height:40, background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.22)", borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  buyBtn: { background:"rgba(201,168,76,0.1)", border:"0.5px solid rgba(201,168,76,0.5)", color:"#C9A84C", borderRadius:8, padding:"5px 11px", fontSize:10, fontWeight:700, cursor:"pointer" },
  certCard: { background:"rgba(10,13,20,0.85)", backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)", border:"0.5px solid rgba(201,168,76,0.38)", borderRadius:16, padding:"22px 16px", textAlign:"center", marginBottom:12, boxShadow:"0 0 48px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.12)" },
  certSeal: { width:72, height:72, borderRadius:"50%", border:"1.5px solid rgba(201,168,76,0.55)", margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", background:"radial-gradient(circle,rgba(201,168,76,0.14) 0%,rgba(201,168,76,0.02) 100%)", boxShadow:"0 0 24px rgba(201,168,76,0.18)" },
  dlBtn: { width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", border:"none", borderRadius:14, padding:13, fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#06080D", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 24px rgba(201,168,76,0.32)" },
  card: { background:"rgba(15,19,28,0.7)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 15px", marginBottom:10, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)" },
  inp: { background:"rgba(6,8,13,0.85)", border:"0.5px solid rgba(201,168,76,0.18)", borderRadius:8, padding:"9px 11px", color:"#F0EDE6", fontSize:12, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", WebkitAppearance:"none" },
  greenBtn: { width:"100%", background:"rgba(82,195,122,0.08)", border:"0.5px solid rgba(82,195,122,0.45)", borderRadius:14, padding:13, fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#52C37A", cursor:"pointer", marginTop:7, boxShadow:"0 2px 14px rgba(82,195,122,0.1)" },
  aides: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 },
  aideC: { background:"rgba(6,8,13,0.75)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", borderRadius:10, padding:12, border:"0.5px solid rgba(255,255,255,0.07)" },
  bnav: { position:"absolute", bottom:0, left:0, right:0, background:"rgba(6,8,13,0.85)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderTop:"0.5px solid rgba(201,168,76,0.1)", display:"flex", padding:"7px 0 12px", zIndex:100, boxShadow:"0 -12px 40px rgba(0,0,0,0.45)" },
  ni: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:2 },
  niw: { width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.25s" },
  niwOn: { width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(201,168,76,0.18)", boxShadow:"0 0 14px rgba(201,168,76,0.2)" },
  nlbl: { fontSize:8, color:"rgba(240,237,230,0.22)", fontWeight:600, textTransform:"uppercase", transition:"color 0.25s" },
  nlblOn: { fontSize:8, color:"#C9A84C", fontWeight:700, textTransform:"uppercase" },
  pinDot: { width:14, height:14, borderRadius:"50%", border:"1.5px solid rgba(201,168,76,0.3)", background:"transparent", transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)" },
  pinDotFill: { width:14, height:14, borderRadius:"50%", background:"linear-gradient(135deg,#EDD060,#C9A84C)", boxShadow:"0 0 10px rgba(201,168,76,0.55)", transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)" },
  pinKey: { width:72, height:72, borderRadius:"50%", background:"rgba(15,19,28,0.75)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", border:"0.5px solid rgba(255,255,255,0.09)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:700, color:"#F0EDE6", userSelect:"none", transition:"all 0.15s", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.07)" },
  keyScreen: { position:"absolute", inset:0, background:"rgba(6,8,13,0.94)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"30px 24px", zIndex:998 },
  keyBox: { width:"100%", background:"rgba(15,19,28,0.75)", backdropFilter:"blur(14px)", WebkitBackdropFilter:"blur(14px)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:16, padding:18, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)" },
  keyInp: { width:"100%", background:"rgba(6,8,13,0.85)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"12px 14px", color:"#F0EDE6", fontFamily:"'DM Sans',sans-serif", fontSize:13, outline:"none", marginBottom:12 },
  keyBtn: { width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", border:"none", borderRadius:10, padding:14, fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700, color:"#06080D", cursor:"pointer", boxShadow:"0 4px 22px rgba(201,168,76,0.32)" },
  rangBadge: { fontSize:9, padding:"2px 7px", borderRadius:20, fontWeight:700, marginLeft:6 },
  scanBtn: { flex:1, background:"linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)", border:"none", borderRadius:14, padding:"12px 10px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#06080D", cursor:"pointer", boxShadow:"0 3px 16px rgba(201,168,76,0.3)" },
  scanBtnGhost: { flex:1, background:"rgba(15,19,28,0.65)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", border:"0.5px solid rgba(201,168,76,0.25)", borderRadius:14, padding:"12px 10px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#C9A84C", cursor:"pointer" },
};

const PROFILS = {
  "Particulier": {
    label: "Particulier",
    icon: "🏠",
    suffix: `

PROFIL : Particulier / bricoleur amateur.
RÈGLES IMPÉRATIVES :
- Commence par la solution la plus simple et accessible
- Indique le niveau de difficulté : ⭐ Facile | ⭐⭐ Intermédiaire | ⭐⭐⭐ Complexe — appelle un pro
- Explique chaque étape sans jargon technique (ou explique le jargon utilisé)
- Signale systématiquement les risques sécurité et quand il FAUT faire appel à un professionnel
- Donne des repères de prix matériaux grand public (Leroy Merlin, Castorama, Brico Dépôt)
- Encourage et rassure — le bricolage est accessible avec de bonnes instructions`,
  },
  "Artisan Pro": {
    label: "Artisan Pro",
    icon: "⚒️",
    suffix: `

PROFIL : Artisan professionnel qualifié.
RÈGLES IMPÉRATIVES :
- Références DTU précises (numéro, paragraphe, année) — obligatoires pour chaque réponse
- Nomenclature technique complète (NF, EN, CE, classements)
- Quantitatifs professionnels (ml, m², kg/m², doses, entraxes, épaisseurs)
- Techniques de mise en oeuvre selon les règles de l'art
- Responsabilités décennale et biennale selon les travaux
- Conseils sur la facturation, sous-traitance, assurances pro`,
  },
  "Architecte": {
    label: "Architecte",
    icon: "📐",
    suffix: `

PROFIL : Architecte / Maître d'oeuvre.
RÈGLES IMPÉRATIVES :
- Référentiels réglementaires exhaustifs (DTU, NF, ERP, PMR, Code de la construction)
- Prescriptions techniques de conception et détails d'exécution
- Coordination inter-corps d'état et phasage chantier
- Aspects administratifs : permis, déclarations préalables, AT, assurances MO/MOE
- Performance et critères de réception des ouvrages`,
  },
  "Investisseur": {
    label: "Investisseur",
    icon: "📈",
    suffix: `

PROFIL : Investisseur immobilier.
RÈGLES IMPÉRATIVES :
- Focus ROI, valorisation et plus-value du bien
- Estimations budgétaires précises en €/m² avec fourchettes réalistes
- Impact sur la valeur locative et vénale
- Optimisation des aides financières cumulables (MaPrimeRénov', déficit foncier)
- Délais réalistes, risques chantier, choix prestataires`,
  },
};

function buildSystemPrompt(iaKey, profileType) {
  const base = IAS[iaKey]?.sys || "";
  const profil = PROFILS[profileType] || PROFILS["Particulier"];
  return base + profil.suffix;
}

function getChips(iaKey, profileType) {
  const ia = IAS[iaKey];
  if (!ia) return [];
  if ((profileType === "Artisan Pro" || profileType === "Architecte") && ia.chipsPro) return ia.chipsPro;
  return ia.chips;
}

// ── Types d'étagères ─────────────────────────────────────────────
const SHELF_TYPES = {
  flottante:   { label:"Flottante",    emoji:"▬",  wRatio:0.55, sh:7,  sd:18, brackets:"pins",    prix:"25-80€",   desc:"Fixations invisibles — aspect épuré" },
  industrielle:{ label:"Industrielle", emoji:"⚙️", wRatio:0.65, sh:12, sd:28, brackets:"metal",   prix:"45-150€",  desc:"Équerres métal apparent" },
  angle:       { label:"Angle",        emoji:"◣",  wRatio:0.35, sh:6,  sd:20, brackets:"corner",  prix:"20-60€",   desc:"Pour coins de pièce" },
  console:     { label:"Console",      emoji:"▭",  wRatio:0.70, sh:8,  sd:38, brackets:"hairpin", prix:"60-200€",  desc:"Pieds épingles scandinave" },
  cube:        { label:"Cube",         emoji:"◻",  wRatio:0.28, sh:24, sd:22, brackets:"hidden",  prix:"30-90€",   desc:"Niche murale design" },
};

// ── Moteur AR 3D ─────────────────────────────────────────────────
function drawARScene(ctx, W, H, anchor, mode, tilt, frame, shelfType) {
  ctx.clearRect(0, 0, W, H);
  const pulse = 0.6 + 0.4 * Math.sin(frame * 0.12);
  const G = "#52C37A", OR = "#C9A84C", BL = "#5290E0", RD = "#E05252";

  if (!anchor) {
    // Guide "appuyez pour placer"
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = OR; ctx.lineWidth = 2; ctx.setLineDash([6,4]);
    ctx.strokeRect(W*0.15, H*0.3, W*0.7, H*0.35);
    ctx.setLineDash([]);
    // Crosshair
    ctx.beginPath(); ctx.moveTo(W/2-18,H/2); ctx.lineTo(W/2+18,H/2);
    ctx.moveTo(W/2,H/2-18); ctx.lineTo(W/2,H/2+18);
    ctx.globalAlpha = 1; ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(W/2-90,H/2+28,180,26); ctx.beginPath();
    ctx.fillStyle = OR; ctx.font = "bold 12px DM Sans,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Appuyez pour placer", W/2, H/2+46);
    ctx.restore();
    return;
  }

  const ax = anchor.x, ay = anchor.y;
  const skewX = (tilt.gamma || 0) * 0.4;
  const skewY = (tilt.beta  || 0) * 0.2;

  if (mode === "etagere") {
    const st = SHELF_TYPES[shelfType] || SHELF_TYPES.flottante;
    const sw = W * st.wRatio, sh = st.sh, sd = st.sd;
    const sx = ax - sw/2, ex = ax + sw/2;
    // Niveau horizontal
    ctx.strokeStyle = G+"cc"; ctx.lineWidth = 1; ctx.setLineDash([8,5]);
    ctx.beginPath(); ctx.moveTo(0,ay); ctx.lineTo(W,ay); ctx.stroke(); ctx.setLineDash([]);
    // Face avant étagère
    ctx.beginPath(); ctx.moveTo(sx,ay-sh); ctx.lineTo(ex,ay-sh); ctx.lineTo(ex,ay); ctx.lineTo(sx,ay); ctx.closePath();
    ctx.fillStyle = "rgba(201,168,76,0.55)"; ctx.fill(); ctx.strokeStyle = OR; ctx.lineWidth = 1.5; ctx.stroke();
    // Face supérieure (perspective)
    ctx.beginPath(); ctx.moveTo(sx,ay-sh); ctx.lineTo(ex,ay-sh);
    ctx.lineTo(ex+sd+skewX,ay-sh-sd*0.45+skewY); ctx.lineTo(sx+sd+skewX,ay-sh-sd*0.45+skewY); ctx.closePath();
    ctx.fillStyle = "rgba(201,168,76,0.38)"; ctx.fill(); ctx.strokeStyle = OR; ctx.stroke();
    // Face droite
    ctx.beginPath(); ctx.moveTo(ex,ay-sh); ctx.lineTo(ex+sd+skewX,ay-sh-sd*0.45+skewY);
    ctx.lineTo(ex+sd+skewX,ay-sd*0.45+skewY); ctx.lineTo(ex,ay); ctx.closePath();
    ctx.fillStyle = "rgba(201,168,76,0.22)"; ctx.fill(); ctx.strokeStyle = OR; ctx.stroke();
    // Fixations selon type
    if (st.brackets === "pins") {
      // Flottante — tiges invisibles
      [sx + sw*0.2, ax, ex - sw*0.2].forEach(bx => {
        ctx.strokeStyle = BL; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(bx, ay); ctx.lineTo(bx, ay+14); ctx.stroke();
        const pr = 7 + 2*pulse;
        ctx.beginPath(); ctx.arc(bx, ay+18, pr, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(224,82,82,${0.5+0.5*pulse})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = RD; ctx.beginPath(); ctx.arc(bx,ay+18,3,0,Math.PI*2); ctx.fill();
      });
    } else if (st.brackets === "metal") {
      // Industrielle — équerres métal visible
      [sx + sw*0.15, ex - sw*0.15].forEach(bx => {
        ctx.strokeStyle = BL; ctx.lineWidth = 4; ctx.beginPath();
        ctx.moveTo(bx, ay); ctx.lineTo(bx, ay+44); ctx.moveTo(bx,ay); ctx.lineTo(bx+20,ay); ctx.stroke();
        const pr = 10 + 3*pulse;
        ctx.beginPath(); ctx.arc(bx, ay+28, pr, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(224,82,82,${0.5+0.5*pulse})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx+14,ay+18,60,18);
        ctx.fillStyle = BL; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
        ctx.fillText("M6 — Cheville ⌀10", bx+16, ay+30);
      });
    } else if (st.brackets === "corner") {
      // Angle — fixation d'angle
      ctx.strokeStyle = BL; ctx.lineWidth = 3.5; ctx.beginPath();
      ctx.moveTo(sx, ay); ctx.lineTo(sx, ay+50); ctx.moveTo(sx,ay); ctx.lineTo(sx+30,ay); ctx.stroke();
      const pr = 9 + 3*pulse;
      ctx.beginPath(); ctx.arc(sx+10, ay+30, pr, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(224,82,82,${0.5+0.5*pulse})`; ctx.lineWidth = 2; ctx.stroke();
    } else if (st.brackets === "hairpin") {
      // Console — pieds épingles
      [sx + sw*0.2, ex - sw*0.2].forEach(bx => {
        ctx.strokeStyle = OR; ctx.lineWidth = 2.5; ctx.beginPath();
        ctx.moveTo(bx-6, ay); ctx.lineTo(bx-6, ay+55); ctx.moveTo(bx+6,ay); ctx.lineTo(bx+6, ay+55);
        ctx.moveTo(bx-6,ay+55); ctx.lineTo(bx+10,ay+55); ctx.moveTo(bx+6,ay+55); ctx.lineTo(bx-10,ay+55); ctx.stroke();
      });
    } else {
      // Cube/hidden — fixations cachées
      [sx + sw*0.25, ex - sw*0.25].forEach(bx => {
        ctx.strokeStyle = BL; ctx.lineWidth = 2; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(bx,ay); ctx.lineTo(bx,ay+20); ctx.stroke(); ctx.setLineDash([]);
        const pr = 8 + 2*pulse;
        ctx.beginPath(); ctx.arc(bx,ay+24,pr,0,Math.PI*2);
        ctx.strokeStyle = `rgba(224,82,82,${0.5+0.5*pulse})`; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = RD; ctx.beginPath(); ctx.arc(bx,ay+24,3,0,Math.PI*2); ctx.fill();
      });
    }
    // Dimension
    ctx.strokeStyle = OR+"bb"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(sx,ay+62); ctx.lineTo(ex,ay+62);
    ctx.moveTo(sx,ay+56); ctx.lineTo(sx,ay+68); ctx.moveTo(ex,ay+56); ctx.lineTo(ex,ay+68); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(ax-38,ay+66,76,18);
    ctx.fillStyle = OR; ctx.font = "bold 10px DM Sans"; ctx.textAlign = "center";
    ctx.fillText(st.label + " — " + Math.round(sw/W*100*2.5)/10+"m", ax, ay+79);
    // Badge DTU + type
    const badgeTxt = "DTU 25.41 — " + st.label + " " + st.prix;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8,8,Math.max(148, badgeTxt.length*7),22);
    ctx.fillStyle = OR; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
    ctx.fillText(badgeTxt, 14, 22);
    // Niveau bulle
    drawLevelBubble(ctx, W-44, 40, tilt.gamma);

  } else if (mode === "cloison") {
    const cw = W * 0.72, ch = H * 0.68;
    const cx = ax - cw/2, cy2 = ay - ch/2;
    // Ossature
    const entraxe = cw / 5;
    ctx.strokeStyle = BL+"88"; ctx.lineWidth = 1.5; ctx.setLineDash([6,4]);
    for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx+i*entraxe, cy2); ctx.lineTo(cx+i*entraxe, cy2+ch); ctx.stroke(); }
    ctx.setLineDash([]);
    // Plaques BA13
    ctx.strokeStyle = OR; ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy2, cw, ch/2); ctx.strokeRect(cx, cy2+ch/2, cw, ch/2);
    ctx.fillStyle = "rgba(201,168,76,0.08)"; ctx.fillRect(cx,cy2,cw,ch/2); ctx.fillRect(cx,cy2+ch/2,cw,ch/2);
    // Joints
    ctx.strokeStyle = G+"66"; ctx.lineWidth = 1; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx, cy2+ch/2); ctx.lineTo(cx+cw, cy2+ch/2); ctx.stroke(); ctx.setLineDash([]);
    // Rails
    ctx.fillStyle = BL+"55"; ctx.fillRect(cx, cy2-6, cw, 6); ctx.fillRect(cx, cy2+ch, cw, 6);
    ctx.strokeStyle = BL; ctx.lineWidth = 1.5;
    ctx.strokeRect(cx,cy2-6,cw,6); ctx.strokeRect(cx,cy2+ch,cw,6);
    // Labels
    ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(ax-50,cy2+ch/2-10,100,20);
    ctx.fillStyle = G; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "center";
    ctx.fillText("JOINT / DÉCALAGE 40cm", ax, cy2+ch/2+4);
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8,8,150,22);
    ctx.fillStyle = OR; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
    ctx.fillText(`DTU 25.41 — Entraxe ${Math.round(entraxe/W*100*2.5)/10}m`, 14, 22);
    drawLevelBubble(ctx, W-44, 40, tilt.gamma);

  } else if (mode === "carrelage") {
    const tw = 60, cols = Math.ceil(W/tw)+1, rows = Math.ceil(H*0.6/tw)+1;
    const offX = ax % tw, offY = ay % tw;
    ctx.strokeStyle = OR+"55"; ctx.lineWidth = 1;
    for (let r = -1; r < rows; r++) for (let c = -1; c < cols; c++) {
      const tx = c*tw + offX, ty = r*tw + offY + ay - H*0.3;
      ctx.fillStyle = r%2===c%2 ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.12)";
      ctx.fillRect(tx+1, ty+1, tw-2, tw-2); ctx.strokeRect(tx, ty, tw, tw);
    }
    ctx.fillStyle = RD+"cc"; ctx.beginPath(); ctx.arc(ax,ay,8,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8,8,145,22);
    ctx.fillStyle = OR; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
    ctx.fillText("DTU 52.1 — Joint 2mm — Départ centre", 14, 22);

  } else if (mode === "prise") {
    const r = 36;
    ctx.strokeStyle = BL; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.strokeRect(ax-r, ay-r, r*2, r*2);
    ctx.strokeStyle = BL+"44"; ctx.lineWidth = 1.5;
    ctx.strokeRect(ax-r-12, ay-r-12, (r+12)*2, (r+12)*2);
    // Câble
    ctx.strokeStyle = RD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, ay+r); ctx.lineTo(ax, H); ctx.stroke();
    // Bornes
    [[ax-10,ay-6],[ax+10,ay-6],[ax,ay+10]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.arc(px,py,4,0,Math.PI*2); ctx.fillStyle = RD; ctx.fill();
    });
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8,8,158,22);
    ctx.fillStyle = OR; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
    ctx.fillText("NFC 15-100 — H≥5cm sol — Boîte ⌀67", 14, 22);

  } else if (mode === "tableau") {
    const tw2 = W*0.55, th = H*0.28;
    const tx2 = ax-tw2/2, ty2 = ay-th/2;
    ctx.strokeStyle = G; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.strokeRect(tx2,ty2,tw2,th);
    ctx.strokeStyle = G+"44"; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
    ctx.strokeRect(tx2-16,ty2-16,tw2+32,th+32); ctx.setLineDash([]);
    // Coins de fixation
    [[tx2+14,ty2+14],[tx2+tw2-14,ty2+14],[tx2+14,ty2+th-14],[tx2+tw2-14,ty2+th-14]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.arc(px,py,8+3*pulse,0,Math.PI*2);
      ctx.strokeStyle = `rgba(224,82,82,${0.5+0.5*pulse})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fillStyle = RD; ctx.fill();
    });
    ctx.strokeStyle = OR+"66"; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(0,ay); ctx.lineTo(W,ay); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(8,8,138,22);
    ctx.fillStyle = OR; ctx.font = "bold 9px DM Sans"; ctx.textAlign = "left";
    ctx.fillText("4 fixations ⌀6mm — Niveau laser", 14, 22);
  }
}

function drawLevelBubble(ctx, cx, cy, gamma) {
  const off = Math.max(-14, Math.min(14, (gamma||0) * 0.6));
  ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 12, 0, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(cx, cy, 22, 12, 0, 0, Math.PI*2); ctx.stroke();
  const onLevel = Math.abs(off) < 3;
  ctx.beginPath(); ctx.arc(cx+off, cy, 7, 0, Math.PI*2);
  ctx.fillStyle = onLevel ? "#52C37A" : "#E05252"; ctx.fill();
}

export default function App() {
  const [page, setPage] = useState("home");
  // Clé API gérée côté serveur Vercel (api/anthropic.js)
  const [curDiv, setCurDiv] = useState("Métier");
  const [curIA, setCurIA] = useState("coach");
  const [msgs, setMsgs] = useState([{ role: "ai", text: "Bonjour ! Je suis votre Coach Expert Bâtiment. Quel est votre projet ?" }]);
  const [hist, setHist] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [store, setStore] = useState("leroy");
  const [dpeS, setDpeS] = useState(75);
  const [dpeT, setDpeT] = useState("Appartement");
  const [dpeC, setDpeC] = useState("Gaz naturel");
  const [dpeRes, setDpeRes] = useState(null);
  const [camActive, setCamActive] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [certProjet, setCertProjet] = useState("Cloison BA13");
  const [certNorme, setCertNorme] = useState("DTU 25.41 — Cloisons plâtre");
  const [certSurface, setCertSurface] = useState("10");
  const [certProp, setCertProp] = useState("");
  const [certArtisan, setCertArtisan] = useState("");
  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");
  const [msgCount, setMsgCount] = useState(() => parseInt(localStorage.getItem("bl_msg_count")||"0"));
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium] = useState(() => localStorage.getItem("bl_premium")==="1");
  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem("bl_onboarded")==="1");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userType, setUserType] = useState(() => localStorage.getItem("bl_user_type") || "Particulier");
  const [pdgUnlocked, setPdgUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [scanIA, setScanIA] = useState("diag");
  const [toolTab, setToolTab] = useState("devis");
  const [devisText, setDevisText] = useState("");
  const [devisResult, setDevisResult] = useState(null);
  const [devisLoading, setDevisLoading] = useState(false);
  const [calcType, setCalcType] = useState("Peinture");
  const [calcSurface, setCalcSurface] = useState("20");
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [artisanNom, setArtisanNom] = useState("");
  const [artisanSpec, setArtisanSpec] = useState("Maçonnerie");
  const [artisanResult, setArtisanResult] = useState(null);
  const [artisanLoading, setArtisanLoading] = useState(false);
  const [primesRev, setPrimesRev] = useState("Modeste");
  const [primesTrav, setPrimesTrav] = useState("Isolation combles");
  const [primesSurf, setPrimesSurf] = useState("80");
  const [primesResult, setPrimesResult] = useState(null);
  const [primesLoading, setPrimesLoading] = useState(false);
  const [projets, setProjets] = useState(() => { try { return JSON.parse(localStorage.getItem("bl_projets") || "[]"); } catch { return []; } });
  const [projetNom, setProjetNom] = useState("");
  const [projetType, setProjetType] = useState("Rénovation");
  const [projetNotes, setProjetNotes] = useState("");
  const [scannerTab, setScannerTab] = useState("photo");
  const [arModeType, setArModeType] = useState("etagere");
  const [arAnchor, setArAnchor] = useState(null);
  const [arTilt, setArTilt] = useState({ beta: 0, gamma: 0 });
  const [arShelfType, setArShelfType] = useState("flottante");
  const [showArAdvisor, setShowArAdvisor] = useState(false);
  const [arAdvInput, setArAdvInput] = useState("");
  const [arAdvResult, setArAdvResult] = useState(null);
  const [arAdvLoading, setArAdvLoading] = useState(false);
  // ── Vocal ─────────────────────────────────────────────────────
  const [voiceActive, setVoiceActive] = useState(false);
  // ── Contre-devis ──────────────────────────────────────────────
  const [counterDevis, setCounterDevis] = useState(null);
  const [counterLoading, setCounterLoading] = useState(false);
  // ── Planning chantier ─────────────────────────────────────────
  const [planningType, setPlanningType] = useState("Rénovation salle de bain");
  const [planningBudget, setPlanningBudget] = useState("5000");
  const [planningResult, setPlanningResult] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  // ── Devis Pro artisan ─────────────────────────────────────────
  const [devisProDesc, setDevisProDesc] = useState("");
  const [devisProClient, setDevisProClient] = useState("");
  const [devisProSurface, setDevisProSurface] = useState("20");
  const [devisProResult, setDevisProResult] = useState(null);
  const [devisProLoading, setDevisProLoading] = useState(false);
  // ── Rentabilité artisan ───────────────────────────────────────
  const [rentaSurface, setRentaSurface] = useState("50");
  const [rentaTaux, setRentaTaux] = useState("45");
  const [rentaMat, setRentaMat] = useState("3000");
  const [rentaDep, setRentaDep] = useState("150");
  const [rentaResult, setRentaResult] = useState(null);
  // ── Jumeau numérique projet ───────────────────────────────────
  const [projetChat, setProjetChat] = useState(null);
  const [projetChatMsgs, setProjetChatMsgs] = useState([]);
  const [projetChatInput, setProjetChatInput] = useState("");
  const [projetChatLoading, setProjetChatLoading] = useState(false);
  // ── CR Chantier ───────────────────────────────────────────────
  const [crLoading, setCrLoading] = useState(false);

  const msgsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const arVideoRef = useRef(null);
  const arCanvasRef = useRef(null);
  const arAnimRef = useRef(null);
  const arFrameRef = useRef(0);
  const streamRef = useRef(null);
  const arAnchorRef = useRef(null);
  const arModeRef = useRef("etagere");
  const arTiltRef = useRef({ beta:0, gamma:0 });
  const arShelfTypeRef = useRef("flottante");
  const voiceRef = useRef(null);

  // Pas de garde apiKey — la clé est côté serveur
  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [msgs]);

  useEffect(() => {
    const handler = (e) => {
      const t = { beta: e.beta || 0, gamma: e.gamma || 0 };
      arTiltRef.current = t;
      setArTilt(t);
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  useEffect(() => { arAnchorRef.current = arAnchor; }, [arAnchor]);
  useEffect(() => { arModeRef.current = arModeType; }, [arModeType]);
  useEffect(() => { arShelfTypeRef.current = arShelfType; }, [arShelfType]);

  // Réattacher le stream quand les éléments video remontent dans le DOM
  useEffect(() => {
    if (streamRef.current) {
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      if (arVideoRef.current && !arVideoRef.current.srcObject) {
        arVideoRef.current.srcObject = streamRef.current;
        arVideoRef.current.play().catch(() => {});
      }
    }
  }, [scannerTab, page]);

  useEffect(() => {
    if (page !== "scanner" || scannerTab !== "ar" || !camActive) {
      cancelAnimationFrame(arAnimRef.current);
      return;
    }
    const loop = () => {
      const canvas = arCanvasRef.current;
      if (!canvas) { arAnimRef.current = requestAnimationFrame(loop); return; }
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) { canvas.width = rect.width; canvas.height = rect.height; }
      const ctx = canvas.getContext("2d");
      drawARScene(ctx, canvas.width, canvas.height, arAnchorRef.current, arModeRef.current, arTiltRef.current, arFrameRef.current, arShelfTypeRef.current);
      arFrameRef.current++;
      arAnimRef.current = requestAnimationFrame(loop);
    };
    arAnimRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(arAnimRef.current);
  }, [page, scannerTab, camActive]);

  const welcomeMsg = (iaKey, profile) => {
    const ia = IAS[iaKey];
    const p = PROFILS[profile] || PROFILS["Particulier"];
    if (profile === "Artisan Pro" || profile === "Architecte") {
      return `${p.icon} ${ia.name} — Mode professionnel. Références DTU, quantitatifs et techniques de mise en oeuvre. Quelle est votre problématique ?`;
    }
    return `${p.icon} Bonjour ! Je suis ${ia.name}. Je m'adapte à votre niveau — de la solution la plus simple à la plus complète. Quel est votre projet ?`;
  };

  const goPage = (p) => {
    // Stopper la caméra quand on quitte le scanner
    if (page === "scanner" && p !== "scanner") {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCamActive(false);
    }
    setPage(p);
    if (p === "coach") {
      setMsgs([{ role: "ai", text: welcomeMsg(curIA, userType) }]);
      setHist([]);
      setErrMsg("");
    }
  };

  // ── Persistance conversations par IA ─────────────────────────
  const saveConv = (iaKey, messages) => {
    try { localStorage.setItem("mm_chat_" + iaKey, JSON.stringify(messages.slice(-40))); } catch {}
  };
  const loadConv = (iaKey) => {
    try { const s = localStorage.getItem("mm_chat_" + iaKey); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  const switchDiv = (div) => {
    saveConv(curIA, msgs);
    setCurDiv(div);
    const firstIA = DIVISIONS[div].ias[0];
    setCurIA(firstIA);
    const saved = loadConv(firstIA);
    setMsgs(saved && saved.length > 0 ? saved : [{ role: "ai", text: welcomeMsg(firstIA, userType) }]);
    setHist([]);
    setErrMsg("");
  };

  const switchIA = (id) => {
    saveConv(curIA, msgs);
    setCurIA(id);
    const div = Object.entries(DIVISIONS).find(([, info]) => info.ias.includes(id));
    if (div) setCurDiv(div[0]);
    const saved = loadConv(id);
    setMsgs(saved && saved.length > 0 ? saved : [{ role: "ai", text: welcomeMsg(id, userType) }]);
    setHist([]);
    setErrMsg("");
  };

  const activerIA = () => {
  };

  const send = async () => {
    if (loading || !input.trim()) return;
    
    const txt = input.trim();
    setInput("");
    setErrMsg("");
    const newMsgs = [...msgs, { role: "user", text: txt }];
    const newHist = [...hist, { role: "user", content: txt }];
    const nc=msgCount+1; setMsgCount(nc); localStorage.setItem("bl_msg_count",nc);
    if(!isPremium&&nc>0&&nc%5===0){setMsgs(newMsgs);setShowPaywall(true);return;}
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const r = await withRetry(()=>fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rep = data.content[0].text || "Désolé, réessayez.";
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs);
      saveConv(curIA, finalMsgs);
    } catch (e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  };

  const ouvrirCamera = async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      if (arVideoRef.current) {
        arVideoRef.current.srcObject = stream;
        arVideoRef.current.play().catch(() => {});
      }
      setCamActive(true);
      setPhotoUrl(null);
      setScanResult(null);
    } catch(e) {
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const prendrePhoto = () => {
    if (!camActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoUrl(dataUrl);
    setCamActive(false);
    // Garder le stream actif pour l'AR — juste mettre pause sur l'affichage
    if (scannerTab !== "ar") {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserPhoto(dataUrl);
  };

  const importerPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhotoUrl(ev.target.result); analyserPhoto(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const analyserPhoto = async (dataUrl, iaKey) => {
    
    setScanLoading(true);
    setScanResult(null);
    const ia = iaKey || scanIA;
    const base64 = dataUrl.split(",")[1];
    const mediaType = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const sysScan = IAS[ia].sys + " Analyse la photo fournie et réponds UNIQUEMENT en JSON valide : {\"urgence\":\"MODERE\",\"titre\":\"Titre court\",\"etapes\":[\"etape 1\",\"etape 2\",\"etape 3\"]}. Urgences possibles : BAS, MODERE, URGENT, DANGER.";
    try {
      const r = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: sysScan,
          messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Analyse ce problème de bâtiment." }] }]
        }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const txt = data.content[0].text.replace(/```json|```/g, "").trim();
      setScanResult(JSON.parse(txt));
    } catch(e) {
      setScanResult({ urgence: "ERREUR", titre: "Analyse impossible", etapes: [e.message] });
    } finally { setScanLoading(false); }
  };

  const sendWithPhoto = async (dataUrl) => {
    
    const caption = input.trim() || "Analyse cette photo et donne-moi ton expertise.";
    setInput("");
    setErrMsg("");
    const mediaTypePhoto = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const newMsgs = [...msgs, { role: "user", text: "📷 " + caption }];
    const newHist = [...hist, { role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaTypePhoto, data: dataUrl.split(",")[1] } },
      { type: "text", text: caption }
    ]}];
    const nc = msgCount + 1; setMsgCount(nc); localStorage.setItem("bl_msg_count", nc);
    if (!isPremium && nc > 0 && nc % 5 === 0) { setMsgs(newMsgs); setShowPaywall(true); return; }
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",  },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rep = data.content[0].text || "Désolé, réessayez.";
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs2 = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs2);
      saveConv(curIA, finalMsgs2);
    } catch(e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  };

  const rateMsg = (idx, rating) => {
    let r; try { r=JSON.parse(localStorage.getItem("bl_ratings")||"[]"); } catch { r=[]; }
    r.push({ia:curIA,rating,timestamp:Date.now(),idx});
    localStorage.setItem("bl_ratings",JSON.stringify(r));
    setMsgs(prev=>prev.map((m,i)=>i===idx?{...m,rated:rating}:m));
  };
  const withRetry = async (fn,retries=3) => {
    for(let i=0;i<retries;i++){try{return await fn();}catch(e){if(i===retries-1)throw e;await new Promise(r=>setTimeout(r,1000*Math.pow(2,i)));}}
  };

  // ── Vocal ──────────────────────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée sur ce navigateur."); return; }
    const rec = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    voiceRef.current = rec;
    rec.onstart = () => setVoiceActive(true);
    rec.onresult = e => { setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript); setVoiceActive(false); };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    rec.start();
  };

  // ── Contexte profil pour toutes les IAs ──────────────────────
  const profilIA = () => ({
    "Particulier":  "PROFIL UTILISATEUR : Particulier / non-professionnel. Langage simple et accessible, pas de jargon sans explication. Indiquer quand il faut impérativement faire appel à un professionnel.",
    "Artisan Pro":  "PROFIL UTILISATEUR : Professionnel du bâtiment / artisan qualifié. Langage technique complet, références DTU obligatoires (numéro + paragraphe), quantitatifs précis, normes de mise en œuvre, responsabilité décennale.",
    "Architecte":   "PROFIL UTILISATEUR : Architecte / Maître d'œuvre. Prescriptions techniques de conception, coordination inter-corps d'état, réglementation ERP/PMR, aspects administratifs (permis, AT, assurances MOE).",
    "Investisseur": "PROFIL UTILISATEUR : Investisseur immobilier. Focus ROI et valorisation du bien, estimations en €/m², impact sur la valeur locative/vénale, optimisation des aides financières cumulables.",
  }[userType] || "");

  const profilPDFLabel = () => ({
    "Particulier":  "Document Particulier",
    "Artisan Pro":  "Document Professionnel",
    "Architecte":   "Document Maître d'Œuvre",
    "Investisseur": "Rapport Investisseur",
  }[userType] || "Document MAESTROMIND");

  // ── Contre-devis ───────────────────────────────────────────────
  // ── Mode Urgence Express ──────────────────────────────────────
  const startUrgence = (type) => {
    const messages = {
      "GAZ":         "🔴 URGENCE GAZ — j'ai une odeur de gaz dans mon logement. Que faire immédiatement ?",
      "EAU":         "🔵 URGENCE EAU — j'ai une fuite d'eau importante. Que faire maintenant ?",
      "ÉLECTRICITÉ": "⚡ URGENCE ÉLECTRICITÉ — odeur de brûlé / court-circuit. Que faire immédiatement ?"
    };
    saveConv(curIA, msgs);
    setCurIA("urgence");
    setCurDiv("Diagnostic");
    setMsgs([{ role: "ai", text: "🚨 MODE URGENCE ACTIVÉ — Je vous guide pas à pas. Restez calme.\n\nQuelle est votre situation exacte ?" }]);
    setHist([]);
    setInput(messages[type]);
    goPage("coach");
  };

  // ── Export conversation → PDF ────────────────────────────────
  const exportChatPDF = () => {
    if (!msgs || msgs.length <= 1) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const ia = IAS[curIA];
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); doc.rect(0, 0, W, 1.5, "F");
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 42, "F");
    doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 42, 18);
    const mw = doc.getTextWidth("MAESTRO"); doc.setTextColor(201, 168, 76); doc.text("MIND", 42 + mw, 18);
    doc.setTextColor(201, 168, 76); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("CONVERSATION — " + (ia?.name || curIA).toUpperCase(), 42, 27);
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(profilPDFLabel() + "  ·  " + dateStr + "  ·  " + msgs.filter(m => m.role !== "ai" || m.text !== "...").length + " messages", 42, 34);
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 44, W, 44);
    let y = 52;
    const addPage = () => { doc.addPage(); doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F"); doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); y = 20; };
    msgs.filter(m => m.text && m.text !== "...").forEach((m) => {
      const isAI = m.role === "ai";
      const label = isAI ? (ia?.name || "IA") : "Vous";
      const color = isAI ? [82, 195, 122] : [201, 168, 76];
      doc.setTextColor(...color); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(label, 14, y); y += 5;
      doc.setTextColor(isAI ? 160 : 240, isAI ? 155 : 237, isAI ? 148 : 230); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(m.text, W - 28);
      if (y + lines.length * 5 > 278) addPage();
      doc.text(lines, 14, y); y += lines.length * 5 + 6;
      if (y > 278) addPage();
    });
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(profilPDFLabel() + " · Export conversation", 13, 292);
    doc.text(dateStr, W - 12, 286, { align: "right" });
    doc.save("MAESTROMIND-" + curIA + "-" + new Date().getTime() + ".pdf");
  };

  const genererContreDevis = async () => {
    if (!devisResult || !devisText.trim()) return;
    setCounterLoading(true); setCounterDevis(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1400,
          system:`Tu es un expert en négociation de travaux en France. ${profilIA()} Génère un contre-devis argumenté. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"poste":"nom","prix_demande":"X€","prix_negocie":"X€","argument":"court argument"}],"economie_totale":"X€","message_negociation":"message poli à envoyer à l artisan en 2-3 phrases","conseil":"conseil final"}`,
          messages:[{role:"user", content:"Devis original :\n"+devisText+"\n\nAnalyse :\n"+JSON.stringify(devisResult)+"\n\nGénère le contre-devis."}] })}));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setCounterDevis(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setCounterDevis({lignes:[],economie_totale:"0€",message_negociation:e.message,conseil:""}); }
    finally { setCounterLoading(false); }
  };

  // ── Planning chantier ──────────────────────────────────────────
  const planifierChantier = async () => {
    
    setPlanningLoading(true); setPlanningResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1400,
          system:`Tu es expert en planification de chantier. ${profilIA()} Réponds UNIQUEMENT en JSON valide : {"duree_totale":"X semaines","semaines":[{"numero":1,"titre":"Titre court","taches":["tâche 1","tâche 2"],"materiaux_a_commander":["matériau 1"],"attention":"point critique"}],"ordre_metiers":["1. Corps de métier"],"conseils":"conseil global","budget_detail":"répartition budget"}`,
          messages:[{role:"user", content:"Projet : "+planningType+", budget "+planningBudget+"€. Planning complet semaine par semaine."}] })}));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setPlanningResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setPlanningResult({duree_totale:"?",semaines:[],ordre_metiers:[],conseils:e.message,budget_detail:""}); }
    finally { setPlanningLoading(false); }
  };

  // ── Devis Pro artisan ──────────────────────────────────────────
  const genererDevisPro = async () => {
    if (!devisProDesc.trim()) return;
    setDevisProLoading(true); setDevisProResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1600,
          system:`Tu es expert en rédaction de devis travaux France 2025. ${profilIA()} Génère un devis professionnel. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"description":"description précise","unite":"m² ou U ou ml ou forfait","quantite":"X","prix_unitaire":"X€","total":"X€","dtu":"DTU ou norme ou vide"}],"sous_total_ht":"X€","tva_taux":"10%","tva":"X€","total_ttc":"X€","validite":"30 jours","garanties":"décennale 10 ans + parfait achèvement 1 an","mentions":"TVA applicable selon art. 279-0 bis du CGI"}`,
          messages:[{role:"user", content:"Travaux : "+devisProDesc+"\nSurface : "+devisProSurface+"m²\nClient : "+(devisProClient||"À compléter")+"\nGénère le devis complet prix France 2025."}] })}));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setDevisProResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setDevisProResult({lignes:[],sous_total_ht:"0€",tva_taux:"10%",tva:"0€",total_ttc:"0€",validite:"30 jours",garanties:"",mentions:""}); }
    finally { setDevisProLoading(false); }
  };

  const genererDevisProPDF = () => {
    if (!devisProResult) return;
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const W=210, H=297;
    const dateStr = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
    const num = "DEV-"+new Date().getFullYear()+"-"+Math.random().toString(36).substr(2,6).toUpperCase();
    doc.setFillColor(6,8,13); doc.rect(0,0,W,H,"F");
    doc.setFillColor(201,168,76); doc.rect(0,0,5,H,"F"); doc.rect(0,0,W,1.5,"F");
    doc.setFillColor(10,14,22); doc.rect(5,1.5,W-5,50,"F");
    doc.setFillColor(201,168,76); doc.roundedRect(14,10,22,22,3,3,"F");
    doc.setTextColor(6,8,13); doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.text("B",25,26,{align:"center"});
    doc.setTextColor(240,237,230); doc.setFontSize(17); doc.setFont("helvetica","bold"); doc.text("DEVIS PROFESSIONNEL",42,20);
    doc.setTextColor(201,168,76); doc.setFontSize(8); doc.text("N° "+num,42,28);
    doc.setTextColor(100,96,88); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
    doc.text("Émis le "+dateStr+"  ·  Validité : "+(devisProResult.validite||"30 jours"),42,35);
    if(devisProClient) doc.text("Client : "+devisProClient,42,42);
    doc.setDrawColor(201,168,76); doc.setLineWidth(0.3); doc.line(5,52,W,52);
    doc.setFillColor(14,18,28); doc.rect(5,53,W-5,10,"F");
    doc.setTextColor(201,168,76); doc.setFontSize(7); doc.setFont("helvetica","bold");
    doc.text("DÉSIGNATION",14,60); doc.text("UNITÉ",102,60,{align:"center"}); doc.text("QTÉ",122,60,{align:"center"}); doc.text("PU HT",147,60,{align:"center"}); doc.text("TOTAL HT",W-12,60,{align:"right"});
    let y=68;
    (devisProResult.lignes||[]).forEach((l,i)=>{
      const desc=l.dtu?l.description+" ("+l.dtu+")":l.description;
      const lines=doc.splitTextToSize(desc,82);
      const rowH=Math.max(10,lines.length*5+4);
      if(i%2===0){doc.setFillColor(10,13,20);doc.rect(5,y-2,W-5,rowH,"F");}
      doc.setTextColor(240,237,230); doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.text(lines,14,y+3);
      doc.setTextColor(180,175,165); doc.text(l.unite||"",102,y+3,{align:"center"});
      doc.text(String(l.quantite||""),122,y+3,{align:"center"});
      doc.text(l.prix_unitaire||"",147,y+3,{align:"center"});
      doc.setTextColor(201,168,76); doc.setFont("helvetica","bold");
      doc.text(l.total||"",W-12,y+3,{align:"right"});
      y+=rowH;
    });
    y=Math.min(y+8,225);
    doc.setDrawColor(201,168,76); doc.line(120,y,W-5,y);
    doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text("Sous-total HT",130,y+7); doc.text(devisProResult.sous_total_ht||"",W-12,y+7,{align:"right"});
    doc.text("TVA "+devisProResult.tva_taux,130,y+14); doc.text(devisProResult.tva||"",W-12,y+14,{align:"right"});
    doc.setFillColor(14,18,28); doc.roundedRect(120,y+17,W-125,12,2,2,"F");
    doc.setDrawColor(201,168,76); doc.setLineWidth(0.5); doc.roundedRect(120,y+17,W-125,12,2,2,"S");
    doc.setTextColor(201,168,76); doc.setFontSize(10); doc.setFont("helvetica","bold");
    doc.text("TOTAL TTC",130,y+26); doc.text(devisProResult.total_ttc||"",W-12,y+26,{align:"right"});
    const yM=Math.min(y+38,248);
    doc.setFillColor(8,10,16); doc.roundedRect(14,yM,W-28,28,2,2,"F");
    doc.setDrawColor(35,45,62); doc.setLineWidth(0.2); doc.roundedRect(14,yM,W-28,28,2,2,"S");
    doc.setTextColor(201,168,76); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("GARANTIES & MENTIONS LÉGALES",22,yM+7);
    doc.setTextColor(110,106,98); doc.setFontSize(6.5); doc.setFont("helvetica","normal");
    doc.text(doc.splitTextToSize((devisProResult.garanties||"")+" — "+(devisProResult.mentions||""),W-52),22,yM+14);
    doc.setDrawColor(40,50,68); doc.setLineWidth(0.3);
    doc.line(18,270,82,270); doc.line(128,270,192,270);
    doc.setTextColor(100,96,88); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text("Signature artisan",50,275,{align:"center"}); doc.text("Signature client + «Bon pour accord»",160,275,{align:"center"});
    doc.setFillColor(10,14,22); doc.rect(0,278,W,19,"F");
    doc.setFillColor(201,168,76); doc.rect(0,278,5,19,"F"); doc.rect(0,295.5,W,1.5,"F");
    doc.setTextColor(201,168,76); doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.text("MAESTROMIND",13,286);
    doc.setTextColor(80,76,70); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text("Devis généré par IA · À compléter avec vos coordonnées",13,292);
    doc.text("N° "+num,W-12,286,{align:"right"});
    doc.text("Validité : "+(devisProResult.validite||"30 jours"),W-12,292,{align:"right"});
    doc.save("devis-pro-"+num+".pdf");
  };

  // ── Rentabilité artisan ────────────────────────────────────────
  const calculerRentabilite = () => {
    const surf=parseFloat(rentaSurface)||0, taux=parseFloat(rentaTaux)||0;
    const mat=parseFloat(rentaMat)||0, dep=parseFloat(rentaDep)||0;
    const heures=surf*2.5, mo=heures*taux;
    const ca_total=mo+mat+dep;
    const charges=mo*0.45;
    const benef=ca_total-mat-dep-charges;
    const marge=ca_total>0?Math.round((benef/ca_total)*100):0;
    setRentaResult({ heures:Math.round(heures), mo:Math.round(mo), ca_total:Math.round(ca_total), charges:Math.round(charges), benef:Math.round(benef), marge, prix_m2:surf>0?Math.round(ca_total/surf):0 });
  };

  // ── Jumeau numérique — IA dédiée projet ───────────────────────
  const ouvrirProjetChat = (p) => {
    setProjetChat(p);
    setProjetChatMsgs([{role:"ai", text:"🏗 Je connais votre projet \""+p.nom+"\" ("+p.type+"). "+(p.notes?"Notes : "+p.notes+" — ":"")+"Posez-moi toutes vos questions sur ce chantier."}]);
    setProjetChatInput("");
  };

  const sendProjetChat = async () => {
    if (!projetChatInput.trim() || !projetChat) return;
    const txt = projetChatInput.trim();
    setProjetChatInput("");
    const newMsgs = [...projetChatMsgs, {role:"user",text:txt}];
    setProjetChatMsgs([...newMsgs, {role:"ai",text:"..."}]);
    setProjetChatLoading(true);
    try {
      const r = await withRetry(()=>fetch("/api/anthropic",{
        method:"POST", headers:{"Content-Type":"application/json",},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900,
          system:"Tu es l'assistant IA dédié à ce projet — Nom : "+projetChat.nom+". Type : "+projetChat.type+". Date : "+projetChat.date+". Statut : "+projetChat.statut+". Notes : "+(projetChat.notes||"aucune")+". Expert bâtiment, normes DTU. Réponds de façon concise et pratique.\n"+profilIA(),
          messages: newMsgs.filter(m=>m.text!=="...").map(m=>({role:m.role==="ai"?"assistant":"user",content:m.text})).slice(-8) })}));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setProjetChatMsgs([...newMsgs, {role:"ai",text:data.content[0].text}]);
    } catch(e) { setProjetChatMsgs([...newMsgs, {role:"ai",text:"Erreur : "+e.message}]); }
    finally { setProjetChatLoading(false); }
  };

  // ── CR Chantier PDF ────────────────────────────────────────────
  const genererCRChantier = async (p) => {
    
    setCrLoading(true);
    try {
      const r = await withRetry(()=>fetch("/api/anthropic",{
        method:"POST", headers:{"Content-Type":"application/json",},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1200,
          system:`${profilIA()}\nTu es expert en compte-rendu de chantier. Réponds UNIQUEMENT en JSON valide : {"avancement":"X%","travaux_realises":["travail 1"],"travaux_restants":["travail 1"],"observations":["observation 1"],"prochaine_intervention":"description","reserves":["réserve ou vide"]}`,
          messages:[{role:"user",content:"Projet : "+p.nom+"\nType : "+p.type+"\nDate : "+p.date+"\nStatut : "+p.statut+"\nNotes : "+(p.notes||"aucune")+"\nGénère le compte-rendu."}] })}));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      genererCRPDF(p, JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { alert("Erreur CR : "+e.message); }
    finally { setCrLoading(false); }
  };

  const genererCRPDF = (projet, cr) => {
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const W=210, H=297;
    const dateStr = new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
    doc.setFillColor(6,8,13); doc.rect(0,0,W,H,"F");
    doc.setFillColor(82,195,122); doc.rect(0,0,5,H,"F"); doc.rect(0,0,W,1.5,"F");
    doc.setFillColor(10,14,22); doc.rect(5,1.5,W-5,52,"F");
    doc.setFillColor(82,195,122); doc.roundedRect(14,10,22,22,3,3,"F");
    doc.setTextColor(6,8,13); doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.text("CR",25,26,{align:"center"});
    doc.setTextColor(240,237,230); doc.setFontSize(15); doc.setFont("helvetica","bold"); doc.text("COMPTE-RENDU DE CHANTIER",42,20);
    doc.setTextColor(82,195,122); doc.setFontSize(8); doc.text(dateStr,42,28);
    doc.setTextColor(100,96,88); doc.setFontSize(8); doc.setFont("helvetica","normal");
    doc.text("Projet : "+projet.nom+"  ·  Type : "+projet.type,42,35);
    const av=parseInt(cr.avancement)||0;
    doc.setFillColor(20,24,34); doc.rect(42,40,W-50,7,"F");
    doc.setFillColor(82,195,122); doc.rect(42,40,(W-50)*av/100,7,"F");
    doc.setTextColor(240,237,230); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text("Avancement : "+cr.avancement,(W+42)/2,45.5,{align:"center"});
    doc.setDrawColor(82,195,122); doc.setLineWidth(0.3); doc.line(5,54,W,54);
    let y=62;
    const sect=(title,items,r,g,b)=>{
      if(!items||!items.length)return;
      doc.setFillColor(10,13,20); doc.roundedRect(14,y,W-28,9,2,2,"F");
      doc.setTextColor(r,g,b); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text(title,22,y+6); y+=13;
      items.forEach(item=>{
        if(!item)return;
        const lines=doc.splitTextToSize("• "+item,W-40);
        doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.text(lines,22,y); y+=lines.length*5+2;
      }); y+=3;
    };
    sect("TRAVAUX RÉALISÉS",cr.travaux_realises,82,195,122);
    sect("TRAVAUX RESTANTS",cr.travaux_restants,201,168,76);
    sect("OBSERVATIONS",cr.observations,82,144,224);
    if(cr.reserves&&cr.reserves[0]) sect("RÉSERVES",cr.reserves,224,82,82);
    if(cr.prochaine_intervention){
      doc.setFillColor(8,10,16); doc.roundedRect(14,y,W-28,20,2,2,"F");
      doc.setDrawColor(82,195,122); doc.setLineWidth(0.2); doc.roundedRect(14,y,W-28,20,2,2,"S");
      doc.setTextColor(82,195,122); doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.text("PROCHAINE INTERVENTION",22,y+7);
      doc.setTextColor(160,155,148); doc.setFontSize(8); doc.setFont("helvetica","normal");
      doc.text(doc.splitTextToSize(cr.prochaine_intervention,W-48),22,y+13); y+=24;
    }
    doc.setDrawColor(40,50,68); doc.setLineWidth(0.3); doc.line(18,270,82,270); doc.line(128,270,192,270);
    doc.setTextColor(100,96,88); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text("Chef de chantier",50,275,{align:"center"}); doc.text("Maître d'ouvrage",160,275,{align:"center"});
    doc.setFillColor(10,14,22); doc.rect(0,278,W,19,"F");
    doc.setFillColor(82,195,122); doc.rect(0,278,5,19,"F"); doc.rect(0,295.5,W,1.5,"F");
    doc.setTextColor(82,195,122); doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.text("MAESTROMIND",13,286);
    doc.setTextColor(80,76,70); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.text(profilPDFLabel()+" · CR chantier",13,292);
    doc.text(dateStr,W-12,286,{align:"right"});
    doc.save("CR-"+projet.nom.replace(/\s+/g,"-")+"-"+new Date().getFullYear()+".pdf");
  };

  const analyserDevis = async () => {
    if (!devisText.trim()) return;
    setDevisLoading(true); setDevisResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`${profilIA()}\nTu es un expert en tarifs de travaux en France 2025. Analyse ce devis et réponds UNIQUEMENT en JSON valide : {"verdict":"CORRECT","resume":"1 phrase synthèse","points":["point 1","point 2","point 3"],"conseil":"conseil pratique"}. Verdict possible : CORRECT, ÉLEVÉ, SUSPECT.`,
          messages:[{role:"user", content:"Analyse ce devis :\n\n"+devisText}] }) }));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setDevisResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setDevisResult({verdict:"ERREUR", resume:e.message, points:[], conseil:""}); }
    finally { setDevisLoading(false); }
  };

  const calculerMateriaux = async () => {
    
    setCalcLoading(true); setCalcResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900,
          system:`${profilIA()}\nTu es un expert en quantitatifs matériaux France. Réponds UNIQUEMENT en JSON valide : {"materiaux":[{"nom":"Produit","quantite":"X unités","prixEstime":"X€","conseil":"marque/ref"}],"total":"X€","conseil":"conseil pratique"}`,
          messages:[{role:"user", content:`Calcule les matériaux pour ${calcType} sur ${calcSurface}m². Inclus pertes standards. Prix marché France 2025. Produits disponibles Leroy Merlin/Castorama.`}] }) }));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setCalcResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setCalcResult({materiaux:[], total:"0€", conseil:e.message}); }
    finally { setCalcLoading(false); }
  };

  const calculerPrimes = async () => {
    
    setPrimesLoading(true); setPrimesResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:`${profilIA()}\nTu es un expert en aides rénovation France 2025 (MaPrimeRénov', CEE, éco-PTZ, TVA 5.5%, Anah). Réponds UNIQUEMENT en JSON valide : {"aides":[{"nom":"Aide","montant":"X€","condition":"condition courte","demarche":"comment faire en 1 phrase"}],"total":"X€","conseil":"conseil pratique","attention":"point important"}`,
          messages:[{role:"user", content:`Foyer ${primesRev}, travaux : ${primesTrav}, surface : ${primesSurf}m². Quelles aides suis-je éligible en 2025 ?`}] }) }));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setPrimesResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setPrimesResult({aides:[], total:"0€", conseil:e.message, attention:""}); }
    finally { setPrimesLoading(false); }
  };

  const verifierArtisan = async () => {
    if (!artisanNom.trim()) return;
    setArtisanLoading(true); setArtisanResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900,
          system:`${profilIA()}\nTu es un expert en vérification d'artisans RGE France. Génère une checklist complète. Réponds UNIQUEMENT en JSON valide : {"checks":[{"label":"Vérification","comment":"comment vérifier","url":"site officiel ou vide"}],"alertes":["alerte 1"],"conseils":"conseil global"}`,
          messages:[{role:"user", content:`Je veux vérifier l'artisan "${artisanNom}" spécialisé en ${artisanSpec}. Checklist de vérification RGE, assurance décennale, existence légale.`}] }) }));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      setArtisanResult(JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim()));
    } catch(e) { setArtisanResult({checks:[], alertes:[e.message], conseils:""}); }
    finally { setArtisanLoading(false); }
  };

  const suggestShelf = async () => {
    if (!arAdvInput.trim()) return;
    setArAdvLoading(true); setArAdvResult(null);
    try {
      const r = await withRetry(() => fetch("/api/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json",},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600,
          system:`Tu es un expert en décoration et aménagement intérieur. L'utilisateur décrit sa pièce ou son mur. Recommande le type d'étagère le plus adapté PARMI : flottante, industrielle, angle, console, cube. Réponds UNIQUEMENT en JSON valide : {"type":"flottante","raison":"courte explication","dimensions":"L x H recommandés","produit":"nom produit précis","prix":"fourchette","ou":"enseigne (Leroy Merlin, IKEA ou Castorama)","url_keyword":"terme de recherche pour trouver le produit","conseils":"1 conseil pratique d'installation"}`,
          messages:[{role:"user", content:arAdvInput}] }) }));
      const data = await r.json(); if(data.error) throw new Error(data.error.message);
      const res = JSON.parse(data.content[0].text.replace(/```json|```/g,"").trim());
      setArAdvResult(res);
      if(res.type && SHELF_TYPES[res.type]) { setArShelfType(res.type); arShelfTypeRef.current = res.type; }
    } catch(e) { setArAdvResult({type:"flottante",raison:e.message,dimensions:"",produit:"",prix:"",ou:"",url_keyword:"",conseils:""}); }
    finally { setArAdvLoading(false); }
  };

  const ajouterProjet = () => {
    if (!projetNom.trim()) return;
    const p = { id:Date.now(), nom:projetNom, type:projetType, notes:projetNotes, date:new Date().toLocaleDateString("fr-FR"), statut:"En cours" };
    const np = [p, ...projets]; setProjets(np); localStorage.setItem("bl_projets", JSON.stringify(np));
    setProjetNom(""); setProjetNotes("");
  };

  const supprimerProjet = (id) => {
    const np = projets.filter(p => p.id !== id); setProjets(np); localStorage.setItem("bl_projets", JSON.stringify(np));
  };

  const calcDPE = () => {
    const prime = Math.round(dpeS * 45 + 2000);
    const cee = Math.round(dpeS * 18);
    setDpeRes({ prime, cee, total: prime + cee, eco: Math.round(dpeS * 4.2) });
  };

  const rangColor = (rang) => {
    if (rang === "Général") return "#C9A84C";
    if (rang === "Colonel") return "#52C37A";
    if (rang === "Capitaine") return "#5290E0";
    return "#888780";
  };

  const NavIcon = ({ id, label, children }) => (
    <div style={s.ni} onClick={() => goPage(id)}>
      <div style={page === id ? s.niwOn : s.niw}>{children}</div>
      <div style={page === id ? s.nlblOn : s.nlbl}>{label}</div>
    </div>
  );

  const genererPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, H = 297;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const certNum = "BRICOL-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const norme = certNorme.split("—")[0].trim();
    const projet = certProjet || "Non renseigné";
    const prop = certProp || "Non renseigné";
    const artisan = certArtisan || "Non renseigné";
    const surface = (certSurface || "10") + " m²";

    // ── Fond général ──────────────────────────────────────────────
    doc.setFillColor(6, 8, 13);
    doc.rect(0, 0, W, H, "F");

    // Barre gauche or
    doc.setFillColor(201, 168, 76);
    doc.rect(0, 0, 5, H, "F");

    // Bande top or
    doc.setFillColor(201, 168, 76);
    doc.rect(0, 0, W, 1.5, "F");

    // ── Header ────────────────────────────────────────────────────
    doc.setFillColor(10, 14, 22);
    doc.rect(5, 1.5, W - 5, 50, "F");

    // Logo carré or
    doc.setFillColor(201, 168, 76);
    doc.roundedRect(14, 10, 24, 24, 3, 3, "F");
    // Lettre B dans le logo
    doc.setTextColor(6, 8, 13);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("B", 26, 27, { align: "center" });

    // MAESTROMIND
    doc.setTextColor(240, 237, 230);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("MAESTRO", 46, 22);
    const bw = doc.getTextWidth("MAESTRO");
    doc.setTextColor(201, 168, 76);
    doc.text("MIND", 46 + bw, 22);

    doc.setTextColor(100, 96, 88);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Plateforme IA Expertise Bâtiment  ·  32 Intelligences Spécialisées", 46, 30);

    // Sous-ligne header
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.3);
    doc.line(5, 52, W, 52);

    // ── Titre certificat ──────────────────────────────────────────
    doc.setFillColor(8, 12, 20);
    doc.rect(5, 52, W - 5, 38, "F");

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("DOCUMENT OFFICIEL DE CONFORMITÉ", W / 2 + 2.5, 63, { align: "center" });

    doc.setTextColor(240, 237, 230);
    doc.setFontSize(19);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICAT DE CONFORMITÉ DTU", W / 2 + 2.5, 79, { align: "center" });

    doc.setFillColor(201, 168, 76);
    doc.rect(5, 90, W - 5, 0.5, "F");

    // ── Bloc données projet ───────────────────────────────────────
    doc.setFillColor(12, 16, 24);
    doc.roundedRect(14, 98, W - 28, 78, 3, 3, "F");
    doc.setDrawColor(201, 168, 76);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, 98, W - 28, 78, 3, 3, "S");

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS DU PROJET", 22, 108);

    doc.setDrawColor(40, 50, 68);
    doc.setLineWidth(0.2);
    doc.line(22, 111, W - 22, 111);

    const rows = [
      ["Projet", projet],
      ["Norme applicable", norme],
      ["Surface concernée", surface],
      ["Maître d'ouvrage", prop],
      ["Artisan / Entreprise", artisan],
      ["Date d'émission", dateStr],
      ["N° Certificat", certNum],
    ];
    rows.forEach(([label, value], i) => {
      const y = 121 + i * 9.5;
      doc.setTextColor(100, 96, 88);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(label + " :", 22, y);
      doc.setTextColor(240, 237, 230);
      doc.setFont("helvetica", "bold");
      doc.text(value, 90, y);
    });

    // ── Cachet CONFORME ───────────────────────────────────────────
    const cx = W - 34, cy = 142;
    doc.setFillColor(6, 8, 13);
    doc.circle(cx, cy, 22, "F");
    doc.setDrawColor(82, 195, 122);
    doc.setLineWidth(1.8);
    doc.circle(cx, cy, 22, "S");
    doc.setLineWidth(0.5);
    doc.circle(cx, cy, 18.5, "S");
    doc.setTextColor(82, 195, 122);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.text("CONFORME", cx, cy - 2, { align: "center" });
    doc.setFontSize(7);
    doc.text("DTU VALIDÉ", cx, cy + 5, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(60, 150, 90);
    doc.text("MAESTROMIND IA", cx, cy + 11, { align: "center" });

    // ── Bloc norme ────────────────────────────────────────────────
    doc.setFillColor(8, 10, 16);
    doc.roundedRect(14, 183, W - 28, 32, 3, 3, "F");
    doc.setDrawColor(35, 45, 62);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 183, W - 28, 32, 3, 3, "S");

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("NORMES ET RÉGLEMENTATION", 22, 192);
    doc.setDrawColor(35, 45, 62);
    doc.line(22, 195, W - 22, 195);

    doc.setTextColor(160, 155, 148);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dtuTxt = `La norme ${norme} définit les règles de l'art applicables à ce projet. Les travaux ont été réalisés dans le strict respect des prescriptions techniques en vigueur au ${dateStr}.`;
    doc.text(doc.splitTextToSize(dtuTxt, W - 50), 22, 201);

    // ── Avertissement ─────────────────────────────────────────────
    doc.setFillColor(16, 10, 6);
    doc.roundedRect(14, 221, W - 28, 20, 2, 2, "F");
    doc.setDrawColor(80, 50, 18);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 221, W - 28, 20, 2, 2, "S");

    doc.setTextColor(140, 95, 40);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("AVERTISSEMENT", 22, 228);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 75, 30);
    const warn = "Ce certificat est généré automatiquement par MAESTROMIND à titre indicatif. Il ne se substitue pas à un contrôle officiel par un bureau de contrôle agréé (Apave, Bureau Veritas, Socotec…).";
    doc.text(doc.splitTextToSize(warn, W - 50), 22, 234);

    // ── Signatures ────────────────────────────────────────────────
    doc.setDrawColor(40, 50, 68);
    doc.setLineWidth(0.3);
    doc.line(18, 262, 82, 262);
    doc.line(128, 262, 192, 262);

    doc.setTextColor(100, 96, 88);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("IA Certificat — MAESTROMIND", 50, 267, { align: "center" });
    doc.text("Responsable Conformité", 50, 272, { align: "center" });
    doc.text("IA Validation Technique", 160, 267, { align: "center" });
    doc.text("Contrôle DTU", 160, 272, { align: "center" });

    // ── Footer ────────────────────────────────────────────────────
    doc.setFillColor(10, 14, 22);
    doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76);
    doc.rect(0, 278, 5, 19, "F");
    doc.setFillColor(201, 168, 76);
    doc.rect(0, 295.5, W, 1.5, "F");

    doc.setTextColor(201, 168, 76);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Plateforme IA Expertise Bâtiment", 13, 292);

    doc.setTextColor(80, 76, 70);
    doc.setFontSize(7);
    doc.text("N° " + certNum, W - 12, 286, { align: "right" });
    doc.text("Émis le " + dateStr, W - 12, 292, { align: "right" });

    doc.save("certificat-" + projet.replace(/\s+/g, "-").toLowerCase() + "-" + new Date().getFullYear() + ".pdf");
  };


  if (!onboardingDone) {
    const steps=[{title:"Bienvenue sur",highlight:"MAESTROMIND",sub:"32 IA expertes du bâtiment, disponibles 24h/24.",icon:"🏗"},{title:"Votre profil ?",highlight:"",sub:"Personnalise vos conseils IA.",icon:"👷",choices:["Particulier","Artisan Pro","Architecte","Investisseur"]},{title:"Vous êtes prêt !",highlight:"",sub:"Activez les notifications pour vos rappels chantier.",icon:"🔔"}];
    const step=steps[onboardingStep];
    return (<><link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:430,margin:"0 auto",background:"#06080D",color:"#F0EDE6",fontFamily:"'DM Sans',sans-serif",alignItems:"center",justifyContent:"center",padding:"0 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,left:"50%",transform:"translateX(-50%)",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{fontSize:56,marginBottom:24}}>{step.icon}</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,textAlign:"center",lineHeight:1.2,marginBottom:8}}>{step.title} {step.highlight&&<span style={{color:"#C9A84C"}}>{step.highlight}</span>}</div>
        <div style={{fontSize:13,color:"rgba(240,237,230,0.5)",textAlign:"center",lineHeight:1.7,marginBottom:36}}>{step.sub}</div>
        {step.choices&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",marginBottom:24}}>{step.choices.map(ch=><button key={ch} onClick={()=>setUserType(ch)} style={{padding:"12px",borderRadius:12,border:"0.5px solid "+(userType===ch?"#C9A84C":"rgba(255,255,255,0.08)"),background:userType===ch?"rgba(201,168,76,0.12)":"rgba(15,19,28,0.6)",color:userType===ch?"#C9A84C":"rgba(240,237,230,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer"}}>{ch}</button>)}</div>}
        <div style={{display:"flex",gap:8,marginBottom:32}}>{steps.map((_,i)=><div key={i} style={{width:i===onboardingStep?24:8,height:8,borderRadius:4,background:i===onboardingStep?"#C9A84C":"rgba(255,255,255,0.1)",transition:"all 0.3s"}}/>)}</div>
        <button onClick={()=>{if(onboardingStep<steps.length-1){setOnboardingStep(prev=>prev+1);}else{localStorage.setItem("bl_onboarded","1");localStorage.setItem("bl_user_type",userType);setOnboardingDone(true);}}} style={{width:"100%",background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)",border:"none",borderRadius:14,padding:"15px",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:"#06080D",cursor:"pointer",boxShadow:"0 4px 24px rgba(201,168,76,0.35)"}}>
          {onboardingStep<steps.length-1?"Continuer →":"Commencer maintenant"}
        </button>
        {onboardingStep>0&&<button onClick={()=>setOnboardingStep(prev=>prev-1)} style={{background:"transparent",border:"none",marginTop:12,fontSize:12,color:"rgba(240,237,230,0.3)",cursor:"pointer"}}>← Retour</button>}
      </div></>);
  }

  const handlePin = (d) => {
    if (pinInput.length >= 6) return;
    const np = pinInput + d;
    setPinInput(np);
    setPinError("");
    if (np.length === 6) {
      hashPin(np).then(hash => {
        if (hash === PDG_PIN_HASH) { setPdgUnlocked(true); }
        else { setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400); }
      });
    }
  };

  const handlePinDel = () => { setPinInput(p => p.slice(0, -1)); setPinError(""); };

  if (!pdgUnlocked && onboardingDone) return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", maxWidth:430, margin:"0 auto", background:"#06080D", color:"#F0EDE6", fontFamily:"'DM Sans',sans-serif", alignItems:"center", justifyContent:"center", padding:"0 32px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, left:"50%", transform:"translateX(-50%)", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 68%)", pointerEvents:"none" }} />
        <div style={{ width:72, height:72, background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", borderRadius:22, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, boxShadow:"0 4px 32px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:4 }}>MAESTRO<span style={{ color:"#C9A84C" }}>MIND</span></div>
        <div style={{ fontSize:11, color:"#C9A84C", fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", marginBottom:8 }}>Interface PDG</div>
        <div style={{ fontSize:12, color:"rgba(240,237,230,0.4)", marginBottom:36, textAlign:"center", lineHeight:1.6 }}>Entrez votre code confidentiel à 6 chiffres</div>
        <div style={{ display:"flex", gap:14, marginBottom:10 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={i < pinInput.length ? s.pinDotFill : s.pinDot} />
          ))}
        </div>
        <div style={{ height:24, display:"flex", alignItems:"center", marginBottom:28 }}>
          {pinError && <div style={{ fontSize:12, color:"#E05252", textAlign:"center" }}>{pinError}</div>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,72px)", gap:14 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} className="bl-pin" style={s.pinKey} onClick={() => handlePin(String(d))}>{d}</button>
          ))}
          <div style={{ width:72, height:72 }} />
          <button className="bl-pin" style={s.pinKey} onClick={() => handlePin("0")}>0</button>
          <button className="bl-pin" style={{ ...s.pinKey }} onClick={handlePinDel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
          </button>
        </div>
        <div style={{ fontSize:11, color:"rgba(240,237,230,0.18)", marginTop:44 }}>Accès réservé — PDG uniquement</div>
      </div>
    </>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 2px 14px rgba(201,168,76,0.45); }
          50% { box-shadow: 0 2px 28px rgba(201,168,76,0.75), 0 0 48px rgba(201,168,76,0.18); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes orbFloat {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-18px) scale(1.06); }
        }
        @keyframes pinSuccess {
          0%  { transform:scale(1); }
          40% { transform:scale(1.18); }
          100%{ transform:scale(1); }
        }
        @keyframes voicePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(224,82,82,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(224,82,82,0); }
        }
        .bl-msg { animation: fadeSlideUp 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .bl-fc:hover  { border-color:rgba(201,168,76,0.28) !important; transform:translateY(-2px); box-shadow:0 6px 24px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.06) !important; }
        .bl-chip:hover{ background:rgba(201,168,76,0.09) !important; border-color:rgba(201,168,76,0.28) !important; color:#C9A84C !important; }
        .bl-pin:active { transform:scale(0.91) !important; background:rgba(201,168,76,0.18) !important; }
        * { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; }
      `}</style>
      <div style={s.app}>
        {/* Ambient glow orbs */}
        <div style={{ position:"absolute", top:-120, left:"50%", transform:"translateX(-50%)", width:340, height:340, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)", pointerEvents:"none", animation:"orbFloat 7s ease-in-out infinite", zIndex:0 }} />
        <div style={{ position:"absolute", bottom:60, right:-80, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(82,144,224,0.05) 0%,transparent 70%)", pointerEvents:"none", animation:"orbFloat 9s ease-in-out infinite 1.5s", zIndex:0 }} />

        {/* Clé gérée côté serveur Vercel — écran supprimé */}

        <div style={s.hdr}>
          <div style={s.logo}>
            <div style={s.logoBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            MAESTRO<span style={{ color:"#C9A84C" }}>MIND</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex", background:"rgba(15,19,28,0.8)", border:"0.5px solid rgba(201,168,76,0.15)", borderRadius:20, padding:2, gap:2 }}>
              {["Particulier","Artisan Pro","Architecte","Investisseur"].map(p => (
                <button key={p} onClick={() => { setUserType(p); localStorage.setItem("bl_user_type", p); setMsgs([{role:"ai", text: PROFILS[p].icon + " Mode " + p + " activé. Je m'adapte à votre profil."}]); setHist([]); }} style={{ padding:"3px 8px", borderRadius:18, fontSize:8, fontWeight:700, cursor:"pointer", border:"none", background: userType===p ? "linear-gradient(135deg,#EDD060,#C9A84C)" : "transparent", color: userType===p ? "#06080D" : "rgba(240,237,230,0.4)", transition:"all 0.2s", whiteSpace:"nowrap" }}>{PROFILS[p].icon}</button>
              ))}
            </div>
            <div style={s.badge}>LIVE</div>
          </div>
        </div>

        <div style={s.pages}>

          <div style={{ ...s.page, ...(page === "home" ? s.pageActive : {}) }}>
            <div style={s.hero}>
              <div style={{ color:"rgba(240,237,230,0.5)", fontSize:12, marginBottom:4 }}>{PROFILS[userType]?.icon} Bonjour, {userType}</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, lineHeight:1.15, marginBottom:5 }}>MAESTRO<span style={{ color:"#C9A84C" }}>MIND</span></div>
              <div style={{ color:"rgba(240,237,230,0.5)", fontSize:11, marginBottom:18 }}>32 IA spécialisées — Normes DTU — 11 divisions</div>
              <button style={s.cta} onClick={() => goPage("coach")}>
                <span>Quel est votre projet ?</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#E05252", marginBottom:8 }}>🚨 Urgence</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                  {[["🔴","GAZ","rgba(224,82,82,0.12)","rgba(224,82,82,0.5)","#E05252"],["🔵","EAU","rgba(82,144,224,0.12)","rgba(82,144,224,0.5)","#5290E0"],["⚡","ÉLECTRICITÉ","rgba(232,135,58,0.12)","rgba(232,135,58,0.5)","#E8873A"]].map(([icon,label,bg,border,color]) => (
                    <button key={label} onClick={() => startUrgence(label)} style={{ background:bg, border:"0.5px solid "+border, borderRadius:12, padding:"10px 6px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:18 }}>{icon}</span>
                      <span style={{ fontSize:9, fontWeight:800, color, letterSpacing:1 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={s.stats3}>
              {[["32","IA actives"],["11","Divisions"],["3","Magasins"]].map(([v,l]) => (
                <div key={l} style={s.sc}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:800, color:"#C9A84C" }}>{v}</div>
                  <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={s.secLbl}>Outils rapides</div>
            <div style={s.featGrid}>
              {[
                { label:"Vérifier un devis", sub:"Prix justes ?", color:"#E8873A", icon:"📋", action:()=>{ goPage("outils"); setToolTab("devis"); } },
                { label:"Calculer matériaux", sub:"Quantités exactes", color:"#52C37A", icon:"📐", action:()=>{ goPage("outils"); setToolTab("mat"); } },
                { label:"Aides 2025", sub:"MaPrimeRénov' CEE", color:"#52C37A", icon:"💰", action:()=>{ goPage("outils"); setToolTab("primes"); } },
                { label:"Vérifier artisan", sub:"RGE & légitimité", color:"#5290E0", icon:"🛡️", action:()=>{ goPage("outils"); setToolTab("rge"); } },
                { label:"Boutique", sub:"Matériaux partenaires", color:"#C9A84C", icon:"🛒", action:()=>{ goPage("shop"); } },
                { label:"Certificat DTU", sub:"Validation conformité", color:"#C9A84C", icon:"🏅", action:()=>{ goPage("cert"); } },
              ].map((t,i) => (
                <div key={i} className="bl-fc" style={s.fc} onClick={t.action}>
                  <div style={{ ...s.fi, background:t.color+"18", border:"0.5px solid "+t.color+"44" }}>
                    <span style={{ fontSize:18 }}>{t.icon}</span>
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, marginBottom:2 }}>{t.label}</div>
                  <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)" }}>{t.sub}</div>
                </div>
              ))}
            </div>
            <div style={s.secLbl}>Divisions IA</div>
            <div style={s.featGrid}>
              {Object.entries(DIVISIONS).map(([div,info],i) => (
                <div key={div} className="bl-fc" style={i===0?s.fcHi:s.fc} onClick={() => { goPage("coach"); switchDiv(div); }}>
                  <div style={{ ...s.fi, background:info.color+"18", border:"0.5px solid "+info.color+"44" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, marginBottom:2 }}>{div}</div>
                  <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)" }}>{info.ias.length} IA</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.page, ...(page === "coach" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={s.aiHdr}>
                <div style={{ ...s.aiAv, background:IAS[curIA].color+"33", border:"0.5px solid "+IAS[curIA].color+"66" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IAS[curIA].color} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700 }}>{IAS[curIA].name}</div>
                    <span style={{ ...s.rangBadge, background:rangColor(IAS[curIA].rang)+"22", color:rangColor(IAS[curIA].rang), border:"0.5px solid "+rangColor(IAS[curIA].rang)+"66" }}>{IAS[curIA].rang}</span>
                  </div>
                  <div style={{ fontSize:10, color:IAS[curIA].color, display:"flex", alignItems:"center", gap:3, marginTop:2 }}>
                    <div style={{ width:4, height:4, borderRadius:"50%", background:IAS[curIA].color }}></div>
                    {IAS[curIA].st}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  {msgs.length > 1 && <button onClick={exportChatPDF} title="Exporter en PDF" style={{ background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.3)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  </button>}
                  {msgs.length > 1 && <button onClick={() => { saveConv(curIA, msgs); setMsgs([{ role:"ai", text: welcomeMsg(curIA, userType) }]); setHist([]); localStorage.removeItem("mm_chat_"+curIA); }} title="Effacer la conversation" style={{ background:"rgba(224,82,82,0.06)", border:"0.5px solid rgba(224,82,82,0.25)", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>}
                </div>
              </div>
              <div style={s.divSel}>
                {Object.entries(DIVISIONS).map(([div,info]) => (
                  <button key={div} style={curDiv===div ? { ...s.divPill, background:info.color+"22", color:info.color, border:"0.5px solid "+info.color+"66" } : s.divPill} onClick={() => switchDiv(div)}>{div}</button>
                ))}
              </div>
              <div style={s.iaSel}>
                {DIVISIONS[curDiv].ias.map(k => (
                  <button key={k} style={curIA===k?s.iapOn:s.iap} onClick={() => switchIA(k)}>{IAS[k].name.replace("IA ","")}</button>
                ))}
              </div>
              <div style={s.chips}>
                {getChips(curIA, userType).map(c => (
                  <div key={c} className="bl-chip" style={s.chip} onClick={() => setInput(c)}>{c}</div>
                ))}
              </div>
              <div style={s.msgs} ref={msgsRef}>
                {msgs.map((m, i) => (
                  <div key={i} className="bl-msg" style={{ ...m.role === "ai" ? s.msgA : s.msgU, animationDelay: i === msgs.length-1 ? "0ms" : `${Math.min(i*30,120)}ms` }}>
                    <div style={s.mav}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">
                        {m.role==="ai" ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}
                      </svg>
                    </div>
                    <div style={{maxWidth:"78%"}}>
                      <div style={m.role==="ai"?s.bubA:s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")}}/>
                      {m.role==="ai"&&m.text!=="..."&&<div style={{display:"flex",gap:6,marginTop:5,paddingLeft:2}}>
                        <button onClick={()=>rateMsg(i,1)} style={{background:m.rated===1?"rgba(82,195,122,0.15)":"transparent",border:"0.5px solid "+(m.rated===1?"#52C37A":"rgba(255,255,255,0.07)"),borderRadius:20,padding:"2px 8px",fontSize:11,color:m.rated===1?"#52C37A":"rgba(240,237,230,0.3)",cursor:"pointer"}}>👍</button>
                        <button onClick={()=>rateMsg(i,-1)} style={{background:m.rated===-1?"rgba(224,82,82,0.12)":"transparent",border:"0.5px solid "+(m.rated===-1?"#E05252":"rgba(255,255,255,0.07)"),borderRadius:20,padding:"2px 8px",fontSize:11,color:m.rated===-1?"#E05252":"rgba(240,237,230,0.3)",cursor:"pointer"}}>👎</button>
                      </div>}
                    </div>
                  </div>
                ))}
              </div>
              {errMsg && <div style={s.errBox}>{errMsg}</div>}
              <div style={s.inputBar}>
                <textarea style={s.ci} value={input} onChange={e => setInput(e.target.value)} placeholder={"Demandez à " + IAS[curIA].name + "..."} rows={1} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}/>
                <button onClick={startVoice} title="Parler à l'IA" style={{ width:38, height:38, borderRadius:"50%", border:"0.5px solid "+(voiceActive?"rgba(224,82,82,0.6)":"rgba(201,168,76,0.22)"), background:voiceActive?"rgba(224,82,82,0.15)":"rgba(201,168,76,0.06)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, animation:voiceActive?"voicePulse 0.8s ease-in-out infinite":"none" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={voiceActive?"#E05252":"#C9A84C"} strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </button>
                <label style={{ width:38, height:38, borderRadius:"50%", background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.22)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }} title="Envoyer une photo à cette IA">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => { const f = e.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = ev => sendWithPhoto(ev.target.result); r.readAsDataURL(f); e.target.value=""; }} />
                </label>
                <button style={s.sb} onClick={send} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div style={{ ...s.page, ...(page === "scanner" ? s.pageActive : {}) }}>
            {/* ── Onglets Photo / AR ── */}
            <div style={{ display:"flex", gap:0, borderBottom:"0.5px solid rgba(201,168,76,0.12)", flexShrink:0 }}>
              {[["photo","📷  Photo IA"],["ar","🎯  AR Live 3D"]].map(([k,l]) => (
                <button key={k} onClick={() => { setScannerTab(k); if(k==="ar"&&!camActive) ouvrirCamera(); }} style={{ flex:1, padding:"12px 0", fontSize:12, fontWeight:700, cursor:"pointer", border:"none", background:"transparent", color: scannerTab===k?"#C9A84C":"rgba(240,237,230,0.3)", borderBottom: scannerTab===k?"2px solid #C9A84C":"2px solid transparent", transition:"all 0.2s", fontFamily:"'Syne',sans-serif" }}>{l}</button>
              ))}
            </div>

            {/* ── Tab Photo IA ── */}
            {scannerTab === "photo" && <div style={{ ...s.wrap, paddingTop:12 }}>
              <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>IA analyste</div>
              <div style={{ display:"flex", gap:5, overflowX:"auto", scrollbarWidth:"none", paddingBottom:8 }}>
                {["diag","analyse_visuelle","urgence","coach","cert","thermique","shop"].map(k => (
                  <button key={k} onClick={() => { setScanIA(k); if(photoUrl) analyserPhoto(photoUrl, k); }} style={{ flexShrink:0, padding:"5px 10px", borderRadius:20, fontSize:10, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", border:"0.5px solid "+(scanIA===k?IAS[k].color:"rgba(255,255,255,0.07)"), background:scanIA===k?IAS[k].color+"18":"transparent", color:scanIA===k?IAS[k].color:"rgba(240,237,230,0.45)", transition:"all 0.2s" }}>
                    {IAS[k].name.replace("IA ","")}
                  </button>
                ))}
              </div>
              <video ref={videoRef} autoPlay playsInline muted style={{ width:"100%", borderRadius:12, display:camActive&&scannerTab==="photo"?"block":"none", marginBottom:12, maxHeight:220, objectFit:"cover" }} />
              <canvas ref={canvasRef} style={{ display:"none" }} />
              {photoUrl && <img src={photoUrl} alt="photo" style={{ width:"100%", borderRadius:12, marginBottom:12, maxHeight:220, objectFit:"cover" }} />}
              {!camActive && !photoUrl && (
                <div style={{ width:"100%", aspectRatio:"4/3", background:"#0D1018", border:"1.5px dashed rgba(201,168,76,0.18)", borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.4" strokeLinecap="round" style={{ opacity:0.6, marginBottom:10 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <p style={{ fontSize:12, color:"rgba(240,237,230,0.5)" }}>Caméra non activée</p>
                </div>
              )}
              <div style={{ display:"flex", gap:10, marginBottom:12 }}>
                <button style={s.scanBtn} onClick={ouvrirCamera}>Activer caméra</button>
                <button style={{ ...s.scanBtnGhost, opacity:camActive?1:0.4 }} onClick={prendrePhoto}>Prendre photo</button>
              </div>
              <label style={{ display:"block", width:"100%", background:"#181D28", border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px", textAlign:"center", fontSize:12, color:"rgba(240,237,230,0.5)", cursor:"pointer", marginBottom:12 }}>
                Importer depuis la galerie
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={importerPhoto} />
              </label>
              {scanLoading && <div style={{ background:"#181D28", borderRadius:12, padding:14, textAlign:"center", fontSize:12, color:"rgba(240,237,230,0.5)", marginBottom:12 }}>L'IA analyse votre photo...</div>}
              {scanResult && (
                <div style={{ background:"#181D28", border:"0.5px solid rgba(255,255,255,0.07)", borderRadius:12, padding:14, marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                    <span style={{ padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700,
                      background: scanResult.urgence==="DANGER"?"rgba(224,82,82,0.18)":scanResult.urgence==="URGENT"?"rgba(232,135,58,0.15)":scanResult.urgence==="MODERE"?"rgba(201,168,76,0.12)":"rgba(82,195,122,0.12)",
                      color: scanResult.urgence==="DANGER"?"#E05252":scanResult.urgence==="URGENT"?"#E8873A":scanResult.urgence==="MODERE"?"#C9A84C":"#52C37A",
                      border:"0.5px solid currentColor" }}>{scanResult.urgence}</span>
                    <strong style={{ fontFamily:"'Syne',sans-serif", fontSize:13 }}>{scanResult.titre}</strong>
                  </div>
                  {(scanResult.urgence==="URGENT"||scanResult.urgence==="DANGER") && (
                    <div style={{ background:"rgba(224,82,82,0.08)", border:"1px solid rgba(224,82,82,0.35)", borderRadius:10, padding:"11px 12px", marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#E05252", marginBottom:6 }}>⚠️ INTERVENTION PROFESSIONNELLE REQUISE</div>
                      <div style={{ fontSize:10, color:"rgba(224,82,82,0.8)", lineHeight:1.7 }}>Ne pas tenter de réparation sans évaluation experte. Risques potentiels : amiante, plomb, gaz, instabilité structurelle. Contactez immédiatement un professionnel qualifié.</div>
                      <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                        {["Amiante → SS3/SS4","Plomb → CREP","Gaz → 0800 47 33 33","Structure → Bureau de contrôle"].map(a => (
                          <span key={a} style={{ fontSize:9, padding:"3px 8px", borderRadius:20, background:"rgba(224,82,82,0.12)", border:"0.5px solid rgba(224,82,82,0.35)", color:"#E05252", fontWeight:600 }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scanResult.etapes.map((e,i) => (
                    <div key={i} style={{ display:"flex", gap:9, marginBottom:7 }}>
                      <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(201,168,76,0.1)", border:"0.5px solid #C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>{i+1}</div>
                      <div style={{ fontSize:12, color:"rgba(240,237,230,0.5)", lineHeight:1.5 }}>{e}</div>
                    </div>
                  ))}
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginTop:12, marginBottom:6 }}>Approfondir avec</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {["diag","urgence","coach","cert","shop"].map(k => (
                      <button key={k} onClick={() => { goPage("coach"); switchIA(k); }} style={{ padding:"5px 11px", borderRadius:20, fontSize:10, fontWeight:600, cursor:"pointer", border:"0.5px solid "+IAS[k].color+"66", background:IAS[k].color+"14", color:IAS[k].color }}>
                        {IAS[k].name.replace("IA ","")}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>}

            {/* ── Tab AR Live 3D ── */}
            {scannerTab === "ar" && <div style={{ position:"absolute", top:44, left:0, right:0, bottom:0, background:"#000", display:"flex", flexDirection:"column" }}>
              {/* Sélecteur de mode */}
              <div style={{ background:"rgba(6,8,13,0.88)", backdropFilter:"blur(12px)", flexShrink:0, zIndex:10 }}>
                <div style={{ display:"flex", gap:5, padding:"7px 10px 4px", overflowX:"auto", scrollbarWidth:"none" }}>
                  {[["etagere","🪞 Étagère"],["cloison","🧱 Cloison"],["carrelage","◼ Carrelage"],["prise","🔌 Prise"],["tableau","🖼 Tableau"]].map(([k,l]) => (
                    <button key={k} onClick={() => { setArModeType(k); setArAnchor(null); arAnchorRef.current = null; arModeRef.current = k; }} style={{ flexShrink:0, padding:"5px 11px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", border:"none", background: arModeType===k?"linear-gradient(135deg,#EDD060,#C9A84C)":"rgba(255,255,255,0.08)", color: arModeType===k?"#06080D":"rgba(240,237,230,0.55)", whiteSpace:"nowrap" }}>{l}</button>
                  ))}
                </div>
                {/* Sélecteur type d'étagère — visible uniquement en mode étagère */}
                {arModeType === "etagere" && (
                  <div style={{ padding:"4px 10px 6px" }}>
                    <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none" }}>
                      {Object.entries(SHELF_TYPES).map(([k,v]) => (
                        <button key={k} onClick={() => { setArShelfType(k); arShelfTypeRef.current = k; setArAdvResult(null); }} style={{ flexShrink:0, padding:"4px 9px", borderRadius:16, fontSize:9, fontWeight:700, cursor:"pointer", border:"0.5px solid "+(arShelfType===k?"#C9A84C":"rgba(255,255,255,0.1)"), background:arShelfType===k?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.04)", color:arShelfType===k?"#C9A84C":"rgba(240,237,230,0.45)", whiteSpace:"nowrap" }}>
                          {v.emoji} {v.label}
                        </button>
                      ))}
                      <button onClick={() => setShowArAdvisor(prev => !prev)} style={{ flexShrink:0, padding:"4px 9px", borderRadius:16, fontSize:9, fontWeight:700, cursor:"pointer", border:"0.5px solid rgba(82,195,122,0.45)", background:"rgba(82,195,122,0.1)", color:"#52C37A", whiteSpace:"nowrap" }}>
                        💡 Je ne sais pas
                      </button>
                    </div>
                    <div style={{ fontSize:8, color:"rgba(240,237,230,0.3)", paddingLeft:2, marginTop:2 }}>{SHELF_TYPES[arShelfType].desc} · {SHELF_TYPES[arShelfType].prix}</div>
                  </div>
                )}
              </div>

              {/* Panneau conseiller IA */}
              {arModeType === "etagere" && showArAdvisor && (
                <div style={{ background:"rgba(6,8,13,0.97)", backdropFilter:"blur(20px)", borderBottom:"0.5px solid rgba(201,168,76,0.2)", padding:"10px 14px", flexShrink:0, zIndex:10 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#52C37A" }}>💡 Conseiller IA Étagère</div>
                    <button onClick={() => setShowArAdvisor(false)} style={{ background:"none", border:"none", color:"rgba(240,237,230,0.4)", fontSize:16, cursor:"pointer", padding:0 }}>×</button>
                  </div>
                  <div style={{ display:"flex", gap:7, marginBottom:8 }}>
                    <input value={arAdvInput} onChange={e => setArAdvInput(e.target.value)} placeholder="Décrivez votre pièce / mur (ex: salon moderne, mur béton 3m de large)" style={{ flex:1, background:"rgba(15,19,28,0.85)", border:"0.5px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"7px 10px", color:"#F0EDE6", fontSize:11, outline:"none", fontFamily:"'DM Sans',sans-serif" }} onKeyDown={e => { if(e.key==="Enter") suggestShelf(); }} />
                    <button onClick={suggestShelf} disabled={arAdvLoading} style={{ flexShrink:0, width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#EDD060,#C9A84C)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#06080D" }}>
                      {arAdvLoading ? "…" : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                    </button>
                  </div>
                  {arAdvResult && (
                    <div style={{ background:"rgba(15,19,28,0.85)", border:"0.5px solid rgba(201,168,76,0.25)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
                        <span style={{ fontSize:16 }}>{SHELF_TYPES[arAdvResult.type]?.emoji || "▬"}</span>
                        <div>
                          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:800, color:"#C9A84C" }}>{SHELF_TYPES[arAdvResult.type]?.label || arAdvResult.type} — {arAdvResult.prix}</div>
                          <div style={{ fontSize:10, color:"rgba(240,237,230,0.55)" }}>{arAdvResult.raison}</div>
                        </div>
                      </div>
                      {arAdvResult.produit && (
                        <div style={{ background:"rgba(201,168,76,0.06)", border:"0.5px solid rgba(201,168,76,0.15)", borderRadius:8, padding:"7px 9px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div>
                            <div style={{ fontSize:10, fontWeight:600, color:"#F0EDE6" }}>{arAdvResult.produit}</div>
                            <div style={{ fontSize:9, color:"rgba(240,237,230,0.45)" }}>{arAdvResult.ou} · {arAdvResult.dimensions}</div>
                          </div>
                          <button onClick={() => { const u = arAdvResult.ou?.toLowerCase().includes("ikea") ? "ikea.com/fr" : arAdvResult.ou?.toLowerCase().includes("casto") ? "castorama.fr" : "leroymerlin.fr"; window.open("https://www."+u+"/recherche/?q="+encodeURIComponent(arAdvResult.url_keyword||arAdvResult.produit)+"&utm_source=maestromind&utm_medium=ar&utm_campaign=advisor","_blank"); }} style={{ flexShrink:0, padding:"5px 10px", borderRadius:8, background:"linear-gradient(135deg,#EDD060,#C9A84C)", border:"none", fontSize:9, fontWeight:700, color:"#06080D", cursor:"pointer" }}>Acheter →</button>
                        </div>
                      )}
                      {arAdvResult.conseils && <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)", marginTop:6, lineHeight:1.5 }}>💡 {arAdvResult.conseils}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Zone caméra + canvas overlay */}
              <div style={{ position:"relative", flex:1, overflow:"hidden" }}
                onClick={e => {
                  if (!camActive) { ouvrirCamera(); return; }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                  setArAnchor(pt); arAnchorRef.current = pt;
                }}>
                <video ref={arVideoRef} autoPlay playsInline muted style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                <canvas ref={arCanvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", touchAction:"none", pointerEvents:"none" }} />
                {!camActive && (
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(6,8,13,0.92)", zIndex:5 }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.3" strokeLinecap="round" style={{ marginBottom:16, opacity:0.9 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:"#C9A84C", marginBottom:8 }}>AR Live 3D</div>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.5)", textAlign:"center", maxWidth:220, lineHeight:1.6 }}>Appuyez pour activer la caméra</div>
                  </div>
                )}
              </div>
              {/* Barre bas */}
              <div style={{ padding:"8px 14px 14px", background:"rgba(6,8,13,0.88)", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, zIndex:10 }}>
                <div style={{ fontSize:10, color: arAnchor?"#52C37A":"rgba(240,237,230,0.45)", fontWeight:600 }}>
                  {arAnchor ? "✅ Placé — Appuyez pour repositionner" : "👆 Appuyez sur le mur pour placer"}
                </div>
                <button onClick={() => { setArAnchor(null); arAnchorRef.current = null; }} style={{ fontSize:9, padding:"5px 12px", borderRadius:20, background:"rgba(224,82,82,0.12)", border:"0.5px solid rgba(224,82,82,0.35)", color:"#E05252", cursor:"pointer", fontWeight:700 }}>Effacer</button>
              </div>
            </div>}
          </div>

          <div style={{ ...s.page, ...(page === "shop" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:3 }}>Boutique</div>
              <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:16 }}>Matériaux et outils chez nos partenaires</div>
              <div style={s.storeTabs}>
                {["leroy","casto","brico"].map(k => (
                  <button key={k} style={store===k?s.stabOn:s.stab} onClick={() => setStore(k)}>
                    {k==="leroy"?"Leroy Merlin":k==="casto"?"Castorama":"Brico Dépôt"}
                  </button>
                ))}
              </div>
              {PRODS[store].map((p,i) => (
                <div key={i} style={s.pi}>
                  <div style={s.piw}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{p.n}</div>
                    <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)" }}>{p.q}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#C9A84C", marginBottom:4, textAlign:"right" }}>{p.p}</div>
                    <button style={s.buyBtn} onClick={() => window.open("https://www."+p.s+"/recherche?q="+encodeURIComponent(p.n)+"&utm_source=maestromind&utm_medium=app&utm_campaign=shop","_blank")}>Acheter</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.page, ...(page === "cert" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:3 }}>Certificat</div>
              <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:14 }}>Validation conformité IA — Normes DTU</div>

              {/* Formulaire */}
              <div style={s.card}>
                <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Données du projet</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Projet</div>
                    <input style={s.inp} value={certProjet} onChange={e => setCertProjet(e.target.value)} placeholder="Ex: Cloison BA13" />
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Surface m²</div>
                    <input style={s.inp} type="number" value={certSurface} onChange={e => setCertSurface(e.target.value)} placeholder="10" />
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Norme DTU</div>
                  <select style={s.inp} value={certNorme} onChange={e => setCertNorme(e.target.value)}>
                    <option>DTU 25.41 — Cloisons plâtre</option>
                    <option>DTU 52.1 — Carrelage</option>
                    <option>DTU 45.1 — Isolation thermique</option>
                    <option>DTU 60.1 — Plomberie sanitaire</option>
                    <option>DTU 70.1 — Électricité NFC 15-100</option>
                    <option>DTU 31.2 — Charpente bois</option>
                    <option>DTU 40.21 — Couverture tuiles</option>
                    <option>DTU 20.1 — Maçonnerie</option>
                  </select>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Maître d'ouvrage</div>
                    <input style={s.inp} value={certProp} onChange={e => setCertProp(e.target.value)} placeholder="Nom propriétaire" />
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Artisan / Entreprise</div>
                    <input style={s.inp} value={certArtisan} onChange={e => setCertArtisan(e.target.value)} placeholder="Nom artisan" />
                  </div>
                </div>
              </div>

              {/* Prévisualisation */}
              <div style={s.certCard}>
                <div style={s.certSeal}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:"#C9A84C", marginBottom:3 }}>CERTIFICAT DE CONFORMITÉ</div>
                <div style={{ fontSize:9, color:"rgba(240,237,230,0.4)", marginBottom:14 }}>Délivré par MAESTROMIND · Plateforme IA Bâtiment</div>
                <div style={{ fontSize:11, color:"rgba(240,237,230,0.55)", lineHeight:2.2, borderTop:"0.5px solid rgba(201,168,76,0.15)", paddingTop:12, textAlign:"left" }}>
                  <div>Projet : <strong style={{ color:"#F0EDE6" }}>{certProjet || "—"}</strong></div>
                  <div>Norme : <strong style={{ color:"#F0EDE6" }}>{certNorme.split("—")[0].trim()}</strong></div>
                  <div>Surface : <strong style={{ color:"#F0EDE6" }}>{certSurface || "—"} m²</strong></div>
                  {certProp && <div>Maître d'ouvrage : <strong style={{ color:"#F0EDE6" }}>{certProp}</strong></div>}
                  {certArtisan && <div>Artisan : <strong style={{ color:"#F0EDE6" }}>{certArtisan}</strong></div>}
                  <div>Date : <strong style={{ color:"#F0EDE6" }}>{new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}</strong></div>
                  <div>Statut : <strong style={{ color:"#52C37A" }}>✓ CONFORME</strong></div>
                </div>
              </div>

              <button style={s.dlBtn} onClick={genererPDF}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Télécharger le certificat PDF
              </button>
            </div>
          </div>

          {/* ═══ PAGE OUTILS ═══════════════════════════════════════ */}
          <div style={{ ...s.page, ...(page === "outils" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:3 }}>Outils IA</div>
              <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:12 }}>Devis · Matériaux · Primes · Artisans · DPE</div>
              {/* Tabs */}
              <div style={{ display:"flex", gap:5, marginBottom:16, overflowX:"auto", scrollbarWidth:"none" }}>
                {[["devis","Devis"],["mat","Matériaux"],["primes","Primes"],["rge","Artisan RGE"],["dpe","DPE"],["planning","Planning"],["devis_pro","Devis Pro"],["rentabilite","Rentabilité"]].map(([k,l]) => (
                  <button key={k} onClick={() => setToolTab(k)} style={{ flexShrink:0, padding:"6px 13px", borderRadius:20, fontSize:11, fontWeight:600, cursor:"pointer", border:"none", background:toolTab===k?"linear-gradient(135deg,#EDD060,#C9A84C,#9A7228)":"rgba(15,19,28,0.7)", color:toolTab===k?"#06080D":"rgba(240,237,230,0.5)", transition:"all 0.2s" }}>{l}</button>
                ))}
              </div>

              {/* Tab Devis */}
              {toolTab === "devis" && <div>
                <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Coller votre devis ici</div>
                <textarea style={{ ...s.ci, width:"100%", minHeight:160, borderRadius:12, padding:"12px 14px", marginBottom:10, lineHeight:1.6 }} value={devisText} onChange={e => setDevisText(e.target.value)} placeholder={"Posez carrelage salle de bain 8m²... fourniture et pose... 1 200€\nEvacuations sanitaires... 350€\n..."} />
                <button style={devisLoading ? {...s.greenBtn, opacity:0.5} : s.greenBtn} onClick={analyserDevis} disabled={devisLoading}>
                  {devisLoading ? "Analyse en cours..." : "🔍 Analyser le devis"}
                </button>
                {devisResult && <div style={{ marginTop:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <span style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:800, background: devisResult.verdict==="CORRECT"?"rgba(82,195,122,0.15)":devisResult.verdict==="ÉLEVÉ"?"rgba(232,135,58,0.15)":"rgba(224,82,82,0.15)", color: devisResult.verdict==="CORRECT"?"#52C37A":devisResult.verdict==="ÉLEVÉ"?"#E8873A":"#E05252", border:"0.5px solid currentColor" }}>{devisResult.verdict}</span>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.75)", flex:1 }}>{devisResult.resume}</div>
                  </div>
                  {devisResult.points.map((p,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:7 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(201,168,76,0.1)", border:"0.5px solid #C9A84C", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.6)", lineHeight:1.5 }}>{p}</div>
                  </div>)}
                  {devisResult.conseil && <div style={{ ...s.card, marginTop:10, borderColor:"rgba(82,195,122,0.2)", background:"rgba(82,195,122,0.05)" }}>
                    <div style={{ fontSize:10, color:"#52C37A", fontWeight:700, marginBottom:4 }}>CONSEIL</div>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.6)" }}>{devisResult.conseil}</div>
                  </div>}
                </div>}
                {devisResult && !counterDevis && (
                  <button style={counterLoading ? {...s.greenBtn, opacity:0.5, borderColor:"rgba(232,135,58,0.4)", color:"#E8873A"} : {...s.greenBtn, borderColor:"rgba(232,135,58,0.45)", color:"#E8873A"}} onClick={genererContreDevis} disabled={counterLoading}>
                    {counterLoading ? "Génération en cours..." : "✍️ Négocier ce devis (contre-devis IA)"}
                  </button>
                )}
                {counterDevis && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ fontSize:9, color:"#E8873A", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>CONTRE-DEVIS NÉGOCIÉ</div>
                    {counterDevis.lignes.map((l,i) => (
                      <div key={i} style={{ ...s.card, marginBottom:7, borderColor:"rgba(232,135,58,0.15)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                          <div style={{ fontSize:12, fontWeight:600, flex:1, marginRight:8 }}>{l.poste}</div>
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontSize:10, color:"rgba(240,237,230,0.35)", textDecoration:"line-through" }}>{l.prix_demande}</div>
                            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:"#52C37A" }}>{l.prix_negocie}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)", lineHeight:1.5 }}>💬 {l.argument}</div>
                      </div>
                    ))}
                    <div style={{ ...s.card, background:"rgba(82,195,122,0.06)", borderColor:"rgba(82,195,122,0.2)", marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ fontSize:12, color:"rgba(240,237,230,0.7)" }}>Économie potentielle</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#52C37A" }}>{counterDevis.economie_totale}</div>
                      </div>
                    </div>
                    <div style={{ ...s.card, background:"rgba(82,144,224,0.05)", borderColor:"rgba(82,144,224,0.2)", marginBottom:10 }}>
                      <div style={{ fontSize:10, color:"#5290E0", fontWeight:700, marginBottom:6 }}>MESSAGE À ENVOYER À L'ARTISAN</div>
                      <div style={{ fontSize:12, color:"rgba(240,237,230,0.7)", lineHeight:1.7, fontStyle:"italic" }}>"{counterDevis.message_negociation}"</div>
                    </div>
                    {counterDevis.conseil && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", lineHeight:1.6, marginBottom:8 }}>💡 {counterDevis.conseil}</div>}
                    <button onClick={() => { setCounterDevis(null); setDevisResult(null); setDevisText(""); }} style={{ ...s.greenBtn, background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(240,237,230,0.4)" }}>← Nouvelle analyse</button>
                  </div>
                )}
              </div>}

              {/* Tab Matériaux */}
              {toolTab === "mat" && <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Type de travaux</div>
                    <select style={s.inp} value={calcType} onChange={e => setCalcType(e.target.value)}>
                      {["Peinture","Carrelage","Parquet","Placo BA13","Enduit","Isolation murs","Isolation combles","Toiture","Béton dalle","Ragréage"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Surface m²</div>
                    <input style={s.inp} type="number" value={calcSurface} onChange={e => setCalcSurface(e.target.value)} />
                  </div>
                </div>
                <button style={calcLoading ? {...s.greenBtn, opacity:0.5} : s.greenBtn} onClick={calculerMateriaux} disabled={calcLoading}>
                  {calcLoading ? "Calcul en cours..." : "📐 Calculer les matériaux"}
                </button>
                {calcResult && <div style={{ marginTop:12 }}>
                  {calcResult.materiaux.map((m,i) => <div key={i} style={{ ...s.pi, marginBottom:8 }}>
                    <div style={s.piw}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:500 }}>{m.nom}</div>
                      <div style={{ fontSize:10, color:"rgba(240,237,230,0.45)" }}>{m.quantite} · {m.conseil}</div>
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#C9A84C" }}>{m.prixEstime}</div>
                  </div>)}
                  <div style={{ ...s.card, background:"rgba(201,168,76,0.06)", borderColor:"rgba(201,168,76,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.6)" }}>Total estimé</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#C9A84C" }}>{calcResult.total}</div>
                  </div>
                  {calcResult.conseil && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", marginTop:8, lineHeight:1.6 }}>💡 {calcResult.conseil}</div>}
                </div>}
              </div>}

              {/* Tab Primes */}
              {toolTab === "primes" && <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Revenus du foyer</div>
                    <select style={s.inp} value={primesRev} onChange={e => setPrimesRev(e.target.value)}>
                      {["Très modeste","Modeste","Intermédiaire","Supérieur"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Surface m²</div>
                    <input style={s.inp} type="number" value={primesSurf} onChange={e => setPrimesSurf(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Type de travaux</div>
                  <select style={s.inp} value={primesTrav} onChange={e => setPrimesTrav(e.target.value)}>
                    {["Isolation combles","Isolation murs","Pompe à chaleur","Chaudière gaz à condensation","Poêle à granulés","VMC double flux","Fenêtres double vitrage","Rénovation globale"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button style={primesLoading ? {...s.greenBtn, opacity:0.5} : s.greenBtn} onClick={calculerPrimes} disabled={primesLoading}>
                  {primesLoading ? "Calcul en cours..." : "💰 Calculer mes aides 2025"}
                </button>
                {primesResult && <div style={{ marginTop:12 }}>
                  {primesResult.aides.map((a,i) => <div key={i} style={{ ...s.card, marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#F0EDE6", flex:1, marginRight:8 }}>{a.nom}</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:"#52C37A", flexShrink:0 }}>{a.montant}</div>
                    </div>
                    <div style={{ fontSize:10, color:"rgba(240,237,230,0.45)", marginBottom:3 }}>{a.condition}</div>
                    <div style={{ fontSize:10, color:"rgba(82,195,122,0.7)" }}>→ {a.demarche}</div>
                  </div>)}
                  <div style={{ ...s.card, background:"rgba(82,195,122,0.06)", borderColor:"rgba(82,195,122,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontSize:12 }}>Total aides estimées</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#52C37A" }}>{primesResult.total}</div>
                  </div>
                  {primesResult.attention && <div style={{ ...s.errBox, borderColor:"rgba(232,135,58,0.3)", background:"rgba(232,135,58,0.05)", color:"#E8873A" }}>⚠️ {primesResult.attention}</div>}
                  {primesResult.conseil && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", lineHeight:1.6 }}>💡 {primesResult.conseil}</div>}
                </div>}
              </div>}

              {/* Tab RGE */}
              {toolTab === "rge" && <div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Nom de l'artisan ou entreprise</div>
                  <input style={s.inp} value={artisanNom} onChange={e => setArtisanNom(e.target.value)} placeholder="Ex: Plomberie Durand, SAS Martin BTP..." />
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Spécialité</div>
                  <select style={s.inp} value={artisanSpec} onChange={e => setArtisanSpec(e.target.value)}>
                    {["Maçonnerie","Plomberie","Électricité","Isolation","Chauffage","Charpente","Couverture","Carrelage","Peinture","Menuiserie"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <button style={artisanLoading ? {...s.greenBtn, opacity:0.5} : s.greenBtn} onClick={verifierArtisan} disabled={artisanLoading}>
                  {artisanLoading ? "Vérification en cours..." : "🛡️ Vérifier cet artisan"}
                </button>
                {artisanResult && <div style={{ marginTop:12 }}>
                  {(() => {
                    const score = Math.min(100, Math.round((artisanResult.checks?.length||0) * 12.5));
                    const color = score>=75?"#52C37A":score>=50?"#E8873A":"#E05252";
                    const label = score>=75?"✅ Artisan fiable":score>=50?"⚠️ Vérifications requises":"🚫 Risque élevé";
                    return (
                      <div style={{ ...s.card, textAlign:"center", marginBottom:12 }}>
                        <div style={{ position:"relative", width:80, height:80, margin:"0 auto 10px" }}>
                          <svg width="80" height="80" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
                            <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="7"
                              strokeDasharray={score*2.136+" "+213.6} strokeDashoffset="53.4"
                              strokeLinecap="round"/>
                          </svg>
                          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color }}>{score}%</div>
                        </div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color }}>{label}</div>
                        <div style={{ fontSize:10, color:"rgba(240,237,230,0.45)", marginTop:3 }}>{artisanResult.checks?.length||0} points vérifiés</div>
                      </div>
                    );
                  })()}
                  {artisanResult.alertes?.length > 0 && <div style={{ marginBottom:10 }}>
                    {artisanResult.alertes.map((a,i) => <div key={i} style={{ ...s.errBox, marginBottom:6 }}>⚠️ {a}</div>)}
                  </div>}
                  {artisanResult.checks?.map((c,i) => <div key={i} style={{ ...s.card, marginBottom:7 }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                      <div style={{ width:22, height:22, borderRadius:6, background:"rgba(82,195,122,0.1)", border:"0.5px solid rgba(82,195,122,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#52C37A", flexShrink:0 }}>✓</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{c.label}</div>
                        <div style={{ fontSize:10, color:"rgba(240,237,230,0.45)", lineHeight:1.5 }}>{c.comment}</div>
                        {c.url && c.url !== "" && <div style={{ fontSize:10, color:"#5290E0", marginTop:3 }}>→ {c.url}</div>}
                      </div>
                    </div>
                  </div>)}
                  {artisanResult.conseils && <div style={{ ...s.card, background:"rgba(201,168,76,0.05)", borderColor:"rgba(201,168,76,0.2)", marginTop:4 }}>
                    <div style={{ fontSize:10, color:"#C9A84C", fontWeight:700, marginBottom:4 }}>CONSEIL GLOBAL</div>
                    <div style={{ fontSize:12, color:"rgba(240,237,230,0.6)", lineHeight:1.6 }}>{artisanResult.conseils}</div>
                  </div>}
                </div>}
              </div>}

              {/* Tab DPE (repris depuis page dpe) */}
              {toolTab === "dpe" && <div>
                <div style={s.card}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:11 }}>
                    <div>
                      <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:6, textTransform:"uppercase" }}>Type de bien</div>
                      <select style={s.inp} value={dpeT} onChange={e => setDpeT(e.target.value)}><option>Appartement</option><option>Maison</option></select>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:6, textTransform:"uppercase" }}>Surface m²</div>
                      <input style={s.inp} type="number" value={dpeS} onChange={e => setDpeS(parseInt(e.target.value)||75)} />
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:6, textTransform:"uppercase" }}>Chauffage actuel</div>
                  <select style={{ ...s.inp, marginBottom:12 }} value={dpeC} onChange={e => setDpeC(e.target.value)}>
                    <option>Gaz naturel</option><option>Électrique</option><option>Fioul</option><option>Pompe à chaleur</option>
                  </select>
                  <button style={s.greenBtn} onClick={calcDPE}>Calculer mes aides</button>
                </div>
                {dpeRes && <div style={s.card}>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, marginBottom:12 }}>Vos aides estimées</div>
                  <div style={s.aides}>
                    {[["MaPrimeRénov",dpeRes.prime],["CEE",dpeRes.cee],["Total aides",dpeRes.total],["Économies/an",dpeRes.eco]].map(([l,v]) => (
                      <div key={l} style={s.aideC}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#52C37A" }}>{v.toLocaleString("fr-FR")}€</div>
                        <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)", marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>}
              </div>}

              {/* Tab Planning */}
              {toolTab === "planning" && <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Type de projet</div>
                    <select style={s.inp} value={planningType} onChange={e => setPlanningType(e.target.value)}>
                      {["Rénovation salle de bain","Rénovation cuisine","Isolation combles","Isolation murs","Pose carrelage","Cloison BA13","Peinture appartement","Rénovation complète","Installation électrique","Plomberie sanitaires"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Budget €</div>
                    <input style={s.inp} type="number" value={planningBudget} onChange={e => setPlanningBudget(e.target.value)} />
                  </div>
                </div>
                <button style={planningLoading ? {...s.greenBtn, opacity:0.5} : s.greenBtn} onClick={planifierChantier} disabled={planningLoading}>
                  {planningLoading ? "Planification en cours..." : "📅 Générer le planning chantier"}
                </button>
                {planningResult && <div style={{ marginTop:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800 }}>{planningResult.duree_totale}</div>
                    <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)" }}>· {planningType}</div>
                  </div>
                  {planningResult.semaines.map((sem,i) => (
                    <div key={i} style={{ ...s.card, marginBottom:9, borderLeft:"2.5px solid #C9A84C" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={{ fontSize:9, padding:"2px 8px", borderRadius:20, background:"linear-gradient(135deg,#EDD060,#C9A84C)", color:"#06080D", fontWeight:800 }}>S{sem.numero}</span>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700 }}>{sem.titre}</div>
                      </div>
                      {sem.taches.map((t,j) => <div key={j} style={{ display:"flex", gap:7, marginBottom:5 }}>
                        <div style={{ width:16, height:16, borderRadius:4, background:"rgba(82,195,122,0.1)", border:"0.5px solid rgba(82,195,122,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#52C37A", flexShrink:0 }}>✓</div>
                        <div style={{ fontSize:11, color:"rgba(240,237,230,0.6)" }}>{t}</div>
                      </div>)}
                      {sem.materiaux_a_commander?.length > 0 && <div style={{ marginTop:8, paddingTop:8, borderTop:"0.5px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, marginBottom:4 }}>🛒 À COMMANDER</div>
                        {sem.materiaux_a_commander.map((m,j) => <div key={j} style={{ fontSize:10, color:"rgba(240,237,230,0.45)", marginBottom:2 }}>→ {m}</div>)}
                      </div>}
                      {sem.attention && <div style={{ marginTop:8, padding:"6px 9px", borderRadius:8, background:"rgba(232,135,58,0.08)", border:"0.5px solid rgba(232,135,58,0.25)", fontSize:10, color:"#E8873A" }}>⚠️ {sem.attention}</div>}
                    </div>
                  ))}
                  {planningResult.ordre_metiers?.length > 0 && <div style={{ ...s.card, marginBottom:9 }}>
                    <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, marginBottom:8 }}>ORDRE DES CORPS DE MÉTIER</div>
                    {planningResult.ordre_metiers.map((m,i) => <div key={i} style={{ fontSize:11, color:"rgba(240,237,230,0.6)", marginBottom:4 }}>{m}</div>)}
                  </div>}
                  {planningResult.budget_detail && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", marginBottom:8, lineHeight:1.6 }}>💶 {planningResult.budget_detail}</div>}
                  {planningResult.conseils && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", lineHeight:1.6 }}>💡 {planningResult.conseils}</div>}
                </div>}
              </div>}

              {/* Tab Devis Pro */}
              {toolTab === "devis_pro" && <div>
                <div style={{ fontSize:9, color:"#E8873A", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>GÉNÉRATEUR DEVIS ARTISAN</div>
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Décrivez les travaux</div>
                  <textarea style={{ ...s.ci, width:"100%", minHeight:100, borderRadius:12, padding:"10px 14px", marginBottom:0, lineHeight:1.6 }} value={devisProDesc} onChange={e => setDevisProDesc(e.target.value)} placeholder="Ex: Pose carrelage salle de bain 8m², dépose ancien revêtement, fourniture et pose faïence murs + sol..." />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Client</div>
                    <input style={s.inp} value={devisProClient} onChange={e => setDevisProClient(e.target.value)} placeholder="Nom du client" />
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Surface m²</div>
                    <input style={s.inp} type="number" value={devisProSurface} onChange={e => setDevisProSurface(e.target.value)} />
                  </div>
                </div>
                <button style={devisProLoading ? {...s.greenBtn, opacity:0.5, borderColor:"rgba(232,135,58,0.4)", color:"#E8873A"} : {...s.greenBtn, borderColor:"rgba(232,135,58,0.45)", color:"#E8873A"}} onClick={genererDevisPro} disabled={devisProLoading}>
                  {devisProLoading ? "Génération en cours..." : "📄 Générer le devis professionnel"}
                </button>
                {devisProResult && <div style={{ marginTop:12 }}>
                  <div style={{ ...s.card, background:"rgba(201,168,76,0.05)", borderColor:"rgba(201,168,76,0.25)", marginBottom:10 }}>
                    {(devisProResult.lignes||[]).map((l,i) => <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:i<devisProResult.lignes.length-1?"0.5px solid rgba(255,255,255,0.05)":"none" }}>
                      <div style={{ flex:1, marginRight:10 }}>
                        <div style={{ fontSize:11, fontWeight:500 }}>{l.description}</div>
                        {l.dtu && <div style={{ fontSize:9, color:"#C9A84C", marginTop:1 }}>{l.dtu}</div>}
                        <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)" }}>{l.quantite} {l.unite} × {l.prix_unitaire}</div>
                      </div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:"#C9A84C", flexShrink:0 }}>{l.total}</div>
                    </div>)}
                    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:10, marginTop:6, borderTop:"0.5px solid rgba(201,168,76,0.2)" }}>
                      <div style={{ fontSize:12, color:"rgba(240,237,230,0.5)" }}>Total TTC</div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:"#C9A84C" }}>{devisProResult.total_ttc}</div>
                    </div>
                  </div>
                  <button style={s.dlBtn} onClick={genererDevisProPDF}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Télécharger le devis PDF
                  </button>
                  <button onClick={() => { setDevisProResult(null); setDevisProDesc(""); }} style={{ ...s.greenBtn, marginTop:8, background:"rgba(255,255,255,0.03)", borderColor:"rgba(255,255,255,0.1)", color:"rgba(240,237,230,0.4)" }}>← Nouveau devis</button>
                </div>}
              </div>}

              {/* Tab Rentabilité */}
              {toolTab === "rentabilite" && <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                  {[["Surface chantier m²",rentaSurface,setRentaSurface],["Taux horaire €/h",rentaTaux,setRentaTaux],["Coût matériaux €",rentaMat,setRentaMat],["Déplacements €",rentaDep,setRentaDep]].map(([label,val,set]) => (
                    <div key={label}>
                      <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
                      <input style={s.inp} type="number" value={val} onChange={e => set(e.target.value)} />
                    </div>
                  ))}
                </div>
                <button style={s.greenBtn} onClick={calculerRentabilite}>📊 Calculer ma rentabilité</button>
                {rentaResult && <div style={{ marginTop:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                    {[["CA Total",rentaResult.ca_total+"€","#C9A84C"],["Bénéfice net",rentaResult.benef+"€",rentaResult.benef>0?"#52C37A":"#E05252"],["Marge",rentaResult.marge+"%",rentaResult.marge>25?"#52C37A":rentaResult.marge>10?"#E8873A":"#E05252"],["Prix/m²",rentaResult.prix_m2+"€","#5290E0"]].map(([l,v,c]) => (
                      <div key={l} style={{ ...s.sc, textAlign:"left", padding:"12px 14px" }}>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:c }}>{v}</div>
                        <div style={{ fontSize:10, color:"rgba(240,237,230,0.5)", marginTop:3 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={s.card}>
                    <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>DÉTAIL</div>
                    {[["Main d'œuvre ("+rentaResult.heures+"h × "+rentaTaux+"€/h)",rentaResult.mo+"€","rgba(240,237,230,0.7)"],["Matériaux",rentaMat+"€","rgba(240,237,230,0.5)"],["Déplacements",rentaDep+"€","rgba(240,237,230,0.5)"],["Charges sociales (45%)","-"+rentaResult.charges+"€","#E05252"],["Bénéfice net","→ "+rentaResult.benef+"€",rentaResult.benef>0?"#52C37A":"#E05252"]].map(([l,v,c]) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                        <div style={{ fontSize:11, color:"rgba(240,237,230,0.55)" }}>{l}</div>
                        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:c }}>{v}</div>
                      </div>
                    ))}
                    <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"8px 0" }} />
                    <div style={{ height:8, borderRadius:4, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                      <div style={{ width:Math.max(0,Math.min(rentaResult.marge,100))+"%", height:"100%", borderRadius:4, background:rentaResult.marge>25?"linear-gradient(90deg,#52C37A,#C9A84C)":rentaResult.marge>10?"#E8873A":"#E05252", transition:"width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize:10, color:"rgba(240,237,230,0.4)", marginTop:4 }}>
                      Marge : {rentaResult.marge}% {rentaResult.marge<15?"⚠️ Insuffisante":rentaResult.marge>30?"✅ Excellente":""}
                    </div>
                  </div>
                </div>}
              </div>}

            </div>
          </div>

          {/* ═══ PAGE PROJETS ════════════════════════════════════════ */}
          <div style={{ ...s.page, ...(page === "projets" ? s.pageActive : {}) }}>
            <div style={s.wrap}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, marginBottom:3 }}>Mes Projets</div>
              <div style={{ fontSize:11, color:"rgba(240,237,230,0.5)", marginBottom:14 }}>Suivi de vos chantiers</div>
              <div style={s.card}>
                <div style={{ fontSize:9, color:"#C9A84C", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Nouveau projet</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Nom du projet</div>
                    <input style={s.inp} value={projetNom} onChange={e => setProjetNom(e.target.value)} placeholder="Ex: Réno salle de bain" />
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Type</div>
                    <select style={s.inp} value={projetType} onChange={e => setProjetType(e.target.value)}>
                      {["Rénovation","Construction","Isolation","Plomberie","Électricité","Peinture","Carrelage","Aménagement","Autre"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:9, color:"rgba(240,237,230,0.38)", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Notes</div>
                  <textarea style={{ ...s.inp, minHeight:60, resize:"none" }} value={projetNotes} onChange={e => setProjetNotes(e.target.value)} placeholder="Description, adresse, budget estimé..." />
                </div>
                <button style={s.greenBtn} onClick={ajouterProjet}>+ Créer le projet</button>
              </div>
              {projets.length === 0 && <div style={{ textAlign:"center", padding:"32px 16px", color:"rgba(240,237,230,0.3)", fontSize:12 }}>
                Aucun projet pour l'instant.<br/>Créez votre premier projet ci-dessus.
              </div>}
              {projets.map(p => <div key={p.id} style={{ ...s.card, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, marginBottom:2 }}>{p.nom}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:20, background:"rgba(201,168,76,0.1)", color:"#C9A84C", border:"0.5px solid rgba(201,168,76,0.3)", fontWeight:600 }}>{p.type}</span>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:20, background:"rgba(82,195,122,0.08)", color:"#52C37A", border:"0.5px solid rgba(82,195,122,0.25)", fontWeight:600 }}>{p.statut}</span>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:20, background:"rgba(255,255,255,0.03)", color:"rgba(240,237,230,0.38)", border:"0.5px solid rgba(255,255,255,0.07)", fontWeight:600 }}>{p.date}</span>
                    </div>
                  </div>
                  <button onClick={() => supprimerProjet(p.id)} style={{ background:"transparent", border:"none", cursor:"pointer", padding:4, color:"rgba(224,82,82,0.5)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
                {p.notes && <div style={{ fontSize:11, color:"rgba(240,237,230,0.45)", lineHeight:1.6, borderTop:"0.5px solid rgba(255,255,255,0.06)", paddingTop:8, marginTop:6 }}>{p.notes}</div>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginTop:10 }}>
                  <button onClick={() => ouvrirProjetChat(p)} style={{ background:"rgba(201,168,76,0.08)", border:"0.5px solid rgba(201,168,76,0.25)", borderRadius:10, padding:"7px 4px", fontSize:9, fontWeight:700, color:"#C9A84C", cursor:"pointer" }}>🤖 IA dédiée</button>
                  <button onClick={() => { goPage("cert"); setCertProjet(p.nom); }} style={{ background:"rgba(82,195,122,0.06)", border:"0.5px solid rgba(82,195,122,0.2)", borderRadius:10, padding:"7px 4px", fontSize:9, fontWeight:700, color:"#52C37A", cursor:"pointer" }}>🏅 Certificat</button>
                  <button onClick={() => genererCRChantier(p)} disabled={crLoading} style={{ background:"rgba(82,144,224,0.06)", border:"0.5px solid rgba(82,144,224,0.2)", borderRadius:10, padding:"7px 4px", fontSize:9, fontWeight:700, color:"#5290E0", cursor:"pointer", opacity:crLoading?0.5:1 }}>{crLoading?"...":"📋 CR PDF"}</button>
                </div>
              </div>)}
            </div>
          </div>

        </div>

        <div style={s.bnav}>
          <NavIcon id="home" label="Accueil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </NavIcon>
          <NavIcon id="coach" label="32 IA">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </NavIcon>
          <NavIcon id="scanner" label="Scanner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </NavIcon>
          <NavIcon id="outils" label="Outils">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </NavIcon>
          <NavIcon id="projets" label="Projets">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </NavIcon>
        </div>

      </div>
      {projetChat && (
        <div style={{ position:"fixed", inset:0, background:"rgba(6,8,13,0.98)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", display:"flex", flexDirection:"column", zIndex:9994, maxWidth:430, margin:"0 auto" }}>
          <div style={{ padding:"14px 16px 10px", display:"flex", alignItems:"center", gap:10, borderBottom:"0.5px solid rgba(201,168,76,0.15)", flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700 }}>{projetChat.nom}</div>
              <div style={{ fontSize:10, color:"#C9A84C" }}>IA dédiée · {projetChat.type}</div>
            </div>
            <button onClick={() => setProjetChat(null)} style={{ background:"none", border:"none", color:"rgba(240,237,230,0.4)", fontSize:22, cursor:"pointer", padding:4 }}>×</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:10 }}>
            {projetChatMsgs.map((m,i) => (
              <div key={i} style={m.role==="ai" ? s.msgA : s.msgU}>
                <div style={s.mav}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">{m.role==="ai"?<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}</svg></div>
                <div style={m.role==="ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")}} />
              </div>
            ))}
          </div>
          <div style={{ padding:"10px 16px 16px", borderTop:"0.5px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
            <div style={s.inputBar}>
              <textarea style={s.ci} value={projetChatInput} onChange={e => setProjetChatInput(e.target.value)} placeholder={"Question sur "+projetChat.nom+"..."} rows={1} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendProjetChat();}}} />
              <button style={s.sb} onClick={sendProjetChat} disabled={projetChatLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {showPaywall && (
        <div style={{ position:"fixed", inset:0, background:"rgba(6,8,13,0.94)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:9997, padding:"0 32px" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🔓</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"#C9A84C", marginBottom:8, textAlign:"center" }}>5 messages utilisés</div>
          <div style={{ fontSize:13, color:"rgba(240,237,230,0.55)", textAlign:"center", marginBottom:28, lineHeight:1.7, maxWidth:280 }}>Passez Premium pour un accès illimité aux 32 IA expertes bâtiment.</div>
          <button onClick={() => setShowPaywall(false)} style={{ width:"100%", maxWidth:320, background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", borderRadius:14, padding:"15px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:"#06080D", cursor:"pointer", marginBottom:12, boxShadow:"0 4px 28px rgba(201,168,76,0.4)" }}>Premium — 4,99€/mois</button>
          <button onClick={() => setShowPaywall(false)} style={{ background:"transparent", border:"none", fontSize:12, color:"rgba(240,237,230,0.3)", cursor:"pointer", padding:8 }}>Continuer sans Premium</button>
        </div>
      )}
      {!rgpdOk && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(10,14,22,0.97)", backdropFilter:"blur(20px)", borderTop:"0.5px solid rgba(201,168,76,0.2)", padding:"14px 16px", zIndex:9999 }}>
          <div style={{ fontSize:11, color:"rgba(240,237,230,0.6)", marginBottom:10, lineHeight:1.6 }}>MAESTROMIND utilise des cookies essentiels. En continuant, vous acceptez notre <span style={{ color:"#C9A84C" }}>politique de confidentialité</span>.</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"linear-gradient(135deg,#EDD060,#C9A84C)", border:"none", borderRadius:10, padding:"10px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#06080D", cursor:"pointer" }}>Accepter</button>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", fontSize:12, color:"rgba(240,237,230,0.5)", cursor:"pointer" }}>Essentiels</button>
          </div>
        </div>
      )}
    </>
  );
}
