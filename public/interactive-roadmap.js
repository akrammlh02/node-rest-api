// Interactive Roadmap JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for lesson navigation
    document.querySelectorAll('.btn-start-lesson').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Add a subtle click animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 100);
        });
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.lesson-node').forEach(node => {
        observer.observe(node);
    });

    // Animate progress bar on load
    setTimeout(() => {
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const width = progressBar.style.width;
            progressBar.style.width = '0%';
            setTimeout(() => {
                progressBar.style.width = width;
            }, 100);
        }
    }, 300);
});
