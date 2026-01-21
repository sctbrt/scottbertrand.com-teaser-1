// Projects Dropdown Navigation
// Handles click/keyboard interaction for the Projects dropdown menu

document.addEventListener('DOMContentLoaded', () => {
    const dropdown = document.querySelector('.nav-dropdown');
    const toggle = document.querySelector('.nav-dropdown-toggle');
    const menu = document.querySelector('.nav-dropdown-menu');

    if (!dropdown || !toggle || !menu) return;

    // Toggle dropdown on click
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDropdown();
            toggle.focus();
        }
    });

    // Keyboard navigation
    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                closeDropdown();
            } else {
                openDropdown();
            }
        }
    });

    function openDropdown() {
        toggle.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
        dropdown.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
        dropdown.setAttribute('aria-expanded', 'false');
    }
});
