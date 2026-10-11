/* Voltouna Platform — multilingual shell (ar-TN / fr / en), framework-free.
   Compile via:
     npx esbuild src/lib/i18n.ts --format=esm --outfile=public/vendor/i18n.js

   Pairs with data-i18ndom attributes:
     <p data-i18n="menu.metric : tmètres" />   → t('menu.metric')
     <p data-i18n="menu.metric : tmètres : fr" />  fallback
     <meta data-i18n-attr="title" data-i18n="meta.title" />  set title attr
   Direction auto-switched: ar-TN → rtl, others → ltr. */


/* ---------- locales ---------- */

const LANGS = {
  'ar-TN': {  /* Tunisian darija, Arabic script. Default locale. */
    name: 'العربية التونسية',
    dir: 'rtl',      plur: (n: number) => n === 1 ? '1' : '2',
    strings: {
      /* Navigation / brand */
      'nav.menu':      'قائمة المنصة',
      'nav.community': 'المجتمع',
      'nav.components': 'المكونات',
      'nav.about':      'عن Wattouna',
      'nav.login':      'تسجيل الدخول',
      'nav.signup':     'احتساب حساب',
      'nav.becomeMaker': 'صانع مختبر؟',
      'nav.settings':   'الإعدادات',
      'nav.volunteer':  'تطوّع',
      'brand.title':    'واطنا — طاقة إعادة التدوير',
      'meta.title':     'منصة Wattouna — طاقة شمسية ومناطق DIY',
      'meta.desc':      'منصة مفتوحة المصدر للطاقة الشمسية DIY وإعادة تدوير البطاريات. مشروع PBX-36: مولد شمسي 36 فولت؟',
      'brand.tagline':  'طاقة إعادة التدوير، شمال الطريقة.',

      /* Workbench */
      'wb.title':      'المختبر — لوحة دوائر الصانعين',
      'wb.kicker':     'مختبر الصانعين — Maker Canvas',
      'wb.headline':    'ركّب دائرتك بالسحب والتوصيل',
      'wb.help':       'انقر طرفًا (يلمع) ثم الطرف الثاني لرسم سلك • نقرة مزدوجة/زر أيمن لحذف سلك • اسحب الكون من رأسها • ▶️ ابدأ المحاكاة ثم انقر الأزرار • ▶️冯 أنواع الدارة • يعمل باللمس 📱',
      'wb.toolbar_name': 'اسم المشروع',
      'wb.toolbar_color': 'لون السلك',
      'wb.color.red':  'أحمر (+)',
      'wb.color.black': 'أسود (GND)',
      'wb.color.orange': 'برتقالي (تماس)',
      'wb.color.blue':  'أزرق (+12V)',
      'wb.color.green': 'أخضر (منطق)',
      'wb.btn_simulation': 'بدء المحاكاة',
      'wb.btn_stop':      'إيقاف',
      'wb.btn_validate':  'فحص التوصيل',
      'wb.btn_save':      'حفظ المشروع',
      'wb.btn_share':     'مشاركة',
      'wb.btn_clear':     'مسح',
      'wb.btn_layout':    'ترتيب تلقائي هرمي',
      'wb.btn_zoom':      'ملاءمة العرض',
      'wb.btn_add_part':  'إضافة',
      'wb.palette_label': 'إضافة مكون',
      'wb.help_mid':      '🧠 ترتيب ذكي (ترتيب هرمي تلقائي)',
      'wb.help_line1':    '🖱️ انقر طرفًا (يلمع) ثم الطرف الثاني لرسم سلك',
      'wb.help_line2':    'نقرة مزدوجة / زر يمين على سلك لحذفه',
      'wb.help_line3':    'اسحب الكون من رأسها',
      'wb.help_line4':    '▶️ ابدأ المحاكاة ثم انقر الأزرار للتبديل',
      'wb.help_line5':    'اسحب الخلفية للتحريك، العجلة/القرص للتقريب',
      'wb.help_line6':    '⟳ لتدوير المكون',
      'wb.help_line7':    'يعمل باللمس 📱',
      'wb.col_wire_red':   '🔴 أحمر (+)',
      'wb.col_wire_black': '⚫ أسود (GND)',
      'wb.col_wire_orange':'🟠 برتقالي (تماس)',
      'wb.col_wire_blue':  '🔵 أزرق (+12V)',
      'wb.col_wire_green': '🟢 أخضر (منطق)',
      'wb.col_wire_color_label': 'لون السلك',
      'wb.sim_state_off': 'متوقف',
      'wb.sim_state_on':  'المحاكاة تعمل — انقر الأزرار!',
      'wb.tier_eco':    'وضع اقتصادي',
      'wb.tier_high':   'أداء عالٍ (60fps)',
      'wb.short_alert':  'ماس كهربائي أثناء المحاكاة! توقفت المحاكاة للحماية — افصل التماس بين (+) و GND ثم أعد التشغيل.',
      'wb.valid_ok':    'لا ماس مكتشف',
      'wb.valid_short': 'ماس كهربائي! قطب (+) متصل مباشرة بـ GND',
      'wb.valid_float': 'عناصر ليس لها سلك',
      'wb.save_local':  'حُفظ محليًا',
      'wb.save_cloud':  'حُفظ في السحابة! +336Wh 🌱',
      'wb.save_msg':    'جارٍ الحفظ…',
      'wb.save_no_parts': 'أضف مكونًا أولًا!',
      'wb.share_copied': 'نُسخ رابط المشاركة!',
      'wb.share_need_save': 'احفظ المشروع أولًا لمشاركته!',
      'wb.clear_title': 'مسح اللوحة بالكامل؟',
      'wb.load_fail':   'تعذر تحميل المشروع — تحقق من الرابط',
      'wb.remix_box':   '🍴 تصميم للصانع — عدّل بحرية ثم احفظ لينُشر كنسخة (Remix) باسمك.',
      'wb.demo_label':  'PBX-36 starter',
      'wb.cloud_off':   'ورشة دون اتصال',
      'wb.cloud_local': 'وضع محلي',
      'wb.cloud_cloud': 'السحابة مفعّلة',

      /* Voice AI */
      'vai.craft_title': 'مساعد المختبر الرقمي',
      'vai.craft_sub':   'قم بأوروبقاقة دوائرك بالميكروفون ثم على زر',
      'vai.status_ready': '● جاهز — قل «أضف بطارية»',
      'vai.status_listen': '🎤 Listening —',
      'vai.status_read':   '📖 Reading Canvas —',
      'vai.mic_title':  'تحدث',
      'vai.brain_title': 'تحميل العقل المحلي (مرة واحدة) ⬇️',
      'vai.prompt_pdf': 'مخطط PDF',
      'vai.form_hint':  'اكتب أو تحدث: أضف MPPT…',
      'vai.fab_hint':   'مساعد المختبر 🎧',
      'vai.fab_aria':   'المساعد الصوتي',
      'vai.save_keys':  '💾 حفظ المفاتيح',
      'vai.keys_saved': '✅ حُفظت محليًا!',
      'vai.collect_title': 'جمع الجهاز',
      'vai.collect_sub':  'USB + GitHub: استكشاف الأجهزة ومشاركة مشروعك',
      'vai.publish_log':  'تسجيل النشر',

      /* Device sync */
      'ds.title':      'المصنع والتصميم',
      'ds.sub':        'US7 + GitHub: شحن الأجهزة على الأجهزة RSIS',
      'ds.flash_title': 'وشبك كود على ESP32',
      'ds.flash_sub':  'USB + GitHub: تشخيص الأجهزة ومشاركة مشروعك',
      'ds.flash_btn':  '🔥 حرق الكود (Flash to Device)',
      'ds.gh_btn':     '🐙 نشر على GitHub',
      'ds.status_local': 'USB + GitHub جاهزان من المتصفح',

      /* Creator studio */
      'cs.title':      'استوديو الخلق',
      'cs.sub':        'Ghost publications, YouTube videos, GitHub',
      'cs.blog':       'تدوينة — يوم',
      'cs.video':      'سيدة يكتب',
      'cs.keys':       'مفاتيح',
      'cs.keys_save':  '💾 حفظ المفاتيح',
      'cs.keys_saved': '✅ مفاتيح المحفوظة!',

      /* Swarm */
      'sw.title':      'المجتمع',
      'sw.sub':        'مشاريع الصانعين، أدوات، أفكار',
      'sw.empty':      'المجتمع يبدأ قريباً — جرب تركيبً وشاركها!',
      'sw.search':     'ابحث',
      'sw.loading':    'تحميل…',
      'sw.show_more':  'أظهر المزيد',
      'sw.show_less':  'أقل',

      /* Profile */
      'pr.title':      '.profile',
      'pr.sub':        'activities your Wattouna',
      'pr.empty':      '.empty',
      'pr.logout':     'تسجيل الخروج',
      'pr.avatar':     'الصورة',
      'pr.name':       'الاسم',

      /* Footer */
      'ft.brand':      'واطنا energía de Segunda vida, al norte.',
      'ft.nav_projects': 'المشاريع',
      'ft.nav_docs':     'الوثائق',
      'ft.nav_commit':   'الاشتراك في الثقة open-source',
      'ft.built_with':  'مُنشئ بمساعدة',
      'ft.contribute':   'ساهم',
      'ft.community':    'المجتمع',
      'ft.platform':     'offer platform',
      'ft.admin':        '⛔ لوحة أدوات',

      /* Common */
      'common.more':   'المزيد',
      'common.less':   'أقل',
      'common.close':  'إغلاق',
      'common.back':   'عودة',
      'common.muted':  'مكتوب',
      'common.link':   'رابط',
      'common.copy':   'نسخ',
      'common.copied': 'تم النسخ',
      'common.open_in_new_tab': 'فتح في التبويبة الجديدة',
    },
  },

  'fr': {
    name: 'Français',
    dir: 'ltr',
    strings: {
      'nav.menu':      'Menu',
      'nav.community': 'Communauté',
      'nav.components': 'Composants',
      'nav.about':      'À propos',
      'nav.login':      'Connexion',
      'nav.signup':     'S\'inscrire',
      'nav.becomeMaker': 'Fabriquer un labo?',
      'nav.settings':   'Paramètres',
      'nav.volunteer':  'Rejoindre',
      'brand.title':    'Wattouna — Énergie de récupération',
      'meta.title':     'Plateforme Wattouna — Énergie solaire et bricolage DIY',
      'meta.desc':      'Plateforme open source pour l\'énergie solaire DIY et la récupération de batteries. Projet PBX-36 : générateur solaire 36V à zéro décharge.',
      'brand.tagline':  'Énergie de récupération, au nord.',

      'wb.title':      "Laboratoire — Planche de circuits des bricoleurs",
      'wb.kicker':     "Laboratoire des bricoleurs — Maker Canvas",
      'wb.headline':    'Assemblez votre circuit par glisser-déposer',
      'wb.help':       'Cliquez sur une borne (clignote) puis sur la seconde pour tracer un fil. Double-clic/droit pour supprimer un fil. Glissez les composants par leur tête. ▶️ Lancez la simulation pour interagir. ⟳ pour tourner. Fonctionne au tactile 📱',
      'wb.toolbar_name': 'Nom du projet',
      'wb.toolbar_color': 'Couleur du fil',
      'wb.color.red':  'Rouge (+)',
      'wb.color.black': 'Noir (GND)',
      'wb.color.orange': 'Orange (Latched)',
      'wb.color.blue':  'Bleu (+12V)',
      'wb.color.green': 'Vert (Logique)',
      'wb.btn_simulation': 'Lancer la simulation',
      'wb.btn_stop':      'Arrêter',
      'wb.btn_validate':  'Vérifier le circuit',
      'wb.btn_save':      'Enregistrer',
      'wb.btn_share':     'Partager',
      'wb.btn_clear':     'Effacer',
      'wb.btn_layout':    'Disposition auto (hiérarchique)',
      'wb.btn_zoom':      'Ajuster la vue',
      'wb.btn_add_part':  'Ajouter',
      'wb.palette_label': 'Ajouter un composant',
      'wb.help_line1':    '🖱️ Cliquez sur une borne (clignote) puis la seconde pour tracer un fil',
      'wb.help_line2':    'Double-clic / clic droit pour supprimer un fil',
      'wb.help_line3':    'Glissez les composants par leur tête',
      'wb.help_line4':    '▶️ Lancez la simulation puis cliquez sur les boutons',
      'wb.help_line5':    'Glissez le fond pour vous déplacer, molette/disque pour zoomer',
      'wb.help_line6':    '⟳ pour tourner un composant',
      'wb.help_line7':    'Fonctionne au tactile 📱',
      'wb.col_wire_red':   '🔴 Rouge (+)',
      'wb.col_wire_black': '⚫ Noir (GND)',
      'wb.col_wire_orange':'🟠 Orange (Latched)',
      'wb.col_wire_blue':  '🔵 Bleu (+12V)',
      'wb.col_wire_green': '🟢 Vert (Logique)',
      'wb.col_wire_color_label': 'Couleur du fil',
      'wb.sim_state_off': 'En pause',
      'wb.sim_state_on':  'Simulation en cours — cliquez sur les boutons!',
      'wb.tier_eco':    'Mode économie d\'énergie',
      'wb.tier_high':   'Hautes performances (60fps)',
      'wb.short_alert':  'Court-circuit pendant la simulation! La simulation s\'est arrêtée pour votre sécurité — déconnectez le court-circuit entre (+) et la masse puis relancez.',
      'wb.valid_ok':    'Aucun court-circuit détecté',
      'wb.valid_short': 'Court-circuit! La borne (+) est directement raccordée à la masse',
      'wb.valid_float': 'Composants sans fil',
      'wb.save_local':  'Enregistré en local',
      'wb.save_cloud':  'Enregistré dans le cloud! +336Wh 🌱',
      'wb.save_msg':    'Enregistrement en cours…',
      'wb.save_no_parts': 'Ajoutez un composant d\'abord!',
      'wb.share_copied': 'Lien de partage copié!',
      'wb.share_need_save': 'Enregistrez le projet d\'abord pour le partager!',
      'wb.clear_title': 'Effacer la plaque entière?',
      'wb.load_fail':   'Impossible de charger le projet — vérifiez le lien',
      'wb.remix_box':   '🍴 Conception de dans la brique — modifiez librement puis enregistrez pour publier une copie (Remix) à votre nom.',
      'wb.demo_label':  'Débutant PBX-36',
      'wb.cloud_off':   'Mode déconnecté',
      'wb.cloud_local': 'Mode local',
      'wb.cloud_cloud': 'Cloud activé',

      'vai.craft_title': 'Assistant labo vocal',
      'vai.craft_sub':   'Concevez vos circuits par la voix, dans le labo',
      'vai.status_ready': '● Prêt — dites « ajoute une batterie »',
      'vai.status_listen': '🎤 Écoute —',
      'vai.status_read':   '📖 Lecture canevas —',
      'vai.mic_title':  'Parler',
      'vai.brain_title': 'Télécharger l\'esprit local (une seule fois) ⬇️',
      'vai.prompt_pdf':   'PDF du schéma',
      'vai.form_hint':    'Tapez ou parlez: ajoute un MPPT…',
      'vai.fab_hint':     'Assistant labo 🎧',
      'vai.fab_aria':     'Assistant vocal du labo',
      'vai.save_keys':    '💾 Enregistrer',
      'vai.keys_saved':   '✅ Enregistré localement!',
      'vai.collect_title': 'Collecte',
      'vai.collect_sub':   'USB + GitHub : découvrir les appareils et partager votre projet',
      'vai.publish_log':   'Journal de publication',

      'ds.title':      'Usine et design',
      'ds.sub':        'USB + GitHub : flasher les appareils et partager votre projet',
      'ds.flash_title': 'Flasher le code sur un ESP32',
      'ds.flash_sub':  'USB + GitHub : diagnostiquer les appareils et partager votre projet',
      'ds.flash_btn':  '🔥 Flasher le code (Flash vers l\'appareil)',
      'ds.gh_btn':     '🐙 Publier sur GitHub',
      'ds.status_local': 'USB + GitHub prêts dans le navigateur',

      'cs.title':      'Studio créatif',
      'cs.sub':        'Publications Ghost, vidéos YouTube, GitHub',
      'cs.blog':       'Article —',
      'cs.video':      'Vidéo',
      'cs.keys':       'Clés',
      'cs.keys_save':  '💾 Enregistrer',
      'cs.keys_saved': '✅ Clés enregistrées!',

      'sw.title':      'Communauté',
      'sw.sub':        'Projets des bricoleurs, outils, idées',
      'sw.empty':      'La communauté arrive bientôt — essayez une configuration et partagez-la!',
      'sw.search':     'Rechercher',
      'sw.loading':    'Chargement…',
      'sw.show_more':  'Afficher plus',
      'sw.show_less':  'Moins',

      'pr.title':      'Profil',
      'pr.sub':        'activités de votre Wattouna',
      'pr.empty':      'Vide',
      'pr.logout':     'Déconnexion',
      'pr.avatar':     'Photo',
      'pr.name':       'Nom',

      'ft.brand':      'Wattouna — énergie de seconde vie, au nord.',
      'ft.nav_projects': 'Projets',
      'ft.nav_docs':     'Documentation',
      'ft.nav_commit':   'Contribuer au code open-source',
      'ft.built_with':   'Construit avec',
      'ft.contribute':   'Contribuer',
      'ft.community':    'Communauté',
      'ft.platform':     'plateforme',
      'ft.admin':        '⛔ Tableau d\'administration',

      'common.more':   'Plus',
      'common.less':   'Moins',
      'common.close':  'Fermer',
      'common.back':   'Retour',
      'common.muted':  'Accentué',
      'common.link':   'Lien',
      'common.copy':   'Copier',
      'common.copied': 'Copié',
      'common.open_in_new_tab': 'Ouvrir dans un nouvel onglet',
    },
  },

  'en': {
    name: 'English',
    dir: 'ltr',
    strings: {
      'nav.menu':      'Menu',
      'nav.community': 'Community',
      'nav.components': 'Components',
      'nav.about':      'About',
      'nav.login':      'Sign in',
      'nav.signup':     'Sign up',
      'nav.becomeMaker': 'Become a maker?',
      'nav.settings':   'Settings',
      'nav.volunteer':  'Volunteer',
      'brand.title':    'Wattouna — Second-life Energy',
      'meta.title':     'Wattouna platform — DIY solar energy & battery upcycling',
      'meta.desc':      'Open-source platform for DIY solar energy and battery upcycling. Flagship: PBX-36 — zero-drain 36V solar generator.',
      'brand.tagline':  'Second-life energy, up north.',

      'wb.title':      'Workshop — Maker Canvas',
      'wb.kicker':     'Maker Workshop — Maker Canvas',
      'wb.headline':    'Build your circuit by dragging and wiring',
      'wb.help':       'Click a terminal (glows) then the second to draw a wire. Double-click/right-click a wire to delete it. Drag components from their head. ▶️ Start the simulation then click buttons to toggle. ⟳ to rotate a component. Works by touch 📱',
      'wb.toolbar_name': 'Project name',
      'wb.toolbar_color': 'Wire color',
      'wb.color.red':  'Red (+)',
      'wb.color.black': 'Black (GND)',
      'wb.color.orange': 'Orange (Latched)',
      'wb.color.blue':  'Blue (+12V)',
      'wb.color.green': 'Green (Logic)',
      'wb.btn_simulation': 'Start simulation',
      'wb.btn_stop':      'Stop',
      'wb.btn_validate':  'Inspect connections',
      'wb.btn_save':      'Save project',
      'wb.btn_share':     'Share',
      'wb.btn_clear':     'Clear',
      'wb.btn_layout':    'Auto-layout (hierarchical)',
      'wb.btn_zoom':      'Fit view',
      'wb.btn_add_part':  'Add',
      'wb.palette_label': 'Add a component',
      'wb.help_line1':    '🖱️ Click a terminal (glows) then the second to draw a wire',
      'wb.help_line2':    'Double-click / right-click a wire to delete it',
      'wb.help_line3':    'Drag components from their head',
      'wb.help_line4':    '▶️ Start the simulation then click buttons to toggle',
      'wb.help_line5':    'Drag the background to pan, scroll/disk to zoom',
      'wb.help_line6':    '⟳ to rotate a component',
      'wb.help_line7':    'Works by touch 📱',
      'wb.col_wire_red':   '🔴 Red (+)',
      'wb.col_wire_black': '⚫ Black (GND)',
      'wb.col_wire_orange':'🟠 Orange (Latched)',
      'wb.col_wire_blue':  '🔵 Blue (+12V)',
      'wb.col_wire_green': '🟢 Green (Logic)',
      'wb.col_wire_color_label': 'Wire color',
      'wb.sim_state_off': 'Paused',
      'wb.sim_state_on':  'Simulating — click the buttons!',
      'wb.tier_eco':    'Eco mode',
      'wb.tier_high':   'High performance (60fps)',
      'wb.short_alert':  'Short circuit during simulation! The simulation stopped for your safety — disconnect the short between (+) and GND, then restart.',
      'wb.valid_ok':    'No short found',
      'wb.valid_short': 'Short circuit! The (+) terminal is directly connected to GND',
      'wb.valid_float': 'Components with no wire',
      'wb.save_local':  'Saved locally',
      'wb.save_cloud':  'Saved to the cloud! +336Wh 🌱',
      'wb.save_msg':    'Saving…',
      'wb.save_no_parts': 'Add a component first!',
      'wb.share_copied': 'Share link copied!',
      'wb.share_need_save': 'Save the project first to share it!',
      'wb.clear_title': 'Clear the whole board?',
      'wb.load_fail':   'Could not load the project — check the link',
      'wb.remix_box':   '🍴 Design by — modify freely then save to publish a copy (Remix) under your name.',
      'wb.demo_label':  'PBX-36 starter',
      'wb.cloud_off':   'Offline workshop',
      'wb.cloud_local': 'Local mode',
      'wb.cloud_cloud': 'Cloud enabled',

      'vai.craft_title': 'Voice lab assistant',
      'vai.craft_sub':   'Design circuits by voice, in the lab',
      'vai.status_ready': '● Ready — say « add a battery »',
      'vai.status_listen': '🎤 Listening —',
      'vai.status_read':   '📖 Reading Canvas —',
      'vai.mic_title':  'Speak',
      'vai.brain_title': 'Download the local brain (once) ⬇️',
      'vai.prompt_pdf':   'Schematic PDF',
      'vai.form_hint':    'Type or speak: add MPPT…',
      'vai.fab_hint':     'Lab assistant 🎧',
      'vai.fab_aria':     'Voice lab assistant',
      'vai.save_keys':    '💾 Save',
      'vai.keys_saved':   '✅ Saved locally!',
      'vai.collect_title': 'Collect',
      'vai.collect_sub':   'USB + GitHub: discover devices and share your project',
      'vai.publish_log':   'Publish log',

      'ds.title':      'Factory & design',
      'ds.sub':        'USB + GitHub: flash devices and share your project',
      'ds.flash_title': 'Flash code to ESP32',
      'ds.flash_sub':  'USB + GitHub: discover devices and share your project',
      'ds.flash_btn':  '🔥 Flash code (Flash to Device)',
      'ds.gh_btn':     '🐙 Publish to GitHub',
      'ds.status_local': 'USB + GitHub ready from the browser',

      'cs.title':      'Creator studio',
      'cs.sub':        'Ghost publications, YouTube videos, GitHub',
      'cs.blog':       'Blog post —',
      'cs.video':      'Video',
      'cs.keys':       'Keys',
      'cs.keys_save':  '💾 Save',
      'cs.keys_saved': '✅ Keys saved!',

      'sw.title':      'Community',
      'sw.sub':        'Maker projects, tools, ideas',
      'sw.empty':      'The community is starting soon — try a build and share it!',
      'sw.search':     'Search',
      'sw.loading':    'Loading…',
      'sw.show_more':  'Show more',
      'sw.show_less':  'Less',

      'pr.title':      'Profile',
      'pr.sub':        'your Wattouna activities',
      'pr.empty':      'Empty',
      'pr.logout':     'Sign out',
      'pr.avatar':     'Photo',
      'pr.name':       'Name',

      'ft.brand':      'Wattouna — second-life energy, up north.',
      'ft.nav_projects': 'Projects',
      'ft.nav_docs':     'Documentation',
      'ft.nav_commit':   'Contribute to the open-source codebase',
      'ft.built_with':   'Built with',
      'ft.contribute':   'Contribute',
      'ft.community':    'Community',
      'ft.platform':     'platform',
      'ft.admin':        '⛔ Admin panel',

      'common.more':   'More',
      'common.less':   'Less',
      'common.close':  'Close',
      'common.back':   'Back',
      'common.muted':  'Muted',
      'common.link':   'Link',
      'common.copy':   'Copy',
      'common.copied': 'Copied',
      'common.open_in_new_tab': 'Open in new tab',
    },
  },
};

/* ---------- API ---------- */

export type Key = string;
export type Locale = keyof typeof LANGS;

export const DEFAULT_LOCALE: Locale = 'ar-TN';

/** Look up a translation, supporting dot-separated keys and a fallback. */
export function t(key: Key, locale?: Locale): string {
  const level = locale || DEFAULT_LOCALE;
  const dict = LANGS[level];
  if (!dict) return key;
  let cur: unknown = dict.strings;
  for (const seg of key.split(':')) {
    if (cur && typeof cur === 'object' && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[seg];
    } else {
      return key;
    }
  }
  return typeof cur === 'string' ? cur : key;
}

/** Current locale, persisted. */
export function currentLocale(): Locale {
  try {
    return (localStorage.getItem('wattouna-locale') as Locale) || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Persist new locale, apply direction + translations. */
export function setLocale(locale: Locale, opts?: { target?: HTMLElement | Document }) {
  const root = opts?.target || document;
  root.documentElement.setAttribute('lang', locale);
  root.documentElement.setAttribute('dir', LANGS[locale].dir);
  try { localStorage.setItem('wattouna-locale', locale); } catch {}
  applyTranslations(root);
  try {
    const evt = new CustomEvent('wattouna:languagechange', { detail: { locale } });
    window.dispatchEvent(evt);
  } catch {}
}

/* ---------- DOM binding ---------- */

const I18N_ATTR = 'data-i18n';
const I18N_FALLBACK_ATTR = 'data-i18n-fallback';
const I18N_ATTR_ATTR = 'data-i18n-attr';

export function applyTranslations(root?: Node): string[] {
  const r = root || document;
  const missing: string[] = [];
  const walker = document.createTreeWalker(r, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n: Node) => NodeFilter.FILTER_ACCEPT,
  });
  const seen = new Set<Element>();
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    if (seen.has(el)) continue;
    seen.add(el);
    apply(el, missing);
  }
  if (root) {
    const docWalker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, {
      acceptNode: () => NodeFilter.FILTER_ACCEPT,
    });
    while (docWalker.nextNode()) {
      const el = docWalker.currentNode as Element;
      if (seen.has(el)) continue;
      seen.add(el);
      apply(el, missing);
    }
    seen.clear();
  }
  return missing;
}

function apply(el: Element, missing: string[]) {
  const key = el.getAttribute(I18N_ATTR);
  if (key) {
    const val = t(key, currentLocale());
    if (val === key) missing.push(key);
    setText(el, val);
  }
  const fb = el.getAttribute(I18N_FALLBACK_ATTR);
  if (fb && !el.textContent) setText(el, fb);
  const attr = el.getAttribute(I18N_ATTR_ATTR);
  if (attr) {
    const key2 = el.getAttribute(I18N_ATTR) || el.getAttribute(I18N_FALLBACK_ATTR);
    if (key2) {
      const v = t(key2, currentLocale());
      if (v !== key2) el.setAttribute(attr, v);
      else if (el.getAttribute(attr) === '') missing.push(key2);
    }
  }
}

function setText(el: Element, v: string) {
  if (el.childNodes.length === 0) {
    el.textContent = v;
  } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const input = el as HTMLInputElement;
    if (input.value === '') input.value = v;
  }
}

/* ---------- language switcher ---------- */

/* ---------- language switcher ---------- */
export function installSwitcher(container: Element | Document) {
  const doc = (container instanceof Document) ? (container as Document) : null;
  let root: HTMLElement = doc ? (doc.documentElement as HTMLElement) : (container as HTMLElement);
  (root.querySelectorAll('.wlang-switch, #wlangSwitcher') || []).forEach((e: Element) => e.remove());

  const btn = document.createElement('button');
  btn.id = 'wlangSwitcher';
  btn.className = 'wlang-switch';
  btn.setAttribute('aria-label', 'Changer de langue');
  btn.setAttribute('title', 'Changer de langue');

  const cur = currentLocale();
  renderSwitcher(btn, cur);

  container.appendChild(btn);

  btn.addEventListener('click', (e) => {
    const next = nextLocale(cur);
    setLocale(next);
    renderSwitcher(btn, next);
  });

  return btn;
}

export function renderSwitcher(btn: HTMLButtonElement, locale: Locale) {
  const w = LANGS[locale];
  const flag = locale === 'ar-TN' ? 'العربية 🇹🇳' : locale === 'fr' ? 'FR 🇫🇷' : 'EN 🇬🇧';
  btn.innerHTML = `<span class="wlang-label" title="${w.name}">${flag} ${w.name}</span>`;
  btn.dataset.locale = locale;
}

/** Cycle for next locale (ar-TN → fr → en → ar-TN). */
export function nextLocale(locale: Locale): Locale {
  const seq = ['ar-TN', 'fr', 'en'] as const;
  const i = seq.indexOf(locale);
  return seq[(i + 1) % seq.length] as Locale;
}

/* ---------- initialise on load ---------- */

export function bootstrapI18n(opts?: { target?: Document | HTMLElement; container?: Element }) {
  setLocale(currentLocale(), opts);
  if (opts?.container) installSwitcher(opts.container);
  try {
    window.dispatchEvent(new CustomEvent('wattouna:localeready', { detail: { locale: currentLocale() } }));
  } catch {}
}

/* ---------- locales list ---------- */
export const locales: Array<{ locale: Locale; name: string; dir: string }> = (Object.entries(LANGS) as Array<[Locale, typeof LANGS[Locale]]>).map(([locale, dict]) => ({
  locale: locale as Locale,
  name: dict.name,
  dir: dict.dir,
}));
