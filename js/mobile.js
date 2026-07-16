// ==========================================================================
// MOBİL JS SADECE mobile.html İÇİNDİR
// Masaüstü oyun kodlarını ve ağır sistemleri içermez, sadece temel UI etkileşimleri.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTLER ---
    const mascotContainer = document.getElementById('mobileMascotContainer');
    const mascotImage = document.getElementById('mascotImage');
    const projectsOverlay = document.getElementById('projectsOverlay');
    const closeProjectsBtn = document.getElementById('closeProjectsBtn');
    
    // --- MASKOT TIKLAMA (TERMİNALİ AÇ) ---
    if (mascotContainer) {
        mascotContainer.addEventListener('click', () => {
            const mascotFace = document.getElementById('mascotFace');
            if(mascotFace) {
                mascotFace.classList.add('happy');
                setTimeout(() => {
                    mascotFace.classList.remove('happy');
                }, 500);
            }

            setTimeout(() => {
                projectsOverlay.classList.remove('hidden');
            }, 600);
        });
    }

    // --- TERMİNALİ KAPAT ---
    if (closeProjectsBtn) {
        closeProjectsBtn.addEventListener('click', () => {
            projectsOverlay.classList.add('hidden');
        });
    }

    // ==========================================================================
    // SİBER-AĞ (CYBER-NODE) KABLO VE SÜRÜKLEME MANTIĞI
    // ==========================================================================
    
    const nodes = [
        // Sol Üst (Referans)
        { id: 'node-instagram', cableId: 'cable-instagram', targetX: '10%', targetY: '15%', url: 'https://instagram.com' },
        // Sağ Üst (Genişliği hesaba katarak simetrik)
        { id: 'node-about', cableId: 'cable-about', targetX: '65%', targetY: '15%', popup: true },
        // Sol Alt (Yüksekliği hesaba katarak simetrik)
        { id: 'node-github', cableId: 'cable-github', targetX: '10%', targetY: '75%', url: 'https://github.com' },
        // Sağ Alt
        { id: 'node-mail', cableId: 'cable-mail', targetX: '70%', targetY: '75%', url: 'mailto:ornek@mail.com' }
    ];

    // Node'ların başlangıç pozisyonlarını ayarla
    nodes.forEach(n => {
        const el = document.getElementById(n.id);
        if(el) {
            el.style.left = n.targetX;
            el.style.top = n.targetY;
        }
    });

    // Kablo çizim döngüsü (60fps)
    function drawCables() {
        if(!mascotImage) return;
        const mascotRect = mascotImage.getBoundingClientRect();
        // Maskotun tam ortasından kablolar çıkacak
        const startX = mascotRect.left + (mascotRect.width / 2);
        const startY = mascotRect.top + (mascotRect.height / 2);

        nodes.forEach(n => {
            const el = document.getElementById(n.id);
            const path = document.getElementById(n.cableId);
            if(el && path) {
                const elRect = el.getBoundingClientRect();
                const endX = elRect.left + (elRect.width / 2);
                const endY = elRect.top + (elRect.height / 2);
                
                // SVG için kavisli yol (Bezier Curve) hesaplama
                // Biraz sarkan, gevşek bir kablo görünümü için kontrol noktalarını aşağı kaydırıyoruz
                const controlX = (startX + endX) / 2;
                const controlY = Math.max(startY, endY) + 50; 

                const d = `M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`;
                path.setAttribute('d', d);
            }
        });
        requestAnimationFrame(drawCables);
    }
    
    // Döngüyü başlat
    drawCables();

    // --- SÜRÜKLE BIRAK (DRAG & DROP WITH SPRING) ---
    nodes.forEach(n => {
        const el = document.getElementById(n.id);
        if(!el) return;

        let isDragging = false;
        let startTouchX = 0, startTouchY = 0;
        let startLeft = 0, startTop = 0;
        let clickTimeout = null;

        el.addEventListener('touchstart', (e) => {
            isDragging = true;
            // Tıklama ile sürüklemeyi ayırt etmek için
            clickTimeout = setTimeout(() => { clickTimeout = null; }, 200); 

            const touch = e.touches[0];
            startTouchX = touch.clientX;
            startTouchY = touch.clientY;
            
            // CSS transition'ı kapat ki parmağı anında takip etsin
            el.style.transition = 'none';
            
            const rect = el.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            
            // Maskotun yüz ifadesini değiştir (> _ <)
            const mascotFace = document.getElementById('mascotFace');
            if (mascotFace) mascotFace.classList.add('squint');
        }, {passive: true});

        el.addEventListener('touchmove', (e) => {
            if(!isDragging) return;
            const touch = e.touches[0];
            const dx = touch.clientX - startTouchX;
            const dy = touch.clientY - startTouchY;
            
            el.style.left = `${startLeft + dx}px`;
            el.style.top = `${startTop + dy}px`;
        }, {passive: true});

        el.addEventListener('touchend', (e) => {
            isDragging = false;
            
            // Yüz ifadesini normale döndür
            const mascotFace = document.getElementById('mascotFace');
            if (mascotFace) mascotFace.classList.remove('squint');
            
            // --- GÖRÜNMEZ EKRAN SINIRLARI VE MASKOT ÇARPIŞMASI ---
            const rect = el.getBoundingClientRect();
            let finalLeft = rect.left;
            let finalTop = rect.top;

            // 1. MASKOT ÇARPIŞMA (Maskotun arkasına gizlenmesini engelleme)
            if (mascotContainer) {
                const mRect = mascotContainer.getBoundingClientRect();
                const mCenterX = mRect.left + mRect.width / 2;
                const mCenterY = mRect.top + mRect.height / 2;
                
                const nCenterX = finalLeft + rect.width / 2;
                const nCenterY = finalTop + rect.height / 2;
                
                const dx = nCenterX - mCenterX;
                const dy = nCenterY - mCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Maskotun yarıçapı + İkonun yarıçapı + 15px tampon bölge
                const minDistance = (mRect.width / 2) + (rect.width / 2) + 15;
                
                if (distance < minDistance) {
                    // Eğer çok yakına (veya tam arkasına) bırakıldıysa, onu dışarı it
                    const pushFactor = distance === 0 ? 1 : distance; // 0'a bölme hatasını engelle
                    const nx = dx === 0 && dy === 0 ? 0 : dx / pushFactor;
                    const ny = dx === 0 && dy === 0 ? -1 : dy / pushFactor; // Tam üstteyse yukarı it
                    
                    finalLeft = mCenterX + (nx * minDistance) - (rect.width / 2);
                    finalTop = mCenterY + (ny * minDistance) - (rect.height / 2);
                }
            }

            // 2. EKRAN KENARI SINIRLARI (Dışarı taşmayı engelleme)
            const padding = 15; 
            const maxX = window.innerWidth - rect.width - padding;
            const maxY = window.innerHeight - rect.height - padding;
            
            if (finalLeft < padding) finalLeft = padding;
            if (finalLeft > maxX) finalLeft = maxX;
            if (finalTop < padding) finalTop = padding;
            if (finalTop > maxY) finalTop = maxY;

            // Eğer kenara çarptıysa yumuşakça ekran içine kayması için transition
            // Ayrıca basılınca küçülme efekti (transform) bozulmasın diye onu da koruyoruz
            el.style.transition = 'left 0.3s ease-out, top 0.3s ease-out, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            // Eski konumuna fırlatmak yerine, yeni konumunda SABİTLE
            el.style.left = `${finalLeft}px`;
            el.style.top = `${finalTop}px`;

            // Eğer çok kısa süre dokunup çektiyse bu bir tıklamadır
            if(clickTimeout) {
                clearTimeout(clickTimeout);
                if(n.url) {
                    window.open(n.url, '_blank');
                } else if(n.popup) {
                    // Hakkında menüsü veya başka eylemler
                    alert("Benim Hikayem: Zzz maskotumuz ve maceralarımız yakında burada olacak!");
                }
            }
        });
    });

});
