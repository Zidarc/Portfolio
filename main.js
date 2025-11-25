/* ========================== NAVIGATION ========================== */
/* Smooth scroll for navigation links */
$(document).ready(function () {
    // Smooth scroll for navigation links
    $('a.nav-link[href^="#"]').on('click', function (e) {
        e.preventDefault();

        const target = $(this.hash);
        if (!target.length) return;

        $('html, body').stop().animate({
            scrollTop: target.offset().top - 70
        }, 900, 'swing');
    });

    // Smooth scroll for skip-to-main link
    $('a.skip-to-main[href^="#"]').on('click', function (e) {
        e.preventDefault();

        const target = $(this.hash);
        if (!target.length) return;

        $('html, body').stop().animate({
            scrollTop: target.offset().top - 70
        }, 900, 'swing');
        
        // Remove focus after scrolling
        this.blur();
    });
});

/* Sidebar Navigation Toggle */
const nav = document.getElementById("sidebar-nav");
const openBtn = document.getElementById("open-nav");
const closeBtn = document.getElementById("close-nav");
const header = document.getElementById("top-header");

// Open navigation menu
openBtn.addEventListener("click", () => {
    nav.classList.add("open");
    openBtn.classList.add("hide");
    header.classList.add("hidden");
});

// Close navigation menu
closeBtn.addEventListener("click", () => {
    nav.classList.remove("open");
    openBtn.classList.remove("hide");
    header.classList.remove("hidden");
});

// Close navigation when clicking a link
document.querySelectorAll(".nav-link").forEach(link =>
    link.addEventListener("click", () => {
        nav.classList.remove("open");
        openBtn.classList.remove("hide");
        header.classList.remove("hidden");
    })
);


/* ========================== HEADER SCROLL EFFECT ========================== */
/* Add scrolled class to header when scrolling */
window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});


/* ========================== SCROLL ANIMATIONS ========================== */
/* Intersection Observer for fade-in animations on scroll */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe main sections
    const sectionsToAnimate = [
        document.getElementById('intro-section'),
        document.getElementById('education-section'),
        document.getElementById('container-2'),
        document.getElementById('container-3')
    ];

    sectionsToAnimate.forEach(section => {
        if (section) {
            observer.observe(section);
        }
    });

    // Observe education items with staggered delay
    const educationItems = document.querySelectorAll('.education-item');
    educationItems.forEach(item => {
        if (item) {
            observer.observe(item);
        }
    });

    // Observe skill icons with staggered delay
    const skillIcons = document.querySelectorAll('.iconSkill');
    skillIcons.forEach((icon, index) => {
        if (icon) {
            // Add delay based on index for staggered effect
            icon.style.transitionDelay = `${(index % 4) * 0.1}s`;
            observer.observe(icon);
        }
    });
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}


/* ========================== MULTI-LANGUAGE SUPPORT ========================== */
/* Translation object containing all language translations */
const translations = {
    en: {
        nav: {
            about: "About Me",
            education: "Education",
            skills: "Skills",
            work: "My Work"
        },
        hero: {
            text: "Beauty, Madness And Everything Else."
        },
        about: {
            title: "About Me",
            para1: "I'm Ali Hussain, an aspiring Data Scientist currently pursuing my Bachelor's in Data Science at FAST National University. My journey in technology began with a passion for transforming raw data into meaningful insights and building innovative solutions that make a real impact.",
            para2: "From engineering cryptocurrency trading platforms handling 100+ concurrent users to creating real-time stock exchange simulators and interactive projects, I thrive on turning complex challenges into elegant solutions. My experience has taught me the value of clear communication and collaborative problem-solving skills, which I try to bring to every project.",
            para3: "I specialize in Python, JavaScript, and the MERN stack, with expertise in data visualization, real-time systems, and database optimization. Whether it's building Power BI dashboards that tell compelling data stories or optimizing MongoDB queries for 30% performance gains, I'm driven by the pursuit of excellence in everything I create."
        },
        education: {
            title: "Education"
        },
        skills: {
            title: "SKILLS AND TOOLS:"
        },
        work: {
            title: "MY WORK:"
        },
        footer: {
            philosophy: {
                title: "MY PHILOSOPHY",
                quote: "\"Data is the new oil, but insights are the refined fuel that drives innovation.\"",
                text: "I believe in transforming complex data into actionable insights and building solutions that make a meaningful impact. Every project is an opportunity to learn, grow, and push the boundaries of what's possible."
            },
            contact: {
                title: "GET IN TOUCH",
                nameLabel: "Name",
                namePlaceholder: "NAME",
                emailLabel: "Email",
                emailPlaceholder: "E-MAIL",
                messageLabel: "Message",
                messagePlaceholder: "YOUR MESSAGE",
                send: "SEND"
            },
            social: {
                title: "FIND ME ONLINE"
            },
            copyright: "© 2025 Ali Hussain • All Rights Reserved",
            location: "Karachi, Pakistan"
        }
    },
    ur: {
        nav: {
            about: "میرے بارے میں",
            education: "تعلیم",
            skills: "مہارتیں",
            work: "میرا کام"
        },
        hero: {
            text: "خوبصورتی، پاگل پن اور باقی سب کچھ۔"
        },
        about: {
            title: "میرے بارے میں",
            para1: "میں علی حسین ہوں، ایک طموح ڈیٹا سائنسدان جو فی الحال FAST نیشنل یونیورسٹی میں ڈیٹا سائنس میں بیچلر کی ڈگری حاصل کر رہا ہوں۔ ٹیکنالوجی میں میرا سفر خام ڈیٹا کو معنی خیز بصیرت میں تبدیل کرنے اور اختراعی حل بنانے کے جذبے سے شروع ہوا جو حقیقی اثر ڈالتے ہیں۔",
            para2: "100+ بیک وقت صارفین کو ہینڈل کرنے والے کرپٹو کرنسی ٹریڈنگ پلیٹ فارمز کی انجینئرنگ سے لے کر حقیقی وقت کے اسٹاک ایکسچینج سمیولیٹرز اور انٹرایکٹو پروجیکٹس بنانے تک، میں پیچیدہ چیلنجز کو خوبصورت حل میں تبدیل کرنے میں کامیاب ہوں۔ میرے تجربے نے مجھے واضح مواصلات اور تعاون پر مبنی مسئلہ حل کرنے کی مہارتوں کی اہمیت سکھائی ہے، جو میں ہر پروجیکٹ میں لانے کی کوشش کرتا ہوں۔",
            para3: "میں Python، JavaScript، اور MERN stack میں مہارت رکھتا ہوں، ڈیٹا ویژولائزیشن، حقیقی وقت کے نظاموں، اور ڈیٹا بیس کی اصلاح میں مہارت کے ساتھ۔ چاہے یہ Power BI ڈیش بورڈز بنانا ہو جو پرکشش ڈیٹا کہانیاں سناتے ہیں یا MongoDB کوئریز کو 30% کارکردگی کے حصول کے لیے بہتر بنانا ہو، میں ہر چیز میں عمدگی کے حصول پر توجہ دیتا ہوں۔"
        },
        education: {
            title: "تعلیم"
        },
        skills: {
            title: "مہارتیں اور اوزار:"
        },
        work: {
            title: "میرا کام:"
        },
        footer: {
            philosophy: {
                title: "میرا فلسفہ",
                quote: "\"ڈیٹا نیا تیل ہے، لیکن بصیرتیں وہ بہتر ایندھن ہیں جو اختراع کو آگے بڑھاتی ہیں۔\"",
                text: "میں یقین رکھتا ہوں کہ پیچیدہ ڈیٹا کو قابل عمل بصیرت میں تبدیل کرنا اور ایسے حل بنانا جو معنی خیز اثر ڈالیں۔ ہر پروجیکٹ سیکھنے، بڑھنے، اور ممکنات کی حدود کو آگے بڑھانے کا موقع ہے۔"
            },
            contact: {
                title: "رابطہ کریں",
                nameLabel: "نام",
                namePlaceholder: "نام",
                emailLabel: "ای میل",
                emailPlaceholder: "ای میل",
                messageLabel: "پیغام",
                messagePlaceholder: "آپ کا پیغام",
                send: "بھیجیں"
            },
            social: {
                title: "آن لائن تلاش کریں"
            },
            copyright: "© 2025 علی حسین • تمام حقوق محفوظ",
            location: "کراچی، پاکستان"
        }
    },
    es: {
        nav: {
            about: "Sobre Mí",
            education: "Educación",
            skills: "Habilidades",
            work: "Mi Trabajo"
        },
        hero: {
            text: "Belleza, Locura Y Todo Lo Demás."
        },
        about: {
            title: "Sobre Mí",
            para1: "Soy Ali Hussain, un aspirante a Científico de Datos que actualmente está cursando su Licenciatura en Ciencia de Datos en la Universidad Nacional FAST. Mi viaje en la tecnología comenzó con una pasión por transformar datos en bruto en conocimientos significativos y construir soluciones innovadoras que generen un impacto real.",
            para2: "Desde la ingeniería de plataformas de trading de criptomonedas que manejan más de 100 usuarios simultáneos hasta la creación de simuladores de bolsa en tiempo real y proyectos interactivos, prospero convirtiendo desafíos complejos en soluciones elegantes. Mi experiencia me ha enseñado el valor de la comunicación clara y las habilidades de resolución colaborativa de problemas, que trato de aportar a cada proyecto.",
            para3: "Me especializo en Python, JavaScript y la pila MERN, con experiencia en visualización de datos, sistemas en tiempo real y optimización de bases de datos. Ya sea construyendo paneles de Power BI que cuentan historias de datos convincentes u optimizando consultas de MongoDB para obtener ganancias de rendimiento del 30%, me impulsa la búsqueda de la excelencia en todo lo que creo."
        },
        education: {
            title: "Educación"
        },
        skills: {
            title: "HABILIDADES Y HERRAMIENTAS:"
        },
        work: {
            title: "MI TRABAJO:"
        },
        footer: {
            philosophy: {
                title: "MI FILOSOFÍA",
                quote: "\"Los datos son el nuevo petróleo, pero los conocimientos son el combustible refinado que impulsa la innovación.\"",
                text: "Creo en transformar datos complejos en conocimientos accionables y construir soluciones que generen un impacto significativo. Cada proyecto es una oportunidad para aprender, crecer y empujar los límites de lo posible."
            },
            contact: {
                title: "PONTE EN CONTACTO",
                nameLabel: "Nombre",
                namePlaceholder: "NOMBRE",
                emailLabel: "Correo",
                emailPlaceholder: "CORREO",
                messageLabel: "Mensaje",
                messagePlaceholder: "TU MENSAJE",
                send: "ENVIAR"
            },
            social: {
                title: "ENCUÉNTRAME EN LÍNEA"
            },
            copyright: "© 2025 Ali Hussain • Todos los Derechos Reservados",
            location: "Karachi, Pakistán"
        }
    },
    fr: {
        nav: {
            about: "À Propos",
            education: "Éducation",
            skills: "Compétences",
            work: "Mon Travail"
        },
        hero: {
            text: "Beauté, Folie Et Tout Le Reste."
        },
        about: {
            title: "À Propos",
            para1: "Je suis Ali Hussain, un aspirant Data Scientist poursuivant actuellement sa Licence en Science des Données à l'Université Nationale FAST. Mon parcours dans la technologie a commencé par une passion pour transformer les données brutes en informations significatives et construire des solutions innovantes qui ont un impact réel.",
            para2: "De l'ingénierie de plateformes de trading de cryptomonnaies gérant plus de 100 utilisateurs simultanés à la création de simulateurs de bourse en temps réel et de projets interactifs, je prospère en transformant des défis complexes en solutions élégantes. Mon expérience m'a appris la valeur d'une communication claire et des compétences de résolution collaborative de problèmes, que j'essaie d'apporter à chaque projet.",
            para3: "Je me spécialise en Python, JavaScript et la pile MERN, avec une expertise en visualisation de données, systèmes en temps réel et optimisation de bases de données. Que ce soit la construction de tableaux de bord Power BI qui racontent des histoires de données convaincantes ou l'optimisation des requêtes MongoDB pour des gains de performance de 30%, je suis motivé par la poursuite de l'excellence dans tout ce que je crée."
        },
        education: {
            title: "Éducation"
        },
        skills: {
            title: "COMPÉTENCES ET OUTILS:"
        },
        work: {
            title: "MON TRAVAIL:"
        },
        footer: {
            philosophy: {
                title: "MA PHILOSOPHIE",
                quote: "\"Les données sont le nouveau pétrole, mais les informations sont le carburant raffiné qui alimente l'innovation.\"",
                text: "Je crois en la transformation de données complexes en informations exploitables et en la construction de solutions qui ont un impact significatif. Chaque projet est une opportunité d'apprendre, de grandir et de repousser les limites du possible."
            },
            contact: {
                title: "ENTRER EN CONTACT",
                nameLabel: "Nom",
                namePlaceholder: "NOM",
                emailLabel: "Email",
                emailPlaceholder: "E-MAIL",
                messageLabel: "Message",
                messagePlaceholder: "VOTRE MESSAGE",
                send: "ENVOYER"
            },
            social: {
                title: "TROUVEZ-MOI EN LIGNE"
            },
            copyright: "© 2025 Ali Hussain • Tous Droits Réservés",
            location: "Karachi, Pakistan"
        }
    },
    ko: {
        nav: {
            about: "소개",
            education: "학력",
            skills: "기술",
            work: "작업물"
        },
        hero: {
            text: "아름다움, 광기 그리고 나머지 모든 것."
        },
        about: {
            title: "소개",
            para1: "저는 Ali Hussain입니다. 현재 FAST 국립대학교에서 데이터 과학 학사 과정을 수료 중인 열망하는 데이터 과학자입니다. 기술에 대한 저의 여정은 원시 데이터를 의미 있는 통찰력으로 변환하고 실제 영향을 미치는 혁신적인 솔루션을 구축하는 열정으로 시작되었습니다.",
            para2: "100명 이상의 동시 사용자를 처리하는 암호화폐 거래 플랫폼 엔지니어링부터 실시간 주식 거래 시뮬레이터 및 대화형 프로젝트 생성에 이르기까지, 저는 복잡한 도전을 우아한 솔루션으로 전환하는 데 탁월합니다. 제 경험은 명확한 커뮤니케이션과 협력적 문제 해결 기술의 가치를 가르쳐 주었으며, 이를 모든 프로젝트에 적용하려고 노력합니다.",
            para3: "저는 Python, JavaScript 및 MERN 스택을 전문으로 하며, 데이터 시각화, 실시간 시스템 및 데이터베이스 최적화에 대한 전문 지식을 보유하고 있습니다. 설득력 있는 데이터 스토리를 전달하는 Power BI 대시보드를 구축하든 MongoDB 쿼리를 30% 성능 향상을 위해 최적화하든, 제가 만드는 모든 것에서 우수성을 추구하는 데 동기를 부여받습니다."
        },
        education: {
            title: "학력"
        },
        skills: {
            title: "기술 및 도구:"
        },
        work: {
            title: "작업물:"
        },
        footer: {
            philosophy: {
                title: "제 철학",
                quote: "\"데이터는 새로운 석유이지만, 통찰력은 혁신을 추진하는 정제된 연료입니다.\"",
                text: "저는 복잡한 데이터를 실행 가능한 통찰력으로 변환하고 의미 있는 영향을 미치는 솔루션을 구축하는 것을 믿습니다. 모든 프로젝트는 배우고, 성장하며, 가능한 것의 경계를 넓힐 기회입니다."
            },
            contact: {
                title: "연락하기",
                nameLabel: "이름",
                namePlaceholder: "이름",
                emailLabel: "이메일",
                emailPlaceholder: "이메일",
                messageLabel: "메시지",
                messagePlaceholder: "메시지를 입력하세요",
                send: "보내기"
            },
            social: {
                title: "온라인에서 찾기"
            },
            copyright: "© 2025 Ali Hussain • 모든 권리 보유",
            location: "카라치, 파키스탄"
        }
    },
    ja: {
        nav: {
            about: "私について",
            education: "学歴",
            skills: "スキル",
            work: "作品"
        },
        hero: {
            text: "美しさ、狂気、そしてその他すべて。"
        },
        about: {
            title: "私について",
            para1: "私はAli Hussainです。現在、FAST国立大学でデータサイエンスの学士号を取得中の志望データサイエンティストです。テクノロジーへの私の旅は、生データを意味のある洞察に変換し、真の影響を与える革新的なソリューションを構築する情熱から始まりました。",
            para2: "100人以上の同時ユーザーを処理する暗号通貨取引プラットフォームのエンジニアリングから、リアルタイムの株式取引シミュレーターやインタラクティブなプロジェクトの作成まで、私は複雑な課題をエレガントなソリューションに変えることに長けています。私の経験は、明確なコミュニケーションと協力的な問題解決スキルの価値を教えてくれ、これをすべてのプロジェクトに持ち込もうとしています。",
            para3: "私はPython、JavaScript、MERNスタックを専門としており、データ可視化、リアルタイムシステム、データベース最適化の専門知識を持っています。説得力のあるデータストーリーを語るPower BIダッシュボードを構築するにせよ、MongoDBクエリを30%のパフォーマンス向上のために最適化するにせよ、私が作成するすべてのものにおいて卓越性の追求に動機づけられています。"
        },
        education: {
            title: "学歴"
        },
        skills: {
            title: "スキルとツール:"
        },
        work: {
            title: "作品:"
        },
        footer: {
            philosophy: {
                title: "私の哲学",
                quote: "\"データは新しい石油ですが、洞察は革新を推進する精製された燃料です。\"",
                text: "私は、複雑なデータを実行可能な洞察に変換し、意味のある影響を与えるソリューションを構築することを信じています。すべてのプロジェクトは、学び、成長し、可能なことの境界を押し広げる機会です。"
            },
            contact: {
                title: "お問い合わせ",
                nameLabel: "名前",
                namePlaceholder: "名前",
                emailLabel: "メール",
                emailPlaceholder: "メールアドレス",
                messageLabel: "メッセージ",
                messagePlaceholder: "メッセージを入力してください",
                send: "送信"
            },
            social: {
                title: "オンラインで見つける"
            },
            copyright: "© 2025 Ali Hussain • 全著作権所有",
            location: "カラチ、パキスタン"
        }
    },
    zh: {
        nav: {
            about: "关于我",
            education: "教育",
            skills: "技能",
            work: "我的作品"
        },
        hero: {
            text: "美丽、疯狂和其他一切。"
        },
        about: {
            title: "关于我",
            para1: "我是Ali Hussain，一位有抱负的数据科学家，目前正在FAST国立大学攻读数据科学学士学位。我在技术领域的旅程始于将原始数据转化为有意义的见解，并构建产生真正影响的创新解决方案的热情。",
            para2: "从处理100多个并发用户的加密货币交易平台工程，到创建实时股票交易模拟器和交互式项目，我擅长将复杂的挑战转化为优雅的解决方案。我的经验教会了我清晰沟通和协作解决问题的价值，我努力将这一点带到每个项目中。",
            para3: "我专精于Python、JavaScript和MERN堆栈，在数据可视化、实时系统和数据库优化方面拥有专业知识。无论是构建讲述引人入胜数据故事的Power BI仪表板，还是优化MongoDB查询以获得30%的性能提升，我都受到在创造的一切中追求卓越的驱动。"
        },
        education: {
            title: "教育"
        },
        skills: {
            title: "技能和工具:"
        },
        work: {
            title: "我的作品:"
        },
        footer: {
            philosophy: {
                title: "我的理念",
                quote: "\"数据是新的石油，但洞察是推动创新的精炼燃料。\"",
                text: "我相信将复杂的数据转化为可操作的见解，并构建产生有意义影响的解决方案。每个项目都是学习、成长和推动可能界限的机会。"
            },
            contact: {
                title: "联系我",
                nameLabel: "姓名",
                namePlaceholder: "姓名",
                emailLabel: "邮箱",
                emailPlaceholder: "邮箱地址",
                messageLabel: "消息",
                messagePlaceholder: "请输入您的消息",
                send: "发送"
            },
            social: {
                title: "在线找到我"
            },
            copyright: "© 2025 Ali Hussain • 版权所有",
            location: "卡拉奇，巴基斯坦"
        }
    },
    de: {
        nav: {
            about: "Über Mich",
            education: "Bildung",
            skills: "Fähigkeiten",
            work: "Meine Arbeit"
        },
        hero: {
            text: "Schönheit, Wahnsinn Und Alles Andere."
        },
        about: {
            title: "Über Mich",
            para1: "Ich bin Ali Hussain, ein aufstrebender Datenwissenschaftler, der derzeit seinen Bachelor in Datenwissenschaft an der FAST National University absolviert. Meine Reise in der Technologie begann mit einer Leidenschaft für die Transformation von Rohdaten in aussagekräftige Erkenntnisse und den Aufbau innovativer Lösungen, die echte Auswirkungen haben.",
            para2: "Von der Entwicklung von Kryptowährungs-Handelsplattformen, die mehr als 100 gleichzeitige Benutzer verarbeiten, bis hin zur Erstellung von Echtzeit-Börsensimulatoren und interaktiven Projekten gedeihe ich daran, komplexe Herausforderungen in elegante Lösungen zu verwandeln. Meine Erfahrung hat mich den Wert klarer Kommunikation und kollaborativer Problemlösungsfähigkeiten gelehrt, die ich in jedes Projekt einzubringen versuche.",
            para3: "Ich spezialisiere mich auf Python, JavaScript und den MERN-Stack mit Expertise in Datenvisualisierung, Echtzeitsystemen und Datenbankoptimierung. Ob es darum geht, Power BI-Dashboards zu erstellen, die überzeugende Daten-Geschichten erzählen, oder MongoDB-Abfragen für 30% Leistungssteigerungen zu optimieren, ich werde von der Verfolgung von Exzellenz in allem, was ich erstelle, angetrieben."
        },
        education: {
            title: "Bildung"
        },
        skills: {
            title: "FÄHIGKEITEN UND WERKZEUGE:"
        },
        work: {
            title: "MEINE ARBEIT:"
        },
        footer: {
            philosophy: {
                title: "MEINE PHILOSOPHIE",
                quote: "\"Daten sind das neue Öl, aber Erkenntnisse sind der raffinierte Treibstoff, der Innovation antreibt.\"",
                text: "Ich glaube daran, komplexe Daten in umsetzbare Erkenntnisse zu verwandeln und Lösungen zu entwickeln, die bedeutende Auswirkungen haben. Jedes Projekt ist eine Gelegenheit zu lernen, zu wachsen und die Grenzen des Möglichen zu erweitern."
            },
            contact: {
                title: "KONTAKT AUFNEHMEN",
                nameLabel: "Name",
                namePlaceholder: "NAME",
                emailLabel: "E-Mail",
                emailPlaceholder: "E-MAIL",
                messageLabel: "Nachricht",
                messagePlaceholder: "IHRE NACHRICHT",
                send: "SENDEN"
            },
            social: {
                title: "FINDEN SIE MICH ONLINE"
            },
            copyright: "© 2025 Ali Hussain • Alle Rechte vorbehalten",
            location: "Karachi, Pakistan"
        }
    },
    ar: {
        nav: {
            about: "نبذة عني",
            education: "التعليم",
            skills: "المهارات",
            work: "أعمالي"
        },
        hero: {
            text: "الجمال والجنون وكل شيء آخر."
        },
        about: {
            title: "نبذة عني",
            para1: "أنا علي حسين، عالم بيانات طموح يتابع حالياً درجة البكالوريوس في علوم البيانات في الجامعة الوطنية FAST. بدأت رحلتي في التكنولوجيا بشغف لتحويل البيانات الخام إلى رؤى ذات معنى وبناء حلول مبتكرة تحدث تأثيراً حقيقياً.",
            para2: "من هندسة منصات تداول العملات المشفرة التي تتعامل مع أكثر من 100 مستخدم متزامن إلى إنشاء محاكيات البورصة في الوقت الفعلي والمشاريع التفاعلية، أزدهر في تحويل التحديات المعقدة إلى حلول أنيقة. علمتني تجربتي قيمة التواصل الواضح ومهارات حل المشكلات التعاونية، والتي أحاول إحضارها إلى كل مشروع.",
            para3: "أتخصص في Python و JavaScript و MERN stack، مع خبرة في تصور البيانات والأنظمة في الوقت الفعلي وتحسين قواعد البيانات. سواء كان بناء لوحات Power BI التي تحكي قصص بيانات مقنعة أو تحسين استعلامات MongoDB لتحقيق مكاسب أداء بنسبة 30%، أنا مدفوع بالسعي للتميز في كل ما أنشئه."
        },
        education: {
            title: "التعليم"
        },
        skills: {
            title: "المهارات والأدوات:"
        },
        work: {
            title: "أعمالي:"
        },
        footer: {
            philosophy: {
                title: "فلسفتي",
                quote: "\"البيانات هي النفط الجديد، لكن الرؤى هي الوقود المكرر الذي يدفع الابتكار.\"",
                text: "أؤمن بتحويل البيانات المعقدة إلى رؤى قابلة للتنفيذ وبناء حلول تحدث تأثيراً ذا معنى. كل مشروع هو فرصة للتعلم والنمو ودفع حدود ما هو ممكن."
            },
            contact: {
                title: "تواصل معي",
                nameLabel: "الاسم",
                namePlaceholder: "الاسم",
                emailLabel: "البريد الإلكتروني",
                emailPlaceholder: "البريد الإلكتروني",
                messageLabel: "الرسالة",
                messagePlaceholder: "رسالتك",
                send: "إرسال"
            },
            social: {
                title: "ابحث عني على الإنترنت"
            },
            copyright: "© 2025 علي حسين • جميع الحقوق محفوظة",
            location: "كراتشي، باكستان"
        }
    },
    pt: {
        nav: {
            about: "Sobre Mim",
            education: "Educação",
            skills: "Habilidades",
            work: "Meu Trabalho"
        },
        hero: {
            text: "Beleza, Loucura E Tudo Mais."
        },
        about: {
            title: "Sobre Mim",
            para1: "Sou Ali Hussain, um aspirante a Cientista de Dados atualmente cursando Bacharelado em Ciência de Dados na Universidade Nacional FAST. Minha jornada na tecnologia começou com uma paixão por transformar dados brutos em insights significativos e construir soluções inovadoras que causam um impacto real.",
            para2: "Da engenharia de plataformas de negociação de criptomoedas que lidam com mais de 100 usuários simultâneos à criação de simuladores de bolsa de valores em tempo real e projetos interativos, prospero transformando desafios complexos em soluções elegantes. Minha experiência me ensinou o valor da comunicação clara e das habilidades colaborativas de resolução de problemas, que tento trazer para cada projeto.",
            para3: "Sou especialista em Python, JavaScript e a stack MERN, com expertise em visualização de dados, sistemas em tempo real e otimização de bancos de dados. Seja construindo painéis Power BI que contam histórias de dados convincentes ou otimizando consultas MongoDB para ganhos de desempenho de 30%, sou impulsionado pela busca da excelência em tudo que crio."
        },
        education: {
            title: "Educação"
        },
        skills: {
            title: "HABILIDADES E FERRAMENTAS:"
        },
        work: {
            title: "MEU TRABALHO:"
        },
        footer: {
            philosophy: {
                title: "MINHA FILOSOFIA",
                quote: "\"Dados são o novo petróleo, mas insights são o combustível refinado que impulsiona a inovação.\"",
                text: "Acredito em transformar dados complexos em insights acionáveis e construir soluções que causam um impacto significativo. Cada projeto é uma oportunidade de aprender, crescer e empurrar os limites do que é possível."
            },
            contact: {
                title: "ENTRE EM CONTATO",
                nameLabel: "Nome",
                namePlaceholder: "NOME",
                emailLabel: "E-mail",
                emailPlaceholder: "E-MAIL",
                messageLabel: "Mensagem",
                messagePlaceholder: "SUA MENSAGEM",
                send: "ENVIAR"
            },
            social: {
                title: "ENCONTRE-ME ONLINE"
            },
            copyright: "© 2025 Ali Hussain • Todos os Direitos Reservados",
            location: "Karachi, Paquistão"
        }
    }
};

/* Language Management */
// Get saved language or default to English
let currentLanguage = localStorage.getItem('language') || 'en';

/**
 * Update text content of an element based on its type
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text to set
 */
function updateTextContent(element, text) {
    if (element.tagName === 'INPUT' && element.type === 'button') {
        element.value = text;
    } else if (element.hasAttribute('data-i18n-placeholder')) {
        element.placeholder = text;
    } else {
        element.textContent = text;
    }
}

/**
 * Translate the entire page to the specified language
 * @param {string} lang - Language code (en, ur, es, fr, ko, ja, zh, de, ar, pt)
 */
function translatePage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update direction for RTL languages
    if (lang === 'ur' || lang === 'ar') {
        document.documentElement.dir = 'rtl';
    } else {
        document.documentElement.dir = 'ltr';
    }
    
    const t = translations[lang];
    if (!t) return;
    
    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const keys = key.split('.');
        let value = t;
        
        for (const k of keys) {
            value = value[k];
            if (!value) break;
        }
        
        if (value) {
            updateTextContent(element, value);
        }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const keys = key.split('.');
        let value = t;
        
        for (const k of keys) {
            value = value[k];
            if (!value) break;
        }
        
        if (value) {
            element.placeholder = value;
        }
    });
    
    // Update language selector
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.value = lang;
    }
}

/* Initialize language on page load */
document.addEventListener('DOMContentLoaded', () => {
    translatePage(currentLanguage);
    
    // Add event listener to language selector
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            translatePage(e.target.value);
        });
    }
});
