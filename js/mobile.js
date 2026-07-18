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

    // --- ABOUT MODAL MANTIĞI ---
    const aboutBtn = document.getElementById('aboutBtn');
    const aboutModal = document.getElementById('aboutModal');
    const aboutCloseBtn = document.getElementById('aboutCloseBtn');

    if (aboutBtn && aboutModal && aboutCloseBtn) {
        // Butona tıklanınca overlay'i aç
        aboutBtn.addEventListener('click', () => {
            aboutModal.classList.remove('hidden');
        });

        // X butonuna tıklanınca overlay'i kapat
        aboutCloseBtn.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });

        // Overlay'in siyah/bulanık kısmına (boşluğa) tıklayınca da kapat
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.add('hidden');
            }
        });
    }

});
