const News = require('../models/News');

/**
 * Datos de noticias culturales en español, inglés y quechua
 * Contenido relacionado con cultura, tradiciones y patrimonio de Cusco
 */
const newsData = [
  // Noticia 1: Inti Raymi (en los 3 idiomas)
  {
    title: 'Inti Raymi 2025: La Fiesta del Sol vuelve a Sacsayhuamán',
    content: 'La tradicional Fiesta del Sol, Inti Raymi, se celebrará el 24 de junio en la fortaleza de Sacsayhuamán. Esta ceremonia ancestral inca rinde homenaje al dios Sol (Inti) con danzas, música tradicional y recreaciones históricas. Miles de turistas y locales se reúnen cada año para presenciar este magnífico espectáculo cultural que conecta el presente con el pasado glorioso del Tahuantinsuyo.',
    summary: 'El Inti Raymi 2025 celebrará la Fiesta del Sol en Sacsayhuamán el 24 de junio con ceremonias ancestrales incas.',
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    language: 'es',
    category: 'festividad',
    isActive: true,
    publishedAt: new Date('2025-06-15')
  },
  {
    title: 'Inti Raymi 2025: Festival of the Sun Returns to Sacsayhuamán',
    content: 'The traditional Festival of the Sun, Inti Raymi, will be celebrated on June 24th at the Sacsayhuamán fortress. This ancestral Inca ceremony pays tribute to the Sun god (Inti) with traditional dances, music, and historical reenactments. Thousands of tourists and locals gather annually to witness this magnificent cultural spectacle that connects the present with the glorious past of Tahuantinsuyo.',
    summary: 'Inti Raymi 2025 will celebrate the Festival of the Sun at Sacsayhuamán on June 24th with ancestral Inca ceremonies.',
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    language: 'en',
    category: 'festividad',
    isActive: true,
    publishedAt: new Date('2025-06-15')
  },
  {
    title: 'Inti Raymi 2025: Inti Raymi Sacsayhuamanman kutirimun',
    content: 'Inti Raymi, ñawpa pachapi rurasqa, junio killapi 24 punchawpi Sacsayhuaman qhapaq wasipi ruwakamunqa. Kay ñawpa inka raymiwanmi Intita yupaychaniku tususpa, takispa, ñawpa pachamanta willakuykunata ruwaspa. Wakin waranka turista runa hinallataq llaqta runakunapas sapa wata tantarimunku kay sumaq cultural espectáculo qhawanapaq, kunan pacha ñawpa pacha Tahuantinsuyo nisqawan tinkuchinapaq.',
    summary: 'Inti Raymi 2025 Sacsayhuamanpi Inti Raymi raymi junio 24 punchawpi ñawpa inka ceremoniawanmi celebrakamunqa.',
    imageUrl: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800',
    language: 'qu',
    category: 'festividad',
    isActive: true,
    publishedAt: new Date('2025-06-15')
  },

  // Noticia 2: Machu Picchu
  {
    title: 'Machu Picchu implementa nuevas medidas de conservación',
    content: 'El Ministerio de Cultura ha anunciado nuevas políticas para preservar la ciudadela inca de Machu Picchu. Las medidas incluyen límites de visitantes diarios, rutas establecidas y horarios controlados. Estos esfuerzos buscan proteger este Patrimonio de la Humanidad para las futuras generaciones mientras se mantiene accesible para el turismo responsable.',
    summary: 'Machu Picchu implementa nuevas medidas de conservación con límites de visitantes y rutas controladas.',
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    language: 'es',
    category: 'arqueologia',
    isActive: true,
    publishedAt: new Date('2025-05-20')
  },
  {
    title: 'Machu Picchu Implements New Conservation Measures',
    content: 'The Ministry of Culture has announced new policies to preserve the Inca citadel of Machu Picchu. Measures include daily visitor limits, established routes, and controlled schedules. These efforts aim to protect this World Heritage Site for future generations while keeping it accessible for responsible tourism.',
    summary: 'Machu Picchu implements new conservation measures with visitor limits and controlled routes.',
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    language: 'en',
    category: 'arqueologia',
    isActive: true,
    publishedAt: new Date('2025-05-20')
  },
  {
    title: 'Machu Picchu musuq waqaychanapaq ruwaykunata churan',
    content: 'Cultura Ministerioqa willaran musuq kamachiykunata Machu Picchu inka llaqtata waqaychananpaq. Kay ruwaykunapiqa kanku sapa punchaw watukuq runa yupay, ñankunapas kamachisqa, horariopas controlasqa. Kay kallpachakuykunawanmi munakunku kay Patrimonio de la Humanidad nisqata waqaychayta qhipa miraykunapaq, chaywantaq accesible kachkan turismo responsable nisqapaq.',
    summary: 'Machu Picchu musuq conservación nisqa ruwaykunata churan watukuq runa límites nisqawan, ñankuna controladaswan.',
    imageUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
    language: 'qu',
    category: 'arqueologia',
    isActive: true,
    publishedAt: new Date('2025-05-20')
  },

  // Noticia 3: Pachamama
  {
    title: 'Agosto: Mes de la Pachamama y las ofrendas a la Madre Tierra',
    content: 'Durante todo agosto, las comunidades andinas de Cusco realizan ceremonias especiales de agradecimiento a la Pachamama (Madre Tierra). Estas tradiciones ancestrales incluyen ofrendas de coca, chicha y pagos rituales. Es un momento de profunda conexión espiritual entre el pueblo quechua y la naturaleza, reflejando la cosmovisión andina de respeto y reciprocidad.',
    summary: 'En agosto, las comunidades andinas de Cusco realizan ceremonias de agradecimiento a la Pachamama.',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
    language: 'es',
    category: 'tradicion',
    isActive: true,
    publishedAt: new Date('2025-08-01')
  },
  {
    title: 'August: Month of Pachamama and Offerings to Mother Earth',
    content: 'Throughout August, Andean communities in Cusco perform special thanksgiving ceremonies to Pachamama (Mother Earth). These ancestral traditions include offerings of coca, chicha, and ritual payments. It is a time of deep spiritual connection between the Quechua people and nature, reflecting the Andean worldview of respect and reciprocity.',
    summary: 'In August, Andean communities in Cusco perform thanksgiving ceremonies to Pachamama.',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
    language: 'en',
    category: 'tradicion',
    isActive: true,
    publishedAt: new Date('2025-08-01')
  },
  {
    title: 'Agosto killa: Pachamama killa, Mama Allpaman haywakuy',
    content: 'Agosto killapi, Qusqu suyupi ayllu runakunaqa ruranku ceremonias especiales Pachamaman (Mama Allpaman) agradecenankupaq. Kay ñawpa kawsaykunapiqa kanku coca haywakuy, chicha, chaynallataq ritual pagokunapas. Kayqa huk pachacha kanki ukhu espiritualpi tinkuymanta runakuna quechua Pachamawanpas, chaymi rikuchin cosmovisión andina nisqa respeto nisqawan reciprocidad nisqawanpas.',
    summary: 'Agosto killapiqa, Qusqu ayllu runakunaqa Pachamaman agradecimiento ceremoniakunata ruwanku.',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800',
    language: 'qu',
    category: 'tradicion',
    isActive: true,
    publishedAt: new Date('2025-08-01')
  },

  // Noticia 4: Gastronomía
  {
    title: 'Festival Gastronómico Cusqueño celebra sabores ancestrales',
    content: 'El próximo mes se realizará el Festival Gastronómico Cusqueño, destacando platillos tradicionales como el cuy chactado, chiriuchu y kapchi. Chefs locales presentarán versiones contemporáneas de recetas ancestrales, fusionando técnicas modernas con ingredientes andinos autóctonos. Una oportunidad única para explorar la riqueza culinaria de la región.',
    summary: 'Festival Gastronómico Cusqueño celebrará platillos tradicionales con técnicas modernas.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    language: 'es',
    category: 'gastronomia',
    isActive: true,
    publishedAt: new Date('2025-10-10')
  },
  {
    title: 'Cusco Gastronomic Festival Celebrates Ancestral Flavors',
    content: 'Next month, the Cusco Gastronomic Festival will take place, featuring traditional dishes such as cuy chactado, chiriuchu, and kapchi. Local chefs will present contemporary versions of ancestral recipes, blending modern techniques with native Andean ingredients. A unique opportunity to explore the region\'s culinary richness.',
    summary: 'Cusco Gastronomic Festival will celebrate traditional dishes with modern techniques.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    language: 'en',
    category: 'gastronomia',
    isActive: true,
    publishedAt: new Date('2025-10-10')
  },
  {
    title: 'Qusqu Mikhuy Raymi ñawpa mikhuykunata raymichan',
    content: 'Qhipa killapiqa ruwakamunqa Qusqu Mikhuy Raymi, chaywanmi rikuchinqa ñawpa mikhuykunata imaynachus cuy chactado, chiriuchu, kapchipas. Llaqta chef runakunaqa presentanqaku kunan pacha versión nisqakunata ñawpa recetakunamanta, kunan pacha técnicas nisqakunawan andino ingredientes autóctonos nisqakunawan chaqruspa. Huk sapalla oportunidad kay suyupi culinario qhapaq kayninmanta yachanaykipaq.',
    summary: 'Qusqu Mikhuy Raymi ñawpa mikhuykunata kunan pacha técnicaswan raymichanqa.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    language: 'qu',
    category: 'gastronomia',
    isActive: true,
    publishedAt: new Date('2025-10-10')
  },

  // Noticia 5: Textilería
  {
    title: 'Artesanos cusqueños revitalizan técnicas ancestrales de textilería',
    content: 'Un grupo de tejedores tradicionales de comunidades rurales está enseñando a jóvenes las técnicas ancestrales de textilería andina. Utilizando telar de cintura y tintes naturales, preservan conocimientos de más de mil años. Estos textiles cuentan historias mediante símbolos y colores, manteniendo viva la identidad cultural quechua.',
    summary: 'Artesanos cusqueños enseñan técnicas ancestrales de textilería a nuevas generaciones.',
    imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800',
    language: 'es',
    category: 'cultura',
    isActive: true,
    publishedAt: new Date('2025-11-01')
  },
  {
    title: 'Cusco Artisans Revitalize Ancestral Textile Techniques',
    content: 'A group of traditional weavers from rural communities is teaching young people ancestral Andean textile techniques. Using backstrap looms and natural dyes, they preserve knowledge spanning over a thousand years. These textiles tell stories through symbols and colors, keeping Quechua cultural identity alive.',
    summary: 'Cusco artisans teach ancestral textile techniques to new generations.',
    imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800',
    language: 'en',
    category: 'cultura',
    isActive: true,
    publishedAt: new Date('2025-11-01')
  },
  {
    title: 'Qusqu ruwaqkunaqa ñawpa away yachayniyuqta musuqmanta kawsachinku',
    content: 'Huk ayllu away ruwaq runakunaqa yachachinku wayna sipaskunaman ñawpa away yachaykunata andino nisqamanta. Away telar de cintura nisqawan, tintes naturales nisqawan ima, waqaychanku yachaykunata aswan waranqa watayuq. Kay awasqakunaqa willakunku willakuykunata símbolos nisqawan colorkunawanpas, chaywanmi kawsaypi waqaychakun identidad cultural quechua nisqa.',
    summary: 'Qusqu ruwaqkunaqa ñawpa away yachaykunata musuq miraykunaman yachachinku.',
    imageUrl: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800',
    language: 'qu',
    category: 'cultura',
    isActive: true,
    publishedAt: new Date('2025-11-01')
  }
];

/**
 * Función para poblar la base de datos con noticias culturales
 */
const seedNews = async () => {
  try {
    console.log('🌱 Iniciando seed de noticias culturales...');

    // Limpiar noticias existentes (opcional)
    await News.deleteMany({});
    console.log('🗑️  Noticias anteriores eliminadas.');

    // Insertar nuevas noticias
    const news = await News.insertMany(newsData);
    console.log(`✅ ${news.length} noticias insertadas correctamente.`);

    return {
      success: true,
      count: news.length,
      news: news
    };
  } catch (error) {
    console.error('❌ Error en seed de noticias:', error);
    throw error;
  }
};

module.exports = { seedNews, newsData };
