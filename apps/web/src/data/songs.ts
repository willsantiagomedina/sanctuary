// Worship song data with lyrics

export interface Song {
  id: string;
  title: string;
  artist: string;
  language: 'en' | 'es' | 'ja';
  tags: string[];
  lyrics: string;
  sections: SongSection[];
}

export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus';
  label: string;
  lyrics: string;
}

// English worship songs
export const ENGLISH_SONGS: Song[] = [
  {
    id: 'en-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    language: 'en',
    tags: ['hymn', 'classic', 'grace'],
    lyrics: `Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind but now I see`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind but now I see` },
      { type: 'verse', label: 'Verse 2', lyrics: `'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed` },
      { type: 'verse', label: 'Verse 3', lyrics: `Through many dangers, toils, and snares\nI have already come\n'Tis grace hath brought me safe thus far\nAnd grace will lead me home` },
    ],
  },
  {
    id: 'en-2',
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    language: 'en',
    tags: ['worship', 'praise', 'contemporary'],
    lyrics: `The splendor of the King\nClothed in majesty\nLet all the earth rejoice`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `The splendor of the King\nClothed in majesty\nLet all the earth rejoice\nAll the earth rejoice\nHe wraps Himself in light\nAnd darkness tries to hide\nAnd trembles at His voice\nTrembles at His voice` },
      { type: 'chorus', label: 'Chorus', lyrics: `How great is our God\nSing with me\nHow great is our God\nAnd all will see\nHow great, how great is our God` },
      { type: 'verse', label: 'Verse 2', lyrics: `Age to age He stands\nAnd time is in His hands\nBeginning and the End\nBeginning and the End\nThe Godhead, Three in One\nFather, Spirit, Son\nThe Lion and the Lamb\nThe Lion and the Lamb` },
      { type: 'bridge', label: 'Bridge', lyrics: `Name above all names\nWorthy of all praise\nMy heart will sing\nHow great is our God` },
    ],
  },
  {
    id: 'en-3',
    title: '10,000 Reasons (Bless the Lord)',
    artist: 'Matt Redman',
    language: 'en',
    tags: ['worship', 'praise'],
    lyrics: `Bless the Lord, O my soul\nO my soul, worship His holy name`,
    sections: [
      { type: 'chorus', label: 'Chorus', lyrics: `Bless the Lord, O my soul\nO my soul, worship His holy name\nSing like never before, O my soul\nI'll worship Your holy name` },
      { type: 'verse', label: 'Verse 1', lyrics: `The sun comes up, it's a new day dawning\nIt's time to sing Your song again\nWhatever may pass and whatever lies before me\nLet me be singing when the evening comes` },
      { type: 'verse', label: 'Verse 2', lyrics: `You're rich in love and You're slow to anger\nYour name is great and Your heart is kind\nFor all Your goodness I will keep on singing\nTen thousand reasons for my heart to find` },
    ],
  },
  {
    id: 'en-4',
    title: 'Good Good Father',
    artist: 'Chris Tomlin',
    language: 'en',
    tags: ['worship', 'identity'],
    lyrics: `You're a good, good Father\nIt's who You are`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `I've heard a thousand stories\nOf what they think You're like\nBut I've heard the tender whisper\nOf love in the dead of night` },
      { type: 'chorus', label: 'Chorus', lyrics: `You're a good, good Father\nIt's who You are, it's who You are, it's who You are\nAnd I'm loved by You\nIt's who I am, it's who I am, it's who I am` },
      { type: 'bridge', label: 'Bridge', lyrics: `You are perfect in all of Your ways\nYou are perfect in all of Your ways\nYou are perfect in all of Your ways to us` },
    ],
  },
  {
    id: 'en-5',
    title: 'What A Beautiful Name',
    artist: 'Hillsong Worship',
    language: 'en',
    tags: ['worship', 'jesus'],
    lyrics: `What a beautiful name it is\nThe name of Jesus`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `You were the Word at the beginning\nOne with God the Lord Most High\nYour hidden glory in creation\nNow revealed in You our Christ` },
      { type: 'chorus', label: 'Chorus', lyrics: `What a beautiful name it is\nWhat a beautiful name it is\nThe name of Jesus Christ my King\nWhat a beautiful name it is\nNothing compares to this\nWhat a beautiful name it is, the name of Jesus` },
      { type: 'bridge', label: 'Bridge', lyrics: `Death could not hold You\nThe veil tore before You\nYou silence the boast of sin and grave\nThe heavens are roaring\nThe praise of Your glory\nFor You are raised to life again` },
    ],
  },
  {
    id: 'en-6',
    title: 'Reckless Love',
    artist: 'Cory Asbury',
    language: 'en',
    tags: ['worship', 'love'],
    lyrics: `O the overwhelming, never-ending, reckless love of God`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `Before I spoke a word, You were singing over me\nYou have been so, so good to me\nBefore I took a breath, You breathed Your life in me\nYou have been so, so kind to me` },
      { type: 'chorus', label: 'Chorus', lyrics: `O the overwhelming, never-ending, reckless love of God\nO it chases me down, fights 'til I'm found, leaves the ninety-nine\nI couldn't earn it, and I don't deserve it, still You give Yourself away\nO the overwhelming, never-ending, reckless love of God` },
    ],
  },
  {
    id: 'en-7',
    title: 'Great Are You Lord',
    artist: 'All Sons & Daughters',
    language: 'en',
    tags: ['worship', 'praise'],
    lyrics: `Great are You Lord`,
    sections: [
      { type: 'verse', label: 'Verse', lyrics: `You give life, You are love\nYou bring light to the darkness\nYou give hope, You restore every heart that is broken\nGreat are You, Lord` },
      { type: 'chorus', label: 'Chorus', lyrics: `It's Your breath in our lungs\nSo we pour out our praise\nWe pour out our praise\nIt's Your breath in our lungs\nSo we pour out our praise to You only` },
    ],
  },
  {
    id: 'en-8',
    title: 'Oceans (Where Feet May Fail)',
    artist: 'Hillsong United',
    language: 'en',
    tags: ['worship', 'faith', 'trust'],
    lyrics: `Spirit lead me where my trust is without borders`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `You call me out upon the waters\nThe great unknown where feet may fail\nAnd there I find You in the mystery\nIn oceans deep, my faith will stand` },
      { type: 'chorus', label: 'Chorus', lyrics: `And I will call upon Your name\nAnd keep my eyes above the waves\nWhen oceans rise, my soul will rest in Your embrace\nFor I am Yours, and You are mine` },
      { type: 'bridge', label: 'Bridge', lyrics: `Spirit lead me where my trust is without borders\nLet me walk upon the waters\nWherever You would call me\nTake me deeper than my feet could ever wander\nAnd my faith will be made stronger\nIn the presence of my Savior` },
    ],
  },
  {
    id: 'en-9',
    title: 'Way Maker',
    artist: 'Sinach',
    language: 'en',
    tags: ['worship', 'faith', 'miracles'],
    lyrics: `Way maker, miracle worker, promise keeper`,
    sections: [
      { type: 'verse', label: 'Verse', lyrics: `You are here, moving in our midst\nI worship You, I worship You\nYou are here, working in this place\nI worship You, I worship You` },
      { type: 'chorus', label: 'Chorus', lyrics: `Way maker, miracle worker\nPromise keeper, light in the darkness\nMy God, that is who You are` },
    ],
  },
  {
    id: 'en-10',
    title: 'Holy Spirit',
    artist: 'Francesca Battistelli',
    language: 'en',
    tags: ['worship', 'holy spirit'],
    lyrics: `Holy Spirit, You are welcome here`,
    sections: [
      { type: 'verse', label: 'Verse', lyrics: `There's nothing worth more that will ever come close\nNothing can compare, You're our living hope\nYour presence, Lord` },
      { type: 'chorus', label: 'Chorus', lyrics: `Holy Spirit, You are welcome here\nCome flood this place and fill the atmosphere\nYour glory, God, is what our hearts long for\nTo be overcome by Your presence, Lord` },
    ],
  },
  // More English songs
  {
    id: 'en-11',
    title: 'Build My Life',
    artist: 'Housefires',
    language: 'en',
    tags: ['worship', 'devotion'],
    lyrics: `I will build my life upon Your love`,
    sections: [
      { type: 'verse', label: 'Verse', lyrics: `Worthy of every song we could ever sing\nWorthy of all the praise we could ever bring\nWorthy of every breath we could ever breathe\nWe live for You` },
      { type: 'chorus', label: 'Chorus', lyrics: `Holy, there is no one like You\nThere is none beside You, open up my eyes in wonder\nShow me who You are and fill me with Your heart\nAnd lead me in Your love to those around me` },
    ],
  },
  {
    id: 'en-12',
    title: 'Goodness of God',
    artist: 'Bethel Music',
    language: 'en',
    tags: ['worship', 'faithfulness'],
    lyrics: `All my life You have been faithful`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `I love You, Lord\nOh Your mercy never failed me\nAll my days, I've been held in Your hands\nFrom the moment that I wake up\nUntil I lay my head\nI will sing of the goodness of God` },
      { type: 'chorus', label: 'Chorus', lyrics: `All my life You have been faithful\nAll my life You have been so, so good\nWith every breath that I am able\nI will sing of the goodness of God` },
    ],
  },
  {
    id: 'en-13',
    title: 'King of Kings',
    artist: 'Hillsong Worship',
    language: 'en',
    tags: ['worship', 'jesus', 'majesty'],
    lyrics: `Praise the Father, Praise the Son, Praise the Spirit`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `In the darkness we were waiting\nWithout hope, without light\n'Til from heaven You came running\nThere was mercy in Your eyes` },
      { type: 'chorus', label: 'Chorus', lyrics: `Praise the Father, Praise the Son\nPraise the Spirit, Three in One\nGod of glory, Majesty\nPraise forever to the King of Kings` },
    ],
  },
  {
    id: 'en-14',
    title: 'Cornerstone',
    artist: 'Hillsong Worship',
    language: 'en',
    tags: ['worship', 'foundation', 'hymn'],
    lyrics: `Christ alone, cornerstone`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `My hope is built on nothing less\nThan Jesus' blood and righteousness\nI dare not trust the sweetest frame\nBut wholly trust in Jesus' name` },
      { type: 'chorus', label: 'Chorus', lyrics: `Christ alone, cornerstone\nWeak made strong in the Savior's love\nThrough the storm, He is Lord\nLord of all` },
    ],
  },
  {
    id: 'en-15',
    title: 'This Is Amazing Grace',
    artist: 'Phil Wickham',
    language: 'en',
    tags: ['worship', 'grace'],
    lyrics: `This is amazing grace`,
    sections: [
      { type: 'verse', label: 'Verse 1', lyrics: `Who breaks the power of sin and darkness\nWhose love is mighty and so much stronger\nThe King of Glory, the King above all kings` },
      { type: 'chorus', label: 'Chorus', lyrics: `This is amazing grace, this is unfailing love\nThat You would take my place, that You would bear my cross\nYou laid down Your life that I would be set free\nOh Jesus, I sing for all that You've done for me` },
    ],
  },
];

// Spanish worship songs
export const SPANISH_SONGS: Song[] = [
  {
    id: 'es-1',
    title: 'Cuán Grande Es Él',
    artist: 'Tradicional',
    language: 'es',
    tags: ['himno', 'clásico', 'alabanza'],
    lyrics: `Señor, mi Dios, al contemplar los cielos`,
    sections: [
      { type: 'verse', label: 'Verso 1', lyrics: `Señor, mi Dios, al contemplar los cielos\nEl firmamento y las estrellas mil\nAl oír Tu voz en los potentes truenos\nY ver brillar al sol en su cenit` },
      { type: 'chorus', label: 'Coro', lyrics: `Mi corazón entona la canción\nCuán grande es Él, cuán grande es Él\nMi corazón entona la canción\nCuán grande es Él, cuán grande es Él` },
    ],
  },
  {
    id: 'es-2',
    title: 'Al Que Está Sentado En El Trono',
    artist: 'Marcos Witt',
    language: 'es',
    tags: ['adoración', 'alabanza'],
    lyrics: `Al que está sentado en el trono`,
    sections: [
      { type: 'verse', label: 'Verso', lyrics: `Al que está sentado en el trono\nY al Cordero\nSea la alabanza y la honra\nLa gloria y el poder` },
      { type: 'chorus', label: 'Coro', lyrics: `Al que está sentado en el trono\nY al Cordero\nSea la alabanza y la honra\nLa gloria y el poder\nPor los siglos de los siglos` },
    ],
  },
  {
    id: 'es-3',
    title: 'Tu Fidelidad',
    artist: 'Marcos Witt',
    language: 'es',
    tags: ['adoración', 'fidelidad'],
    lyrics: `Tu fidelidad es grande`,
    sections: [
      { type: 'verse', label: 'Verso', lyrics: `Tu fidelidad es grande\nTu fidelidad incomparable es\nNadie como Tú, bendito Dios\nGrande es Tu fidelidad` },
    ],
  },
  {
    id: 'es-4',
    title: 'Dios Manda Lluvia',
    artist: 'Danilo Montero',
    language: 'es',
    tags: ['adoración', 'avivamiento'],
    lyrics: `Dios manda lluvia, manda lluvia aquí`,
    sections: [
      { type: 'chorus', label: 'Coro', lyrics: `Dios manda lluvia, manda lluvia aquí\nSobre este lugar, Señor\nSobre este pueblo, Señor` },
    ],
  },
  {
    id: 'es-5',
    title: 'Eres Mi Respirar',
    artist: 'Michael W. Smith (Español)',
    language: 'es',
    tags: ['adoración', 'intimidad'],
    lyrics: `Eres mi respirar`,
    sections: [
      { type: 'verse', label: 'Verso', lyrics: `Eres mi respirar\nEres mi respirar\nY sin Ti no puedo más` },
      { type: 'chorus', label: 'Coro', lyrics: `Estoy desesperado por Ti\nEstoy perdido sin Ti` },
    ],
  },
  {
    id: 'es-6',
    title: 'Digno Es El Señor',
    artist: 'Danilo Montero',
    language: 'es',
    tags: ['adoración', 'majestuoso'],
    lyrics: `Digno es el Señor`,
    sections: [
      { type: 'chorus', label: 'Coro', lyrics: `Digno, digno, digno es el Señor\nDios todopoderoso\nQue era, que es, y que vendrá\nDigno, digno, digno es el Señor` },
    ],
  },
  {
    id: 'es-7',
    title: 'Abre Mis Ojos Oh Cristo',
    artist: 'Danilo Montero',
    language: 'es',
    tags: ['adoración', 'intimidad'],
    lyrics: `Abre mis ojos, oh Cristo`,
    sections: [
      { type: 'verse', label: 'Verso', lyrics: `Abre mis ojos, oh Cristo\nAbre mis ojos, te pido\nYo quiero verte, yo quiero verte` },
    ],
  },
  {
    id: 'es-8',
    title: 'Grande Y Fuerte',
    artist: 'Miel San Marcos',
    language: 'es',
    tags: ['adoración', 'poder'],
    lyrics: `Grande y fuerte`,
    sections: [
      { type: 'chorus', label: 'Coro', lyrics: `Grande y fuerte, poderoso\nDios de Israel\nCielo y tierra pasan\nPero Tu Palabra permanecerá` },
    ],
  },
  {
    id: 'es-9',
    title: 'Como En El Cielo',
    artist: 'Miel San Marcos',
    language: 'es',
    tags: ['adoración', 'presencia'],
    lyrics: `Como en el cielo, aquí en la tierra`,
    sections: [
      { type: 'chorus', label: 'Coro', lyrics: `Como en el cielo, aquí en la tierra\nManifiesta Tu presencia\nComo en el cielo, aquí en la tierra\nManifiesta Tu poder` },
    ],
  },
  {
    id: 'es-10',
    title: 'Rey De Reyes',
    artist: 'Hillsong en Español',
    language: 'es',
    tags: ['adoración', 'jesús'],
    lyrics: `Alaba al Padre, alaba al Hijo`,
    sections: [
      { type: 'verse', label: 'Verso', lyrics: `En la oscuridad, esperamos\nSin esperanza, sin luz\nDesde el cielo Tú corriste\nHubo gracia en Tu mirar` },
      { type: 'chorus', label: 'Coro', lyrics: `Alaba al Padre, alaba al Hijo\nAlaba al Espíritu, tres en uno\nDios de gloria, majestad\nAlabanza al Rey de Reyes` },
    ],
  },
];

// Japanese worship songs
export const JAPANESE_SONGS: Song[] = [
  {
    id: 'ja-1',
    title: '主の祈り',
    artist: '伝統的',
    language: 'ja',
    tags: ['祈り', '伝統的'],
    lyrics: `天にいます私たちの父よ`,
    sections: [
      { type: 'verse', label: '祈り', lyrics: `天にいます私たちの父よ\n御名があがめられますように\n御国が来ますように\n御心が天で行われるように\n地でも行われますように` },
    ],
  },
  {
    id: 'ja-2',
    title: 'いつくしみ深き',
    artist: '讃美歌',
    language: 'ja',
    tags: ['讃美歌', '友情'],
    lyrics: `いつくしみ深き友なるイエスは`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `いつくしみ深き友なるイエスは\n罪とが憂いを取り去りたもう\n心の嘆きを包まず述べて\n重荷のすべてを委ねまつれ` },
    ],
  },
  {
    id: 'ja-3',
    title: '輝く日を仰ぐとき',
    artist: '讃美歌',
    language: 'ja',
    tags: ['讃美歌', '賛美'],
    lyrics: `輝く日を仰ぐとき`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `輝く日を仰ぐとき\n月星眺むるとき\n雷、いかずち渡る時\n誉れ高き神の御業` },
      { type: 'chorus', label: 'コーラス', lyrics: `我が魂、いざ歌え\n大いなる御神を\n我が魂、いざ歌え\n大いなる御神を` },
    ],
  },
  {
    id: 'ja-4',
    title: '御名をあがめて',
    artist: 'ワーシップ・ジャパン',
    language: 'ja',
    tags: ['礼拝', '賛美'],
    lyrics: `御名をあがめて`,
    sections: [
      { type: 'chorus', label: 'コーラス', lyrics: `御名をあがめて\n御名をあがめて\n主よ、あなたに栄光あれ` },
    ],
  },
  {
    id: 'ja-5',
    title: '主は今生きておられる',
    artist: '日本語ワーシップ',
    language: 'ja',
    tags: ['礼拝', '力強い'],
    lyrics: `主は今生きておられる`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `主は今生きておられる\nこの地の上に立たれる\n世界の王として\n我らの主として` },
    ],
  },
  {
    id: 'ja-6',
    title: '主を仰ぎ見て',
    artist: 'ヒルソング・ジャパン',
    language: 'ja',
    tags: ['礼拝', '信仰'],
    lyrics: `主を仰ぎ見て`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `深い海へと呼ばれる\n未知の場所、足が沈む\n神秘の中で見つける\n深い海で信仰立つ` },
      { type: 'chorus', label: 'コーラス', lyrics: `御名を呼び続ける\n波の上、目を向け\n嵐来ても魂は\nあなたの腕の中で安らぐ` },
    ],
  },
  {
    id: 'ja-7',
    title: '素晴らしい主',
    artist: 'ニューライフ・ワーシップ',
    language: 'ja',
    tags: ['礼拝', '賛美'],
    lyrics: `素晴らしい主`,
    sections: [
      { type: 'chorus', label: 'コーラス', lyrics: `素晴らしい主\n素晴らしい主\nあなたは素晴らしい` },
    ],
  },
  {
    id: 'ja-8',
    title: '主はわが避け所',
    artist: '伝統的',
    language: 'ja',
    tags: ['讃美歌', '信頼'],
    lyrics: `主はわが避け所`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `いと高き方のもとに住む者は\n全能者の影に宿る\n私は主に言おう\n私の避け所、私の砦` },
    ],
  },
  {
    id: 'ja-9',
    title: '栄光から栄光へ',
    artist: 'ワーシップ・ジャパン',
    language: 'ja',
    tags: ['礼拝', '変容'],
    lyrics: `栄光から栄光へ`,
    sections: [
      { type: 'chorus', label: 'コーラス', lyrics: `栄光から栄光へ\n変えられていく\n主のようになっていく\n日々新たに` },
    ],
  },
  {
    id: 'ja-10',
    title: '感謝と賛美',
    artist: 'エターナル・ワーシップ',
    language: 'ja',
    tags: ['礼拝', '感謝'],
    lyrics: `感謝と賛美`,
    sections: [
      { type: 'verse', label: '1番', lyrics: `心からの感謝を捧げます\n主よ、あなたは良いお方\n恵みと憐れみに満ちた方\n永遠に賛美します` },
    ],
  },
];

// All songs combined
export const ALL_SONGS = [...ENGLISH_SONGS, ...SPANISH_SONGS, ...JAPANESE_SONGS];

// Helper functions
export function getSongsByLanguage(language: 'en' | 'es' | 'ja'): Song[] {
  return ALL_SONGS.filter(s => s.language === language);
}

export function searchSongs(query: string): Song[] {
  const q = query.toLowerCase();
  return ALL_SONGS.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.lyrics.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function getSongById(id: string): Song | undefined {
  return ALL_SONGS.find(s => s.id === id);
}
