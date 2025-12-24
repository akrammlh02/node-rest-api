document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for Cards Reveal
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px'
    };

    const revealOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.modern-card');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.15}s`;
        revealOnScroll.observe(card);
    });

    // 2. Dynamic Mouse Glow Effect
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Re-purposing card-glow for mouse position if needed
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.left = `${x}px`;
                glow.style.top = `${y}px`;
                glow.style.opacity = '0.15';
            }
        });

        card.addEventListener('mouseleave', () => {
            const glow = card.querySelector('.card-glow');
            if (glow) glow.style.opacity = '0';
        });
    });

    // 3. Smooth Scale on Logo
    const logo = document.querySelector('.brand-wrapper');
    if (logo) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY > 50;
            logo.style.transform = scrolled ? 'scale(0.95)' : 'scale(1)';
            logo.style.transition = '0.4s cubic-bezier(0.23, 1, 0.32, 1)';
        });
    }

    // 4. FAQ Logic: Search & Tags
    const faqSearch = document.getElementById('faqSearch');
    const faqItems = document.querySelectorAll('.custom-accordion .accordion-item');
    const faqTags = document.querySelectorAll('.faq-tag');

    if (faqSearch) {
        faqSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            let hasResults = false;

            faqItems.forEach(item => {
                const title = item.querySelector('.accordion-button').textContent.toLowerCase();
                const body = item.querySelector('.accordion-body').textContent.toLowerCase();

                if (title.includes(term) || body.includes(term)) {
                    item.style.display = 'block';
                    hasResults = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // Toggle No Results notice
            const noResults = document.getElementById('faqNoResults');
            if (noResults) {
                noResults.classList.toggle('d-none', hasResults);
            }
        });
    }

    faqTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const filter = tag.getAttribute('data-filter').toLowerCase();

            // Toggle active class
            faqTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            // Fill search or filter directly
            if (faqSearch) {
                faqSearch.value = filter;
                faqSearch.dispatchEvent(new Event('input'));
            }
        });
    });
    // 5. Header Scroll Effect
    // 5. Header Scroll Effect
    const mainNav = document.querySelector('.glass-nav');
    if (mainNav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                mainNav.classList.add('scrolled');
            } else {
                mainNav.classList.remove('scrolled');
            }
        });
    }

    // 6. Roadmap Path Search
    const pathSearch = document.getElementById('pathSearch');
    const pathContainers = document.querySelectorAll('.path-container');

    if (pathSearch) {
        pathSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            pathContainers.forEach(container => {
                const title = container.querySelector('.card-title').textContent.toLowerCase();
                const desc = container.querySelector('.card-desc').textContent.toLowerCase();
                const lang = container.querySelector('.icon-box').textContent.toLowerCase();

                if (title.includes(term) || desc.includes(term) || lang.includes(term)) {
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
            });
        });
    }
});
