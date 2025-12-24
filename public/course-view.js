// Get course ID from URL parameter
function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load and display course from database
async function loadCourse() {
  const courseId = getCourseIdFromUrl();
  if (!courseId) {
    // Redirect to courses page if no course ID provided
    window.location.href = '/course';
    return;
  }

  try {
    const response = await fetch(`/course/api/course/${courseId}`);
    const result = await response.json();

    if (!result.success || !result.course) {
      // Show error message and redirect after 2 seconds
      document.getElementById('courseTitle').textContent = 'Course not found';
      document.getElementById('courseDescription').textContent = 'The course you are looking for does not exist or has been removed. Redirecting to courses page...';
      setTimeout(() => {
        window.location.href = '/course';
      }, 2000);
      return;
    }

    const course = result.course;

    // Display course information
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseDescription').textContent = course.description || 'No description available.';
    document.getElementById('coursePrice').textContent = course.price + ' DA';

    // Update sticky cta content
    const stickyTitle = document.getElementById('stickyCourseTitle');
    const stickyPrice = document.getElementById('stickyCoursePrice');
    if (stickyTitle) stickyTitle.textContent = course.title;
    if (stickyPrice) stickyPrice.textContent = course.price + ' DA';

    // Update author name if element exists
    const authorEl = document.querySelector('.hero-author-name');
    if (authorEl && course.author) {
      authorEl.textContent = course.author;
    }

    // Update category badge
    if (course.level) {
      const categoryEl = document.getElementById('courseCategory');
      const headerLevelEl = document.getElementById('courseLevelHeader');
      if (categoryEl) {
        categoryEl.textContent = course.level;
        categoryEl.style.display = 'inline-block';
      }
      if (headerLevelEl) {
        headerLevelEl.textContent = course.level;
      }
    }

    // Populate duration and level for landing page
    const durationEl = document.getElementById('courseDuration');
    const levelEl = document.getElementById('courseLevel');
    if (durationEl) durationEl.textContent = (course.duration_hours || '0') + ' Hours';
    if (levelEl) levelEl.textContent = course.level || 'All Levels';

    // Display preview video with AUTOPLAY
    if (course.preview_video_url && course.preview_video_url.trim() !== '') {
      const previewSection = document.getElementById('previewVideoSection');
      const previewFrame = document.getElementById('previewVideoFrame');
      if (previewSection && previewFrame) {
        let videoUrl = course.preview_video_url;

        // Add YouTube autoplay parameters (mute required for autoplay)
        if (videoUrl.includes('youtube.com/embed/')) {
          const separator = videoUrl.includes('?') ? '&' : '?';
          videoUrl += `${separator}autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`;
        }

        previewFrame.src = videoUrl;
        previewSection.style.display = 'block';
      }
    }

    currentCourseId = courseId;

    // Load completed lessons
    let completedLessons = [];
    if (course.hasAccess) {
      try {
        const progressResponse = await fetch(`/course/api/progress/${courseId}`);
        const progressResult = await progressResponse.json();
        if (progressResult.success) {
          completedLessons = progressResult.completedLessons || [];
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }

    // Mark lessons as completed
    if (course.chapters) {
      course.chapters.forEach(chapter => {
        if (chapter.lessons) {
          chapter.lessons.forEach(lesson => {
            lesson.completed = completedLessons.includes(lesson.lesson_id);
          });
        }
      });
    }

    // Display chapters and lessons
    renderChapters(course.chapters || [], course.hasAccess || false);

    // Update enroll button for enrolled users
    if (course.hasAccess) {
      const enrollBtn = document.querySelector('.btn-enroll-primary');
      if (enrollBtn) {
        enrollBtn.innerHTML = '<span class="material-symbols-outlined">play_circle</span> Continue Learning';
        enrollBtn.onclick = () => {
          const firstChapter = document.querySelector('.chapter-header');
          if (firstChapter) {
            firstChapter.scrollIntoView({ behavior: 'smooth' });
            toggleChapter(0);
          }
        };
      }
    }
  } catch (error) {
    console.error('Error loading course:', error);
    document.getElementById('courseTitle').textContent = 'Error loading course';
  }
}

let allLessons = [];
let currentLessonIndex = -1;
let currentCourseId = null;

function renderChapters(chapters, hasAccess) {
  const container = document.getElementById('chaptersContainer');

  if (!chapters || chapters.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No chapters available yet.</p></div>';
    return;
  }

  // Flatten all lessons for navigation
  allLessons = [];
  chapters.forEach((chapter, chapterIndex) => {
    (chapter.lessons || []).forEach((lesson, lessonIndex) => {
      allLessons.push({
        ...lesson,
        chapterIndex,
        lessonIndex,
        chapterTitle: chapter.title
      });
    });
  });

  container.innerHTML = chapters.map((chapter, chapterIndex) => {
    const sortedLessons = chapter.lessons || [];
    const isChapterFree = chapter.is_free === 1;

    return `
      <div class="chapter-card ${isChapterFree ? 'free-chapter' : ''}">
        <div class="chapter-header" onclick="toggleChapter(${chapterIndex})">
          <div class="chapter-title-section">
            <span class="material-symbols-outlined expand-icon" id="icon-${chapterIndex}">expand_more</span>
            <h3 class="chapter-title">
              <span class="chapter-number ${isChapterFree ? 'free' : ''}">Chapter ${chapter.order || chapterIndex + 1}</span>
              ${chapter.title}
              ${isChapterFree ? '<span class="chapter-free-badge">🎁 FREE CHAPTER</span>' : ''}
            </h3>
          </div>
          <span class="lesson-count">${sortedLessons.length} ${sortedLessons.length === 1 ? 'Lesson' : 'Lessons'}</span>
        </div>
        <div class="lessons-container" id="lessons-${chapterIndex}" style="display: none;">
          ${sortedLessons.length === 0
        ? '<p class="no-lessons">No lessons in this chapter yet.</p>'
        : sortedLessons.map((lesson, lessonIndex) => {
          const globalIndex = allLessons.findIndex(l => l.lesson_id === lesson.lesson_id);
          const isCompleted = lesson.completed || false;
          const isFree = lesson.is_free === 1 || chapter.is_free === 1;

          if (hasAccess) {
            return `
              <div class="lesson-item ${isCompleted ? 'completed' : ''}" data-lesson-id="${lesson.lesson_id}" data-lesson-index="${globalIndex}">
                <div class="lesson-number ${isCompleted ? 'completed' : ''}">${lesson.order_number || lessonIndex + 1}</div>
                <div class="lesson-content">
                  <h4 class="lesson-title">
                    ${lesson.title}
                    ${isCompleted ? '<span class="completed-badge"><span class="material-symbols-outlined">check_circle</span></span>' : ''}
                  </h4>
                  <div class="lesson-actions">
                    <a href="/course/tv?lessonId=${lesson.lesson_id}" class="lesson-link" onclick="setCurrentLesson(${globalIndex}, ${lesson.lesson_id})">
                      <span class="material-symbols-outlined">play_circle</span>
                      Watch Video
                    </a>
                    ${!isCompleted ? `
                    <button class="btn-mark-complete" onclick="markLessonComplete(${lesson.lesson_id}, ${globalIndex})">
                      <span class="material-symbols-outlined">check</span>
                      Mark Complete
                    </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          } else if (isFree) {
            // Show free preview button for free lessons
            return `
              <div class="lesson-item free-lesson" data-lesson-id="${lesson.lesson_id}">
                <div class="lesson-number free">${lesson.order_number || lessonIndex + 1}</div>
                <div class="lesson-content">
                  <h4 class="lesson-title">
                    ${lesson.title} 
                    <span class="free-badge">🎁 FREE</span>
                  </h4>
                  <button class="btn-watch-free" onclick="openFreeLessonModal(${lesson.lesson_id}, '${lesson.title.replace(/'/g, "\\'")}', '${lesson.content_url}', '${(lesson.description || '').replace(/'/g, "\\'")}')">
                    <span class="material-symbols-outlined">play_circle</span>
                    Watch Free Preview
                  </button>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="lesson-item locked">
                <div class="lesson-number">${lesson.order_number || lessonIndex + 1}</div>
                <div class="lesson-content">
                  <h4 class="lesson-title">${lesson.title} <span class="lock-badge">🔒</span></h4>
                  <span class="lesson-link locked-link">
                    <span class="material-symbols-outlined">lock</span>
                    Locked - Purchase to unlock
                  </span>
                </div>
              </div>
            `;
          }
        }).join('')
      }
        </div>
      </div>
    `;
  }).join('') + `
    ${hasAccess && allLessons.length > 0 ? `
    <div class="lesson-navigation">
      <button class="btn-nav btn-prev" onclick="navigateLesson('prev')" disabled>
        <span class="material-symbols-outlined">arrow_back</span>
        Previous
      </button>
      <button class="btn-nav btn-next" onclick="navigateLesson('next')" ${allLessons.length > 1 ? '' : 'disabled'}>
        Next
        <span class="material-symbols-outlined">arrow_forward</span>
      </button>
    </div>
    ` : ''}
  `;
}

function setCurrentLesson(index, lessonId) {
  currentLessonIndex = index;
  updateNavigationButtons();
}

function navigateLesson(direction) {
  if (direction === 'next' && currentLessonIndex < allLessons.length - 1) {
    currentLessonIndex++;
  } else if (direction === 'prev' && currentLessonIndex > 0) {
    currentLessonIndex--;
  }

  const lesson = allLessons[currentLessonIndex];
  if (lesson) {
    // Redirect to TV page with the lesson ID
    window.location.href = `/course/tv?lessonId=${lesson.lesson_id}`;
  }

  updateNavigationButtons();
}

function updateNavigationButtons() {
  const prevBtn = document.querySelector('.btn-prev');
  const nextBtn = document.querySelector('.btn-next');

  if (prevBtn) {
    prevBtn.disabled = currentLessonIndex <= 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentLessonIndex >= allLessons.length - 1;
  }
}

async function markLessonComplete(lessonId, lessonIndex) {
  try {
    const response = await fetch('/course/api/mark-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lessonId })
    });

    const result = await response.json();

    if (result.success) {
      const lessonElement = document.querySelector(`[data-lesson-id="${lessonId}"]`);
      if (lessonElement) {
        lessonElement.classList.add('completed');
        const lessonNumber = lessonElement.querySelector('.lesson-number');
        if (lessonNumber) lessonNumber.classList.add('completed');

        const title = lessonElement.querySelector('.lesson-title');
        if (title && !title.querySelector('.completed-badge')) {
          title.innerHTML += '<span class="completed-badge"><span class="material-symbols-outlined">check_circle</span></span>';
        }

        const markBtn = lessonElement.querySelector('.btn-mark-complete');
        if (markBtn) markBtn.remove();
      }

      if (typeof loadCourseProgress === 'function') {
        loadCourseProgress();
      }
    } else {
      alert(result.message || 'Failed to mark lesson as complete');
    }
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    alert('Error marking lesson as complete');
  }
}

function toggleChapter(index) {
  const lessonsContainer = document.getElementById(`lessons-${index}`);
  const icon = document.getElementById(`icon-${index}`);

  if (lessonsContainer.style.display === 'none') {
    lessonsContainer.style.display = 'block';
    icon.textContent = 'expand_less';
  } else {
    lessonsContainer.style.display = 'none';
    icon.textContent = 'expand_more';
  }
}

// Buy Now - Add to cart and go directly to checkout
async function buyNow() {
  const courseId = getCourseIdFromUrl();
  if (!courseId) {
    return;
  }

  // Visual feedback on all buttons
  const buttons = document.querySelectorAll('.btn-enroll-primary, .floating-join-cta, .btn-enroll-modal');
  buttons.forEach(btn => {
    if (btn.tagName === 'BUTTON' || btn.tagName === 'A') {
      const originalHtml = btn.innerHTML;
      btn.setAttribute('data-original', originalHtml);
      btn.innerHTML = '<span class="material-symbols-outlined">sync</span> Chargement...';
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.8';
    }
  });

  try {
    // Add to cart officially before redirecting
    await fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId })
    });

    // Short delay for visual polish
    setTimeout(() => {
      window.location.href = '/payment/checkout';
    }, 400);

  } catch (error) {
    console.error('Error during Buy Now:', error);
    // Fallback: direct redirect
    window.location.href = `/payment/checkout?courseId=${courseId}`;
  }
}

// Legacy function name for backward compatibility
function enrollCourse() {
  buyNow();
}

// Add to Checkout - add to cart/checkout session and stay on page
function addToCheckout() {
  const courseId = getCourseIdFromUrl();
  if (!courseId) {
    return;
  }

  // Use AJAX to add to cart/checkout
  fetch('/cart/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ courseId })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        // Show success notification
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: opacity 0.5s ease;';
        notification.innerHTML = '<div style="display: flex; align-items: center; gap: 10px;"><span class="material-symbols-outlined">check_circle</span> Course added to checkout!</div>';
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 500);
        }, 3000);

        // Update cart badge
        if (result.cartCount !== undefined) {
          updateCartBadge(result.cartCount);
        } else {
          updateCartBadge();
        }

        // Update button state visually to indicate success
        const btn = document.querySelector('.btn-add-to-cart-small');
        if (btn) {
          const originalContent = btn.innerHTML;
          btn.innerHTML = '<span class="material-symbols-outlined">check</span>';
          btn.style.backgroundColor = '#28a745';
          btn.style.borderColor = '#28a745';
          btn.style.color = 'white';

          // Reset button after 2 seconds
          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
            btn.style.color = '';
          }, 2000);
        }
      } else {
        if (result.message && result.message.includes('already')) {
          const notification = document.createElement('div');
          notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #17a2b8; color: white; padding: 1rem 1.5rem; border-radius: 8px; z-index: 9999;';
          notification.innerHTML = '<div style="display: flex; align-items: center; gap: 10px;"><span class="material-symbols-outlined">info</span> Already in checkout</div>';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        } else {
          alert(result.message || 'Failed to add to checkout');
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Failed to process request. Please try again.');
    });
}

// Function to open free lesson modal
function openFreeLessonModal(lessonId, title, videoUrl, description) {
  document.getElementById('modalLessonTitle').textContent = title;
  let formattedVideoUrl = videoUrl;
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    let videoId = '';
    if (videoUrl.includes('watch?v=')) videoId = videoUrl.split('v=')[1].split('&')[0];
    else if (videoUrl.includes('embed/')) videoId = videoUrl.split('embed/')[1].split('?')[0];
    else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    if (videoId) formattedVideoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  }
  document.getElementById('modalVideoFrame').src = formattedVideoUrl;
  const descriptionText = description && description.trim() !== '' ? description : 'This free lesson gives you a preview...';
  document.getElementById('modalDescriptionText').textContent = descriptionText;
  const modal = new bootstrap.Modal(document.getElementById('freeLessonModal'));
  modal.show();
  document.getElementById('freeLessonModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('modalVideoFrame').src = '';
  }, { once: true });
}

// Function to switch between tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const clickedBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
  const targetPane = document.getElementById(`tab-${tabId}`);
  if (clickedBtn) clickedBtn.classList.add('active');
  if (targetPane) targetPane.classList.add('active');
}

// Stick Bottom CTA logic
function handleStickyCta() {
  const stickyBar = document.getElementById('stickyCtaBar');
  if (!stickyBar) return;
  const mainCta = document.querySelector('.btn-enroll-primary');
  if (!mainCta) return;
  const scrollPosition = window.scrollY;
  const ctaPosition = mainCta.getBoundingClientRect().top + window.scrollY;
  if (scrollPosition > ctaPosition + 100) stickyBar.classList.add('visible');
  else stickyBar.classList.remove('visible');
}

// Load course on page load
document.addEventListener('DOMContentLoaded', function () {
  loadCourse();
  updateCartBadge();
  window.addEventListener('scroll', handleStickyCta);
});
