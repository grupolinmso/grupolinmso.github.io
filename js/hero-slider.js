// hero-slider.js - JavaScript para el slider hero con barra de progreso
document.addEventListener('DOMContentLoaded', function() {
    class HeroSlider {
        constructor() {
            this.slides = document.querySelectorAll('.slide');
            this.progressBar = document.getElementById('progress-bar');
            this.sliderContainer = document.querySelector('.hero-slider-container');
            this.currentSlide = 0;
            this.slideDuration = 3000; // 3 segundos

            this.init();
        }
        
        init() {
            if (this.slides.length === 0 || !this.progressBar) {
                console.error('Slider o barra de progreso no encontrados.');
                return;
            }

            // Pausar la animación al pasar el cursor sobre el slider
            this.sliderContainer.addEventListener('mouseenter', () => this.pause());
            this.sliderContainer.addEventListener('mouseleave', () => this.play());

            // Escuchar cuando la animación termina para pasar al siguiente slide
            this.progressBar.addEventListener('animationend', () => this.nextSlide());
            
            // Iniciar el primer slide
            this.showSlide(0);
        }
        
        showSlide(index) {
            // Validar el índice
            this.currentSlide = index >= this.slides.length ? 0 : index;
            
            // Ocultar todos los slides y mostrar el actual
            this.slides.forEach(slide => slide.classList.remove('active'));
            this.slides[this.currentSlide].classList.add('active');
            
            // Reiniciar y comenzar la animación de la barra de progreso
            this.startAnimation();
        }
        
        nextSlide() {
            const nextIndex = (this.currentSlide + 1) % this.slides.length;
            this.showSlide(nextIndex);
        }

        startAnimation() {
            // Quitar la clase de animación para resetearla
            this.progressBar.classList.remove('animating');
            
            // Forzar un "reflow" del navegador para que reconozca el reinicio
            void this.progressBar.offsetWidth; 
            
            // Establecer la duración y añadir la clase para iniciar la animación
            this.progressBar.style.animationDuration = `${this.slideDuration}ms`;
            this.progressBar.classList.add('animating');
        }

        pause() {
            this.progressBar.style.animationPlayState = 'paused';
        }

        play() {
            this.progressBar.style.animationPlayState = 'running';
        }
    }

    // Inicializar el slider
    new HeroSlider();
});