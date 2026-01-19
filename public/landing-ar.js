// Get course ID from URL parameter
function getCourseIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Sticky header behavior
window.addEventListener('scroll', () => {
    const stickyHeader = document.getElementById('stickyHeader');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 200) {
        stickyHeader.classList.add('visible');
    } else {
        stickyHeader.classList.remove('visible');
    }
});

// Countdown Timer - Creates urgency
function initCountdownTimer() {
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (!hoursEl || !minutesEl || !secondsEl) return;

    function updateTimer() {
        // Get end of day
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const diff = endOfDay - now;

        if (diff <= 0) {
            // Reset to 24 hours
            hoursEl.textContent = '23';
            minutesEl.textContent = '59';
            secondsEl.textContent = '59';
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        hoursEl.textContent = hours.toString().padStart(2, '0');
        minutesEl.textContent = minutes.toString().padStart(2, '0');
        secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

// Limited Spots Counter - Creates scarcity
function initLimitedSpots() {
    const spotsEl = document.getElementById('spotsLeft');
    if (!spotsEl) return;

    // Get or initialize spots count
    let spots = localStorage.getItem('spotsLeft');

    if (!spots) {
        // Random between 5-12 spots
        spots = Math.floor(Math.random() * 8) + 5;
        localStorage.setItem('spotsLeft', spots);
    }

    spotsEl.textContent = spots;

    // Decrease spots randomly (simulate real bookings)
    setInterval(() => {
        let currentSpots = parseInt(localStorage.getItem('spotsLeft') || spots);

        // 10% chance to decrease spots every 30 seconds
        if (Math.random() < 0.1 && currentSpots > 2) {
            currentSpots--;
            localStorage.setItem('spotsLeft', currentSpots);
            spotsEl.textContent = currentSpots;

            // Add flash animation
            spotsEl.parentElement.style.animation = 'none';
            setTimeout(() => {
                spotsEl.parentElement.style.animation = 'spotsBounce 2s ease-in-out infinite';
            }, 10);
        }
    }, 30000); // Check every 30 seconds
}

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
            console.error('Course data not found or invalid:', result);
            // Optionally update UI to show error, but do not alert/redirect immediately if it might be a glitch
            // document.getElementById('courseTitle').textContent = 'حدث خطأ في تحميل الدورة';
            return;
        }

        const course = result.course;

        // Update page title and meta tags
        document.getElementById('pageTitle').textContent = `${course.title} - DevAcademy`;
        document.getElementById('pageDescription').content = course.description || 'غير مستقبلك المهني مع دورتنا الشاملة';
        document.getElementById('ogTitle').content = course.title;
        document.getElementById('ogDescription').content = course.description || 'غير مستقبلك المهني مع دورتنا الشاملة';

        // Update hero section
        document.getElementById('courseTitle').textContent = course.title;
        document.getElementById('courseDescription').textContent = course.description || 'لا يوجد وصف متاح.';

        // Update header
        document.getElementById('headerCourseTitle').textContent = course.title;

        // Update pricing
        const price = course.price || 0;
        document.getElementById('coursePrice').textContent = price.toLocaleString('ar-DZ');
        document.getElementById('headerPrice').textContent = `${price.toLocaleString('ar-DZ')} دج`;

        // Update inline price if element exists
        const priceInline = document.getElementById('priceInline');
        if (priceInline) {
            priceInline.textContent = price.toLocaleString('ar-DZ');
        }

        // Display preview video if available
        if (course.preview_video_url && course.preview_video_url.trim() !== '') {
            const heroVideoSection = document.getElementById('heroVideoSection');
            const heroVideoFrame = document.getElementById('heroVideoFrame');

            if (heroVideoSection && heroVideoFrame) {
                let videoUrl = course.preview_video_url;

                // Add YouTube parameters (no autoplay, sound on)
                if (videoUrl.includes('youtube.com/embed/')) {
                    const separator = videoUrl.includes('?') ? '&' : '?';
                    videoUrl += `${separator}rel=0&modestbranding=1&playsinline=1`;
                }

                heroVideoFrame.src = videoUrl;
                heroVideoFrame.src = videoUrl;
                heroVideoSection.style.display = 'block';
            }
        }

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

        // Specific Content for Course ID 14 (Frontend Course - Arabic)
        const courseProjectsData = {
            '14': [
                {
                    title: "موقع معرض أعمال شخصي",
                    description: "قم ببناء موقع شخصي (Portfolio) احترافي ومتجاوب مع جميع الشاشات لعرض مهاراتك ومشاريعك. ستتعلم استخدام HTML5 و CSS3 المتقدمة.",
                    image: "/images/front-end-1.jpg",
                    tags: ["HTML5", "CSS3", "تصميم متجاوب"]
                },
                {
                    title: "صفحة منتج لمتجر إلكتروني",
                    description: "أنشئ صفحة تفاعلية لمنتج تحتوي على معرض صور، سلة تسوق، وأزرار تفاعلية باستخدام JavaScript للتحكم في عناصر الصفحة DOM.",
                    image: "/images/Untitled-design.png",
                    tags: ["JavaScript", "تفاعل المستخدم", "DOM"]
                },
                {
                    title: "لوحة تحكم إدارية (Dashboard)",
                    description: "أتقن تصميم الواجهات المعقدة ببناء لوحة تحكم تحتوي على قوائم جانبية، جداول بيانات، ورسوم بيانية باستخدام CSS Grid و Flexbox.",
                    image: "/images/background.gif",
                    tags: ["CSS Grid", "تخطيط متقدم", "لوحة تحكم"]
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

        const totalLessonsEl = document.getElementById('totalLessons');
        if (totalLessonsEl) {
            totalLessonsEl.textContent = totalLessons;
        }

        // Update student count (dynamic from database or calculated)
        const studentCount = Math.floor(totalLessons * 10) + 200;
        const studentCountEl = document.getElementById('studentCount');
        if (studentCountEl) {
            studentCountEl.textContent = `${studentCount}+`;
        }

        // Update inline student count if element exists
        const studentCountInline = document.getElementById('studentCountInline');
        if (studentCountInline) {
            studentCountInline.textContent = `${studentCount}+`;
        }

        const certificateCount = Math.floor(studentCount * 0.6);
        const certificateCountEl = document.getElementById('certificateCount');
        if (certificateCountEl) {
            certificateCountEl.textContent = `${certificateCount}+`;
        }

        // Render chapters
        renderChapters(course.chapters || []);

    } catch (error) {
        console.error('خطأ في تحميل الدورة:', error);
        // alert('خطأ في تحميل الدورة. يرجى المحاولة لاحقاً.');
    }
}

// Render chapters in curriculum section with expandable lessons
function renderChapters(chapters) {
    const container = document.getElementById('chaptersContainer');

    if (!chapters || chapters.length === 0) {
        container.innerHTML = `
      <div class="loading-state">
        <span class="material-symbols-outlined">info</span>
        <p>لا يوجد محتوى متاح حالياً.</p>
      </div>
    `;
        return;
    }

    container.innerHTML = chapters.map((chapter, index) => {
        const lessonsCount = chapter.lessons ? chapter.lessons.length : 0;
        const isFree = chapter.is_free === 1;

        // Build lessons HTML
        const lessonsHTML = chapter.lessons && chapter.lessons.length > 0
            ? chapter.lessons.map((lesson, lessonIndex) => {
                const isLessonFree = lesson.is_free === 1 || isFree;
                return `
            <div class="lesson-item-landing ${isLessonFree ? 'free-lesson' : ''}">
              <div class="lesson-number-landing">${lesson.order_number || lessonIndex + 1}</div>
              <div class="lesson-info-landing">
                <span class="lesson-title-landing">${lesson.title}</span>
                ${isLessonFree ? '<span class="free-badge-small">🎁 مجاني</span>' : '<span class="lock-badge-small">🔒</span>'}
              </div>
            </div>
          `;
            }).join('')
            : '<p class="no-lessons-text">لا توجد دروس في هذا الفصل</p>';

        return `
      <div class="chapter-item-expandable ${isFree ? 'free-chapter' : ''}">
        <div class="chapter-header-expandable" onclick="toggleChapterLanding(${index})">
          <div class="chapter-left">
            <span class="chapter-number-landing">${chapter.order || index + 1}</span>
            <span class="chapter-title-landing">${chapter.title}</span>
            ${isFree ? '<span class="free-badge-chapter">🎁 مجاني</span>' : ''}
          </div>
          <div class="chapter-right">
            <span class="chapter-lessons-count">${lessonsCount} ${lessonsCount === 1 ? 'درس' : 'دروس'}</span>
            <span class="material-symbols-outlined expand-icon" id="expand-icon-${index}">expand_more</span>
          </div>
        </div>
        <div class="lessons-list-landing" id="lessons-${index}" style="display: none;">
          ${lessonsHTML}
        </div>
      </div>
    `;
    }).join('');
}

// Toggle chapter expansion to show/hide lessons
function toggleChapterLanding(index) {
    const lessonsList = document.getElementById(`lessons-${index}`);
    const expandIcon = document.getElementById(`expand-icon-${index}`);

    if (lessonsList.style.display === 'none') {
        lessonsList.style.display = 'block';
        expandIcon.textContent = 'expand_less';
    } else {
        lessonsList.style.display = 'none';
        expandIcon.textContent = 'expand_more';
    }
}

// FAQ toggle functionality
function toggleFaq(index) {
    const faqItems = document.querySelectorAll('.faq-item');
    const clickedItem = faqItems[index];

    // Toggle active class
    clickedItem.classList.toggle('active');
}

// Enroll course - WhatsApp integration with Arabic message
function enrollCourse() {
    const courseId = getCourseIdFromUrl();
    const courseTitle = document.getElementById('courseTitle').textContent;
    const coursePrice = document.getElementById('coursePrice').textContent;

    if (courseId) {
        // Create detailed WhatsApp message in Arabic
        const message = encodeURIComponent(
            `السلام عليكم أستاذ أكرم،\n\n` +
            `أنا مهتم بالتسجيل في الدورة:\n\n` +
            `📚 اسم الدورة: ${courseTitle}\n` +
            `💰 السعر: ${coursePrice} دج\n` +
            `🆔 رقم الدورة: ${courseId}\n\n` +
            `من فضلك، أريد معرفة المزيد عن:\n` +
            `• طريقة الدفع المتاحة\n` +
            `• كيفية الوصول للدورة بعد الدفع\n` +
            `• مدة الدورة والشهادة\n\n` +
            `شكراً لك 🙏`
        );

        const whatsappUrl = `https://wa.me/213540921726?text=${message}`;

        // Track Facebook Pixel - Lead event
        if (typeof fbq !== 'undefined') {
            const priceValue = parseFloat(coursePrice.replace(/[^0-9]/g, '')) || 0;
            fbq('track', 'Lead', {
                content_name: courseTitle,
                content_category: 'Course',
                content_ids: [courseId],
                value: priceValue,
                currency: 'DZD'
            });
            console.log('Facebook Pixel: Lead event tracked -', courseTitle, priceValue, 'DZD');
        }

        // Track conversion
        console.log('تم بدء عملية التسجيل للدورة:', courseId);

        // Optional: Send Google Analytics event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'begin_checkout', {
                'course_id': courseId,
                'course_name': courseTitle,
                'value': coursePrice
            });
        }

        // CRITICAL FIX: Delay redirect to allow pixel event to be sent
        // This prevents mobile browsers from interrupting the pixel tracking
        setTimeout(function () {
            window.location.href = whatsappUrl;
        }, 600); // 600ms delay ensures pixel event is sent before redirect
    }
}

// Smooth animations on scroll
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load course data
    loadCourse();

    // Initialize psychological triggers
    initCountdownTimer();
    initLimitedSpots();

    // Animate elements on scroll
    const animatedElements = document.querySelectorAll('.testimonial-card, .chapter-item, .faq-item, .benefit-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// Add scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.style.cssText = `
  position: fixed;
  top: 0;
  right: 0;
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

// Prevent zoom on double tap (better mobile UX)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Track time on page for analytics
let timeOnPage = 0;
setInterval(() => {
    timeOnPage++;

    // Log engagement milestones
    if (timeOnPage === 30) {
        console.log('المستخدم قضى 30 ثانية على الصفحة');
    } else if (timeOnPage === 60) {
        console.log('المستخدم قضى دقيقة على الصفحة');
    } else if (timeOnPage === 120) {
        console.log('المستخدم قضى دقيقتين على الصفحة - مهتم جداً!');
    }
}, 1000);
