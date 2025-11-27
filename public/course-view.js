// Get course ID from URL parameter
function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Load and display course from database
async function loadCourse() {
  const courseId = getCourseIdFromUrl();
  if (!courseId) {
    document.getElementById('courseTitle').textContent = 'Course not found';
    return;
  }

  try {
    const response = await fetch(`/course/api/course/${courseId}`);
    const result = await response.json();

    if (!result.success || !result.course) {
      document.getElementById('courseTitle').textContent = 'Course not found';
      return;
    }

    const course = result.course;

    // Display course information
    document.getElementById('courseTitle').textContent = course.title;
    document.getElementById('courseDescription').textContent = course.description || 'No description available.';
    document.getElementById('coursePrice').textContent = course.price + ' DA';

    // Update category badge
    if (course.level) {
      const categoryEl = document.getElementById('courseCategory');
      if (categoryEl) {
        categoryEl.textContent = course.level;
        categoryEl.style.display = 'inline-block';
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
          videoUrl += `${separator}autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
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

    return `
      <div class="chapter-card">
        <div class="chapter-header" onclick="toggleChapter(${chapterIndex})">
          <div class="chapter-title-section">
            <span class="material-symbols-outlined expand-icon" id="icon-${chapterIndex}">expand_more</span>
            <h3 class="chapter-title">
              <span class="chapter-number">Chapter ${chapter.order || chapterIndex + 1}</span>
              ${chapter.title}
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
    const chapterIndex = lesson.chapterIndex;
    const lessonsContainer = document.getElementById(`lessons-${chapterIndex}`);
    if (lessonsContainer && lessonsContainer.style.display === 'none') {
      toggleChapter(chapterIndex);
    }

    setTimeout(() => {
      const lessonElement = document.querySelector(`[data-lesson-id="${lesson.lesson_id}"]`);
      if (lessonElement) {
        lessonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.querySelectorAll('.lesson-item').forEach(item => {
          item.classList.remove('current-lesson');
        });
        lessonElement.classList.add('current-lesson');
      }
    }, 300);

    setTimeout(() => {
      window.open(lesson.content_url, '_blank');
    }, 500);
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

function enrollCourse() {
  const courseId = getCourseIdFromUrl();
  if (courseId) {
    const whatsappUrl = `https://wa.me/213540921726?text=Salam%20Akram%2C%20ana%20mhtam%20bdwrat%20ID:${courseId}`;
    window.open(whatsappUrl, '_blank');
  }
}

// Load course on page load
document.addEventListener('DOMContentLoaded', function () {
  loadCourse();
});
