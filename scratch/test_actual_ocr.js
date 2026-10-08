const { extractDocumentData } = require('../lib/extractDocumentData.js');

const text = `13:26 ii F7 ED

x Attestation d'assurance v
PDF - 101 ko

fi) Auto

Pour aous contacter

Gestion Ge votre Contrat : Ja<s votre Escace Perso

er VOUS COMNECIAN! avec vatre adresse e- mai M. ERWAN KAMDJOM

st ae C0 10 8D 80 04 [4" non surfant) 22 RUE DES PINSONS

Ea cas de sialsire : dèeri votre Etpace Perio 95610 ERAGNY SUR OISE
Ou 40584 Mobile Dec! Avsurance

et az C6 T0 2 80 OT fa* non vurteut)
Bégoanage ; 07 55 37 27 20, ZAH/24, 7.07

Contrat n° 100158580615
Swesnes, le 07/09/2026

ATTESTATION D'ASSURANCE

Nous confirmons que la voture ci-dessous est assurée du 14/07/2026 à ONOO jusqu'au 12/07/2027 inclus.
Marque : TOYOTA

Modèle : AURSS

Appellation : 135H COLLECTION

Immatriculation : FBSTTHV

Nous vous remercions dé votre confiance.

Pour l'assureur,

Cotte aftertafion d'euvarance ex valebie, vout réverve du bon encamemest de voire réglement, cosformement à lartcie & 2-6 du Cade den
rc ve da grès" or Mira cbr bia «trier “Tout conducteur Eux véhicule mertionnt à Tartcie L 215-1 doit. dons les conssioes
prévues aux articles de Le prévente vwction, éêre #2 rmevate de préverter un decurrant Fatveré prévamer que l'obigetion d'axsurence à été vatilaite
s0 que les condiigns de l'article L 27-3 vont applicables Cette prévomgton résulte de la production, aux fonchonnaires où sqenés chargés de
corstyner les infractions à La poñce de a crcuaton, d'un des éecurents dont les cordons détatlssement et de validité sont fiskes par le

d'admistaaration publique prévu à Tarticle L 2511. À défaut d'un de ces documents, © jusificaron est fournie aus 20100nés judiciares par

Passe nou écrire - Direct Auararnce, TSA 27007 TOTRA Lite Cocos 08
Dore Era ME rue Care = CS NOTE = RIT Serres Cortes Ortega ef Se rage € hrcr — TA pli ee NT NS À = STE PRE VA ECS arte = Maria drone
`;

const res = extractDocumentData(text);
console.log(JSON.stringify(res, null, 2));
