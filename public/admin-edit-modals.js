// Edit Chapter Modal Functions
function editChapter(chapterId, currentTitle) {
    // Set the values in the modal
    document.getElementById('editChapterId').value = chapterId;
    document.getElementById('editChapterTitle').value = currentTitle;

    // Clear any previous messages
    const messageDiv = document.getElementById('editChapterMessage');
    messageDiv.style.display = 'none';

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('editChapterModal'));
    modal.show();
}

// Edit Lesson Modal Functions
function editLesson(lessonId, currentTitle, currentVideoUrl) {
    // Set the values in the modal
    document.getElementById('editLessonId').value = lessonId;
    document.getElementById('editLessonTitle').value = currentTitle;
    document.getElementById('editLessonVideoUrl').value = currentVideoUrl;

    // Clear any previous messages
    const messageDiv = document.getElementById('editLessonMessage');
    messageDiv.style.display = 'none';

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('editLessonModal'));
    modal.show();
}

// Handle edit chapter form submission
document.addEventListener('DOMContentLoaded', function () {
    const editChapterForm = document.getElementById('editChapterForm');
    if (editChapterForm) {
        editChapterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const chapterId = document.getElementById('editChapterId').value;
            const newTitle = document.getElementById('editChapterTitle').value.trim();
            const messageDiv = document.getElementById('editChapterMessage');

            if (!newTitle) {
                messageDiv.className = 'alert alert-danger';
                messageDiv.textContent = 'Chapter title is required';
                messageDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`/admin/api/chapters/${chapterId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTitle })
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.className = 'alert alert-success';
                    messageDiv.textContent = 'Chapter updated successfully!';
                    messageDiv.style.display = 'block';

                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('editChapterModal')).hide();
                        loadChapters(currentCourseId);
                    }, 1000);
                } else {
                    messageDiv.className = 'alert alert-danger';
                    messageDiv.textContent = result.message || 'Failed to update chapter';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error updating chapter:', error);
                messageDiv.className = 'alert alert-danger';
                messageDiv.textContent = 'Error connecting to the server.';
                messageDiv.style.display = 'block';
            }
        });
    }

    // Handle edit lesson form submission
    const editLessonForm = document.getElementById('editLessonForm');
    if (editLessonForm) {
        editLessonForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const lessonId = document.getElementById('editLessonId').value;
            const newTitle = document.getElementById('editLessonTitle').value.trim();
            const newVideoUrl = document.getElementById('editLessonVideoUrl').value.trim();
            const messageDiv = document.getElementById('editLessonMessage');

            if (!newTitle) {
                messageDiv.className = 'alert alert-danger';
                messageDiv.textContent = 'Lesson title is required';
                messageDiv.style.display = 'block';
                return;
            }

            if (!newVideoUrl) {
                messageDiv.className = 'alert alert-danger';
                messageDiv.textContent = 'Video URL is required';
                messageDiv.style.display = 'block';
                return;
            }

            try {
                const response = await fetch(`/admin/api/lessons/${lessonId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: newTitle,
                        videoUrl: newVideoUrl
                    })
                });

                const result = await response.json();

                if (result.success) {
                    messageDiv.className = 'alert alert-success';
                    messageDiv.textContent = 'Lesson updated successfully!';
                    messageDiv.style.display = 'block';

                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('editLessonModal')).hide();
                        loadLessons(currentChapterId);
                    }, 1000);
                } else {
                    messageDiv.className = 'alert alert-danger';
                    messageDiv.textContent = result.message || 'Failed to update lesson';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Error updating lesson:', error);
                messageDiv.className = 'alert alert-danger';
                messageDiv.textContent = 'Error connecting to the server.';
                messageDiv.style.display = 'block';
            }
        });
    }
});
