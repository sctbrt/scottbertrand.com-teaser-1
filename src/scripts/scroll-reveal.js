/**
 * Scroll Reveal System
 * scottbertrand.com v2.0.0
 *
 * Intersection Observer-based scroll-triggered animations.
 * Respects prefers-reduced-motion preference.
 */

class ScrollReveal {
    constructor(options = {}) {
        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Make all elements visible immediately
            document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger').forEach(el => {
                el.classList.add('revealed');
            });
            return;
        }

        this.options = {
            threshold: options.threshold || 0.15,
            rootMargin: options.rootMargin || '-50px 0px',
            ...options
        };

        this.init();
    }

    init() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: this.options.threshold,
                rootMargin: this.options.rootMargin
            }
        );

        // Observe all scroll-reveal elements
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger').forEach(el => {
            this.observer.observe(el);
        });
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Stop observing once revealed (one-time animation)
                this.observer.unobserve(entry.target);
            }
        });
    }

    // Method to manually observe new elements (for dynamically added content)
    observe(element) {
        if (element && !element.classList.contains('revealed')) {
            this.observer.observe(element);
        }
    }

    // Method to refresh all observations
    refresh() {
        document.querySelectorAll('.scroll-reveal:not(.revealed), .scroll-reveal-stagger:not(.revealed)').forEach(el => {
            this.observer.observe(el);
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.scrollReveal = new ScrollReveal();
});
