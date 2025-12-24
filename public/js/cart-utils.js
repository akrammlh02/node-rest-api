/**
 * Global Cart Utilities
 * Handles updating of cart badges across different pages
 */

async function updateCartBadge(count) {
    const selectors = [
        '.cart-badge',
        '.cart-badge-custom',
        '#cartBadgeNav',
        '#cartBadgeFloat',
        '#cartBadge',
        '#floatingCartBadge'
    ];

    const badges = document.querySelectorAll(selectors.join(', '));
    if (badges.length === 0) return;

    if (count === undefined) {
        try {
            const response = await fetch('/cart/count');
            const result = await response.json();
            if (result.success) {
                count = result.count;
            } else {
                return;
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
            return;
        }
    }

    badges.forEach(badge => {
        badge.textContent = count;
        if (count > 0) {
            // Check if it's a flex container or block
            if (badge.id === 'floatingCartBadge') {
                badge.style.display = 'block';
            } else {
                badge.style.display = 'flex';
            }

            // Animation pulse
            if (!badge.classList.contains('no-pulse')) {
                badge.classList.remove('badge-pulse');
                void badge.offsetWidth; // trigger reflow
                badge.classList.add('badge-pulse');
            }
        } else {
            badge.style.display = 'none';
        }
    });
}

// Initial update
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});
