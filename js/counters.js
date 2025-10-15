document.addEventListener('DOMContentLoaded', () => {
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateCounter = (element) => {
        const target = +element.getAttribute('data-target');
        const duration = 2000; // La animación durará 2 segundos
        const frameDuration = 1000 / 60; // 60 frames por segundo
        const totalFrames = Math.round(duration / frameDuration);
        let frame = 0;

        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = Math.round(target * progress);

            element.innerText = `+${currentCount}`;

            if (frame === totalFrames) {
                clearInterval(counter);
                element.innerText = `+${target}`; // Asegura el valor final
            }
        }, frameDuration);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach(number => animateCounter(number));
                observer.disconnect(); // Anima solo una vez
            }
        });
    }, {
        threshold: 0.5 // Se activa cuando el 50% del elemento es visible
    });

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
});