"""Seed data for Edu Plus - questions and live sessions."""
from datetime import datetime, timedelta, timezone

# Categories:
# romana: gramatica, literatura, vocabular, fonetica, sintaxa
# matematica: aritmetica, algebra, geometrie, ecuatii, procente

ROMANA_QUESTIONS = [
    # Gramatică (12)
    {"category": "gramatica", "question": "Ce parte de vorbire este cuvântul „repede” în propoziția „El aleargă repede.”?", "options": ["Adjectiv", "Adverb", "Verb", "Substantiv"], "correct": 1, "is_initial": True},
    {"category": "gramatica", "question": "Care este forma corectă?", "options": ["Mi-a-r plăcea", "Mi-ar plăcea", "Miar plăcea", "Mi ar plăcea"], "correct": 1, "is_initial": True},
    {"category": "gramatica", "question": "Modul verbului din „să citesc” este:", "options": ["Indicativ", "Conjunctiv", "Imperativ", "Condițional"], "correct": 1},
    {"category": "gramatica", "question": "Genul substantivului „caiet” este:", "options": ["Masculin", "Feminin", "Neutru", "Comun"], "correct": 2},
    {"category": "gramatica", "question": "Timpul verbului „voi citi” este:", "options": ["Prezent", "Imperfect", "Viitor", "Perfect compus"], "correct": 2},
    {"category": "gramatica", "question": "Pronumele „dânsul” este de tip:", "options": ["Personal", "Personal de politețe", "Demonstrativ", "Reflexiv"], "correct": 1},
    {"category": "gramatica", "question": "Numeralul „al treilea” este:", "options": ["Cardinal", "Ordinal", "Colectiv", "Fracționar"], "correct": 1},
    {"category": "gramatica", "question": "În „cartea fratelui meu”, „fratelui” este în cazul:", "options": ["Nominativ", "Genitiv", "Dativ", "Acuzativ"], "correct": 1},
    {"category": "gramatica", "question": "Care este forma corectă de plural pentru „ou”?", "options": ["Ouă", "Oue", "Ouri", "Oi"], "correct": 0},
    {"category": "gramatica", "question": "„Deși” este o conjuncție:", "options": ["Coordonatoare", "Subordonatoare concesivă", "Subordonatoare cauzală", "Adversativă"], "correct": 1},
    {"category": "gramatica", "question": "Adjectivul „frumos” are la superlativ absolut:", "options": ["Mai frumos", "Cel mai frumos", "Foarte frumos", "Frumosul"], "correct": 2},
    {"category": "gramatica", "question": "Verbul „a fi” în „El este student” are funcția de:", "options": ["Predicativ", "Copulativ", "Auxiliar", "Personal"], "correct": 1},

    # Literatură (10)
    {"category": "literatura", "question": "Cum se numește figura de stil din versul „Luna doarme pe vale”?", "options": ["Metaforă", "Personificare", "Comparație", "Epitet"], "correct": 1, "is_initial": True},
    {"category": "literatura", "question": "„Mihai Eminescu” a scris poezia:", "options": ["Lupul și mielul", "Luceafărul", "Mioriţa", "Plumb"], "correct": 1},
    {"category": "literatura", "question": "„Amintiri din copilărie” a fost scrisă de:", "options": ["Mihail Sadoveanu", "Ion Creangă", "Mihai Eminescu", "George Coșbuc"], "correct": 1},
    {"category": "literatura", "question": "Genul liric se caracterizează prin:", "options": ["Acțiune și personaje", "Sentimente și emoții", "Dialog și replici", "Cronologie"], "correct": 1},
    {"category": "literatura", "question": "„Mioriţa” este:", "options": ["Baladă populară", "Doină", "Snoavă", "Roman"], "correct": 0},
    {"category": "literatura", "question": "În „obraji ca trandafirii”, figura de stil este:", "options": ["Metaforă", "Comparație", "Epitet", "Hiperbolă"], "correct": 1},
    {"category": "literatura", "question": "Naratorul la persoana I se găsește în:", "options": ["Roman obiectiv", "Roman subiectiv", "Basm cult", "Tragedie"], "correct": 1},
    {"category": "literatura", "question": "Strofa de patru versuri se numește:", "options": ["Distih", "Terțet", "Catren", "Cvinarie"], "correct": 2},
    {"category": "literatura", "question": "„Hyperion” din „Luceafărul” simbolizează:", "options": ["Iubirea pământească", "Geniul", "Tinerețea", "Tradiția"], "correct": 1},
    {"category": "literatura", "question": "Genul epic se caracterizează prin:", "options": ["Versuri", "Naratiune și acțiune", "Sentimente intime", "Dialog dramatic"], "correct": 1},

    # Vocabular (10)
    {"category": "vocabular", "question": "Care este antonimul cuvântului „înalt”?", "options": ["Lung", "Mare", "Scund", "Subțire"], "correct": 2, "is_initial": True},
    {"category": "vocabular", "question": "Sinonimul cuvântului „a începe” este:", "options": ["A termina", "A demara", "A opri", "A ezita"], "correct": 1},
    {"category": "vocabular", "question": "Antonimul lui „a permite” este:", "options": ["A îngădui", "A interzice", "A admite", "A consimți"], "correct": 1},
    {"category": "vocabular", "question": "Sinonim pentru „inteligent”:", "options": ["Prost", "Deștept", "Leneș", "Trist"], "correct": 1},
    {"category": "vocabular", "question": "„Banal” înseamnă:", "options": ["Original", "Comun, obișnuit", "Rar", "Prețios"], "correct": 1},
    {"category": "vocabular", "question": "Paronimul lui „original” este:", "options": ["Originar", "Curajos", "Vechi", "Nou"], "correct": 0},
    {"category": "vocabular", "question": "„Lacom” înseamnă:", "options": ["Generos", "Hapsân, avid", "Vesel", "Trist"], "correct": 1},
    {"category": "vocabular", "question": "Cuvântul „a ezita” este sinonim cu:", "options": ["A se grăbi", "A șovăi", "A decide", "A insista"], "correct": 1},
    {"category": "vocabular", "question": "Antonim pentru „a respinge”:", "options": ["A accepta", "A refuza", "A nega", "A repudia"], "correct": 0},
    {"category": "vocabular", "question": "„Efemer” înseamnă:", "options": ["Etern", "Trecător, scurt", "Important", "Vechi"], "correct": 1},

    # Fonetică (8)
    {"category": "fonetica", "question": "Cuvântul „copil” are:", "options": ["3 silabe", "2 silabe", "1 silabă", "4 silabe"], "correct": 1, "is_initial": True},
    {"category": "fonetica", "question": "Cuvântul „ceai” conține:", "options": ["Un diftong", "Un triftong", "Două vocale", "Un hiat"], "correct": 0},
    {"category": "fonetica", "question": "În „leoaică”, „eoa” este:", "options": ["Diftong", "Triftong", "Hiat", "Vocală"], "correct": 1},
    {"category": "fonetica", "question": "În cuvântul „pian”, „ia” formează:", "options": ["Diftong", "Triftong", "Hiat", "Silabă tonică"], "correct": 2},
    {"category": "fonetica", "question": "Câte litere și sunete are cuvântul „ceas”?", "options": ["4 litere, 3 sunete", "4 litere, 4 sunete", "3 litere, 3 sunete", "5 litere, 4 sunete"], "correct": 0},
    {"category": "fonetica", "question": "Despărțirea corectă în silabe pentru „inegal”:", "options": ["i-ne-gal", "in-e-gal", "ine-gal", "i-neg-al"], "correct": 0},
    {"category": "fonetica", "question": "Câte vocale are cuvântul „aurar”?", "options": ["2", "3", "4", "5"], "correct": 1},
    {"category": "fonetica", "question": "În „chiuvetă”, litera „h”:", "options": ["Se pronunță", "Nu se pronunță", "Este vocală", "Este accent"], "correct": 1},

    # Sintaxă (10)
    {"category": "sintaxa", "question": "Care propoziție conține un complement direct?", "options": ["Merge la școală.", "Citește o carte.", "Vorbește frumos.", "Stă acasă."], "correct": 1},
    {"category": "sintaxa", "question": "Subiectul propoziției „A venit primăvara” este:", "options": ["A venit", "Primăvara", "Inexistent", "Subînțeles"], "correct": 1},
    {"category": "sintaxa", "question": "În „El scrie repede”, „repede” este:", "options": ["Complement direct", "Atribut", "Complement circumstanțial de mod", "Subiect"], "correct": 2},
    {"category": "sintaxa", "question": "Predicatul nominal este format din:", "options": ["Verb predicativ + complement", "Verb copulativ + nume predicativ", "Două verbe", "Adverb + verb"], "correct": 1},
    {"category": "sintaxa", "question": "În „Cartea de pe masă este nouă”, „de pe masă” este:", "options": ["Subiect", "Atribut", "Complement", "Predicat"], "correct": 1},
    {"category": "sintaxa", "question": "Fraza „Cred că vine.” conține:", "options": ["O propoziție principală", "O propoziție principală și una subordonată", "Două propoziții principale", "Trei propoziții"], "correct": 1},
    {"category": "sintaxa", "question": "Complementul indirect răspunde la întrebarea:", "options": ["Ce?", "Cui?", "Unde?", "Când?"], "correct": 1},
    {"category": "sintaxa", "question": "În „Plouă.”, subiectul este:", "options": ["Exprimat", "Subînțeles", "Inexistent", "Multiplu"], "correct": 2},
    {"category": "sintaxa", "question": "Atributul determină:", "options": ["Un verb", "Un substantiv sau substitut", "Un adverb", "O conjuncție"], "correct": 1},
    {"category": "sintaxa", "question": "În „Mi-e foame”, „mi” este:", "options": ["Subiect", "Complement indirect", "Atribut", "Predicat"], "correct": 1},
]

MATEMATICA_QUESTIONS = [
    # Aritmetică (10)
    {"category": "aritmetica", "question": "Cât face 3/4 + 1/2?", "options": ["1", "5/4", "4/6", "2/3"], "correct": 1, "is_initial": True},
    {"category": "aritmetica", "question": "Care număr este prim?", "options": ["9", "15", "17", "21"], "correct": 2, "is_initial": True},
    {"category": "aritmetica", "question": "C.m.m.d.c.(12, 18) =", "options": ["6", "12", "18", "36"], "correct": 0},
    {"category": "aritmetica", "question": "C.m.m.m.c.(4, 6) =", "options": ["2", "12", "24", "10"], "correct": 1},
    {"category": "aritmetica", "question": "0,25 ca fracție ireductibilă este:", "options": ["25/100", "1/4", "2/8", "5/20"], "correct": 1},
    {"category": "aritmetica", "question": "Suma divizorilor lui 12 este:", "options": ["16", "28", "24", "20"], "correct": 1},
    {"category": "aritmetica", "question": "2/3 dintr-un sfert este:", "options": ["1/6", "2/12", "1/12", "1/8"], "correct": 0},
    {"category": "aritmetica", "question": "Rotunjirea lui 4,567 la sutimi este:", "options": ["4,5", "4,57", "4,56", "4,6"], "correct": 1},
    {"category": "aritmetica", "question": "1,5 + 2,75 =", "options": ["3,25", "4,25", "4,5", "3,75"], "correct": 1},
    {"category": "aritmetica", "question": "Câte numere prime sunt între 1 și 10?", "options": ["3", "4", "5", "6"], "correct": 1},

    # Algebră (12)
    {"category": "algebra", "question": "Soluția ecuației 2x - 6 = 0 este:", "options": ["x = 2", "x = 3", "x = -3", "x = 6"], "correct": 1, "is_initial": True},
    {"category": "algebra", "question": "(-2)³ = ?", "options": ["-8", "8", "-6", "6"], "correct": 0},
    {"category": "algebra", "question": "√144 = ?", "options": ["10", "11", "12", "14"], "correct": 2},
    {"category": "algebra", "question": "Dacă 5x = 35, atunci x este:", "options": ["5", "6", "7", "8"], "correct": 2},
    {"category": "algebra", "question": "Soluția: 3x + 5 = 20 este:", "options": ["x = 5", "x = 7", "x = 6", "x = 4"], "correct": 0},
    {"category": "algebra", "question": "(a + b)² = ?", "options": ["a² + b²", "a² + 2ab + b²", "a² - 2ab + b²", "2ab"], "correct": 1},
    {"category": "algebra", "question": "Dacă x² = 49, atunci x ∈ :", "options": ["{7}", "{-7}", "{-7, 7}", "{49}"], "correct": 2},
    {"category": "algebra", "question": "2x + 3 = x + 8, deci x =", "options": ["3", "5", "8", "11"], "correct": 1},
    {"category": "algebra", "question": "Valoarea expresiei 2·3² - 4 este:", "options": ["14", "8", "32", "20"], "correct": 0},
    {"category": "algebra", "question": "|−5| + |3| =", "options": ["2", "−2", "8", "−8"], "correct": 2},
    {"category": "algebra", "question": "Dacă x/3 = 4, atunci x =", "options": ["1", "7", "12", "4/3"], "correct": 2},
    {"category": "algebra", "question": "Inegalitatea x + 2 > 5 are soluții:", "options": ["x > 3", "x < 3", "x = 3", "x ≥ 3"], "correct": 0},

    # Geometrie (12)
    {"category": "geometrie", "question": "Aria unui pătrat cu latura de 5 cm este:", "options": ["10 cm²", "20 cm²", "25 cm²", "15 cm²"], "correct": 2, "is_initial": True},
    {"category": "geometrie", "question": "Volumul unui cub cu latura 3 cm este:", "options": ["9 cm³", "12 cm³", "27 cm³", "18 cm³"], "correct": 2},
    {"category": "geometrie", "question": "Suma unghiurilor într-un triunghi este:", "options": ["90°", "180°", "270°", "360°"], "correct": 1},
    {"category": "geometrie", "question": "Aria unui cerc cu raza 2 este:", "options": ["4π", "2π", "π", "8π"], "correct": 0},
    {"category": "geometrie", "question": "Perimetrul unui dreptunghi cu L=6, l=4 este:", "options": ["10", "20", "24", "12"], "correct": 1},
    {"category": "geometrie", "question": "Teorema lui Pitagora se aplică în:", "options": ["Triunghi oarecare", "Triunghi dreptunghic", "Triunghi echilateral", "Patrulater"], "correct": 1},
    {"category": "geometrie", "question": "Într-un triunghi dreptunghic cu catetele 3 și 4, ipotenuza este:", "options": ["5", "6", "7", "25"], "correct": 0},
    {"category": "geometrie", "question": "Aria unui triunghi cu baza 6 și înălțimea 4 este:", "options": ["10", "12", "24", "20"], "correct": 1},
    {"category": "geometrie", "question": "Suma unghiurilor unui patrulater convex este:", "options": ["180°", "270°", "360°", "540°"], "correct": 2},
    {"category": "geometrie", "question": "Diagonala unui pătrat cu latura √2 este:", "options": ["1", "2", "√2", "4"], "correct": 1},
    {"category": "geometrie", "question": "Lungimea unui cerc cu raza r este:", "options": ["πr", "2πr", "πr²", "r²"], "correct": 1},
    {"category": "geometrie", "question": "Un triunghi echilateral are toate laturile:", "options": ["Diferite", "Egale două câte două", "Egale", "Perpendiculare"], "correct": 2},

    # Ecuații (8)
    {"category": "ecuatii", "question": "Sistemul {x+y=5, x-y=1} are soluția:", "options": ["(2,3)", "(3,2)", "(4,1)", "(1,4)"], "correct": 1},
    {"category": "ecuatii", "question": "Ecuația x² - 4 = 0 are soluțiile:", "options": ["x=2", "x=-2", "x∈{-2, 2}", "x=4"], "correct": 2},
    {"category": "ecuatii", "question": "Soluția: 4(x-1) = 12 este:", "options": ["x=2", "x=3", "x=4", "x=5"], "correct": 2},
    {"category": "ecuatii", "question": "Dacă x + 5 = 2x - 3, atunci x =", "options": ["2", "6", "8", "−2"], "correct": 2},
    {"category": "ecuatii", "question": "Soluția ecuației x/2 + 3 = 7 este:", "options": ["x=4", "x=8", "x=10", "x=14"], "correct": 1},
    {"category": "ecuatii", "question": "Ecuația 3x = 0 are soluția:", "options": ["x=3", "x=0", "x=−3", "Nu are"], "correct": 1},
    {"category": "ecuatii", "question": "Dacă 2(x+3) = 4x - 2, atunci x =", "options": ["2", "3", "4", "5"], "correct": 2},
    {"category": "ecuatii", "question": "Ecuația 5x + 10 = 5(x + 2) are:", "options": ["O soluție", "Două soluții", "Nicio soluție", "Infinit de soluții"], "correct": 3},

    # Procente (8)
    {"category": "procente", "question": "25% din 200 este:", "options": ["25", "40", "50", "75"], "correct": 2, "is_initial": True},
    {"category": "procente", "question": "Ce procent este 15 din 60?", "options": ["20%", "25%", "30%", "15%"], "correct": 1},
    {"category": "procente", "question": "Un obiect costă 100 lei și este redus cu 20%. Prețul nou este:", "options": ["70 lei", "75 lei", "80 lei", "90 lei"], "correct": 2},
    {"category": "procente", "question": "10% din 500 + 20% din 200 =", "options": ["70", "90", "100", "150"], "correct": 1},
    {"category": "procente", "question": "Dacă 30 reprezintă 60%, atunci 100% reprezintă:", "options": ["40", "50", "60", "70"], "correct": 1},
    {"category": "procente", "question": "Un preț crește cu 10%. De la 200 lei devine:", "options": ["210", "220", "240", "200"], "correct": 1},
    {"category": "procente", "question": "75% din 80 este:", "options": ["50", "55", "60", "65"], "correct": 2},
    {"category": "procente", "question": "Dintr-o clasă de 30 elevi, 40% sunt fete. Câte fete sunt?", "options": ["10", "12", "15", "18"], "correct": 1},
]


def get_live_sessions_seed():
    now = datetime.now(timezone.utc)
    return [
        {
            "title": "Recapitulare gramatică - subordonate",
            "professor": "Prof. Ioana Marinescu",
            "subject": "romana",
            "description": "Sesiune live: clarificăm propozițiile subordonate și exemple cheie pentru subiectul I.",
            "date": (now + timedelta(days=3, hours=2)).isoformat(),
            "duration_min": 60,
            "zoom_link": "https://zoom.us/j/eduplus-demo-001",
            "required_package": "premium",
            "spots_left": 12,
        },
        {
            "title": "Probleme de geometrie - Pitagora",
            "professor": "Prof. Andrei Popescu",
            "subject": "matematica",
            "description": "Aplicații variate ale teoremei lui Pitagora în triunghiuri și paralelograme.",
            "date": (now + timedelta(days=5)).isoformat(),
            "duration_min": 75,
            "zoom_link": "https://zoom.us/j/eduplus-demo-002",
            "required_package": "premium",
            "spots_left": 8,
        },
        {
            "title": "Comentariu literar - Eminescu",
            "professor": "Prof. Elena Dumitrescu",
            "subject": "romana",
            "description": "Cum analizezi o poezie de Eminescu pas cu pas pentru subiectul al III-lea.",
            "date": (now + timedelta(days=7, hours=4)).isoformat(),
            "duration_min": 60,
            "zoom_link": "https://zoom.us/j/eduplus-demo-003",
            "required_package": "premium",
            "spots_left": 15,
        },
        {
            "title": "Q&A deschis: ecuații și inecuații",
            "professor": "Prof. Mihai Ionescu",
            "subject": "matematica",
            "description": "Sesiune deschisă pentru toți studenții - aducem întrebări și rezolvăm împreună.",
            "date": (now + timedelta(days=10)).isoformat(),
            "duration_min": 90,
            "zoom_link": "https://zoom.us/j/eduplus-demo-004",
            "required_package": "standard",
            "spots_left": 25,
        },
    ]
