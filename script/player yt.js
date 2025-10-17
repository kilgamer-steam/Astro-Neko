class YouTubeAnimePlayer {
  constructor() {
    // ... ініціалізація змінних ...
    
    // Додаємо нові елементи для кастомного інтерфейсу
    this.progressFilled = document.getElementById('progress-filled');
    this.progressThumb = document.getElementById('progress-thumb');
    this.currentTimeDisplay = document.getElementById('current-time');
    this.durationDisplay = document.getElementById('duration');
    this.playPauseBtn = document.getElementById('play-pause');
    this.rewindBtn = document.getElementById('rewind-10');
    this.forwardBtn = document.getElementById('forward-10');
    this.toggleMuteBtn = document.getElementById('toggle-mute');
    this.volumeFilled = document.getElementById('volume-filled');
    this.toggleFullscreenBtn = document.getElementById('toggle-fullscreen');
    this.videoPoster = document.getElementById('video-poster');
    this.playLargeBtn = document.getElementById('play-large-btn');
    
    this.isPlaying = false;
    this.isMuted = false;
    this.currentVolume = 100;
    this.duration = 0;
    
    this.init();
  }

  // ... інші методи ...

  setupCustomControls() {
    // Події для кастомних контролів
    this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    this.playLargeBtn.addEventListener('click', () => this.startPlayback());
    this.rewindBtn.addEventListener('click', () => this.rewind(10));
    this.forwardBtn.addEventListener('click', () => this.forward(10));
    this.toggleMuteBtn.addEventListener('click', () => this.toggleMute());
    this.toggleFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // Прогрес бар
    this.setupProgressBar();
    
    // Контроль гучності
    this.setupVolumeControl();
    
    // Клік по відео для паузи/відтворення
    this.playerElement.addEventListener('click', () => this.togglePlayPause());
  }

  setupProgressBar() {
    const progressBar = this.progressFilled.parentElement;
    
    progressBar.addEventListener('click', (e) => this.seekToClick(e));
    progressBar.addEventListener('mousemove', (e) => this.showHoverTime(e));
    
    let isDragging = false;
    
    this.progressThumb.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.addEventListener('mousemove', this.handleProgressDrag);
      document.addEventListener('mouseup', () => {
        isDragging = false;
        document.removeEventListener('mousemove', this.handleProgressDrag);
      });
    });
    
    this.handleProgressDrag = (e) => {
      if (isDragging) {
        this.seekToClick(e);
      }
    };
  }

  setupVolumeControl() {
    const volumeBar = this.volumeFilled.parentElement;
    
    volumeBar.addEventListener('click', (e) => {
      const rect = volumeBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this.setVolume(percent * 100);
    });
  }

  initializeYouTubePlayer() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.createPlayer(resolve);
      } else {
        window.onYouTubeIframeAPIReady = () => {
          this.createPlayer(resolve);
        };
      }
    });
  }

  createPlayer(resolve) {
    this.player = new YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId: this.currentVideoId,
      playerVars: {
        'playsinline': 1,
        'enablejsapi': 1,
        'origin': window.location.origin,
        'widget_referrer': window.location.href,
        'rel': 0,
        'modestbranding': 1,
        'showinfo': 0,
        'controls': 0, // ВИМКНУТИ стандартні контроли YouTube
        'autoplay': 0, // ВИМКНУТИ автостарт
        'iv_load_policy': 3,
        'disablekb': 1 // ВИМКНУТИ клавіатурні скорочення YouTube
      },
      events: {
        'onReady': (event) => this.onPlayerReady(event, resolve),
        'onStateChange': (event) => this.onPlayerStateChange(event),
        'onError': (event) => this.onPlayerError(event)
      }
    });
  }

  onPlayerReady(event, resolve) {
    this.playerReady = true;
    this.updateLoadingProgress(90, 'Плеєр готовий до відтворення');
    
    // Отримуємо тривалість відео
    this.duration = event.target.getDuration();
    this.updateDurationDisplay();
    
    // Відновлюємо прогрес (без автоматичного запуску)
    const progress = this.getEpisodeProgress();
    if (progress && progress.time > 0) {
      event.target.seekTo(progress.time, true);
      this.updateProgressBar(progress.time);
    }
    
    // Налаштовуємо кастомні контроли
    this.setupCustomControls();
    
    // Запускаємо оновлення інтерфейсу
    this.startUIUpdate();
    
    this.updateLoadingProgress(100, 'Плеєр завантажено');
    this.hideLoadingDelay = setTimeout(() => this.hideLoading(), 500);
    
    resolve();
  }

  onPlayerStateChange(event) {
    const state = event.data;
    
    switch (state) {
      case YT.PlayerState.PLAYING:
        this.isPlaying = true;
        this.updatePlayPauseButton();
        this.videoPoster.classList.add('hidden');
        this.updateLoadingProgress(100, 'Відтворення розпочато!');
        this.hideLoadingDelay = setTimeout(() => this.hideLoading(), 500);
        this.startProgressTracking();
        break;
        
      case YT.PlayerState.PAUSED:
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.saveProgress();
        break;
        
      case YT.PlayerState.ENDED:
        this.isPlaying = false;
        this.updatePlayPauseButton();
        this.saveProgress();
        if (this.autoNextEnabled) {
          this.handleAutoNext();
        }
        break;
        
      case YT.PlayerState.CUED:
        this.updateLoadingProgress(100, 'Плеєр готовий');
        this.hideLoadingDelay = setTimeout(() => this.hideLoading(), 500);
        break;
    }
    
    if (this.autoSkipEnabled && state === YT.PlayerState.PLAYING) {
      this.checkAutoSkip();
    }
  }

  startUIUpdate() {
    this.uiUpdateInterval = setInterval(() => {
      if (this.player && this.player.getCurrentTime && this.isPlaying) {
        const currentTime = this.player.getCurrentTime();
        this.updateProgressBar(currentTime);
        this.updateTimeDisplay(currentTime);
      }
    }, 100);
  }

  updateProgressBar(currentTime) {
    const progress = (currentTime / this.duration) * 100;
    this.progressFilled.style.width = `${progress}%`;
    this.progressThumb.style.left = `${progress}%`;
  }

  updateTimeDisplay(currentTime) {
    this.currentTimeDisplay.textContent = this.formatTime(currentTime);
  }

  updateDurationDisplay() {
    this.durationDisplay.textContent = this.formatTime(this.duration);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  updatePlayPauseButton() {
    this.playPauseBtn.textContent = this.isPlaying ? '❚❚' : '▶';
  }

  // Основні методи управління
  togglePlayPause() {
    if (!this.playerReady) return;
    
    if (this.isPlaying) {
      this.player.pauseVideo();
    } else {
      this.player.playVideo();
    }
  }

  startPlayback() {
    if (!this.playerReady) return;
    
    this.videoPoster.classList.add('hidden');
    this.player.playVideo();
  }

  rewind(seconds) {
    if (!this.playerReady) return;
    
    const currentTime = this.player.getCurrentTime();
    this.player.seekTo(Math.max(0, currentTime - seconds), true);
  }

  forward(seconds) {
    if (!this.playerReady) return;
    
    const currentTime = this.player.getCurrentTime();
    this.player.seekTo(Math.min(this.duration, currentTime + seconds), true);
  }

  seekToClick(e) {
    if (!this.playerReady) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = this.duration * percent;
    
    this.player.seekTo(seekTime, true);
  }

  toggleMute() {
    if (!this.playerReady) return;
    
    if (this.isMuted) {
      this.player.unMute();
      this.isMuted = false;
      this.toggleMuteBtn.textContent = '🔊';
    } else {
      this.player.mute();
      this.isMuted = true;
      this.toggleMuteBtn.textContent = '🔇';
    }
  }

  setVolume(volume) {
    if (!this.playerReady) return;
    
    this.currentVolume = Math.max(0, Math.min(100, volume));
    this.player.setVolume(this.currentVolume);
    this.volumeFilled.style.width = `${this.currentVolume}%`;
    
    if (this.currentVolume === 0) {
      this.toggleMuteBtn.textContent = '🔇';
      this.isMuted = true;
    } else {
      this.toggleMuteBtn.textContent = '🔊';
      this.isMuted = false;
    }
  }

  toggleFullscreen() {
    const container = this.playerElement.parentElement;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.log('Помилка повноекранного режиму:', err);
      });
      container.classList.add('fullscreen');
    } else {
      document.exitFullscreen();
      container.classList.remove('fullscreen');
    }
  }

  showHoverTime(e) {
    // Можна додати відображення часу при наведенні на прогрес бар
  }

  // ... решта методів залишається незмінною ...

  destroy() {
    // Очищаємо інтервали
    if (this.uiUpdateInterval) {
      clearInterval(this.uiUpdateInterval);
    }
    
    // Викликаємо батьківський destroy
    super.destroy();
  }
}

// Ініціалізація плеєра
document.addEventListener('DOMContentLoaded', () => {
  window.animePlayer = new YouTubeAnimePlayer();
});