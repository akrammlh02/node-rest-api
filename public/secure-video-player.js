/**
 * Secure YouTube Video Player with Custom Controls
 * Hides YouTube branding and provides custom playback controls
 */

class SecureVideoPlayer {
    constructor(containerId, videoUrl) {
        this.container = document.getElementById(containerId);
        this.videoUrl = videoUrl;
        this.player = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentTime = 0;
        this.duration = 0;
        this.volume = 100;

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        // Extract video ID from URL
        this.videoId = this.extractVideoId(this.videoUrl);
        if (!this.videoId) {
            this.showError('Invalid YouTube URL');
            return;
        }

        // Create player structure
        this.createPlayerHTML();

        // Load YouTube IFrame API
        this.loadYouTubeAPI();
    }

    extractVideoId(url) {
        if (!url) return null;

        // Handle different YouTube URL formats
        let videoId = null;

        if (url.includes('youtube.com/embed/')) {
            videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1]?.split('&')[0];
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1]?.split('?')[0];
        }

        return videoId;
    }

    createPlayerHTML() {
        this.container.innerHTML = `
      <div class="secure-player-wrapper">
        <div id="${this.container.id}-youtube" class="secure-player-iframe"></div>
        
        <!-- Custom Controls Overlay -->
        <div class="secure-player-controls">
          <!-- Top gradient for better visibility -->
          <div class="controls-gradient-top"></div>
          
          <!-- Bottom controls -->
          <div class="controls-bottom">
            <!-- Timeline -->
            <div class="timeline-container">
              <div class="timeline">
                <div class="timeline-progress"></div>
                <div class="timeline-buffered"></div>
                <div class="timeline-handle"></div>
              </div>
              <div class="time-display">
                <span class="time-current">0:00</span>
                <span class="time-separator">/</span>
                <span class="time-duration">0:00</span>
              </div>
            </div>
            
            <!-- Control buttons -->
            <div class="controls-buttons">
              <div class="controls-left">
                <button class="btn-control btn-play" title="Play/Pause">
                  <span class="material-symbols-outlined icon-play">play_arrow</span>
                  <span class="material-symbols-outlined icon-pause" style="display:none;">pause</span>
                </button>
                
                <button class="btn-control btn-volume" title="Mute/Unmute">
                  <span class="material-symbols-outlined icon-volume-up">volume_up</span>
                  <span class="material-symbols-outlined icon-volume-off" style="display:none;">volume_off</span>
                </button>
                
                <div class="volume-slider-container">
                  <input type="range" class="volume-slider" min="0" max="100" value="100">
                </div>
              </div>
              
              <div class="controls-right">
                <button class="btn-control btn-settings" title="Quality">
                  <span class="material-symbols-outlined">settings</span>
                </button>
                
                <button class="btn-control btn-fullscreen" title="Fullscreen">
                  <span class="material-symbols-outlined icon-fullscreen">fullscreen</span>
                  <span class="material-symbols-outlined icon-fullscreen-exit" style="display:none;">fullscreen_exit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Loading overlay (initially hidden) -->
        <div class="secure-player-loading" style="display: none;">
          <div class="loading-spinner"></div>
        </div>
        
        <!-- Big play button overlay -->
        <div class="secure-player-big-play">
          <button class="btn-big-play">
            <span class="material-symbols-outlined">play_circle</span>
          </button>
        </div>
      </div>
    `;

        this.attachEventListeners();
    }

    loadYouTubeAPI() {
        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            this.createPlayer();
            return;
        }

        // Load the API
        if (!window.onYouTubeIframeAPIReady) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Store reference to this instance
            const self = this;
            window.onYouTubeIframeAPIReady = () => {
                self.createPlayer();
                // Also trigger for any other players waiting
                if (window.playersWaiting) {
                    window.playersWaiting.forEach(player => player.createPlayer());
                    window.playersWaiting = [];
                }
            };
        } else {
            // API is loading, wait for it
            if (!window.playersWaiting) window.playersWaiting = [];
            window.playersWaiting.push(this);
        }
    }

    createPlayer() {
        const playerId = `${this.container.id}-youtube`;

        this.player = new YT.Player(playerId, {
            videoId: this.videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,  // Hide YouTube controls
                modestbranding: 1,  // Hide YouTube logo
                rel: 0,  // Don't show related videos
                showinfo: 0,  // Hide video info
                fs: 1,  // Enable fullscreen
                iv_load_policy: 3,  // Hide annotations
                disablekb: 0,  // Enable keyboard controls
                playsinline: 1,  // Play inline on mobile
                origin: window.location.origin
            },
            events: {
                onReady: (event) => this.onPlayerReady(event),
                onStateChange: (event) => this.onPlayerStateChange(event)
            }
        });
    }

    onPlayerReady(event) {
        this.duration = this.player.getDuration();
        this.updateTimeDisplay();

        // Ensure loading screen is hidden
        this.hideLoading();

        // Start time update interval
        setInterval(() => {
            if (this.isPlaying) {
                this.currentTime = this.player.getCurrentTime();
                this.updateTimeline();
                this.updateTimeDisplay();
            }
        }, 100);
    }

    onPlayerStateChange(event) {
        const state = event.data;

        // Always hide loading screen first
        this.hideLoading();

        if (state === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.updatePlayButton(true);
            this.hideBigPlayButton();
            this.hideLoading();
        } else if (state === YT.PlayerState.PAUSED) {
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.hideLoading();
        } else if (state === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            this.updatePlayButton(false);
            this.showBigPlayButton();
            this.hideLoading();
        } else if (state === YT.PlayerState.BUFFERING) {
            this.showLoading();
        } else {
            this.hideLoading();
        }
    }

    attachEventListeners() {
        // Play/Pause button
        const playBtn = this.container.querySelector('.btn-play');
        const bigPlayBtn = this.container.querySelector('.btn-big-play');

        playBtn?.addEventListener('click', () => this.togglePlay());
        bigPlayBtn?.addEventListener('click', () => this.togglePlay());

        // Volume button
        const volumeBtn = this.container.querySelector('.btn-volume');
        volumeBtn?.addEventListener('click', () => this.toggleMute());

        // Volume slider
        const volumeSlider = this.container.querySelector('.volume-slider');
        volumeSlider?.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Fullscreen button
        const fullscreenBtn = this.container.querySelector('.btn-fullscreen');
        fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());

        // Timeline
        const timeline = this.container.querySelector('.timeline');
        timeline?.addEventListener('click', (e) => this.seekToPosition(e));

        // Timeline dragging
        let isDragging = false;
        const timelineHandle = this.container.querySelector('.timeline-handle');

        timelineHandle?.addEventListener('mousedown', () => {
            isDragging = true;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        timeline?.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.seekToPosition(e);
            }
        });

        // Show/hide controls on hover
        const wrapper = this.container.querySelector('.secure-player-wrapper');
        const controls = this.container.querySelector('.secure-player-controls');

        let hideControlsTimeout;

        const showControls = () => {
            controls?.classList.add('visible');
            clearTimeout(hideControlsTimeout);

            if (this.isPlaying) {
                hideControlsTimeout = setTimeout(() => {
                    controls?.classList.remove('visible');
                }, 3000);
            }
        };

        wrapper?.addEventListener('mousemove', showControls);
        wrapper?.addEventListener('touchstart', showControls);

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.player) return;

            switch (e.key) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seekRelative(-5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seekRelative(5);
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });
    }

    togglePlay() {
        if (!this.player) return;

        if (this.isPlaying) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

    toggleMute() {
        if (!this.player) return;

        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            this.player.mute();
            this.updateVolumeButton(true);
        } else {
            this.player.unMute();
            this.updateVolumeButton(false);
        }
    }

    setVolume(volume) {
        if (!this.player) return;

        this.volume = parseInt(volume);
        this.player.setVolume(this.volume);

        if (this.volume === 0) {
            this.isMuted = true;
            this.updateVolumeButton(true);
        } else {
            this.isMuted = false;
            this.updateVolumeButton(false);
        }
    }

    seekToPosition(event) {
        if (!this.player) return;

        const timeline = this.container.querySelector('.timeline');
        const rect = timeline.getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const seekTime = percent * this.duration;

        this.player.seekTo(seekTime, true);
        this.currentTime = seekTime;
        this.updateTimeline();
        this.updateTimeDisplay();
    }

    seekRelative(seconds) {
        if (!this.player) return;

        const newTime = Math.max(0, Math.min(this.duration, this.currentTime + seconds));
        this.player.seekTo(newTime, true);
    }

    toggleFullscreen() {
        const wrapper = this.container.querySelector('.secure-player-wrapper');

        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
            this.updateFullscreenButton(true);
        } else {
            document.exitFullscreen();
            this.updateFullscreenButton(false);
        }
    }

    updatePlayButton(isPlaying) {
        const playIcon = this.container.querySelector('.icon-play');
        const pauseIcon = this.container.querySelector('.icon-pause');

        if (isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }

    updateVolumeButton(isMuted) {
        const volumeUpIcon = this.container.querySelector('.icon-volume-up');
        const volumeOffIcon = this.container.querySelector('.icon-volume-off');

        if (isMuted) {
            volumeUpIcon.style.display = 'none';
            volumeOffIcon.style.display = 'block';
        } else {
            volumeUpIcon.style.display = 'block';
            volumeOffIcon.style.display = 'none';
        }
    }

    updateFullscreenButton(isFullscreen) {
        const fullscreenIcon = this.container.querySelector('.icon-fullscreen');
        const fullscreenExitIcon = this.container.querySelector('.icon-fullscreen-exit');

        if (isFullscreen) {
            fullscreenIcon.style.display = 'none';
            fullscreenExitIcon.style.display = 'block';
        } else {
            fullscreenIcon.style.display = 'block';
            fullscreenExitIcon.style.display = 'none';
        }
    }

    updateTimeline() {
        const progress = this.container.querySelector('.timeline-progress');
        const handle = this.container.querySelector('.timeline-handle');

        if (this.duration > 0) {
            const percent = (this.currentTime / this.duration) * 100;
            progress.style.width = percent + '%';
            handle.style.left = percent + '%';
        }
    }

    updateTimeDisplay() {
        const currentEl = this.container.querySelector('.time-current');
        const durationEl = this.container.querySelector('.time-duration');

        currentEl.textContent = this.formatTime(this.currentTime);
        durationEl.textContent = this.formatTime(this.duration);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showLoading() {
        const loading = this.container.querySelector('.secure-player-loading');
        if (loading) {
            loading.style.display = 'flex';
            loading.style.opacity = '1';
        }
    }

    hideLoading() {
        const loading = this.container.querySelector('.secure-player-loading');
        if (loading) {
            loading.style.display = 'none';
            loading.style.opacity = '0';
        }
    }

    showBigPlayButton() {
        const bigPlay = this.container.querySelector('.secure-player-big-play');
        if (bigPlay) {
            bigPlay.style.display = 'flex';
        }
    }

    hideBigPlayButton() {
        const bigPlay = this.container.querySelector('.secure-player-big-play');
        if (bigPlay) {
            bigPlay.style.display = 'none';
        }
    }

    showError(message) {
        this.container.innerHTML = `
      <div class="secure-player-error">
        <span class="material-symbols-outlined">error</span>
        <p>${message}</p>
      </div>
    `;
    }

    // Public method to destroy player
    destroy() {
        if (this.player) {
            this.player.destroy();
        }
    }
}

// Export for use in other files
window.SecureVideoPlayer = SecureVideoPlayer;
