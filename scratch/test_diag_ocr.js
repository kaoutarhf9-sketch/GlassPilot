const { extractDocumentData } = require('../lib/extractDocumentData.js');

// Text extracted from Tesseract on the user's uploaded image
const textFromOCR = `
A
13:26
u
en
Attestation d'assurance
...
x
PDF - 101 ko
Direct
fi) Auto
Pour nous contacter
Gestion de votre contrat: 5305 votre Espace Perse
en VOUS COMNECIAN! avec voire adresse e- mad
M. ERWAN KAMDJOM
22 RUE DES PINSONS
# ae C0 10 8 80 04 [+" no surtant)
95610 ERAGNY SUR OTSE
Un cas de sinistre : does votre Eipser Perso
Ou 2058 mobile Direct Assurance
#é a CO 10 MD 80 01 [a* con vurtant)
Dépannage ; 0755 37 27 20, 24W/24, 74/7
Contrat n° 100158580615
Swresnes, le 07/09/2026
ATTESTATION D'ASSURANCE
Nous confirmons que la voñure ci-dessous est assurée du 14/07/2026 à ONOO jusqu'au 12/07/2027 inclus.
Marque : TOYOTA
Modèle : AURSS
Appellation : 135H COLLECTION
Immatriculation  FES77HV
Nous vous remercions de votre confiance.
Pour l'assureur,
PE
Henry de Courtois
Directeur Général d'Avanssur
Cette attetation d'envarance est valable, vous rénerve du bos encanvement de voire réglement, conformément à l'ateie © 25-16 du Code des
aseronces (Décret n°85-8T9 Qu 22 août 1585) qué précise que Tout conducteur Eux véiicule mentionné à l'article L 213-1 doit. dans les conéfiors
prévues aux actiches de Le préureise vection, dêre «= mavate de prévacter un decurrant fatnané prévamer que l'bigation d'axserence à dé vablaite
20 que les condifigns de l'article L 21-3 vont applicables. Cette prévomgton résulte de la production, aux fonchennaires où agents chargés de
constoner les infractions à la poñce de ‘a crcuation, d'un des documents dont les conérions d'établissement et de valicitt sont flstes par le
réglement d'admisiatration publique prévu à l'article L 211-1, À défaut d'un de ces documents, fa jusificaton est fournie aus autarnés pusiciares par
115 Moyens»
En cas de contrôle par les forces de l'ordre, la présentation de cette amestation d'assaraece fait effice de présomption d'assoraece de la voiture
assuvée qar nas scies. Lite vous permet de juilifer que vous avez satisfait à l'obigation d'assurance, et donc de cisculer avec la voiture désignée
ci-dessus.
Pons sous Berre; Donc Aasaranecn, TSA 7008 SATA Le Cadre 08
`;

console.log("Extraction standard:");
console.log(extractDocumentData(textFromOCR));
