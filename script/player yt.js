class YouTubeAnimePlayer {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        this.animeId = this.params.get("id");
        this.seasonNumber = parseInt(this.params.get("season"));
        this.episodeNumber = parseInt(this.params.get("episode"));
        this.movieNumber = parseInt(this.params.get("movie"));
        
        this.player = null;
        this.playerElement = document.getElementById("youtube-player");
        this.seasonOrMovieSpan = document.getElementById("season-or-movie");
        this.episodeNumSpan = document.getElementById("episode-number");
        this.titleSpan = document.getElementById("episode-title");
        this.prevBtn = document.getElementById("prev-episode");
        this.nextBtn = document.getElementById("next-episode");
        this.backToInfoBtn = document.getElementById("backToInfo");

        // Елементи налаштувань
        this.settingsModal = document.getElementById('settings-modal');
        this.openSettingsBtn = document.getElementById('open-settings');
        this.closeSettingsBtn = document.getElementById('close-settings');
        this.closeModalBtn = document.getElementById('close-modal');
        this.settingsAudioSelect = document.getElementById('settings-audio');
        this.settingsQualitySelect = document.getElementById('settings-quality');
        this.autoSkipLink = document.getElementById('auto-skip-link');
        this.autoNextLink = document.getElementById('auto-next-link');

        // Кастомні елементи управління
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
        this.progressBar = this.progressFilled ? this.progressFilled.parentElement : null;

        // Стан плеєра
        this.currentEpisode = null;
        this.currentAnime = null;
        this.currentDubbingStudio = null;
        this.currentQuality = null;
        this.currentVideoId = null;
        this.autoSkipEnabled = false;
        this.autoNextEnabled = false;
        this.isLoading = true;
        this.playerReady = false;
        this.currentTime = 0;
        this.duration = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.currentVolume = 80;
        this.isDraggingProgress = false;
        this.isControlsVisible = true;
        this.controlsTimeout = null;

        // Елемент для підказки часу
        this.timeTooltip = null;

        this.init();
    }

    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="wave-loader">
                <div class="wave-dot"></div>
                <div class="wave-dot"></div>
                <div class="wave-dot"></div>
                <div class="wave-dot"></div>
                <div class="wave-dot"></div>
            </div>
            <div class="loading-text">Триває Astro завантаження</div>
            <div class="loading-subtext" id="loading-status">Підготовка YouTube плеєра</div>
            <div class="loading-progress">
                <div class="loading-progress-bar" id="loading-progress-bar"></div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.loadingProgressBar = overlay.querySelector('#loading-progress-bar');
        return overlay;
    }

    updateLoadingProgress(percentage, status = '') {
        if (this.loadingProgressBar) {
            this.loadingProgressBar.style.width = percentage + '%';
        }
        
        const statusElement = document.getElementById('loading-status');
        if (statusElement && status) {
            statusElement.textContent = status;
        }
    }

    showLoading() {
        this.isLoading = true;
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
        this.updateLoadingProgress(0, 'Підготовка YouTube плеєра...');
    }

    hideLoading() {
        this.isLoading = false;
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
        
        // Анімація появи контенту
        const playerWrapper = document.querySelector('.player-wrapper');
        const youtubePlayer = document.getElementById('youtube-player');
        
        if (playerWrapper) playerWrapper.classList.add('loaded');
        if (youtubePlayer) youtubePlayer.classList.add('loaded');
    }

    async init() {
        this.loadingOverlay = this.createLoadingOverlay();
        this.showLoading();
        await this.setupEventListeners();
        await this.loadPlayer();
        this.setupAutoHideHeader();
    }

    async setupEventListeners() {
        // Навігація
        this.backToInfoBtn.onclick = () => this.goBackToInfo();
        this.prevBtn.onclick = () => this.goToPreviousEpisode();
        this.nextBtn.onclick = () => this.goToNextEpisode();

        // Налаштування
        this.openSettingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.closeModalBtn.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });

        // Перемикачі налаштувань
        this.autoSkipLink.addEventListener('click', (e) => this.toggleAutoSkip(e));
        this.autoNextLink.addEventListener('click', (e) => this.toggleAutoNext(e));
        this.settingsAudioSelect.addEventListener('change', () => this.onAudioChange());
        this.settingsQualitySelect.addEventListener('change', () => this.onQualityChange());

        // Кастомні контроли
        this.setupCustomControls();

        // Збереження прогресу
        this.throttledSaveProgress = this.throttle(() => this.saveProgress(), 2000);
    }

    setupCustomControls() {
        if (!this.playPauseBtn) return;

        // Події для кастомних контролів
        this.playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePlayPause();
        });
        
        this.playLargeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startPlayback();
        });
        
        this.rewindBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.rewind(10);
        });
        
        this.forwardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.forward(10);
        });
        
        this.toggleMuteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });
        
        this.toggleFullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFullscreen();
        });

        // Прогрес бар
        this.setupProgressBar();

        // Контроль гучності
        this.setupVolumeControl();

        // Клік по відео для паузи/відтворення
        this.playerElement.addEventListener('click', () => this.togglePlayPause());

        // Управління відображенням контролів
        this.setupControlsVisibility();
    }

    setupProgressBar() {
        if (!this.progressBar) return;

        const progressContainer = this.progressBar.parentElement;
        
        // Клік по прогрес бару
        progressContainer.addEventListener('click', (e) => this.seekToClick(e));
        
        // Наведення на прогрес бар
        progressContainer.addEventListener('mousemove', (e) => this.showHoverTime(e));
        progressContainer.addEventListener('mouseleave', () => this.hideHoverTime());
        
        // Перетягування повзунка
        this.progressThumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startDragging(e);
        });
    }

    setupVolumeControl() {
        const volumeBar = this.volumeFilled ? this.volumeFilled.parentElement : null;
        if (!volumeBar) return;
        
        volumeBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = volumeBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.setVolume(percent * 100);
        });
    }

    setupControlsVisibility() {
        const playerContainer = this.playerElement.parentElement;
        
        playerContainer.addEventListener('mousemove', () => {
            this.showControls();
            this.resetControlsTimer();
        });
        
        playerContainer.addEventListener('mouseleave', () => {
            this.startControlsTimer();
        });
    }

    showControls() {
        const controls = document.querySelector('.custom-controls');
        if (controls) {
            controls.style.opacity = '1';
        }
        this.isControlsVisible = true;
    }

    hideControls() {
        if (this.isPlaying) {
            const controls = document.querySelector('.custom-controls');
            if (controls) {
                controls.style.opacity = '0';
            }
            this.isControlsVisible = false;
        }
    }

    resetControlsTimer() {
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
        }
        this.controlsTimeout = setTimeout(() => this.hideControls(), 3000);
    }

    startControlsTimer() {
        if (this.isPlaying) {
            this.controlsTimeout = setTimeout(() => this.hideControls(), 1000);
        }
    }

    async loadPlayer() {
        if (!this.animeId) {
            alert("Не вказано всі параметри для плеєра!");
            this.hideLoading();
            return;
        }

        try {
            this.updateLoadingProgress(10, 'Завантаження даних аніме...');
            const anime = await this.fetchAnimeData();
            this.currentAnime = anime;
            
            this.updateLoadingProgress(20, 'Налаштування сторінки...');
            this.setupPage(anime);
            
            this.updateLoadingProgress(40, 'Завантаження епізоду...');
            await this.setupEpisode();
            
            this.updateLoadingProgress(60, 'Ініціалізація YouTube плеєра...');
            await this.initializeYouTubePlayer();
            
            this.updateLoadingProgress(80, 'Налаштування навігації...');
            this.setupNavigationButtons();
            this.setupTooltip();

        } catch (err) {
            console.error('Критична помилка:', err);
            this.updateLoadingProgress(0, 'Помилка завантаження');
            
            setTimeout(() => {
                alert("Помилка при завантаженні плеєра: " + err.message);
                this.hideLoading();
            }, 1000);
        }
    }

    async fetchAnimeData() {
        const resp = await fetch(`anime/${encodeURIComponent(this.animeId)}.json`);
        if (!resp.ok) throw new Error("Не вдалося завантажити аніме");
        return await resp.json();
    }

    setupPage(anime) {
        document.getElementById("anime-bg").style.backgroundImage = `url('${anime.background}')`;
        document.title = `Дивитися — ${anime.title}`;
    }

    async setupEpisode() {
        const episode = this.findCurrentEpisode();
        if (!episode) throw new Error("Епізод не знайдено");

        this.currentEpisode = episode;
        this.updateEpisodeInfo();
        
        const preferences = this.getAnimePreferences();
        this.applyPreferences(preferences);
        
        this.restoreProgress();
        this.setupAutoFeatures();
    }

    findCurrentEpisode() {
        if (this.seasonNumber) {
            const season = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
            return season ? season.episodes[this.episodeNumber - 1] : null;
        } else if (this.movieNumber) {
            return this.currentAnime.movies[this.movieNumber - 1];
        }
        return null;
    }

    updateEpisodeInfo() {
        const isMovie = !!this.movieNumber;
        
        if (isMovie) {
            this.seasonOrMovieSpan.textContent = `Фільм ${this.movieNumber}`;
            this.episodeNumSpan.textContent = "";
            this.prevBtn.style.display = "none";
            this.nextBtn.style.display = "none";
        } else {
            this.seasonOrMovieSpan.textContent = `Сезон ${this.seasonNumber}`;
            this.episodeNumSpan.textContent = `Серія ${this.episodeNumber}`;
            this.prevBtn.style.display = "inline-block";
            this.nextBtn.style.display = "inline-block";
        }
        this.titleSpan.textContent = this.currentEpisode.name;
    }

    setupNavigationButtons() {
        if (this.movieNumber) {
            return;
        }

        // Анімації для кнопок навігації
        this.prevBtn.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        this.nextBtn.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

        // Перевірка для кнопки "Попередня серія"
        if (this.episodeNumber === 1 && this.seasonNumber === 1) {
            this.prevBtn.disabled = true;
            this.prevBtn.style.opacity = "0.5";
            this.prevBtn.style.transform = "scale(0.95)";
        } else {
            this.prevBtn.disabled = false;
            this.prevBtn.style.opacity = "1";
            this.prevBtn.style.transform = "scale(1)";
        }

        // Перевірка для кнопки "Наступна серія"
        const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
        const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
        
        if (this.episodeNumber >= currentSeason.episodes.length && !nextSeason) {
            this.nextBtn.disabled = true;
            this.nextBtn.style.opacity = "0.5";
            this.nextBtn.style.transform = "scale(0.95)";
        } else {
            this.nextBtn.disabled = false;
            this.nextBtn.style.opacity = "1";
            this.nextBtn.style.transform = "scale(1)";
        }
    }

    applyPreferences(preferences) {
        let dubbingIndex = 0;
        let qualityIndex = 0;

        if (preferences.dubbing) {
            const preferredDubbingIndex = this.currentEpisode.dubbing.findIndex(d => d.studio === preferences.dubbing);
            if (preferredDubbingIndex !== -1) dubbingIndex = preferredDubbingIndex;
            
            if (preferences.quality) {
                const selectedDubbing = this.currentEpisode.dubbing[dubbingIndex];
                const preferredQualityIndex = selectedDubbing.quality.findIndex(q => q.value === preferences.quality);
                if (preferredQualityIndex !== -1) qualityIndex = preferredQualityIndex;
            }
        }

        this.currentDubbingStudio = this.currentEpisode.dubbing[dubbingIndex].studio;
        this.currentQuality = this.currentEpisode.dubbing[dubbingIndex].quality[qualityIndex].value;
        this.currentVideoId = this.extractYouTubeId(this.currentEpisode.dubbing[dubbingIndex].quality[qualityIndex].videoUrl);
        
        this.autoSkipEnabled = Boolean(preferences.autoSkip);
        this.autoNextEnabled = Boolean(preferences.autoNext);
    }

    extractYouTubeId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
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
                'controls': 0,
                'autoplay': 0,
                'iv_load_policy': 3,
                'disablekb': 0
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
            this.updateTimeDisplay(progress.time);
        }
        
        // Встановлюємо початкову гучність
        this.player.setVolume(this.currentVolume);
        this.updateVolumeDisplay();
        
        this.updateLoadingProgress(100, 'Плеєр завантажено');
        setTimeout(() => this.hideLoading(), 500);
        
        resolve();
    }

    onPlayerStateChange(event) {
        const state = event.data;
        
        switch (state) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                this.updatePlayPauseButton();
                this.videoPoster.classList.add('hidden');
                this.startProgressTracking();
                this.startUIUpdate();
                this.startControlsTimer();
                break;
                
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                this.updatePlayPauseButton();
                this.saveProgress();
                this.showControls();
                break;
                
            case YT.PlayerState.ENDED:
                this.isPlaying = false;
                this.updatePlayPauseButton();
                this.saveProgress();
                this.showControls();
                if (this.autoNextEnabled) {
                    this.handleAutoNext();
                }
                break;
                
            case YT.PlayerState.CUED:
                this.updateLoadingProgress(100, 'Плеєр готовий');
                setTimeout(() => this.hideLoading(), 500);
                break;
        }
        
        if (this.autoSkipEnabled && state === YT.PlayerState.PLAYING) {
            this.checkAutoSkip();
        }
    }

    onPlayerError(event) {
        console.error('YouTube помилка:', event.data);
        this.updateLoadingProgress(0, 'Помилка завантаження відео');
    }

    startUIUpdate() {
        // Оновлюємо UI кожні 100мс для плавності
        this.uiUpdateInterval = setInterval(() => {
            if (this.player && this.player.getCurrentTime && this.isPlaying) {
                const currentTime = this.player.getCurrentTime();
                this.currentTime = currentTime;
                this.updateProgressBar(currentTime);
                this.updateTimeDisplay(currentTime);
            }
        }, 100);
    }

    updateProgressBar(currentTime) {
        if (!this.progressFilled || !this.progressThumb) return;
        
        const progress = (currentTime / this.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
        this.progressThumb.style.left = `${progress}%`;
    }

    updateTimeDisplay(currentTime) {
        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = this.formatTime(currentTime);
        }
    }

    updateDurationDisplay() {
        if (this.durationDisplay) {
            this.durationDisplay.textContent = this.formatTime(this.duration);
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updatePlayPauseButton() {
        if (this.playPauseBtn) {
            this.playPauseBtn.textContent = this.isPlaying ? '❚❚' : '▶';
            this.playPauseBtn.style.transform = this.isPlaying ? 'scale(1.1)' : 'scale(1)';
        }
    }

    updateVolumeDisplay() {
        if (this.volumeFilled) {
            this.volumeFilled.style.width = `${this.currentVolume}%`;
        }
        if (this.toggleMuteBtn) {
            this.toggleMuteBtn.textContent = this.isMuted ? '🔇' : '🔊';
        }
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
        const newTime = Math.max(0, currentTime - seconds);
        this.player.seekTo(newTime, true);
        
        // Анімація кнопки
        this.animateButton(this.rewindBtn);
    }

    forward(seconds) {
        if (!this.playerReady) return;
        
        const currentTime = this.player.getCurrentTime();
        const newTime = Math.min(this.duration, currentTime + seconds);
        this.player.seekTo(newTime, true);
        
        // Анімація кнопки
        this.animateButton(this.forwardBtn);
    }

    animateButton(button) {
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    seekToClick(e) {
        if (!this.playerReady || !this.progressBar) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = this.duration * Math.max(0, Math.min(1, percent));
        
        this.player.seekTo(seekTime, true);
    }

    startDragging(e) {
        this.isDraggingProgress = true;
        document.addEventListener('mousemove', this.handleDrag);
        document.addEventListener('mouseup', this.stopDragging);
        
        this.showControls();
    }

    handleDrag = (e) => {
        if (!this.isDraggingProgress || !this.progressBar) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = this.duration * Math.max(0, Math.min(1, percent));
        
        this.updateProgressBar(seekTime);
        this.updateTimeDisplay(seekTime);
        
        // Оновлюємо підказку під час перетягування
        this.updateTimeTooltip(e, seekTime);
    }

    stopDragging = () => {
        if (!this.isDraggingProgress) return;
        
        this.isDraggingProgress = false;
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.stopDragging);
        
        if (this.playerReady) {
            const currentProgress = parseFloat(this.progressFilled.style.width) / 100;
            const seekTime = this.duration * currentProgress;
            this.player.seekTo(seekTime, true);
        }
        
        this.hideTimeTooltip();
    }

    showHoverTime(e) {
        if (!this.progressBar || this.isDraggingProgress) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const hoverTime = this.duration * Math.max(0, Math.min(1, percent));
        
        this.createTimeTooltip();
        this.updateTimeTooltip(e, hoverTime);
    }

    hideHoverTime() {
        if (!this.isDraggingProgress) {
            this.hideTimeTooltip();
        }
    }

    createTimeTooltip() {
        if (this.timeTooltip) return;
        
        this.timeTooltip = document.createElement('div');
        this.timeTooltip.className = 'time-tooltip';
        document.body.appendChild(this.timeTooltip);
    }

    updateTimeTooltip(e, time) {
        if (!this.timeTooltip) return;
        
        this.timeTooltip.textContent = this.formatTime(time);
        this.timeTooltip.style.left = e.clientX + 'px';
        this.timeTooltip.style.top = (e.clientY - 40) + 'px';
        this.timeTooltip.style.display = 'block';
    }

    hideTimeTooltip() {
        if (this.timeTooltip) {
            this.timeTooltip.style.display = 'none';
        }
    }

    toggleMute() {
        if (!this.playerReady) return;
        
        if (this.isMuted) {
            this.player.unMute();
            this.isMuted = false;
        } else {
            this.player.mute();
            this.isMuted = true;
        }
        this.updateVolumeDisplay();
        this.animateButton(this.toggleMuteBtn);
    }

    setVolume(volume) {
        if (!this.playerReady) return;
        
        this.currentVolume = Math.max(0, Math.min(100, volume));
        this.player.setVolume(this.currentVolume);
        this.updateVolumeDisplay();
        
        if (this.currentVolume === 0 && !this.isMuted) {
            this.isMuted = true;
        } else if (this.currentVolume > 0 && this.isMuted) {
            this.isMuted = false;
        }
        this.updateVolumeDisplay();
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
        this.animateButton(this.toggleFullscreenBtn);
    }

    // Навігація між серіями
    goBackToInfo() {
        this.saveProgress();
        window.location.href = `anime-info.html?id=${encodeURIComponent(this.animeId)}`;
    }

    goToPreviousEpisode() {
        this.animateButton(this.prevBtn);
        this.saveProgress();
        
        if (this.episodeNumber > 1) {
            window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber-1}`;
        } else if (this.seasonNumber > 1) {
            const prevSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber - 1);
            if (prevSeason && prevSeason.episodes.length > 0) {
                const lastEpisodeInPrevSeason = prevSeason.episodes.length;
                window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber-1}&episode=${lastEpisodeInPrevSeason}`;
            }
        }
    }

    goToNextEpisode() {
        this.animateButton(this.nextBtn);
        this.saveProgress();
        
        const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
        
        if (this.episodeNumber < currentSeason.episodes.length) {
            window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber+1}`;
        } else {
            const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
            if (nextSeason && nextSeason.episodes.length > 0) {
                window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber+1}&episode=1`;
            } else {
                alert("Це остання серія аніме!");
            }
        }
    }

    // Авто-скіп та авто-продовження
    checkAutoSkip() {
        if (!this.autoSkipEnabled || !this.currentEpisode || !this.playerReady) return;
        
        const currentDubbing = this.currentEpisode.dubbing.find(d => d.studio === this.currentDubbingStudio);
        if (!currentDubbing) return;
        
        const [openingStart, openingEnd] = currentDubbing.opening || [0, 0];
        const [endingStart, endingEnd] = currentDubbing.ending || [0, 0];
        
        const currentTime = this.player.getCurrentTime();
        
        if (openingStart >= 0 && openingEnd > openingStart && 
            currentTime >= openingStart && currentTime <= openingEnd) {
            this.player.seekTo(openingEnd, true);
        }
        
        if (endingStart >= 0 && endingEnd > endingStart && 
            currentTime >= endingStart && currentTime <= endingEnd) {
            this.player.seekTo(endingEnd, true);
        }
    }

    handleAutoNext() {
        if (this.nextBtn.style.display !== 'none' && !this.nextBtn.disabled) {
            setTimeout(() => {
                this.goToNextEpisode();
            }, 2000);
        }
    }

    // Налаштування
    openSettings() {
        this.settingsModal.style.display = 'flex';
        setTimeout(() => {
            this.settingsModal.querySelector('.settings-content').classList.add('show');
        }, 10);
        this.loadCurrentSettings();
        this.animateButton(this.openSettingsBtn);
    }

    closeSettings() {
        const settingsContent = this.settingsModal.querySelector('.settings-content');
        settingsContent.classList.remove('show');
        setTimeout(() => {
            this.settingsModal.style.display = 'none';
        }, 300);
    }

    loadCurrentSettings() {
        const prefs = this.getAnimePreferences();
        
        this.settingsAudioSelect.innerHTML = '';
        if (this.currentEpisode && this.currentEpisode.dubbing) {
            this.currentEpisode.dubbing.forEach((dub) => {
                const option = document.createElement('option');
                option.value = dub.studio;
                option.textContent = `${dub.studio} (${dub.language})`;
                option.selected = dub.studio === this.currentDubbingStudio;
                this.settingsAudioSelect.appendChild(option);
            });
        }
        
        this.updateQualityOptions();
        
        this.autoSkipEnabled = Boolean(prefs.autoSkip);
        this.autoNextEnabled = Boolean(prefs.autoNext);
        
        this.updateToggleDisplay();
    }

    updateQualityOptions() {
        this.settingsQualitySelect.innerHTML = '';
        
        if (!this.currentEpisode || !this.currentEpisode.dubbing) return;
        
        const selectedAudio = this.currentEpisode.dubbing.find(d => d.studio === this.settingsAudioSelect.value);
        if (selectedAudio && selectedAudio.quality) {
            selectedAudio.quality.forEach(quality => {
                const option = document.createElement('option');
                option.value = quality.value;
                option.textContent = `${quality.value}p`;
                option.selected = quality.value === this.currentQuality;
                this.settingsQualitySelect.appendChild(option);
            });
        }
    }

    updateToggleDisplay() {
        if (this.autoSkipLink) {
            if (this.autoSkipEnabled) {
                this.autoSkipLink.classList.add('active');
                this.autoSkipLink.querySelector('.toggle-icon').textContent = '☑';
            } else {
                this.autoSkipLink.classList.remove('active');
                this.autoSkipLink.querySelector('.toggle-icon').textContent = '☐';
            }
        }
        
        if (this.autoNextLink) {
            if (this.autoNextEnabled) {
                this.autoNextLink.classList.add('active');
                this.autoNextLink.querySelector('.toggle-icon').textContent = '☑';
            } else {
                this.autoNextLink.classList.remove('active');
                this.autoNextLink.querySelector('.toggle-icon').textContent = '☐';
            }
        }
    }

    toggleAutoSkip(e) {
        e.preventDefault();
        this.autoSkipEnabled = !this.autoSkipEnabled;
        this.updateToggleDisplay();
        this.saveSettings();
    }

    toggleAutoNext(e) {
        e.preventDefault();
        this.autoNextEnabled = !this.autoNextEnabled;
        this.updateToggleDisplay();
        this.saveSettings();
    }

    onAudioChange() {
        this.updateQualityOptions();
        this.applyAudioChange();
    }

    onQualityChange() {
        this.applyQualityChange();
    }

    applyAudioChange() {
        if (!this.settingsAudioSelect.value) return;
        
        const selectedAudio = this.currentEpisode.dubbing.find(d => d.studio === this.settingsAudioSelect.value);
        if (selectedAudio && selectedAudio.quality.length > 0) {
            const highestQuality = selectedAudio.quality.reduce((max, q) => 
                parseInt(q.value) > parseInt(max.value) ? q : max
            );
            
            this.currentDubbingStudio = this.settingsAudioSelect.value;
            this.currentQuality = highestQuality.value;
            this.currentVideoId = this.extractYouTubeId(highestQuality.videoUrl);
            
            this.updateVideoSource();
            this.saveSettings();
        }
    }

    applyQualityChange() {
        if (!this.settingsQualitySelect.value || !this.settingsAudioSelect.value) return;
        
        const selectedAudio = this.currentEpisode.dubbing.find(d => d.studio === this.settingsAudioSelect.value);
        const selectedQuality = selectedAudio.quality.find(q => q.value === this.settingsQualitySelect.value);
        
        if (selectedQuality) {
            this.currentQuality = selectedQuality.value;
            this.currentVideoId = this.extractYouTubeId(selectedQuality.videoUrl);
            this.updateVideoSource();
            this.saveSettings();
        }
    }

    updateVideoSource() {
        if (!this.playerReady || !this.currentVideoId) return;
        
        const currentTime = this.player.getCurrentTime();
        this.player.loadVideoById({
            videoId: this.currentVideoId,
            startSeconds: currentTime
        });
    }

    // Інші методи
    setupAutoHideHeader() {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        const headerHeight = header.offsetHeight;

        document.querySelector('.player-wrapper').style.paddingTop = headerHeight + 'px';

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
            
            lastScrollY = currentScrollY;
        });

        header.addEventListener('mouseenter', () => {
            header.classList.remove('hidden');
        });

        header.addEventListener('mouseleave', () => {
            lastScrollY = window.scrollY;
        });
    }

    setupAutoFeatures() {
        // Авто-скіп та авто-продовження вже налаштовані
    }

    setupTooltip() {
        let customTooltip = null;
        this.titleSpan.addEventListener('mouseenter', (e) => {
            if (!customTooltip) {
                customTooltip = document.createElement('div');
                customTooltip.className = 'custom-tooltip';
                document.body.appendChild(customTooltip);
            }
            
            const rect = e.target.getBoundingClientRect();
            customTooltip.textContent = this.currentEpisode.name;
            customTooltip.style.left = (rect.left + rect.width / 2) + 'px';
            customTooltip.style.top = (rect.bottom + 10) + 'px';
            customTooltip.style.transform = 'translateX(-50%) scale(0.5)';
            customTooltip.style.opacity = '0';
            customTooltip.style.display = 'block';
            
            setTimeout(() => {
                customTooltip.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                customTooltip.style.transform = 'translateX(-50%) scale(1)';
                customTooltip.style.opacity = '1';
            }, 10);
        });

        this.titleSpan.addEventListener('mouseleave', () => {
            if (customTooltip) {
                customTooltip.style.transition = 'all 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045)';
                customTooltip.style.transform = 'translateX(-50%) scale(0.7)';
                customTooltip.style.opacity = '0';
                
                setTimeout(() => {
                    customTooltip.style.display = 'none';
                }, 300);
            }
        });
    }

    startProgressTracking() {
        this.progressInterval = setInterval(() => {
            if (this.player && this.player.getCurrentTime) {
                this.currentTime = this.player.getCurrentTime();
                this.throttledSaveProgress();
            }
        }, 1000);
    }

    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    restoreProgress() {
        const progress = this.getEpisodeProgress();
        if (progress && progress.time) {
            this.currentTime = progress.time;
        }
    }

    // LocalStorage методи
    getAnimePreferences() {
        const key = `preferences_${this.animeId}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : {};
    }

    setAnimePreferences(preferences) {
        const key = `preferences_${this.animeId}`;
        localStorage.setItem(key, JSON.stringify(preferences));
    }

    getEpisodeProgress() {
        if (!this.seasonNumber) return null;
        const key = `progress_${this.animeId}_s${this.seasonNumber}_e${this.episodeNumber}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    setEpisodeProgress(progress) {
        if (!this.seasonNumber) return;
        const key = `progress_${this.animeId}_s${this.seasonNumber}_e${this.episodeNumber}`;
        localStorage.setItem(key, JSON.stringify(progress));
    }

    saveProgress() {
        if (!this.animeId || !this.seasonNumber || !this.currentEpisode || !this.playerReady) return;
        
        const progress = {
            time: this.currentTime,
            timestamp: new Date().toISOString()
        };
        
        this.setEpisodeProgress(progress);
    }

    saveSettings() {
        const prefs = this.getAnimePreferences();
        
        const updatedPrefs = {
            dubbing: this.currentDubbingStudio,
            quality: this.currentQuality,
            autoSkip: this.autoSkipEnabled,
            autoNext: this.autoNextEnabled,
            lastUpdated: new Date().toISOString()
        };
        
        this.setAnimePreferences(updatedPrefs);
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    destroy() {
        this.stopProgressTracking();
        this.stopUIUpdate();
        this.saveProgress();
        this.saveSettings();
        
        if (this.uiUpdateInterval) {
            clearInterval(this.uiUpdateInterval);
        }
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        if (this.player && this.player.destroy) {
            this.player.destroy();
        }
        
        if (this.timeTooltip) {
            this.timeTooltip.remove();
        }
    }

    stopUIUpdate() {
        if (this.uiUpdateInterval) {
            clearInterval(this.uiUpdateInterval);
        }
    }
}

// Ініціалізація плеєра при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    window.animePlayer = new YouTubeAnimePlayer();
});

// Збереження стану при закритті сторінки
window.addEventListener('beforeunload', () => {
    if (window.animePlayer) {
        window.animePlayer.destroy();
    }
});