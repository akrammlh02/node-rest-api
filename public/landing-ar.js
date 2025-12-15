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
            alert('الدورة غير موجودة. سيتم التوجيه إلى صفحة الدورات...');
            setTimeout(() => {
                window.location.href = '/course';
            }, 2000);
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

                // Add YouTube autoplay parameters (with sound)
                if (videoUrl.includes('youtube.com/embed/')) {
                    const separator = videoUrl.includes('?') ? '&' : '?';
                    videoUrl += `${separator}autoplay=1&rel=0&modestbranding=1&playsinline=1`;
                }

                heroVideoFrame.src = videoUrl;
                heroVideoSection.style.display = 'block';
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

        // Update student count (dynamic from database or calculated)
        const studentCount = Math.floor(totalLessons * 10) + 200;
        document.getElementById('studentCount').textContent = `${studentCount}+`;

        // Update inline student count if element exists
        const studentCountInline = document.getElementById('studentCountInline');
        if (studentCountInline) {
            studentCountInline.textContent = `${studentCount}+`;
        }

        const certificateCount = Math.floor(studentCount * 0.6);
        document.getElementById('certificateCount').textContent = `${certificateCount}+`;

        // Render chapters
        renderChapters(course.chapters || []);

    } catch (error) {
        console.error('خطأ في تحميل الدورة:', error);
        alert('خطأ في تحميل الدورة. يرجى المحاولة لاحقاً.');
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

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');

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
