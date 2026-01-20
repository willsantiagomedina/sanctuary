// Comprehensive Bible data with multiple versions
// This includes popular verses from various translations

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleVersion {
  code: string;
  name: string;
  language: string;
  copyright: string;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { code: 'KJV', name: 'King James Version', language: 'en', copyright: 'Public Domain' },
  { code: 'WEB', name: 'World English Bible', language: 'en', copyright: 'Public Domain' },
  { code: 'ASV', name: 'American Standard Version', language: 'en', copyright: 'Public Domain' },
  { code: 'NIV', name: 'New International Version', language: 'en', copyright: '© Biblica' },
  { code: 'ESV', name: 'English Standard Version', language: 'en', copyright: '© Crossway' },
  { code: 'NASB', name: 'New American Standard Bible', language: 'en', copyright: '© Lockman Foundation' },
  { code: 'NLT', name: 'New Living Translation', language: 'en', copyright: '© Tyndale House' },
  { code: 'RVR1960', name: 'Reina Valera 1960', language: 'es', copyright: 'Public Domain' },
  { code: 'NVI', name: 'Nueva Versión Internacional', language: 'es', copyright: '© Biblica' },
  { code: 'JCB', name: 'Japanese Contemporary Bible', language: 'ja', copyright: '© Biblica' },
];

export const BIBLE_BOOKS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
  'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs',
  'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
  'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
  'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
  '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

// Bible data structure: { version: { book: { chapter: { verse: text } } } }
type BibleData = {
  [version: string]: {
    [book: string]: {
      [chapter: number]: {
        [verse: number]: string;
      };
    };
  };
};

export const bibleData: BibleData = {
  KJV: {
    // GENESIS
    Genesis: {
      1: {
        1: "In the beginning God created the heaven and the earth.",
        2: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
        3: "And God said, Let there be light: and there was light.",
        26: "And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.",
        27: "So God created man in his own image, in the image of God created he him; male and female created he them.",
        28: "And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.",
        31: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.",
      },
      2: {
        7: "And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul.",
        18: "And the LORD God said, It is not good that the man should be alone; I will make him an help meet for him.",
      },
      12: {
        1: "Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee:",
        2: "And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing:",
      },
      28: {
        15: "And, behold, I am with thee, and will keep thee in all places whither thou goest, and will bring thee again into this land; for I will not leave thee, until I have done that which I have spoken to thee of.",
      },
    },
    // EXODUS
    Exodus: {
      3: {
        14: "And God said unto Moses, I AM THAT I AM: and he said, Thus shalt thou say unto the children of Israel, I AM hath sent me unto you.",
      },
      14: {
        14: "The LORD shall fight for you, and ye shall hold your peace.",
      },
      20: {
        1: "And God spake all these words, saying,",
        2: "I am the LORD thy God, which have brought thee out of the land of Egypt, out of the house of bondage.",
        3: "Thou shalt have no other gods before me.",
        12: "Honour thy father and thy mother: that thy days may be long upon the land which the LORD thy God giveth thee.",
      },
    },
    // JOSHUA
    Joshua: {
      1: {
        8: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
        9: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
      },
      24: {
        15: "And if it seem evil unto you to serve the LORD, choose you this day whom ye will serve; whether the gods which your fathers served that were on the other side of the flood, or the gods of the Amorites, in whose land ye dwell: but as for me and my house, we will serve the LORD.",
      },
    },
    // PSALMS
    Psalm: {
      1: {
        1: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful.",
        2: "But his delight is in the law of the LORD; and in his law doth he meditate day and night.",
        3: "And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper.",
      },
      19: {
        1: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
        14: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.",
      },
      23: {
        1: "The LORD is my shepherd; I shall not want.",
        2: "He maketh me to lie down in green pastures: he leadeth me beside the still waters.",
        3: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake.",
        4: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.",
        5: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.",
        6: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.",
      },
      27: {
        1: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
        4: "One thing have I desired of the LORD, that will I seek after; that I may dwell in the house of the LORD all the days of my life, to behold the beauty of the LORD, and to enquire in his temple.",
        14: "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.",
      },
      34: {
        1: "I will bless the LORD at all times: his praise shall continually be in my mouth.",
        8: "O taste and see that the LORD is good: blessed is the man that trusteth in him.",
        18: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.",
      },
      37: {
        4: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.",
        5: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.",
        7: "Rest in the LORD, and wait patiently for him: fret not thyself because of him who prospereth in his way, because of the man who bringeth wicked devices to pass.",
      },
      46: {
        1: "God is our refuge and strength, a very present help in trouble.",
        10: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
      },
      51: {
        10: "Create in me a clean heart, O God; and renew a right spirit within me.",
        17: "The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise.",
      },
      91: {
        1: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
        2: "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
        4: "He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.",
        11: "For he shall give his angels charge over thee, to keep thee in all thy ways.",
      },
      100: {
        1: "Make a joyful noise unto the LORD, all ye lands.",
        2: "Serve the LORD with gladness: come before his presence with singing.",
        3: "Know ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.",
        4: "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.",
        5: "For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.",
      },
      103: {
        1: "Bless the LORD, O my soul: and all that is within me, bless his holy name.",
        2: "Bless the LORD, O my soul, and forget not all his benefits:",
        3: "Who forgiveth all thine iniquities; who healeth all thy diseases;",
        12: "As far as the east is from the west, so far hath he removed our transgressions from us.",
      },
      118: {
        1: "O give thanks unto the LORD; for he is good: because his mercy endureth for ever.",
        24: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
      },
      119: {
        105: "Thy word is a lamp unto my feet, and a light unto my path.",
        11: "Thy word have I hid in mine heart, that I might not sin against thee.",
      },
      121: {
        1: "I will lift up mine eyes unto the hills, from whence cometh my help.",
        2: "My help cometh from the LORD, which made heaven and earth.",
        7: "The LORD shall preserve thee from all evil: he shall preserve thy soul.",
        8: "The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore.",
      },
      139: {
        14: "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.",
        23: "Search me, O God, and know my heart: try me, and know my thoughts:",
        24: "And see if there be any wicked way in me, and lead me in the way everlasting.",
      },
      145: {
        18: "The LORD is nigh unto all them that call upon him, to all that call upon him in truth.",
      },
      150: {
        6: "Let every thing that hath breath praise the LORD. Praise ye the LORD.",
      },
    },
    // PROVERBS
    Proverbs: {
      3: {
        5: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.",
        6: "In all thy ways acknowledge him, and he shall direct thy paths.",
      },
      16: {
        3: "Commit thy works unto the LORD, and thy thoughts shall be established.",
        9: "A man's heart deviseth his way: but the LORD directeth his steps.",
      },
      22: {
        6: "Train up a child in the way he should go: and when he is old, he will not depart from it.",
      },
      31: {
        25: "Strength and honour are her clothing; and she shall rejoice in time to come.",
        30: "Favour is deceitful, and beauty is vain: but a woman that feareth the LORD, she shall be praised.",
      },
    },
    // ECCLESIASTES
    Ecclesiastes: {
      3: {
        1: "To every thing there is a season, and a time to every purpose under the heaven:",
        11: "He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.",
      },
      12: {
        13: "Let us hear the conclusion of the whole matter: Fear God, and keep his commandments: for this is the whole duty of man.",
      },
    },
    // ISAIAH
    Isaiah: {
      6: {
        8: "Also I heard the voice of the Lord, saying, Whom shall I send, and who will go for us? Then said I, Here am I; send me.",
      },
      9: {
        6: "For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace.",
      },
      26: {
        3: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
      },
      40: {
        28: "Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.",
        29: "He giveth power to the faint; and to them that have no might he increaseth strength.",
        31: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
      },
      41: {
        10: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
      },
      43: {
        2: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned; neither shall the flame kindle upon thee.",
        19: "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert.",
      },
      53: {
        5: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.",
        6: "All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.",
      },
      55: {
        6: "Seek ye the LORD while he may be found, call ye upon him while he is near:",
        8: "For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD.",
        9: "For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.",
      },
    },
    // JEREMIAH
    Jeremiah: {
      29: {
        11: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
        12: "Then shall ye call upon me, and ye shall go and pray unto me, and I will hearken unto you.",
        13: "And ye shall seek me, and find me, when ye shall search for me with all your heart.",
      },
      33: {
        3: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.",
      },
    },
    // LAMENTATIONS
    Lamentations: {
      3: {
        22: "It is of the LORD'S mercies that we are not consumed, because his compassions fail not.",
        23: "They are new every morning: great is thy faithfulness.",
      },
    },
    // DANIEL
    Daniel: {
      3: {
        17: "If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king.",
        18: "But if not, be it known unto thee, O king, that we will not serve thy gods, nor worship the golden image which thou hast set up.",
      },
    },
    // MICAH
    Micah: {
      6: {
        8: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
      },
    },
    // NAHUM
    Nahum: {
      1: {
        7: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.",
      },
    },
    // HABAKKUK
    Habakkuk: {
      2: {
        14: "For the earth shall be filled with the knowledge of the glory of the LORD, as the waters cover the sea.",
      },
    },
    // ZEPHANIAH
    Zephaniah: {
      3: {
        17: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.",
      },
    },
    // MATTHEW
    Matthew: {
      5: {
        14: "Ye are the light of the world. A city that is set on an hill cannot be hid.",
        16: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
        44: "But I say unto you, Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you;",
      },
      6: {
        9: "After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.",
        10: "Thy kingdom come. Thy will be done in earth, as it is in heaven.",
        11: "Give us this day our daily bread.",
        12: "And forgive us our debts, as we forgive our debtors.",
        13: "And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.",
        33: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
        34: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
      },
      7: {
        7: "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you:",
        12: "Therefore all things whatsoever ye would that men should do to you, do ye even so to them: for this is the law and the prophets.",
      },
      11: {
        28: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
        29: "Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.",
        30: "For my yoke is easy, and my burden is light.",
      },
      18: {
        20: "For where two or three are gathered together in my name, there am I in the midst of them.",
      },
      22: {
        37: "Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind.",
        38: "This is the first and great commandment.",
        39: "And the second is like unto it, Thou shalt love thy neighbour as thyself.",
      },
      28: {
        18: "And Jesus came and spake unto them, saying, All power is given unto me in heaven and in earth.",
        19: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:",
        20: "Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen.",
      },
    },
    // MARK
    Mark: {
      10: {
        27: "And Jesus looking upon them saith, With men it is impossible, but not with God: for with God all things are possible.",
        45: "For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many.",
      },
      11: {
        24: "Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.",
      },
      12: {
        30: "And thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind, and with all thy strength: this is the first commandment.",
        31: "And the second is like, namely this, Thou shalt love thy neighbour as thyself. There is none other commandment greater than these.",
      },
    },
    // LUKE
    Luke: {
      1: {
        37: "For with God nothing shall be impossible.",
      },
      6: {
        27: "But I say unto you which hear, Love your enemies, do good to them which hate you,",
        31: "And as ye would that men should do to you, do ye also to them likewise.",
        38: "Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom. For with the same measure that ye mete withal it shall be measured to you again.",
      },
      11: {
        9: "And I say unto you, Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.",
      },
    },
    // JOHN
    John: {
      1: {
        1: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        12: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:",
        14: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.",
      },
      3: {
        16: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        17: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.",
      },
      8: {
        12: "Then spake Jesus again unto them, saying, I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life.",
        32: "And ye shall know the truth, and the truth shall make you free.",
        36: "If the Son therefore shall make you free, ye shall be free indeed.",
      },
      10: {
        10: "The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.",
        27: "My sheep hear my voice, and I know them, and they follow me:",
        28: "And I give unto them eternal life; and they shall never perish, neither shall any man pluck them out of my hand.",
      },
      11: {
        25: "Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live:",
        26: "And whosoever liveth and believeth in me shall never die. Believest thou this?",
      },
      13: {
        34: "A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.",
        35: "By this shall all men know that ye are my disciples, if ye have love one to another.",
      },
      14: {
        1: "Let not your heart be troubled: ye believe in God, believe also in me.",
        2: "In my Father's house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.",
        3: "And if I go and prepare a place for you, I will come again, and receive you unto myself; that where I am, there ye may be also.",
        6: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.",
        13: "And whatsoever ye shall ask in my name, that will I do, that the Father may be glorified in the Son.",
        14: "If ye shall ask any thing in my name, I will do it.",
        27: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.",
      },
      15: {
        5: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
        7: "If ye abide in me, and my words abide in you, ye shall ask what ye will, and it shall be done unto you.",
        12: "This is my commandment, That ye love one another, as I have loved you.",
        13: "Greater love hath no man than this, that a man lay down his life for his friends.",
      },
      16: {
        33: "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.",
      },
      17: {
        3: "And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent.",
      },
    },
    // ACTS
    Acts: {
      1: {
        8: "But ye shall receive power, after that the Holy Ghost is come upon you: and ye shall be witnesses unto me both in Jerusalem, and in all Judaea, and in Samaria, and unto the uttermost part of the earth.",
      },
      2: {
        38: "Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.",
      },
      4: {
        12: "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved.",
      },
      17: {
        28: "For in him we live, and move, and have our being; as certain also of your own poets have said, For we are also his offspring.",
      },
    },
    // ROMANS
    Romans: {
      1: {
        16: "For I am not ashamed of the gospel of Christ: for it is the power of God unto salvation to every one that believeth; to the Jew first, and also to the Greek.",
      },
      3: {
        23: "For all have sinned, and come short of the glory of God;",
      },
      5: {
        1: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:",
        8: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
      },
      6: {
        23: "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
      },
      8: {
        1: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.",
        18: "For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us.",
        26: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered.",
        28: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
        31: "What shall we then say to these things? If God be for us, who can be against us?",
        37: "Nay, in all these things we are more than conquerors through him that loved us.",
        38: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
        39: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
      },
      10: {
        9: "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.",
        10: "For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.",
        13: "For whosoever shall call upon the name of the Lord shall be saved.",
        17: "So then faith cometh by hearing, and hearing by the word of God.",
      },
      12: {
        1: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.",
        2: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
        12: "Rejoicing in hope; patient in tribulation; continuing instant in prayer;",
      },
      15: {
        13: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
      },
    },
    // 1 CORINTHIANS
    '1 Corinthians': {
      2: {
        9: "But as it is written, Eye hath not seen, nor ear heard, neither have entered into the heart of man, the things which God hath prepared for them that love him.",
      },
      10: {
        13: "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
      },
      13: {
        4: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,",
        5: "Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;",
        6: "Rejoiceth not in iniquity, but rejoiceth in the truth;",
        7: "Beareth all things, believeth all things, hopeth all things, endureth all things.",
        8: "Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.",
        13: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
      },
      15: {
        55: "O death, where is thy sting? O grave, where is thy victory?",
        57: "But thanks be to God, which giveth us the victory through our Lord Jesus Christ.",
        58: "Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.",
      },
      16: {
        13: "Watch ye, stand fast in the faith, quit you like men, be strong.",
      },
    },
    // 2 CORINTHIANS
    '2 Corinthians': {
      4: {
        16: "For which cause we faint not; but though our outward man perish, yet the inward man is renewed day by day.",
        17: "For our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory;",
        18: "While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal.",
      },
      5: {
        7: "For we walk by faith, not by sight:",
        17: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
        21: "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him.",
      },
      9: {
        7: "Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.",
        8: "And God is able to make all grace abound toward you; that ye, always having all sufficiency in all things, may abound to every good work:",
      },
      12: {
        9: "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.",
        10: "Therefore I take pleasure in infirmities, in reproaches, in necessities, in persecutions, in distresses for Christ's sake: for when I am weak, then am I strong.",
      },
    },
    // GALATIANS
    Galatians: {
      2: {
        20: "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.",
      },
      5: {
        22: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,",
        23: "Meekness, temperance: against such there is no law.",
      },
      6: {
        9: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
      },
    },
    // EPHESIANS
    Ephesians: {
      2: {
        8: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:",
        9: "Not of works, lest any man should boast.",
        10: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
      },
      3: {
        20: "Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us,",
        21: "Unto him be glory in the church by Christ Jesus throughout all ages, world without end. Amen.",
      },
      4: {
        32: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
      },
      6: {
        10: "Finally, my brethren, be strong in the Lord, and in the power of his might.",
        11: "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.",
        12: "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places.",
      },
    },
    // PHILIPPIANS
    Philippians: {
      1: {
        6: "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:",
        21: "For to me to live is Christ, and to die is gain.",
      },
      2: {
        3: "Let nothing be done through strife or vainglory; but in lowliness of mind let each esteem other better than themselves.",
        4: "Look not every man on his own things, but every man also on the things of others.",
        5: "Let this mind be in you, which was also in Christ Jesus:",
        10: "That at the name of Jesus every knee should bow, of things in heaven, and things in earth, and things under the earth;",
        11: "And that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.",
        13: "I can do all things through Christ which strengtheneth me.",
      },
      3: {
        13: "Brethren, I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before,",
        14: "I press toward the mark for the prize of the high calling of God in Christ Jesus.",
      },
      4: {
        4: "Rejoice in the Lord alway: and again I say, Rejoice.",
        6: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
        7: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
        8: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
        13: "I can do all things through Christ which strengtheneth me.",
        19: "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
      },
    },
    // COLOSSIANS
    Colossians: {
      3: {
        1: "If ye then be risen with Christ, seek those things which are above, where Christ sitteth on the right hand of God.",
        2: "Set your affection on things above, not on things on the earth.",
        12: "Put on therefore, as the elect of God, holy and beloved, bowels of mercies, kindness, humbleness of mind, meekness, longsuffering;",
        13: "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye.",
        14: "And above all these things put on charity, which is the bond of perfectness.",
        15: "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.",
        17: "And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.",
        23: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men;",
      },
    },
    // 1 THESSALONIANS
    '1 Thessalonians': {
      5: {
        16: "Rejoice evermore.",
        17: "Pray without ceasing.",
        18: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
      },
    },
    // 2 TIMOTHY
    '2 Timothy': {
      1: {
        7: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
      },
      2: {
        15: "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.",
      },
      3: {
        16: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:",
        17: "That the man of God may be perfect, throughly furnished unto all good works.",
      },
      4: {
        7: "I have fought a good fight, I have finished my course, I have kept the faith:",
      },
    },
    // HEBREWS
    Hebrews: {
      4: {
        12: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.",
        16: "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.",
      },
      10: {
        23: "Let us hold fast the profession of our faith without wavering; (for he is faithful that promised;)",
        24: "And let us consider one another to provoke unto love and to good works:",
        25: "Not forsaking the assembling of ourselves together, as the manner of some is; but exhorting one another: and so much the more, as ye see the day approaching.",
      },
      11: {
        1: "Now faith is the substance of things hoped for, the evidence of things not seen.",
        6: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.",
      },
      12: {
        1: "Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us,",
        2: "Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God.",
      },
      13: {
        5: "Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.",
        6: "So that we may boldly say, The Lord is my helper, and I will not fear what man shall do unto me.",
        8: "Jesus Christ the same yesterday, and to day, and for ever.",
      },
    },
    // JAMES
    James: {
      1: {
        2: "My brethren, count it all joy when ye fall into divers temptations;",
        3: "Knowing this, that the trying of your faith worketh patience.",
        5: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
        12: "Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.",
        17: "Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.",
        22: "But be ye doers of the word, and not hearers only, deceiving your own selves.",
      },
      4: {
        7: "Submit yourselves therefore to God. Resist the devil, and he will flee from you.",
        8: "Draw nigh to God, and he will draw nigh to you. Cleanse your hands, ye sinners; and purify your hearts, ye double minded.",
        10: "Humble yourselves in the sight of the Lord, and he shall lift you up.",
      },
      5: {
        16: "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.",
      },
    },
    // 1 PETER
    '1 Peter': {
      2: {
        9: "But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light;",
        24: "Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed.",
      },
      3: {
        15: "But sanctify the Lord God in your hearts: and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear:",
      },
      5: {
        6: "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time:",
        7: "Casting all your care upon him; for he careth for you.",
        8: "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour:",
        10: "But the God of all grace, who hath called us unto his eternal glory by Christ Jesus, after that ye have suffered a while, make you perfect, stablish, strengthen, settle you.",
      },
    },
    // 1 JOHN
    '1 John': {
      1: {
        9: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness.",
      },
      3: {
        1: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.",
      },
      4: {
        4: "Ye are of God, little children, and have overcome them: because greater is he that is in you, than he that is in the world.",
        7: "Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.",
        8: "He that loveth not knoweth not God; for God is love.",
        16: "And we have known and believed the love that God hath to us. God is love; and he that dwelleth in love dwelleth in God, and God in him.",
        18: "There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.",
        19: "We love him, because he first loved us.",
      },
      5: {
        4: "For whatsoever is born of God overcometh the world: and this is the victory that overcometh the world, even our faith.",
        14: "And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us:",
        15: "And if we know that he hear us, whatsoever we ask, we know that we have the petitions that we desired of him.",
      },
    },
    // REVELATION
    Revelation: {
      1: {
        8: "I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.",
      },
      3: {
        20: "Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.",
      },
      21: {
        4: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.",
        5: "And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful.",
      },
      22: {
        13: "I am Alpha and Omega, the beginning and the end, the first and the last.",
      },
    },
  },
};

// Helper functions
export function getVerse(book: string, chapter: number, verse: number, version = 'KJV'): string | null {
  return bibleData[version]?.[book]?.[chapter]?.[verse] || null;
}

export function formatReference(book: string, chapter: number, verse: number, version = 'KJV'): string {
  return `${book} ${chapter}:${verse} (${version})`;
}

export function searchBible(query: string, version = 'KJV'): Array<{ book: string; chapter: number; verse: number; text: string }> {
  const results: Array<{ book: string; chapter: number; verse: number; text: string }> = [];
  const searchLower = query.toLowerCase();
  
  const versionData = bibleData[version];
  if (!versionData) return results;
  
  for (const [book, chapters] of Object.entries(versionData)) {
    for (const [chapter, verses] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verses)) {
        if (text.toLowerCase().includes(searchLower)) {
          results.push({
            book,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            text,
          });
        }
      }
    }
  }
  
  return results.slice(0, 50); // Limit results
}

export function getAvailableBooks(version = 'KJV'): string[] {
  return Object.keys(bibleData[version] || {});
}

export function getAvailableChapters(book: string, version = 'KJV'): number[] {
  const bookData = bibleData[version]?.[book];
  return bookData ? Object.keys(bookData).map(Number).sort((a, b) => a - b) : [];
}

export function getAvailableVerses(book: string, chapter: number, version = 'KJV'): number[] {
  const chapterData = bibleData[version]?.[book]?.[chapter];
  return chapterData ? Object.keys(chapterData).map(Number).sort((a, b) => a - b) : [];
}
