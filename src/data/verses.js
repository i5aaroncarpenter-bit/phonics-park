/**
 * The Scrolls — the verse library.
 *
 * Two public-domain translations ship with the game:
 *   web — World English Bible (modern English). The WEB renders the divine
 *         name as "Yahweh"; because most families read "the LORD", that is
 *         what we show here. Parents can edit any verse in the Captain's Tent.
 *   kjv — King James Version.
 *
 * Scrolls are ordered from short starter verses to long, epic passages.
 */

const S = (id, name, subtitle, icon, verses) => ({ id, name, subtitle, icon, verses });
const V = (id, ref, web, kjv) => ({ id, ref, web, kjv });

export const SCROLLS = [
  S("sling", "The Shepherd's Sling", "Short verses to start your training", "🪨", [
    V("1th5_17", "1 Thessalonians 5:17", "Pray without ceasing.", "Pray without ceasing."),
    V("1jn4_19", "1 John 4:19", "We love him, because he first loved us.", "We love him, because he first loved us."),
    V("ps23_1", "Psalm 23:1", "The LORD is my shepherd; I shall lack nothing.", "The LORD is my shepherd; I shall not want."),
    V("ps56_3", "Psalm 56:3", "When I am afraid, I will put my trust in you.", "What time I am afraid, I will trust in thee."),
    V("ps119_105", "Psalm 119:105", "Your word is a lamp to my feet, and a light for my path.", "Thy word is a lamp unto my feet, and a light unto my path."),
    V("php4_13", "Philippians 4:13", "I can do all things through Christ who strengthens me.", "I can do all things through Christ which strengtheneth me."),
    V("ps46_1", "Psalm 46:1", "God is our refuge and strength, a very present help in trouble.", "God is our refuge and strength, a very present help in trouble."),
    V("ps118_24", "Psalm 118:24", "This is the day that the LORD has made. We will rejoice and be glad in it.", "This is the day which the LORD hath made; we will rejoice and be glad in it."),
    V("ps136_1", "Psalm 136:1", "Give thanks to the LORD, for he is good, for his loving kindness endures forever.", "O give thanks unto the LORD; for he is good: for his mercy endureth for ever."),
  ]),

  S("courage", "Courage of the Mighty", "Verses for brave hearts", "🦁", [
    V("1co16_13", "1 Corinthians 16:13", "Watch! Stand firm in the faith! Be courageous! Be strong!", "Watch ye, stand fast in the faith, quit you like men, be strong."),
    V("ps27_1", "Psalm 27:1", "The LORD is my light and my salvation. Whom shall I fear? The LORD is the strength of my life. Of whom shall I be afraid?", "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?"),
    V("2ti1_7", "2 Timothy 1:7", "For God didn't give us a spirit of fear, but of power, love, and self-control.", "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind."),
    V("ps144_1", "Psalm 144:1", "Blessed be the LORD, my rock, who trains my hands to war, and my fingers to battle.", "Blessed be the LORD my strength, which teacheth my hands to war, and my fingers to fight."),
    V("jos1_9", "Joshua 1:9", "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for the LORD your God is with you wherever you go.", "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest."),
    V("deu31_6", "Deuteronomy 31:6", "Be strong and courageous. Don't be afraid or scared of them, for the LORD your God himself is who goes with you. He will not fail you nor forsake you.", "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee."),
    V("1sa17_47", "1 Samuel 17:47", "And that all this assembly may know that the LORD doesn't save with sword and spear; for the battle is the LORD's, and he will give you into our hand.", "And all this assembly shall know that the LORD saveth not with sword and spear: for the battle is the LORD's, and he will give you into our hands."),
    V("isa41_10", "Isaiah 41:10", "Don't you be afraid, for I am with you. Don't be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness.", "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness."),
    V("ps18_2", "Psalm 18:2", "The LORD is my rock, my fortress, and my deliverer; my God, my rock, in whom I take refuge; my shield, and the horn of my salvation, my high tower.", "The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust; my buckler, and the horn of my salvation, and my high tower."),
  ]),

  S("truth", "The Belt of Truth", "God's word is true", "🪢", [
    V("jhn17_17", "John 17:17", "Sanctify them in your truth. Your word is truth.", "Sanctify them through thy truth: thy word is truth."),
    V("jhn8_32", "John 8:32", "You will know the truth, and the truth will make you free.", "And ye shall know the truth, and the truth shall make you free."),
    V("pro30_5", "Proverbs 30:5", "Every word of God is flawless. He is a shield to those who take refuge in him.", "Every word of God is pure: he is a shield unto them that put their trust in him."),
    V("ps119_160", "Psalm 119:160", "All of your words are truth. Every one of your righteous ordinances endures forever.", "Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever."),
    V("pro12_22", "Proverbs 12:22", "Lying lips are an abomination to the LORD, but those who do the truth are his delight.", "Lying lips are abomination to the LORD: but they that deal truly are his delight."),
    V("jhn14_6", "John 14:6", "Jesus said to him, \"I am the way, the truth, and the life. No one comes to the Father, except through me.\"", "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me."),
    V("ps25_5", "Psalm 25:5", "Guide me in your truth, and teach me, for you are the God of my salvation. I wait for you all day long.", "Lead me in thy truth, and teach me: for thou art the God of my salvation; on thee do I wait all the day."),
    V("eph4_25", "Ephesians 4:25", "Therefore, putting away falsehood, speak truth each one with his neighbor. For we are members of one another.", "Wherefore putting away lying, speak every man truth with his neighbour: for we are members one of another."),
  ]),

  S("righteous", "The Breastplate of Righteousness", "A clean heart guards you", "🛡️", [
    V("rom3_23", "Romans 3:23", "For all have sinned, and fall short of the glory of God.", "For all have sinned, and come short of the glory of God."),
    V("ps51_10", "Psalm 51:10", "Create in me a clean heart, O God. Renew a right spirit within me.", "Create in me a clean heart, O God; and renew a right spirit within me."),
    V("mat5_6", "Matthew 5:6", "Blessed are those who hunger and thirst for righteousness, for they shall be filled.", "Blessed are they which do hunger and thirst after righteousness: for they shall be filled."),
    V("pro21_21", "Proverbs 21:21", "He who follows after righteousness and kindness finds life, righteousness, and honor.", "He that followeth after righteousness and mercy findeth life, righteousness, and honour."),
    V("1jn1_9", "1 John 1:9", "If we confess our sins, he is faithful and righteous to forgive us the sins and to cleanse us from all unrighteousness.", "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness."),
    V("mat6_33", "Matthew 6:33", "But seek first God's Kingdom and his righteousness; and all these things will be given to you as well.", "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you."),
    V("mic6_8", "Micah 6:8", "He has shown you, O man, what is good. What does the LORD require of you, but to act justly, to love mercy, and to walk humbly with your God?", "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?"),
    V("2co5_21", "2 Corinthians 5:21", "For him who knew no sin he made to be sin on our behalf, so that in him we might become the righteousness of God.", "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him."),
  ]),

  S("peace", "The Shoes of Peace", "Ready feet, a quiet heart", "🥾", [
    V("ps34_14", "Psalm 34:14", "Depart from evil, and do good. Seek peace, and pursue it.", "Depart from evil, and do good; seek peace, and pursue it."),
    V("mat5_9", "Matthew 5:9", "Blessed are the peacemakers, for they shall be called children of God.", "Blessed are the peacemakers: for they shall be called the children of God."),
    V("rom12_18", "Romans 12:18", "If it is possible, as much as it is up to you, be at peace with all men.", "If it be possible, as much as lieth in you, live peaceably with all men."),
    V("isa26_3", "Isaiah 26:3", "You will keep whoever's mind is steadfast in perfect peace, because he trusts in you.", "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee."),
    V("col3_15", "Colossians 3:15", "And let the peace of God rule in your hearts, to which also you were called in one body, and be thankful.", "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful."),
    V("php4_6", "Philippians 4:6", "In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God.", "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God."),
    V("php4_7", "Philippians 4:7", "And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.", "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus."),
    V("jhn14_27", "John 14:27", "Peace I leave with you. My peace I give to you; not as the world gives, I give to you. Don't let your heart be troubled, neither let it be fearful.", "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid."),
  ]),

  S("faith", "The Shield of Faith", "Trust that blocks every fiery dart", "🔥", [
    V("2co5_7", "2 Corinthians 5:7", "For we walk by faith, not by sight.", "For we walk by faith, not by sight."),
    V("rom10_17", "Romans 10:17", "So faith comes by hearing, and hearing by the word of God.", "So then faith cometh by hearing, and hearing by the word of God."),
    V("pro3_5", "Proverbs 3:5", "Trust in the LORD with all your heart, and don't lean on your own understanding.", "Trust in the LORD with all thine heart; and lean not unto thine own understanding."),
    V("pro3_6", "Proverbs 3:6", "In all your ways acknowledge him, and he will make your paths straight.", "In all thy ways acknowledge him, and he shall direct thy paths."),
    V("heb11_1", "Hebrews 11:1", "Now faith is assurance of things hoped for, proof of things not seen.", "Now faith is the substance of things hoped for, the evidence of things not seen."),
    V("mrk9_23", "Mark 9:23", "Jesus said to him, \"If you can believe, all things are possible to him who believes.\"", "Jesus said unto him, If thou canst believe, all things are possible to him that believeth."),
    V("ps9_10", "Psalm 9:10", "Those who know your name will put their trust in you, for you, LORD, have not forsaken those who seek you.", "And they that know thy name will put their trust in thee: for thou, LORD, hast not forsaken them that seek thee."),
    V("eph6_16", "Ephesians 6:16", "Above all, taking up the shield of faith, with which you will be able to quench all the fiery darts of the evil one.", "Above all, taking the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked."),
    V("heb11_6", "Hebrews 11:6", "Without faith it is impossible to be well pleasing to him, for he who comes to God must believe that he exists, and that he is a rewarder of those who seek him.", "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him."),
  ]),

  S("salvation", "The Helmet of Salvation", "The good news that guards your mind", "⛑️", [
    V("rom6_23", "Romans 6:23", "For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.", "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord."),
    V("eph2_8", "Ephesians 2:8", "For by grace you have been saved through faith, and that not of yourselves; it is the gift of God.", "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God."),
    V("rom5_8", "Romans 5:8", "But God commends his own love toward us, in that while we were yet sinners, Christ died for us.", "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us."),
    V("act16_31", "Acts 16:31", "They said, \"Believe in the Lord Jesus Christ, and you will be saved, you and your household.\"", "And they said, Believe on the Lord Jesus Christ, and thou shalt be saved, and thy house."),
    V("jhn3_16", "John 3:16", "For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.", "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."),
    V("jhn1_12", "John 1:12", "But as many as received him, to them he gave the right to become God's children, to those who believe in his name.", "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name."),
    V("act4_12", "Acts 4:12", "There is salvation in no one else, for there is no other name under heaven that is given among men, by which we must be saved!", "Neither is there salvation in any other: for there is none other name under heaven given among men, whereby we must be saved."),
    V("rom10_9", "Romans 10:9", "That if you will confess with your mouth that Jesus is Lord, and believe in your heart that God raised him from the dead, you will be saved.", "That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved."),
    V("jhn11_25", "John 11:25", "Jesus said to her, \"I am the resurrection and the life. He who believes in me will still live, even if he dies.\"", "Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live."),
  ]),

  S("sword", "The Sword of the Spirit", "The word of God is your blade", "⚔️", [
    V("ps119_11", "Psalm 119:11", "I have hidden your word in my heart, that I might not sin against you.", "Thy word have I hid in mine heart, that I might not sin against thee."),
    V("mat24_35", "Matthew 24:35", "Heaven and earth will pass away, but my words will not pass away.", "Heaven and earth shall pass away, but my words shall not pass away."),
    V("isa40_8", "Isaiah 40:8", "The grass withers, the flower fades; but the word of our God stands forever.", "The grass withereth, the flower fadeth: but the word of our God shall stand for ever."),
    V("eph6_17", "Ephesians 6:17", "And take the helmet of salvation, and the sword of the Spirit, which is the word of God.", "And take the helmet of salvation, and the sword of the Spirit, which is the word of God."),
    V("ps119_9", "Psalm 119:9", "How can a young man keep his way pure? By living according to your word.", "Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word."),
    V("2ti3_16", "2 Timothy 3:16", "Every Scripture is God-breathed and profitable for teaching, for reproof, for correction, and for instruction in righteousness.", "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness."),
    V("mat4_4", "Matthew 4:4", "But he answered, \"It is written, 'Man shall not live by bread alone, but by every word that proceeds out of God's mouth.'\"", "But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."),
    V("heb4_12", "Hebrews 4:12", "For the word of God is living and active, and sharper than any two-edged sword, piercing even to the dividing of soul and spirit, of both joints and marrow, and is able to discern the thoughts and intentions of the heart.", "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart."),
    V("jos1_8", "Joshua 1:8", "This book of the law shall not depart from your mouth, but you shall meditate on it day and night, that you may observe to do according to all that is written in it; for then you shall make your way prosperous, and then you shall have good success.", "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success."),
  ]),

  S("loyal", "Loyal to the King", "Love and obedience", "👑", [
    V("jhn14_15", "John 14:15", "If you love me, keep my commandments.", "If ye love me, keep my commandments."),
    V("eph6_1", "Ephesians 6:1", "Children, obey your parents in the Lord, for this is right.", "Children, obey your parents in the Lord: for this is right."),
    V("pro17_17", "Proverbs 17:17", "A friend loves at all times; and a brother is born for adversity.", "A friend loveth at all times, and a brother is born for adversity."),
    V("col3_23", "Colossians 3:23", "And whatever you do, work heartily, as for the Lord and not for men.", "And whatsoever ye do, do it heartily, as to the Lord, and not unto men."),
    V("deu6_5", "Deuteronomy 6:5", "You shall love the LORD your God with all your heart, with all your soul, and with all your might.", "And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might."),
    V("1co13_4", "1 Corinthians 13:4", "Love is patient and is kind. Love doesn't envy. Love doesn't brag, is not proud.", "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up."),
    V("jhn13_34", "John 13:34", "A new commandment I give to you, that you love one another. Just as I have loved you, you also love one another.", "A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another."),
    V("eph4_32", "Ephesians 4:32", "And be kind to one another, tender hearted, forgiving each other, just as God also in Christ forgave you.", "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you."),
    V("rom12_10", "Romans 12:10", "In love of the brothers be tenderly affectionate to one another; in honor preferring one another.", "Be kindly affectioned one to another with brotherly love; in honour preferring one another."),
  ]),

  S("wisdom", "Wisdom of Solomon", "Proverbs for sharp minds", "🦉", [
    V("pro15_1", "Proverbs 15:1", "A gentle answer turns away wrath, but a harsh word stirs up anger.", "A soft answer turneth away wrath: but grievous words stir up anger."),
    V("pro27_17", "Proverbs 27:17", "Iron sharpens iron; so a man sharpens his friend's countenance.", "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend."),
    V("pro16_9", "Proverbs 16:9", "A man's heart plans his course, but the LORD directs his steps.", "A man's heart deviseth his way: but the LORD directeth his steps."),
    V("pro18_10", "Proverbs 18:10", "The LORD's name is a strong tower; the righteous run to him, and are safe.", "The name of the LORD is a strong tower: the righteous runneth into it, and is safe."),
    V("pro4_23", "Proverbs 4:23", "Keep your heart with all diligence, for out of it is the wellspring of life.", "Keep thy heart with all diligence; for out of it are the issues of life."),
    V("pro1_7", "Proverbs 1:7", "The fear of the LORD is the beginning of knowledge, but the foolish despise wisdom and instruction.", "The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction."),
    V("pro22_6", "Proverbs 22:6", "Train up a child in the way he should go, and when he is old he will not depart from it.", "Train up a child in the way he should go: and when he is old, he will not depart from it."),
    V("jas1_19", "James 1:19", "So, then, my beloved brothers, let every man be swift to hear, slow to speak, and slow to anger.", "Wherefore, my beloved brethren, let every man be swift to hear, slow to speak, slow to wrath."),
    V("jas1_5", "James 1:5", "But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.", "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him."),
  ]),

  S("psalms", "Songs of David", "The shepherd king's own songs", "🎵", [
    V("ps34_8", "Psalm 34:8", "Oh taste and see that the LORD is good. Blessed is the man who takes refuge in him.", "O taste and see that the LORD is good: blessed is the man that trusteth in him."),
    V("ps37_4", "Psalm 37:4", "Also delight yourself in the LORD, and he will give you the desires of your heart.", "Delight thyself also in the LORD; and he shall give thee the desires of thine heart."),
    V("ps23_2", "Psalm 23:2", "He makes me lie down in green pastures. He leads me beside still waters.", "He maketh me to lie down in green pastures: he leadeth me beside the still waters."),
    V("ps23_3", "Psalm 23:3", "He restores my soul. He guides me in the paths of righteousness for his name's sake.", "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake."),
    V("ps23_4", "Psalm 23:4", "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.", "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me."),
    V("ps23_5", "Psalm 23:5", "You prepare a table before me in the presence of my enemies. You anoint my head with oil. My cup runs over.", "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over."),
    V("ps23_6", "Psalm 23:6", "Surely goodness and loving kindness shall follow me all the days of my life, and I will dwell in the LORD's house forever.", "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever."),
    V("ps121_1", "Psalm 121:1-2", "I will lift up my eyes to the hills. Where does my help come from? My help comes from the LORD, who made heaven and earth.", "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth."),
    V("ps139_14", "Psalm 139:14", "I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful. My soul knows that very well.", "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well."),
    V("ps19_14", "Psalm 19:14", "Let the words of my mouth and the meditation of my heart be acceptable in your sight, LORD, my rock, and my redeemer.", "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer."),
  ]),

  S("armor", "The Whole Armor of God", "Epic passages for true mighty men", "🏆", [
    V("eph6_10", "Ephesians 6:10", "Finally, be strong in the Lord and in the strength of his might.", "Finally, my brethren, be strong in the Lord, and in the power of his might."),
    V("eph6_11", "Ephesians 6:11", "Put on the whole armor of God, that you may be able to stand against the wiles of the devil.", "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil."),
    V("eph6_13", "Ephesians 6:13", "Therefore put on the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand.", "Wherefore take unto you the whole armour of God, that ye may be able to withstand in the evil day, and having done all, to stand."),
    V("eph6_14", "Ephesians 6:14", "Stand therefore, having the utility belt of truth buckled around your waist, and having put on the breastplate of righteousness.", "Stand therefore, having your loins girt about with truth, and having on the breastplate of righteousness."),
    V("eph6_15", "Ephesians 6:15", "And having fitted your feet with the preparation of the Good News of peace.", "And your feet shod with the preparation of the gospel of peace."),
    V("rom8_28", "Romans 8:28", "We know that all things work together for good for those who love God, for those who are called according to his purpose.", "And we know that all things work together for good to them that love God, to them who are the called according to his purpose."),
    V("eph6_12", "Ephesians 6:12", "For our wrestling is not against flesh and blood, but against the principalities, against the powers, against the world's rulers of the darkness of this age, and against the spiritual forces of wickedness in the heavenly places.", "For we wrestle not against flesh and blood, but against principalities, against powers, against the rulers of the darkness of this world, against spiritual wickedness in high places."),
    V("rom8_38", "Romans 8:38-39", "For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers, nor height, nor depth, nor any other created thing will be able to separate us from God's love which is in Christ Jesus our Lord.", "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord."),
    V("mat28_19", "Matthew 28:19-20", "Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all things that I commanded you. Behold, I am with you always, even to the end of the age.", "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world."),
  ]),
];

export const TRANSLATIONS = {
  web: { id: "web", name: "WEB", long: "World English Bible (modern English, public domain)" },
  kjv: { id: "kjv", name: "KJV", long: "King James Version" },
};

export const CUSTOM_SCROLL_ID = "custom";

const byId = new Map();
for (const s of SCROLLS) for (const v of s.verses) byId.set(v.id, { ...v, scroll: s.id });

/** All built-in verses, flat, each with its scroll id. */
export const VERSES = [...byId.values()];

export function getVerse(id, settings) {
  if (byId.has(id)) return byId.get(id);
  const c = (settings?.customVerses || []).find((v) => v.id === id);
  return c ? { ...c, scroll: CUSTOM_SCROLL_ID, custom: true } : null;
}

/** The text a family actually sees: override > chosen translation > any text. */
export function verseText(verse, settings) {
  if (!verse) return "";
  const ov = settings?.overrides?.[verse.id];
  if (ov) return ov;
  if (verse.custom) return verse.text || "";
  const t = settings?.translation || "web";
  return verse[t] || verse.web || verse.kjv || "";
}

/** Scrolls including the family's custom scroll (if any verses were added). */
export function allScrolls(settings) {
  const list = SCROLLS.map((s) => ({ ...s, verses: s.verses.map((v) => byId.get(v.id)) }));
  const custom = settings?.customVerses || [];
  if (custom.length) {
    list.push({
      id: CUSTOM_SCROLL_ID,
      name: "Our Family's Scroll",
      subtitle: "Verses added by your Captain",
      icon: "📜",
      verses: custom.map((v) => ({ ...v, scroll: CUSTOM_SCROLL_ID, custom: true })),
    });
  }
  return list;
}

export function allVerses(settings) {
  return allScrolls(settings).flatMap((s) => s.verses);
}

/* ---------- Text helpers shared by every mini-game ---------- */

export function tokenize(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

export function normalizeWord(w) {
  return String(w || "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9']/g, "");
}

export function sameWord(a, b) {
  return normalizeWord(a) === normalizeWord(b);
}

/**
 * Group words into short phrases (2-4 words) for long verses so young
 * players sort chunks rather than 40 individual words. Breaks prefer
 * punctuation boundaries.
 */
export function chunkWords(words, target = 3) {
  if (words.length <= 8) return words.map((w) => [w]);
  const chunks = [];
  let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const endsClause = /[.,;:!?"”’']$/.test(words[i]);
    const remaining = words.length - i - 1;
    if ((cur.length >= target && (endsClause || cur.length >= target + 1)) || remaining === 0) {
      chunks.push(cur);
      cur = [];
    } else if (endsClause && cur.length >= 2 && remaining > 1) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    if (chunks.length && cur.length === 1) chunks[chunks.length - 1].push(...cur);
    else chunks.push(cur);
  }
  return chunks;
}

const SMALL = new Set(["a", "an", "the", "and", "of", "to", "in", "is", "for", "be", "on", "or", "it", "i", "my", "me", "you", "your", "he", "his", "him", "thy", "thee", "thou", "ye", "unto", "that", "with", "but", "not", "all", "as", "so", "do", "by", "at", "o"]);

/** Content words are the ones worth quizzing on. */
export function isContentWord(w) {
  const n = normalizeWord(w);
  return n.length > 2 && !SMALL.has(n);
}

export function referenceParts(ref) {
  const m = String(ref).match(/^(.*?)\s+(\d+):(\S+)$/);
  if (!m) return { book: ref, chapter: "", verse: "" };
  return { book: m[1], chapter: m[2], verse: m[3] };
}
