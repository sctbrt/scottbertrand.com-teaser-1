/**
 * Theme Manager — v1.3.0
 * Light-default theme system with OS listener support
 */

class ThemeManager {
    constructor() {
        this.html = document.documentElement;
        this.toggle = document.getElementById('themeToggle');
        this.currentMode = this.getSavedMode();
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        this.init();
    }

    init() {
        // Apply theme immediately (before DOM ready to prevent FOUC)
        this.applyTheme();

        // Set up OS listener for system mode
        this.mediaQuery.addEventListener('change', () => {
            if (this.currentMode === 'system') {
                this.applyTheme();
            }
        });

        // Toggle on button click (cycles: light → dark → system → light)
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.cycleMode());
        }
    }

    getSavedMode() {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('sb-theme');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved;
        }

        // Default to light mode (not system)
        return 'light';
    }

    getSystemTheme() {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    cycleMode() {
        // Cycle through: light → dark → system → light
        const modes = ['light', 'dark', 'system'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.currentMode = modes[nextIndex];

        // Save and apply
        localStorage.setItem('sb-theme', this.currentMode);
        this.applyTheme();
    }

    applyTheme() {
        // Determine effective theme
        let effectiveTheme;
        if (this.currentMode === 'system') {
            effectiveTheme = this.getSystemTheme();
        } else {
            effectiveTheme = this.currentMode;
        }

        // Apply data-theme attribute
        this.html.setAttribute('data-theme', effectiveTheme);
        this.html.setAttribute('data-theme-mode', this.currentMode);
    }
}

/**
 * Menu Manager — v1.3.0
 * Hamburger-on-overflow: collapses nav only when content would spill
 */
class MenuManager {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('navMenu');
        this.navContainer = this.navMenu?.parentElement;

        if (this.hamburger && this.navMenu && this.navContainer) {
            this.init();
        }
    }

    init() {
        // Set up hamburger toggle
        this.hamburger.addEventListener('click', () => this.toggleMenu());

        // Close menu when clicking menu items
        this.navMenu.querySelectorAll('a, button').forEach(item => {
            item.addEventListener('click', () => this.closeMenu());
        });

        // Close menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.navMenu.classList.contains('active')) {
                this.closeMenu();
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.navMenu.classList.contains('active') &&
                !this.navMenu.contains(e.target) &&
                !this.hamburger.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Set up overflow detection with ResizeObserver
        this.setupOverflowDetection();
    }

    setupOverflowDetection() {
        const checkOverflow = () => {
            // Check if nav content would overflow its container
            const navWidth = this.navMenu.scrollWidth;
            const containerWidth = this.navContainer.clientWidth;
            const isOverflowing = navWidth > containerWidth;

            // Toggle collapsed state
            if (isOverflowing) {
                this.navContainer.classList.add('nav--collapsed');
            } else {
                this.navContainer.classList.remove('nav--collapsed');
                this.closeMenu(); // Close menu if we're no longer collapsed
            }
        };

        // Observe container size changes
        const resizeObserver = new ResizeObserver(checkOverflow);
        resizeObserver.observe(this.navContainer);

        // Initial check
        checkOverflow();
    }

    toggleMenu() {
        const isActive = this.navMenu.classList.contains('active');
        const isExpanded = this.hamburger.getAttribute('aria-expanded') === 'true';

        if (isActive) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.navMenu.classList.add('active');
        this.hamburger.classList.add('active');
        this.hamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.navMenu.classList.remove('active');
        this.hamburger.classList.remove('active');
        this.hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
}

/**
 * Active Nav State
 * Highlights the current section in navigation based on scroll position
 */
class ActiveNavManager {
    constructor() {
        this.sections = document.querySelectorAll('.section[id], .hero');
        this.navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

        if (this.sections.length > 0 && this.navLinks.length > 0) {
            this.init();
        }
    }

    init() {
        // Set up Intersection Observer
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id || 'hero';
                    this.setActiveLink(id);
                }
            });
        }, options);

        // Observe all sections
        this.sections.forEach(section => {
            this.observer.observe(section);
        });
    }

    setActiveLink(sectionId) {
        // Remove active class from all links
        this.navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to matching link
        const activeLink = document.querySelector(`.nav-menu a[href="#${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
    new MenuManager();
    new ActiveNavManager();
});
