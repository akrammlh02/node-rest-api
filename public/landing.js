// Get course ID from URL parameter
function getCourseIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Sticky header behavior
let lastScrollTop = 0;
const stickyHeader = document.getElementById('stickyHeader');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Show sticky header after scrolling down 300px
    if (scrollTop > 300) {
        stickyHeader.classList.add('visible');
    } else {
        stickyHeader.classList.remove('visible');
    }

    lastScrollTop = scrollTop;
});

// Scroll to enrollment section
function scrollToEnroll() {
    const enrollSection = document.getElementById('enrollSection');
    if (enrollSection) {
        enrollSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Load and display course data
async function loadCourse() {
    const courseId = getCourseIdFromUrl();

    if (!courseId) {
        window.location.href = '/course';
        return;
    }

    try {
        const response = await fetch(`/course/api/course/${courseId}`);
        const result = await response.json();

        if (!result.success || !result.course) {
            alert('Course not found. Redirecting to courses page...');
            setTimeout(() => {
                window.location.href = '/course';
            }, 2000);
            return;
        }

        const course = result.course;

        // Update page title and meta tags
        document.getElementById('pageTitle').textContent = `${course.title} - DevAcademy`;
        document.getElementById('pageDescription').content = course.description || 'Transform your career with our comprehensive course.';
        document.getElementById('ogTitle').content = course.title;
        document.getElementById('ogDescription').content = course.description || 'Transform your career with our comprehensive course.';

        // Update hero section
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('courseDescription').textContent = course.description || 'No description available.';

        // Update level badge
        if (course.level) {
            const badgeSpan = document.querySelector('.hero-badge span:last-child');
            if (badgeSpan) badgeSpan.textContent = course.level;
        }

        // Update header
        document.getElementById('headerCourseTitle').textContent = course.title;

        // Update Skills/Tech Stack
        if (course.skills) {
            const skillsContainer = document.getElementById('courseSkills');
            const skillsSection = document.getElementById('techStackSection');

            if (skillsContainer && skillsSection) {
                const skills = course.skills.split(',').map(s => s.trim()).filter(s => s);

                if (skills.length > 0) {
                    skillsContainer.innerHTML = skills.map(skill => `
                        <div class="tech-item">
                            <span class="material-symbols-outlined">code</span>
                            <span>${skill}</span>
                        </div>
                    `).join('');
                    skillsSection.style.display = 'block';

                    // Add animation observer to new elements
                    const techItems = document.querySelectorAll('.tech-item');
                    techItems.forEach(el => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(20px)';
                        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                        observer.observe(el);
                    });
                }
            }
        }

        // Update pricing
        const price = course.price || 0;
        document.getElementById('coursePrice').textContent = price;
        document.getElementById('headerPrice').textContent = `${price} DA`;

        // Display preview video if available
        if (course.preview_video_url && course.preview_video_url.trim() !== '') {
            const heroVideoSection = document.getElementById('heroVideoSection');
            const heroVideoFrame = document.getElementById('heroVideoFrame');

            if (heroVideoSection && heroVideoFrame) {
                let videoUrl = course.preview_video_url;

                // Add YouTube parameters
                if (videoUrl.includes('youtube.com/embed/')) {
                    const separator = videoUrl.includes('?') ? '&' : '?';
                    videoUrl += `${separator}rel=0&modestbranding=1&playsinline=1`;
                }

                heroVideoFrame.src = videoUrl;
                heroVideoSection.style.display = 'block';
            }
        }

        // Specific Content for Course ID 14 (Frontend Course)
        const courseProjectsData = {
            '14': [
                {
                    title: "Modern Portfolio Website",
                    description: "Build a stunning, responsive personal portfolio to showcase your work and resume. Learn CSS Grid, Flexbox, and animations.",
                    image: "/images/front-end-1.jpg",
                    tags: ["HTML5", "CSS3", "Responsive Design"]
                },
                {
                    title: "E-Commerce Product Page",
                    description: "Create a dynamic product page with image galleries, cart functionality, and interactive UI elements using JavaScript.",
                    image: "/images/Untitled-design.png",
                    tags: ["JavaScript", "DOM Manipulation", "UI/UX"]
                },
                {
                    title: "Dashboard Interface",
                    description: "Master advanced layout techniques by building a complex admin dashboard with charts, data tables, and sidebar navigation.",
                    image: "/images/background.gif", // Using gif for dynamic feel
                    tags: ["CSS Grid", "Charts", "Complex Layouts"]
                }
            ]
        };

        // Render Projects if data exists for this course
        if (courseProjectsData[courseId]) {
            const projectsContainer = document.getElementById('courseProjects');
            const projectsSection = document.getElementById('projectsSection');

            if (projectsContainer && projectsSection) {
                projectsContainer.innerHTML = courseProjectsData[courseId].map(project => `
                    <div class="project-card">
                        <div class="project-image-container">
                            <img src="${project.image}" alt="${project.title}" class="project-image">
                        </div>
                        <div class="project-content">
                            <h3 class="project-title">${project.title}</h3>
                            <p class="project-description">${project.description}</p>
                            <div class="project-tags">
                                ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('');

                projectsSection.style.display = 'block';

                // Add animation observer to new elements
                const projectCards = document.querySelectorAll('.project-card');
                projectCards.forEach(el => {
                    el.style.opacity = '0';
                    el.style.transform = 'translateY(30px)';
                    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                    observer.observe(el);
                });
            }
        }

        // Calculate total lessons
        let totalLessons = 0;
        if (course.chapters) {
            course.chapters.forEach(chapter => {
                if (chapter.lessons) {
                    totalLessons += chapter.lessons.length;
                }
            });
        }

        document.getElementById('totalLessons').textContent = totalLessons;

        // Update student count (you can make this dynamic from database)
        const studentCount = Math.floor(totalLessons * 10) + 200; // Example calculation
        document.getElementById('studentCount').textContent = `${studentCount}+`;

        const certificateCount = Math.floor(studentCount * 0.6);
        document.getElementById('certificateCount').textContent = `${certificateCount}+`;

        // Render chapters
        renderChapters(course.chapters || []);

    } catch (error) {
        console.error('Error loading course:', error);
        alert('Error loading course. Please try again later.');
    }
}

// Render chapters in curriculum section
function renderChapters(chapters) {
    const container = document.getElementById('chaptersContainer');

    if (!chapters || chapters.length === 0) {
        container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">info</span>
        <p>No curriculum available yet.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = chapters.map((chapter, index) => {
        const lessonsCount = chapter.lessons ? chapter.lessons.length : 0;
        const isFree = chapter.is_free === 1;

        return `
      <div class="chapter-item ${isFree ? 'free-chapter' : ''}">
        <div class="chapter-header-landing">
          <div class="chapter-title-landing">
            <span class="chapter-number-landing">${chapter.order || index + 1}</span>
            <span>${chapter.title}</span>
            ${isFree ? '<span style="color: #10b981; font-size: 0.875rem; font-weight: 600;">🎁 FREE</span>' : ''}
          </div>
          <div class="chapter-lessons-count">
            <span class="material-symbols-outlined" style="font-size: 1rem;">play_circle</span>
            <span>${lessonsCount} ${lessonsCount === 1 ? 'lesson' : 'lessons'}</span>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// FAQ toggle functionality
function toggleFaq(index) {
    const faqItems = document.querySelectorAll('.faq-item');
    const clickedItem = faqItems[index];

    // Toggle active class
    clickedItem.classList.toggle('active');

    // Optional: Close other FAQs when opening one (accordion behavior)
    // faqItems.forEach((item, i) => {
    //   if (i !== index) {
    //     item.classList.remove('active');
    //   }
    // });
}

// Enroll course - WhatsApp integration
function enrollCourse() {
    const courseId = getCourseIdFromUrl();
    const courseTitle = document.getElementById('courseTitle').textContent;
    const coursePrice = document.getElementById('coursePrice').textContent;

    if (courseId) {
        // Create a more detailed WhatsApp message
        const message = encodeURIComponent(
            `السلام عليكم Akram,\n\n` +
            `أنا مهتم بالتسجيل في الدورة:\n` +
            `📚 ${courseTitle}\n` +
            `💰 السعر: ${coursePrice} DA\n` +
            `🆔 Course ID: ${courseId}\n\n` +
            `من فضلك أعطني المزيد من المعلومات حول كيفية التسجيل والدفع.`
        );

        const whatsappUrl = `https://wa.me/213540921726?text=${message}`;

        // Track Facebook Pixel - Lead event
        if (typeof fbq !== 'undefined') {
            const priceValue = parseFloat(coursePrice.replace(/[^0-9.]/g, '')) || 0;
            fbq('track', 'Lead', {
                content_name: courseTitle,
                content_category: 'Course',
                content_ids: [courseId],
                value: priceValue,
                currency: 'DZD'
            });
            console.log('Facebook Pixel: Lead event tracked');
        }

        window.open(whatsappUrl, '_blank');

        // Track conversion (you can add analytics here)
        console.log('Enrollment initiated for course:', courseId);
    }
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation on scroll
document.addEventListener('DOMContentLoaded', () => {
    // Load course data
    loadCourse();

    // Animate sections on scroll
    const animatedElements = document.querySelectorAll('.testimonial-card, .chapter-item, .faq-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// Track time on page (for analytics)
let timeOnPage = 0;
setInterval(() => {
    timeOnPage++;
    // You can send this data to your analytics service
    if (timeOnPage % 30 === 0) { // Every 30 seconds
        console.log(`User has been on page for ${timeOnPage} seconds`);
    }
}, 1000);

// Exit intent detection (show special offer when user tries to leave)
let exitIntentShown = false;
document.addEventListener('mouseout', (e) => {
    if (!exitIntentShown && e.clientY < 10) {
        // User is moving mouse to close tab/window
        exitIntentShown = true;

        // You can show a modal or alert here
        // For now, just log it
        console.log('Exit intent detected - could show special offer');

        // Example: Uncomment to show alert
        // if (confirm('Wait! Get 10% off if you enroll now. Contact us on WhatsApp?')) {
        //   enrollCourse();
        // }
    }
});

// Add scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  transition: width 0.1s ease-out;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    scrollProgress.style.width = scrolled + '%';
});
