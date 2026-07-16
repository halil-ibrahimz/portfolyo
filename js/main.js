document.addEventListener('DOMContentLoaded', () => {

    // CHROME GPU ÇÖKME NİHAİ ÇÖZÜMÜ (Zorunlu Reflow) ve KUSURSUZ ORANTI (Custom VW)
    // Ekran büyütülüp küçültüldüğünde ekran kartı HTML'i çizmeyi unutursa diye
    // pencere boyutlandığında siteyi saniyenin binde biri hızında gizleyip geri açarak zorla yeniden çizdiriyoruz.
    let resizeTimer;

    function updateCustomVW() {
        const room = document.querySelector('.room-container');
        if (room) {
            // Odanın anlık gerçek genişliğini alıp 100'e bölerek "Odaya Özel VW" değerini hesaplıyoruz.
            // Böylece tarayıcı ne kadar daralırsa daralsın, pano içindeki resimler bu değere göre küçülecek ve asla sapmayacak.
            const rect = room.getBoundingClientRect();
            document.documentElement.style.setProperty('--cw', `${rect.width / 100}px`);
        }
    }
    
    // Sayfa açıldığında ilk hesaplamayı yap
    updateCustomVW();

    window.addEventListener('resize', () => {
        updateCustomVW(); // Her boyutta orantıyı koru
        
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const room = document.querySelector('.room-container');
            if (room) {
                room.style.display = 'none';
                room.offsetHeight; // Tarayıcıyı hesaplamaya zorla (Reflow)
                room.style.display = 'block';
            }
        }, 50); // Resize bitiminden hemen sonra tetikle
    });

    // --- SES DOSYALARI (AUDIO) ---
    const sfx = {
        atariStart: new Audio('sound/atari-start.ogg'),
        plant: new Audio('sound/bitki.ogg'),
        coffee: new Audio('sound/coffe.ogg'),
        eatApple: new Audio('sound/eat-apple.ogg'),
        panoStart: new Audio('sound/pano-start.ogg'),
        pongRacket: new Audio('sound/pong-raket.ogg'),
        snakeDead: new Audio('sound/snake-dead.ogg'),
        lamp: new Audio('sound/lamp.ogg'),
        atariButton: new Audio('sound/atari-button.ogg'),
        trainStart: new Audio('sound/tren-kalkis.ogg'),
        hover: new Audio('sound/hover.ogg'),
        pongDead: new Audio('sound/pong-dead.ogg'),
        miniMascot: new Audio('sound/mini-mascot.ogg'),
        mascotZoom: new Audio('sound/mascot-zoom.ogg'),
        cyberClick: new Audio('sound/cyber-click.ogg'),
        terminalDetail: new Audio('sound/terminal-detail.ogg'),
        terminalOut: new Audio('sound/terminal-out.ogg')
    };

    function playSound(audioObj, volume = 1.0, startAt = 0) {
        if (!audioObj) return;

        // Seslerin üst üste (overlap) sorunsuz çalabilmesi için her defasında objeyi klonluyoruz
        const clone = audioObj.cloneNode();
        clone.volume = volume;
        clone.currentTime = startAt; // Sesin başındaki sessizliği atlamak için
        clone.play().catch(e => console.log('Ses çalma hatası:', e));
    }

    // Elementleri Yakala
    const train = document.getElementById('flyingTrain');
    const oldSceneImg = document.querySelector('#oldScene img');
    const newSceneContainer = document.getElementById('newScene');
    const newSceneImg = document.querySelector('#newScene img');

    // Manzara Havuzu
    const scenes = [
        'image/nature.webp', // Ghibli Vadisi
        'image/sea.webp'     // Sahil Kasabası
    ];
    let currentSceneIndex = 0;
    let isFlying = false;

    // Başlangıç Ayarları
    oldSceneImg.src = scenes[0];
    newSceneImg.src = scenes[0];

    // --- GECE MODU MANTIĞI ---
    let isNightMode = false;
    const lampBtn = document.getElementById('lampBtn');

    function getScenePath(sceneBase, isNight) {
        if (isNight) {
            return sceneBase.replace('.webp', '-night.webp');
        }
        return sceneBase;
    }

    if (lampBtn) {
        lampBtn.addEventListener('click', () => {
            playSound(sfx.lamp, 1.0); // Lamba açma/kapatma sesi

            isNightMode = !isNightMode;
            document.body.classList.toggle('night-mode', isNightMode);

            // Gece olunca maskotu uyut (z_z), gündüz olunca uyandır
            const face = document.getElementById('mascotFace');
            if (face) {
                Array.from(face.classList).forEach(cls => {
                    if (cls.startsWith('mood-')) face.classList.remove(cls);
                });
                face.classList.add(isNightMode ? 'mood-sleepy' : 'mood-default');
                currentMoodIndex = isNightMode ? 3 : 0; // 3:sleepy, 0:default
            }

            // Yumuşak geçiş için lambayı hafifçe soldur (CSS opacity 0.2s)
            lampBtn.style.opacity = '0';
            setTimeout(() => {
                // Resmi değiştir ve tekrar görünür yap
                lampBtn.src = isNightMode ? 'image/lamb-night.webp' : 'image/lamb.webp';
                lampBtn.style.opacity = '1';
            }, 200);

            // O anki pencere manzarasını gece/gündüz versiyonuna YUMUŞAKÇA çevir (Crossfade)
            const currentSceneBase = scenes[currentSceneIndex];

            // Yeni resmi (gece/gündüz) üst katmana yükle
            newSceneImg.src = getScenePath(currentSceneBase, isNightMode);

            // Üst katmanı soldan sağa kayarak değil, yavaşça belirerek (opacity) göster
            newSceneContainer.style.transition = 'none'; // Önce transition'ı kapat ki opacity 0 aniden olsun
            newSceneContainer.style.opacity = '0';
            newSceneContainer.style.clipPath = 'inset(0 0 0 0)';

            newSceneContainer.offsetHeight; // Reflow (Tarayıcı opacity:0'ı kaydetsin)

            newSceneContainer.style.transition = 'opacity 1s ease-in-out'; // Transition'ı geri aç
            newSceneContainer.style.opacity = '1'; // Yumuşak geçiş başlar

            // Geçiş bitince arkadaki ana resmi de güncelle ve sistemi normale döndür
            setTimeout(() => {
                oldSceneImg.src = getScenePath(currentSceneBase, isNightMode);
                newSceneContainer.style.transition = 'none';
                newSceneContainer.style.opacity = '';
                newSceneContainer.style.clipPath = 'inset(0 0 0 100%)'; // Tekrar tamamen gizle
            }, 1000);
        });
    }

    // Trene Tıklama Olayı (Event Listener)
    train.addEventListener('click', () => {
        if (isFlying) return;
        isFlying = true;

        // Maskotun mevcut yüzünü geçici olarak kaydedip şaşkınlık (o_o) ifadesini ekle
        const face = document.getElementById('mascotFace');
        let oldMood = '';
        if (face) {
            Array.from(face.classList).forEach(cls => {
                if (cls.startsWith('mood-')) {
                    oldMood = cls;
                    face.classList.remove(cls);
                }
            });
            face.classList.add('mood-surprised');
        }

        // Sıradaki manzarayı belirle
        let nextSceneIndex = (currentSceneIndex + 1) % scenes.length;

        // Yeni manzaranın resmini arkada yükle (gizliyken)
        newSceneImg.src = getScenePath(scenes[nextSceneIndex], isNightMode);

        // --- ANİMASYONLARI BAŞLAT ---
        playSound(sfx.trainStart, 0.6, 0.25); // Kalkış düdüğü/buhar sesi (Ses yarıya kısıldı, baştaki boşluk atlandı)

        // 1. Zıplama ve Titreme (Çalar Saat Etkisi)
        train.style.animation = 'none';
        train.offsetHeight; // Reflow
        train.style.animation = 'trainJumpShake 1s ease-in-out forwards';

        // 2. Sıçrama bitince (1sn sonra) asıl uçuşu başlat
        setTimeout(() => {
            // Tren Uçuşu
            train.style.animation = 'none';
            train.offsetHeight;
            train.style.animation = 'flyAcrossScreen 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards';

            // Sahne Silme (Wipe) Efekti
            newSceneContainer.style.animation = 'none';
            newSceneContainer.offsetHeight;
            newSceneContainer.style.animation = 'wipeScene 4s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards';

            // --- ANİMASYON BİTİNCE TEMİZLİK ---
            setTimeout(() => {
                // Eski manzarayı değiştir
                currentSceneIndex = nextSceneIndex;
                oldSceneImg.src = getScenePath(scenes[currentSceneIndex], isNightMode);

                // Başa sar
                newSceneContainer.style.animation = 'none';
                train.style.animation = 'floatInPlace 4s ease-in-out infinite';
                isFlying = false;

                // Maskotun eski yüzünü (uçuş bitince) geri getir
                if (face) {
                    face.classList.remove('mood-surprised');
                    if (oldMood) face.classList.add(oldMood);
                }
            }, 4000); // 4 saniye süren uçuşun bitmesini bekle

        }, 1000); // 1 saniyelik zıplamayı bekle
    });

    // Bitkiye (Saksıya) Tıklama Olayı (Sallanma)
    const plant = document.querySelector('.plant');
    plant.addEventListener('click', () => {
        // Eğer bitki zaten sallanıyorsa tekrar tıklamayı yoksay
        if (plant.classList.contains('shake-anim')) return;

        playSound(sfx.plant, 0.8); // Bitki hışırtı sesi

        // Animasyonu başlat
        plant.classList.add('shake-anim');

        // 1.5 saniye sonra (animasyon bitince) sınıfı temizle ki tekrar tıklanabilsin
        setTimeout(() => {
            plant.classList.remove('shake-anim');
        }, 1500);
    });

    // Kupa (Kahve) Tıklama Olayı
    const mug = document.getElementById('mugContainer');
    if (mug) {
        mug.addEventListener('click', () => {
            if (mug.classList.contains('shake-anim')) return;
            playSound(sfx.coffee, 1.0); // Kahve yudum/kupa sesi
            mug.classList.add('shake-anim');
            setTimeout(() => {
                mug.classList.remove('shake-anim');
            }, 500);
        });
    }

    // --- MİNİ MASKOT FARE TAKİBİ ---
    const miniFace = document.getElementById('miniMascotFace');
    const room = document.querySelector('.room-container');

    room.addEventListener('mousemove', (e) => {
        if (!miniFace) return;

        // Odanın (ekranın) boyutlarını alıyoruz
        const rect = room.getBoundingClientRect();

        // Farenin odanın içindeki yüzde kaçlık kısımda olduğunu buluyoruz (0 ile 1 arası)
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Yüzün ne kadar hareket edeceğini belirliyoruz (Örn: max -4px ile +4px arası)
        const moveX = (x - 0.5) * 8;
        const moveY = (y - 0.5) * 8;

        // Yüzün orjinal translate(-50%, -50%) merkezlemesini bozmadan üstüne kaymayı ekliyoruz
        miniFace.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
    });

    // Mini Maskot Tıklama Olayı (Ses Efekti)
    const miniMascotContainer = document.getElementById('miniMascotContainer');
    if (miniMascotContainer) {
        miniMascotContainer.addEventListener('click', () => {
            playSound(sfx.miniMascot, 0.42);
        });
    }

    // --- YEŞİL BUTON İLE ANA MASKOT YÜZÜ DEĞİŞTİRME ---
    const greenBtn = document.querySelector('.green-btn');
    const mainMascotFace = document.getElementById('mascotFace');

    // Geçiş yapılacak ruh halleri listesi
    const moods = ['mood-default', 'mood-dead', 'mood-surprised', 'mood-sleepy', 'mood-angry'];
    let currentMoodIndex = 0;

    if (greenBtn && mainMascotFace) {
        greenBtn.addEventListener('click', () => {
            // Mevcut ruh halini sil
            Array.from(mainMascotFace.classList).forEach(cls => {
                if (cls.startsWith('mood-')) mainMascotFace.classList.remove(cls);
            });

            // Sonraki ruh haline geç (Listenin sonuna gelince başa döner)
            currentMoodIndex = (currentMoodIndex + 1) % moods.length;

            // Yeni ruh halini ekle
            mainMascotFace.classList.add(moods[currentMoodIndex]);
        });
    }

    // --- ÇOKLU OYUN KONSOLU SİSTEMİ ---
    const gameboyBtn = document.getElementById('gameboyBtn');
    const consoleOverlay = document.getElementById('gameConsoleOverlay');
    const closeConsoleBtn = document.getElementById('closeConsoleBtn');
    const switchGameBtn = document.getElementById('switchGameBtn');
    const gameTitleText = document.getElementById('gameTitleText');
    const gameScoreElement = document.getElementById('gameScore');
    const gameFooterText = document.getElementById('gameFooterText');

    // Yılan (Snake) Değişkenleri
    const snakeCanvas = document.getElementById('snakeCanvas');
    const ctx = snakeCanvas ? snakeCanvas.getContext('2d') : null;
    let snakeGameInterval;

    // Pong Değişkenleri
    const pongCanvas = document.getElementById('pongCanvas');
    const pongCtx = pongCanvas ? pongCanvas.getContext('2d') : null;
    let pongGameInterval;

    let currentGame = 'snake'; // 'snake' veya 'pong'

    const grid = 20; // Her bir karenin boyutu (px)
    let count = 0;
    let gameSpeed = 8; // Başlangıç hızı (8 = Başlangıç için ideal sakin hız)
    let changingDirection = false; // Aynı kare (frame) içinde iki kere dönmeyi engelleyen kilit

    // Yılan durumu
    let snake = {
        x: 160,
        y: 160,
        dx: grid, // Sağa doğru başlıyor
        dy: 0,
        cells: [],
        maxCells: 4
    };

    // Yem durumu (Kırmızı elma/piksel)
    let food = { x: 320, y: 320 };
    let score = 0;
    let isGameOver = false;

    // Kareli (Canlı Çim) Zemin Çizimi
    function drawBackground() {
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 20; col++) {
                // Çapraz dama tahtası deseni
                if ((row + col) % 2 === 0) {
                    ctx.fillStyle = '#a2d149'; // 🎨 ZEMİN RENGİ 1 (Koyu çim yeşili)
                } else {
                    ctx.fillStyle = '#aad751'; // 🎨 ZEMİN RENGİ 2 (Açık çim yeşili)
                }
                ctx.fillRect(col * grid, row * grid, grid, grid);
            }
        }
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function resetGame() {
        snake.x = 160;
        snake.y = 160;
        snake.cells = [];
        snake.maxCells = 4;
        snake.dx = grid;
        snake.dy = 0;
        score = 0;
        gameSpeed = 8; // Hızı başlangıca sıfırla
        changingDirection = false;
        if (gameScoreElement) gameScoreElement.textContent = score;
        isGameOver = false;

        // Yemi rastgele bir grid konumuna yerleştir
        food.x = getRandomInt(0, 20) * grid;
        food.y = getRandomInt(0, 20) * grid;
    }

    // Oyun Döngüsü (Game Loop)
    function snakeLoop() {
        snakeGameInterval = requestAnimationFrame(snakeLoop);

        // Hızı ayarlama (Daha yüksek sayı = Daha yavaş yılan)
        if (++count < gameSpeed) {
            return;
        }
        count = 0;

        // Yeni bir kare çizildiğinde dönüş kilidini aç
        changingDirection = false;

        // Zemin çizimi
        ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
        drawBackground();

        if (!isGameOver) {
            snake.x += snake.dx;
            snake.y += snake.dy;

            // Duvara çarpma kontrolü (Ölüm)
            if (snake.x < 0 || snake.x >= snakeCanvas.width || snake.y < 0 || snake.y >= snakeCanvas.height) {
                if (!isGameOver) playSound(sfx.snakeDead, 0.6);
                isGameOver = true;
                // Çarptığı an hareketini geri al (duvara gömülmeyi engeller)
                snake.x -= snake.dx;
                snake.y -= snake.dy;
            } else {
                // Eğer ölmediyse ilerlemeye devam et ve diziyi güncelle
                snake.cells.unshift({ x: snake.x, y: snake.y });

                // Yılanın boyunu sınırla (Kuyruktan kes)
                if (snake.cells.length > snake.maxCells) {
                    snake.cells.pop();
                }
            }
        }

        // Yemi Çiz (Kırmızı Parlak Elma/Böcek)
        ctx.fillStyle = '#ff4757'; // 🎨 YEMİN (ELMANIN) RENGİ (Parlak kırmızı)
        ctx.beginPath();
        // Hafif küçük ve yuvarlak bir yem
        ctx.arc(food.x + grid / 2, food.y + grid / 2, grid / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Yılanı Çiz (Lofi Mavi Renk)
        snake.cells.forEach(function (cell, index) {

            // Yılan yemi yedi mi? (Sadece kafasıyla kontrol)
            if (index === 0 && cell.x === food.x && cell.y === food.y) {
                playSound(sfx.eatApple, 0.6);
                snake.maxCells++;
                score += 10;

                // Yılan yedikçe kademeli hızlanma mantığı
                // Mevcut başlangıç 8. Max sınır 5.5. Yavaş yavaş (0.1) hızlanır.
                if (gameSpeed > 5.5) {
                    gameSpeed -= 0.1; // Hızlanma miktarı çok daha yumuşak yapıldı
                }

                if (gameScoreElement) gameScoreElement.textContent = score;
                food.x = getRandomInt(0, 20) * grid;
                food.y = getRandomInt(0, 20) * grid;
            }

            // Kendi kuyruğuna çarptı mı?
            for (let i = index + 1; i < snake.cells.length; i++) {
                if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
                    if (!isGameOver) playSound(sfx.snakeDead, 0.6);
                    isGameOver = true;
                }
            }

            // Eğer yılanın ilk hücresi ise (Kafa), oraya maskot yüzünü çizeceğiz
            if (index === 0) {
                // Kafanın arka planı (Dikkat çekici fosforlu renk yapıldı ki bulabilesin)
                ctx.fillStyle = '#040000ff'; // 🎨 YILANIN KAFASININ ARKA PLAN RENGİ (Fosforlu Yeşil)
                ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);

                // Kafaya maskot yüzü
                ctx.fillStyle = '#ffffffff'; // 🎨 YÜZ İFADESİNİN (-_- veya x_x) YAZI RENGİ (Siyah)
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let face = isGameOver ? "x_x" : "-_-"; // Ölünce yüz x_x olur
                ctx.fillText(face, cell.x + grid / 2, cell.y + grid / 2);
            } else {
                // Gövde hücresi
                ctx.fillStyle = '#040000ff'; // 🎨 YILANIN GÖVDESİNİN (KUYRUĞUNUN) RENGİ (Koyu Fosforlu Yeşil)
                ctx.fillRect(cell.x, cell.y, grid - 1, grid - 1);
            }
        });

        // Game Over Ekranı
        if (isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 🎨 OYUN BİTİNCE EKRANI KARARTMA (Saydamlık 0.5 yapıldı ki yılanın x_x yüzü net görünsün)
            ctx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);

            ctx.fillStyle = '#ffffff'; // 🎨 OYUN BİTTİ YAZISI RENGİ
            ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText("OYUN BİTTİ!", snakeCanvas.width / 2, snakeCanvas.height / 2 - 10);

            ctx.font = '14px Courier New';
            ctx.fillStyle = '#a2d149'; // 🎨 YENİDEN BAŞLA YAZISI RENGİ
            ctx.fillText("Yeniden başlamak için", snakeCanvas.width / 2, snakeCanvas.height / 2 + 20);
            ctx.fillText("BOŞLUK tuşuna bas", snakeCanvas.width / 2, snakeCanvas.height / 2 + 40);

            // x_x Yüzü kapanmasın diye en son bir daha sadece kafayı üste çiziyoruz
            ctx.fillStyle = '#ff1414ff'; // Kafa rengi
            ctx.fillRect(snake.cells[0].x, snake.cells[0].y, grid - 1, grid - 1);
            ctx.fillStyle = '#fcfcfcff'; // Yüz rengi
            ctx.font = 'bold 12px Courier New';
            ctx.fillText("x_x", snake.cells[0].x + grid / 2, snake.cells[0].y + grid / 2);
        }
    }

    // ==========================================
    // === PING PONG (EMOJI PONG) SİSTEMİ ===
    // ==========================================
    let pongScore = 0;
    let isPongGameOver = false;
    let pongKeys = { left: false, right: false }; // Tuş basılı tutma takibi

    let pongPaddle = {
        x: 150,
        y: 370,
        width: 100, // Raket genişliği artırıldı (eski: 80)
        height: 14, // Raket kalınlığı artırıldı (eski: 10)
        dx: 0,
        speed: 6
    };
    let pongBall = {
        x: 200,
        y: 200,
        size: 26, // Top boyutu artırıldı (eski: 20)
        dx: 2.5, // Hız ciddi oranda düşürüldü (önceki: 4)
        dy: 2.5
    };

    function resetPong() {
        pongScore = 0;
        if (gameScoreElement) gameScoreElement.textContent = pongScore;
        isPongGameOver = false;
        pongPaddle.x = 160;
        pongPaddle.dx = 0;
        pongKeys.left = false;
        pongKeys.right = false;
        pongBall.x = 200;
        pongBall.y = 200;
        // Başlangıç hızı ve yönü
        pongBall.dx = 2.5 * (Math.random() > 0.5 ? 1 : -1);
        pongBall.dy = -2.5; // Önce yukarı doğru seker
    }

    function drawPongBackground() {
        // CRT ekranla uyumlu koyu arka plan ve ince Grid (ızgara)
        pongCtx.fillStyle = '#1a2421';
        pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);

        pongCtx.strokeStyle = '#2c2f28';
        pongCtx.lineWidth = 1;
        for (let i = 0; i < 400; i += 40) {
            pongCtx.beginPath();
            pongCtx.moveTo(i, 0);
            pongCtx.lineTo(i, 400);
            pongCtx.stroke();
            pongCtx.beginPath();
            pongCtx.moveTo(0, i);
            pongCtx.lineTo(400, i);
            pongCtx.stroke();
        }
    }

    function pongLoop() {
        pongGameInterval = requestAnimationFrame(pongLoop);

        pongCtx.clearRect(0, 0, pongCanvas.width, pongCanvas.height);
        drawPongBackground();

        if (!isPongGameOver) {
            // Raket Hızı Güncelleme (Tuş Takibine Göre)
            if (pongKeys.left && !pongKeys.right) pongPaddle.dx = -pongPaddle.speed;
            else if (pongKeys.right && !pongKeys.left) pongPaddle.dx = pongPaddle.speed;
            else pongPaddle.dx = 0;

            // Raket Hareketi
            pongPaddle.x += pongPaddle.dx;
            // Duvar Sınırları (Raket ekran dışına çıkmasın)
            if (pongPaddle.x < 0) pongPaddle.x = 0;
            if (pongPaddle.x + pongPaddle.width > pongCanvas.width) pongPaddle.x = pongCanvas.width - pongPaddle.width;

            // Top Hareketi
            pongBall.x += pongBall.dx;
            pongBall.y += pongBall.dy;

            // Duvara Çarpma (Sağ ve Sol)
            if (pongBall.x < 0 || pongBall.x + pongBall.size > pongCanvas.width) {
                pongBall.dx *= -1; // Yön değiştir
                pongBall.x += pongBall.dx; // Duvara yapışmayı önle
            }

            // Tavana Çarpma
            if (pongBall.y < 0) {
                pongBall.dy *= -1; // Yön değiştir
                pongBall.y += pongBall.dy;
            }

            // Rakete Çarpma (Önemsiz hataları önlemek için geniş bir kontrol)
            if (pongBall.dy > 0 &&
                pongBall.y + pongBall.size >= pongPaddle.y &&
                pongBall.y + pongBall.size <= pongPaddle.y + pongPaddle.height + 5 &&
                pongBall.x + pongBall.size >= pongPaddle.x &&
                pongBall.x <= pongPaddle.x + pongPaddle.width) {

                playSound(sfx.pongRacket, 0.8);
                pongBall.dy *= -1; // Yukarı sektir

                // Çarptıktan sonra topta kademeli hızlanma (Instagram mantığı)
                if (Math.abs(pongBall.dy) < 10) { // Max hız limiti
                    pongBall.dy = pongBall.dy < 0 ? pongBall.dy - 0.4 : pongBall.dy + 0.4; // Hızlanma miktarı ayarlandı
                    pongBall.dx = pongBall.dx < 0 ? pongBall.dx - 0.4 : pongBall.dx + 0.4;
                }

                pongScore += 10;
                if (gameScoreElement) gameScoreElement.textContent = pongScore;
            }

            // Yere Düşme (Yanma - Game Over)
            if (pongBall.y > pongCanvas.height) {
                if (!isPongGameOver) playSound(sfx.pongDead, 0.8);
                isPongGameOver = true;
            }
        }

        // Raketi Çiz
        pongCtx.fillStyle = '#cc4731'; // Turuncu-kırmızı (CRT kasa uyumlu)
        pongCtx.fillRect(pongPaddle.x, pongPaddle.y, pongPaddle.width, pongPaddle.height);

        // Topu Çiz (Sadece Yuvarlak Simge, Yüz kaldırıldı)
        pongCtx.fillStyle = '#39ff14'; // Fosforlu yeşil daire
        pongCtx.beginPath();
        pongCtx.arc(pongBall.x + pongBall.size / 2, pongBall.y + pongBall.size / 2, pongBall.size / 2, 0, Math.PI * 2);
        pongCtx.fill();

        // Game Over Ekranı
        if (isPongGameOver) {
            pongCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            pongCtx.fillRect(0, 0, pongCanvas.width, pongCanvas.height);

            pongCtx.fillStyle = '#ffffff';
            pongCtx.font = 'bold 24px Courier New';
            pongCtx.textAlign = 'center';
            pongCtx.fillText("OYUN BİTTİ!", pongCanvas.width / 2, pongCanvas.height / 2 - 10);

            pongCtx.font = '14px Courier New';
            pongCtx.fillStyle = '#39ff14';
            pongCtx.fillText("Yeniden başlamak için", pongCanvas.width / 2, pongCanvas.height / 2 + 20);
            pongCtx.fillText("BOŞLUK tuşuna bas", pongCanvas.width / 2, pongCanvas.height / 2 + 40);
        }
    }

    // ==========================================
    // === KLAVYE VE OYUN GEÇİŞ SİSTEMİ ===
    // ==========================================

    // Klavye Kontrolleri (Tuşa Basılınca)
    document.addEventListener('keydown', function (e) {
        if (consoleOverlay && !consoleOverlay.classList.contains('hidden')) {

            // Ok tuşlarının sayfayı kaydırmasını engelle
            if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
                e.preventDefault();
            }

            if (currentGame === 'snake') {
                if (isGameOver && e.code === 'Space') {
                    resetGame();
                    return;
                }

                if (changingDirection) return; // Yılan çift tuş engeli

                if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && snake.dx === 0) {
                    snake.dx = -grid; snake.dy = 0; changingDirection = true;
                }
                else if ((e.code === 'ArrowUp' || e.code === 'KeyW') && snake.dy === 0) {
                    snake.dy = -grid; snake.dx = 0; changingDirection = true;
                }
                else if ((e.code === 'ArrowRight' || e.code === 'KeyD') && snake.dx === 0) {
                    snake.dx = grid; snake.dy = 0; changingDirection = true;
                }
                else if ((e.code === 'ArrowDown' || e.code === 'KeyS') && snake.dy === 0) {
                    snake.dy = grid; snake.dx = 0; changingDirection = true;
                }
            }
            else if (currentGame === 'pong') {
                if (isPongGameOver && e.code === 'Space') {
                    resetPong();
                    return;
                }

                if (e.code === 'ArrowLeft' || e.code === 'KeyA') pongKeys.left = true;
                if (e.code === 'ArrowRight' || e.code === 'KeyD') pongKeys.right = true;
            }
        }
    });

    // Klavye Kontrolleri (Tuştan El Çekilince - Pong Raketi Durdurma)
    document.addEventListener('keyup', function (e) {
        if (currentGame === 'pong') {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') pongKeys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') pongKeys.right = false;
        }
    });

    // ==========================================
    // === MANTAR PANO (CORKBOARD) SİSTEMİ ===
    // ==========================================
    const corkboardBtn = document.getElementById('corkboardBtn');
    const panoOverlay = document.getElementById('panoOverlay');
    const closePanoBtn = document.getElementById('closePanoBtn');

    if (corkboardBtn && panoOverlay && closePanoBtn) {
        corkboardBtn.addEventListener('click', () => {
            // Pano sesinin başındaki boşluğu atlamak için 3. parametre (örn: 0.2 saniye)
            playSound(sfx.panoStart, 1.0, 0.2);
            panoOverlay.classList.remove('hidden');
            // Arkadaki duvar (pillarbox) rengini siyah yap
            document.body.classList.add('terminal-transition-bg');
        });

        closePanoBtn.addEventListener('click', () => {
            playSound(sfx.atariButton, 0.8);
            panoOverlay.classList.add('hidden');
            // Siyah arka planı kaldır ve eski duvar rengine dön
            document.body.classList.remove('terminal-transition-bg');
            // Panoyu kapatınca açık olan hakkımda popup'ı varsa onu da gizle
            const aboutPopup = document.getElementById('aboutPopup');
            if (aboutPopup) aboutPopup.classList.add('hidden');
        });
    }

    // Hakkında (Sticker) Tıklama İşlemleri
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutPopup = document.getElementById('aboutPopup');
    const closeAboutBtn = document.getElementById('closeAboutBtn');

    if (aboutBtn && aboutPopup && closeAboutBtn) {
        aboutBtn.addEventListener('click', () => {
            aboutPopup.classList.remove('hidden');
        });

        closeAboutBtn.addEventListener('click', () => {
            aboutPopup.classList.add('hidden');
        });
    }

    // Görevler (To-Do List) Tıklama İşlemleri
    const todoList = document.getElementById('interactiveTodoList');
    if (todoList) {
        todoList.addEventListener('click', (e) => {
            // Eğer tıklanan element bir 'li' ise (görev maddesi)
            if (e.target && e.target.nodeName === 'LI' && e.target.classList.contains('todo-item')) {
                if (e.target.classList.contains('unchecked')) {
                    e.target.classList.remove('unchecked');
                    e.target.classList.add('checked');
                } else {
                    e.target.classList.remove('checked');
                    e.target.classList.add('unchecked');
                }
            }
        });
    }

    // Panodaki menü elemanlarına hover (üzerine gelme) sesi ekleme
    const attachPanoHoverSound = (selector, volume = 0.4) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                playSound(sfx.hover, volume);
            });
        });
    };

    // Pano açıldıktan sonra elemanlara sesi bağla
    attachPanoHoverSound('.contact-links a', 1.0);
    attachPanoHoverSound('.todo-item', 1.0);
    attachPanoHoverSound('#aboutBtn', 1.0);

    // ==========================================
    // === MASKOT İÇİNE GİRİŞ (PROJELER) ===
    // ==========================================
    const mainMascotContainer = document.getElementById('mascotContainer');
    const roomContainer = document.querySelector('.room-container');
    const projectsOverlay = document.getElementById('projectsOverlay');
    const closeProjectsBtn = document.getElementById('closeProjectsBtn');

    if (mainMascotContainer && roomContainer && projectsOverlay && closeProjectsBtn) {
        mainMascotContainer.addEventListener('click', () => {
            playSound(sfx.mascotZoom, 1.0, 0.27); // Zoom in efekti (Siber/Matrix giriş sesi) - Baştaki boşluk atlandı
            // 1. Odayı Maskotun yüzüne doğru devasa büyüt (Zoom in)
            roomContainer.classList.add('zoomed-into-mascot');
            // Arkadaki duvar (pillarbox) rengini yumuşakça siyaha çevir
            document.body.classList.add('terminal-transition-bg');
            // Animasyon sırasında fare hover olaylarını kapat ki eşyalar ve maskot gözleri buga girmesin
            roomContainer.style.pointerEvents = 'none';

            // 2. 1.5 saniye (CSS transition süresi) bekleyip dijital arayüzü göster
            setTimeout(() => {
                projectsOverlay.classList.remove('hidden');
                // CSS opacity animasyonunun çalışması için çok ufak bir gecikme
                setTimeout(() => {
                    projectsOverlay.style.opacity = '1';
                }, 50);
            }, 1200); // Ekran tam kararmadan hemen önce arayüzü belirmeye başlat
        });

        // Terminal (Projeler) ekranındaki elemanlara hover (üzerine gelme) sesi ekleme (Pano mantığı ile aynı)
        const attachTerminalHoverSound = (selector, volume = 1.0) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    // Sesin başından "çok az" (0.08 saniye) kırpıldı
                    playSound(sfx.cyberClick, volume, 0.135);
                });
            });
        };

        // Sadece proje kartlarına siber hover sesini bağla
        attachTerminalHoverSound('.project-card', 0.7);

        // "İncele" yazılarına (butonlarına) yeni eklenen detay sesini bağla
        const attachTerminalDetailSound = (selector, volume = 1.0) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    playSound(sfx.terminalDetail, volume);
                });
            });
        };
        // İncele sesini "çok çok az" kıstık (1.0'dan 0.8'e)
        attachTerminalDetailSound('.project-btn', 0.8);

        closeProjectsBtn.addEventListener('click', () => {
            playSound(sfx.terminalOut, 1.0); // Kapatma sesi olarak terminal-out sesi eklendi

            // 1. Dijital arayüzü yavaşça sil (Fade out)
            projectsOverlay.style.opacity = '0';

            // 2. Arayüz silinirken AYNI ANDA kamerayı geri çek (Zoom out)
            // Bu sayede garip siyah bekleme süresi ortadan kalkıyor
            roomContainer.classList.remove('zoomed-into-mascot');
            // Siyah olan arka plan rengini eski duvar rengine yumuşakça geri çevir
            document.body.classList.remove('terminal-transition-bg');

            // 3. Arayüz tamamen görünmez olduktan sonra HTML'den gizle
            setTimeout(() => {
                projectsOverlay.classList.add('hidden');
            }, 500);

            // 4. Zoom out (1.2s) tamamen bittikten sonra odadaki eşyalara tıklama/hover özelliğini geri ver
            setTimeout(() => {
                roomContainer.style.pointerEvents = 'auto';
            }, 1200);
        });
    }

    // ==========================================
    // === OYUN KONSOLU AÇMA / KAPATMA ===
    // ==========================================
    // Oyunu Açma, Kapatma ve Değiştirme
    if (gameboyBtn && consoleOverlay && closeConsoleBtn && switchGameBtn) {

        // Gameboy'a tıklanınca (Konsolu Aç)
        gameboyBtn.addEventListener('click', () => {
            // Atari sesinin başındaki boşluğu atlamak için 3. parametre (0.6 saniye yapıldı)
            playSound(sfx.atariStart, 0.7, 0.6);
            consoleOverlay.classList.remove('hidden');
            // Arkadaki duvar (pillarbox) rengini siyah yap
            document.body.classList.add('terminal-transition-bg');
            if (currentGame === 'snake') {
                resetGame();
                snakeGameInterval = requestAnimationFrame(snakeLoop);
            } else {
                resetPong();
                pongGameInterval = requestAnimationFrame(pongLoop);
            }
        });

        // X (Kapat) tuşuna basılınca
        closeConsoleBtn.addEventListener('click', () => {
            playSound(sfx.atariButton, 0.8);
            consoleOverlay.classList.add('hidden');
            // Siyah arka planı kaldır ve eski duvar rengine dön
            document.body.classList.remove('terminal-transition-bg');
            cancelAnimationFrame(snakeGameInterval);
            cancelAnimationFrame(pongGameInterval);
        });

        // 🔄 (Oyun Değiştir) tuşuna basılınca
        switchGameBtn.addEventListener('click', () => {
            playSound(sfx.atariButton, 0.8);
            if (currentGame === 'snake') {
                // Pong'a Geçiş
                currentGame = 'pong';
                cancelAnimationFrame(snakeGameInterval); // Yılanı durdur
                snakeCanvas.classList.add('hidden'); // Yılanı gizle
                pongCanvas.classList.remove('hidden'); // Pong'u göster

                if (switchGameBtn) switchGameBtn.textContent = '←';
                if (gameTitleText) gameTitleText.textContent = 'PING PONG';
                if (gameFooterText) gameFooterText.textContent = 'RAKET İÇİN SAĞ/SOL veya A/D TUŞLARINI KULLAN';

                if (gameScoreElement) gameScoreElement.textContent = pongScore;

                resetPong();
                pongGameInterval = requestAnimationFrame(pongLoop);
            } else {
                // Yılan'a Dönüş
                currentGame = 'snake';
                cancelAnimationFrame(pongGameInterval); // Pong'u durdur
                pongCanvas.classList.add('hidden'); // Pong'u gizle
                snakeCanvas.classList.remove('hidden'); // Yılanı göster

                if (switchGameBtn) switchGameBtn.textContent = '→';
                if (gameTitleText) gameTitleText.textContent = 'YILAN OYUNU';
                if (gameFooterText) gameFooterText.textContent = 'YILAN İÇİN YÖN veya W/A/S/D TUŞLARINI KULLAN';

                if (gameScoreElement) gameScoreElement.textContent = score;

                resetGame();
                snakeGameInterval = requestAnimationFrame(snakeLoop);
            }
        });
    }

    // ==========================================
    // === MÜZİK ÇALAR (MINI PLAYER) MANTIĞI ===
    // ==========================================
    const cassetteBtn = document.getElementById('cassetteBtn');
    const musicPlayerWidget = document.getElementById('musicPlayerWidget');
    const closeMusicBtn = document.getElementById('closeMusicBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevSongBtn = document.getElementById('prevSongBtn');
    const nextSongBtn = document.getElementById('nextSongBtn');
    const songNameDisplay = document.getElementById('songNameDisplay');
    const musicNotesContainer = document.getElementById('musicNotesContainer');

    // Tembel yükleme (Lazy Load) için dosya yolları ve özel ses seviyeleri
    const playlist = [
        { title: "YAĞMUR SESİ", src: "sound/rain.ogg", volume: 1.0 },
        { title: "PİYANO RESİTALİ", src: "sound/piano.ogg", volume: 0.55 }, // Piyanonun sesi biraz daha açıldı
        { title: "KUŞ CIVILTILARI", src: "sound/bird.ogg", volume: 1.0 }
    ];

    let currentSongIndex = 0;
    let isMusicPlaying = false;
    let currentAudio = null;
    let isFirstOpen = true;
    let noteInterval;

    function createMusicNote() {
        if (!isMusicPlaying) return;
        const note = document.createElement('div');
        note.classList.add('music-note');
        note.textContent = Math.random() > 0.5 ? '♪' : '♫';
        const leftPos = (Math.random() * 30) - 50;
        note.style.left = `calc(50% + ${leftPos}px)`;
        musicNotesContainer.appendChild(note);

        setTimeout(() => {
            if (note.parentNode) {
                note.parentNode.removeChild(note);
            }
        }, 2000);
    }

    const loadAndPlayTrack = (index) => {
        // Önceki müziği durdur ve temizle
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        // Seçili şarkıyı yarat ve çal
        currentAudio = new Audio(playlist[index].src);
        currentAudio.loop = true;
        currentAudio.volume = playlist[index].volume; // Şarkıya özel ses seviyesini ayarla

        songNameDisplay.textContent = "ÇALINIYOR: " + playlist[index].title;

        currentAudio.play().then(() => {
            isMusicPlaying = true;
            playPauseBtn.textContent = "||";
            musicPlayerWidget.classList.add('playing');
            cassetteBtn.classList.add('playing-music-glow');
            if (!noteInterval) noteInterval = setInterval(createMusicNote, 1000);

            // YAĞMUR EFEKTİ KONTROLÜ (Sadece 1. Şarkı (index 0) çalarken yağsın)
            const rainOverlay = document.getElementById('rainOverlay');
            if (rainOverlay) {
                if (index === 0) rainOverlay.classList.add('active');
                else rainOverlay.classList.remove('active');
            }
        }).catch(e => console.log("Müzik çalınamadı:", e));
    };

    function toggleMusic() {
        if (!currentAudio) {
            loadAndPlayTrack(currentSongIndex);
            return;
        }

        if (isMusicPlaying) {
            currentAudio.pause();
            isMusicPlaying = false;
            playPauseBtn.textContent = '►';
            songNameDisplay.textContent = "DURAKLATILDI: " + playlist[currentSongIndex].title;
            musicPlayerWidget.classList.remove('playing');
            cassetteBtn.classList.remove('playing-music-glow');
            
            // Şarkı durduğunda yağmur da dursun
            const rainOverlay = document.getElementById('rainOverlay');
            if (rainOverlay) rainOverlay.classList.remove('active');
            clearInterval(noteInterval);
            noteInterval = null;
        } else {
            currentAudio.play();
            isMusicPlaying = true;
            playPauseBtn.textContent = '||';
            songNameDisplay.textContent = "ÇALINIYOR: " + playlist[currentSongIndex].title;
            musicPlayerWidget.classList.add('playing');
            cassetteBtn.classList.add('playing-music-glow');

            // Şarkı devam ettiğinde, eğer yağmur şarkısıysa yağmuru geri başlat
            const rainOverlay = document.getElementById('rainOverlay');
            if (rainOverlay && currentSongIndex === 0) rainOverlay.classList.add('active');
            if (!noteInterval) noteInterval = setInterval(createMusicNote, 1000);
        }
    }

    function changeSong(direction) {
        playSound(sfx.miniMascot, 0.2); // İleri/Geri tuşlarının sesi epeyce kısıldı
        currentSongIndex += direction;
        if (currentSongIndex < 0) currentSongIndex = playlist.length - 1;
        if (currentSongIndex >= playlist.length) currentSongIndex = 0;

        loadAndPlayTrack(currentSongIndex);
    }

    if (cassetteBtn && musicPlayerWidget) {
        cassetteBtn.addEventListener('click', () => {
            const isHidden = musicPlayerWidget.classList.contains('hidden');
            if (isHidden) {
                musicPlayerWidget.classList.remove('hidden');

                // Kaset ilk defa açılıyorsa ilk şarkı (Yağmur) çalsın
                if (isFirstOpen) {
                    isFirstOpen = false;
                    loadAndPlayTrack(0);
                } else if (!isMusicPlaying) {
                    // Eğer X ile durdurulmuşsa kaldığı yerden otomatik devam etsin
                    toggleMusic();
                }
            } else {
                // Kaset kendisine tıklanarak kapatılırsa sadece UI gizlenir, müzik çalmaya DEVAM EDER
                musicPlayerWidget.classList.add('hidden');
            }
        });

        closeMusicBtn.addEventListener('click', () => {
            playSound(sfx.miniMascot, 0.2); // Kapatma butonunun sesi kısıldı
            musicPlayerWidget.classList.add('hidden');

            // Çarpı (X) butonuna basılınca kaset TAMAMEN KAPANSIN (Müzik dursun)
            if (currentAudio && isMusicPlaying) {
                currentAudio.pause();
                isMusicPlaying = false;
                playPauseBtn.textContent = '►';
                songNameDisplay.textContent = "DURAKLATILDI: " + playlist[currentSongIndex].title;
                musicPlayerWidget.classList.remove('playing');
                cassetteBtn.classList.remove('playing-music-glow');
                
                // Müzik player çarpıdan kapatıldığında yağmur dursun
                const rainOverlay = document.getElementById('rainOverlay');
                if (rainOverlay) rainOverlay.classList.remove('active');
                clearInterval(noteInterval);
                noteInterval = null;
            }
        });

        playPauseBtn.addEventListener('click', () => {
            playSound(sfx.miniMascot, 0.3); // Oynat/Durdur butonunun sesi kısıldı
            toggleMusic();
        });

        prevSongBtn.addEventListener('click', () => changeSong(-1));
        nextSongBtn.addEventListener('click', () => changeSong(1));
    }

});
