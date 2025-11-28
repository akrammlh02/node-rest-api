// Get lesson ID from URL
function getLessonIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lessonId');
}

let currentLessonData = null;
let allLessons = [];

// Load lesson data
async function loadLesson() {
  const lessonId = getLessonIdFromUrl();
  if (!lessonId) {
    showError('No lesson ID provided');
    return;
  }

  try {
    const response = await fetch(`/course/api/lesson/${lessonId}`);
    const result = await response.json();

    if (!result.success) {
      showError(result.message || 'Failed to load lesson');
      return;
    }

    currentLessonData = result.lesson;
    allLessons = flattenLessons(currentLessonData.chapters);

    // Update UI
    updateLessonUI();
    renderChapters();
    updateNavigationButtons();

    // Hide loading screen
    document.getElementById('loadingScreen').style.display = 'none';
  } catch (error) {
    console.error('Error loading lesson:', error);
    showError('Error loading lesson. Please try again.');
  }
}

// Flatten lessons from chapters
function flattenLessons(chapters) {
  const lessons = [];
  chapters.forEach(chapter => {
    (chapter.lessons || []).forEach(lesson => {
      lessons.push({
        ...lesson,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order
      });
    });
  });
  return lessons;
}

// Update lesson UI
function updateLessonUI() {
  if (!currentLessonData) return;

  // Update course title
  document.getElementById('courseTitle').textContent = currentLessonData.course_title;

  // Update chapter title
  document.getElementById('chapterTitle').textContent = currentLessonData.chapter_title;

  // Update progress
  const progress = currentLessonData.courseProgress;
  document.getElementById('lessonProgress').textContent = `Progress: ${progress.completed}/${progress.total}`;

  // Update lesson title
  document.getElementById('lessonTitle').textContent = currentLessonData.title;

  // Update mark complete button
  const markCompleteBtn = document.getElementById('markCompleteBtn');
  const markCompleteText = document.getElementById('markCompleteText');

  if (currentLessonData.isCompleted) {
    markCompleteBtn.classList.add('completed');
    markCompleteText.textContent = 'Completed';
    markCompleteBtn.disabled = true;
  } else {
    markCompleteBtn.classList.remove('completed');
    markCompleteText.textContent = 'Mark as Completed';
    markCompleteBtn.disabled = false;
  }

  // Load video
  loadVideo(currentLessonData.content_url);
}

// YouTube Player Variables
let player;
let updateInterval;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Load video into iframe
function loadVideo(videoUrl) {
  const videoContainer = document.getElementById('videoContainer');

  if (!videoUrl) {
    videoContainer.innerHTML = `
      <div class="video-placeholder">
        <span class="material-symbols-outlined">error</span>
        <p>No video URL available</p>
      </div>
    `;
    return;
  }

  // Extract Video ID
  let videoId = '';
  if (videoUrl.includes('youtube.com/watch?v=')) {
    videoId = videoUrl.split('v=')[1]?.split('&')[0];
  } else if (videoUrl.includes('youtu.be/')) {
    videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
  } else if (videoUrl.includes('youtube.com/embed/')) {
    videoId = videoUrl.split('embed/')[1]?.split('?')[0];
  }

  if (videoId) {
    if (player) {
      player.loadVideoById(videoId);
    } else {
      // Initialize Player if API is ready, otherwise it will be init by onYouTubeIframeAPIReady
      if (window.YT && window.YT.Player) {
        createPlayer(videoId);
      } else {
        window.onYouTubeIframeAPIReady = function () {
          createPlayer(videoId);
        };
      }
    }
  } else {
    // Fallback for non-YouTube videos (if any)
    videoContainer.innerHTML = '<p>Video format not supported for custom player</p>';
  }
}

function createPlayer(videoId) {
  player = new YT.Player('videoContainer', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0, // Hide default controls
      'modestbranding': 1,
      'rel': 0,
      'iv_load_policy': 3,
      'fs': 0,
      'disablekb': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  updateTimerDisplay();
  // Start updating progress
  clearInterval(updateInterval);
  updateInterval = setInterval(updateProgressBar, 500);
}

function onPlayerStateChange(event) {
  const wrapper = document.getElementById('customVideoWrapper');
  const btnIcon = document.querySelector('#playPauseBtn span');
  const bigPlayBtn = document.querySelector('.big-play-button span');

  if (event.data == YT.PlayerState.PLAYING) {
    wrapper.classList.remove('paused');
    if (btnIcon) btnIcon.textContent = 'pause';
    if (bigPlayBtn) bigPlayBtn.textContent = 'pause';
  } else {
    wrapper.classList.add('paused');
    if (btnIcon) btnIcon.textContent = 'play_arrow';
    if (bigPlayBtn) bigPlayBtn.textContent = 'play_arrow';
  }
}

// Custom Control Functions
function togglePlayPause() {
  if (!player) return;
  const state = player.getPlayerState();
  if (state == YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function seekVideo(event) {
  if (!player) return;
  const timeline = document.getElementById('videoTimeline');
  const rect = timeline.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const percentage = offsetX / rect.width;
  const duration = player.getDuration();

  player.seekTo(duration * percentage, true);
}

function updateProgressBar() {
  if (!player || !player.getDuration) return;

  const currentTime = player.getCurrentTime();
  const duration = player.getDuration();

  if (duration) {
    const percentage = (currentTime / duration) * 100;
    const progressBar = document.getElementById('videoProgressBar');
    if (progressBar) progressBar.style.width = `${percentage}%`;
    updateTimerDisplay(currentTime, duration);
  }
}

function updateTimerDisplay(current = 0, total = 0) {
  const currentTimeEl = document.getElementById('currentTime');
  const totalTimeEl = document.getElementById('totalTime');
  if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
  if (totalTimeEl) totalTimeEl.textContent = formatTime(total);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function toggleFullscreen() {
  const wrapper = document.getElementById('customVideoWrapper');
  if (!document.fullscreenElement) {
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen();
    } else if (wrapper.webkitRequestFullscreen) { /* Safari */
      wrapper.webkitRequestFullscreen();
    } else if (wrapper.msRequestFullscreen) { /* IE11 */
      wrapper.msRequestFullscreen();
    }
    wrapper.classList.add('fullscreen');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
    wrapper.classList.remove('fullscreen');
  }
}

// Listen for fullscreen change to update class
document.addEventListener('fullscreenchange', () => {
  const wrapper = document.getElementById('customVideoWrapper');
  if (!document.fullscreenElement) {
    wrapper.classList.remove('fullscreen');
  }
});

// Render chapters in sidebar
function renderChapters() {
  if (!currentLessonData || !currentLessonData.chapters) return;

  const accordion = document.getElementById('chaptersAccordion');
  const currentLessonId = parseInt(currentLessonData.lesson_id);

  accordion.innerHTML = currentLessonData.chapters.map((chapter, chapterIndex) => {
    const isCurrentChapter = chapter.lessons.some(l => l.lesson_id == currentLessonId);
    const collapseId = `collapseChapter${chapter.id}`;

    return `
      <div class="accordion-item-modern">
        <h2 class="accordion-header-modern">
          <button class="accordion-button-modern ${isCurrentChapter ? '' : 'collapsed'}" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#${collapseId}"
                  aria-expanded="${isCurrentChapter ? 'true' : 'false'}">
            <span class="chapter-number">Chapter ${chapter.order || chapterIndex + 1}</span>
            <span class="chapter-name">${chapter.title}</span>
            <span class="lesson-count">${chapter.lessons.length} ${chapter.lessons.length === 1 ? 'lesson' : 'lessons'}</span>
          </button>
        </h2>
        <div id="${collapseId}" 
             class="accordion-collapse-modern collapse ${isCurrentChapter ? 'show' : ''}" 
             data-bs-parent="#chaptersAccordion">
          <div class="accordion-body-modern">
            <ul class="lessons-list-modern">
              ${chapter.lessons.map(lesson => {
      const isCurrent = lesson.lesson_id == currentLessonId;
      const isCompleted = lesson.completed || false;
      return `
                  <li class="lesson-item-modern ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <a href="/course/tv?lessonId=${lesson.lesson_id}" class="lesson-link-modern">
                      <span class="lesson-number-modern">${lesson.order_number || ''}</span>
                      <span class="lesson-title-modern">${lesson.title}</span>
                      ${isCompleted ? '<span class="completed-icon-modern"><span class="material-symbols-outlined">check_circle</span></span>' : ''}
                      ${isCurrent ? '<span class="current-icon-modern"><span class="material-symbols-outlined">play_circle</span></span>' : ''}
                    </a>
                  </li>
                `;
    }).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Update navigation buttons
function updateNavigationButtons() {
  if (!currentLessonData) return;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (currentLessonData.prevLesson) {
    prevBtn.disabled = false;
    prevBtn.onclick = () => navigateToLesson(currentLessonData.prevLesson.lesson_id);
  } else {
    prevBtn.disabled = true;
  }

  if (currentLessonData.nextLesson) {
    nextBtn.disabled = false;
    nextBtn.onclick = () => navigateToLesson(currentLessonData.nextLesson.lesson_id);
  } else {
    nextBtn.disabled = true;
  }
}

// Navigate to lesson
function navigateLesson(direction) {
  if (!currentLessonData) return;

  let targetLesson = null;
  if (direction === 'prev' && currentLessonData.prevLesson) {
    targetLesson = currentLessonData.prevLesson;
  } else if (direction === 'next' && currentLessonData.nextLesson) {
    targetLesson = currentLessonData.nextLesson;
  }

  if (targetLesson) {
    navigateToLesson(targetLesson.lesson_id);
  }
}

// Navigate to specific lesson
function navigateToLesson(lessonId) {
  window.location.href = `/course/tv?lessonId=${lessonId}`;
}

// Mark lesson as complete
async function markLessonComplete() {
  if (!currentLessonData) return;

  const lessonId = currentLessonData.lesson_id;

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
      // Update UI
      const markCompleteBtn = document.getElementById('markCompleteBtn');
      const markCompleteText = document.getElementById('markCompleteText');

      markCompleteBtn.classList.add('completed');
      markCompleteText.textContent = 'Completed';
      markCompleteBtn.disabled = true;

      // Update lesson data
      currentLessonData.isCompleted = true;

      // Reload chapters to update completion status
      renderChapters();

      // Show success message
      showSuccessMessage('Lesson marked as completed!');
    } else {
      alert(result.message || 'Failed to mark lesson as complete');
    }
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    alert('Error marking lesson as complete');
  }
}

// Show error message
function showError(message) {
  const loadingScreen = document.getElementById('loadingScreen');
  loadingScreen.innerHTML = `
    <div class="error-message">
      <span class="material-symbols-outlined">error</span>
      <p>${message}</p>
      <a href="/course" class="btn-back">Go Back to Courses</a>
    </div>
  `;
}

// Show success message
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.innerHTML = `
    <span class="material-symbols-outlined">check_circle</span>
    <span>${message}</span>
  `;
  document.body.appendChild(successDiv);

  setTimeout(() => {
    successDiv.classList.add('show');
  }, 10);

  setTimeout(() => {
    successDiv.classList.remove('show');
    setTimeout(() => successDiv.remove(), 300);
  }, 3000);
}

// Load lesson on page load
document.addEventListener('DOMContentLoaded', function () {
  loadLesson();
});
