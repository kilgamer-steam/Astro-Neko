class SimpleYouTubePlayer {
    constructor() {
        this.params = new URLSearchParams(window.location.search);
        this.animeId = this.params.get("id");
        this.seasonNumber = parseInt(this.params.get("season"));
        this.episodeNumber = parseInt(this.params.get("episode"));
        this.movieNumber = parseInt(this.params.get("movie"));
        
        // Основний плеєр
        this.player = null;
        this.playerElement = document.getElementById("youtube-player");
        
        // Елементи інтерфейсу
        this.playerContainer = document.getElementById("player-container");
        this.simpleControls = document.getElementById("simple-controls");
        this.progressFilled = document.getElementById("progress-filled");
        this.progressBar = document.getElementById("progress-bar");
        this.currentTimeDisplay = document.getElementById("current-time");
        this.durationDisplay = document.getElementById("duration");
        this.playPauseBtn = document.getElementById("play-pause");
        this.toggleMuteBtn = document.getElementById("toggle-mute");
        this.toggleFullscreenBtn = document.getElementById("toggle-fullscreen");
        this.youtubeQualitySelect = document.getElementById("youtube-quality");
        this.videoPoster = document.getElementById("video-poster");
        this.playLargeBtn = document.getElementById("play-large-btn");
        
        // Навігація
        this.seasonOrMovieSpan = document.getElementById("season-or-movie");
        this.episodeNumSpan = document.getElementById("episode-number");
        this.titleSpan = document.getElementById("episode-title");
        this.prevBtn = document.getElementById("prev-episode");
        this.nextBtn = document.getElementById("next-episode");
        this.backToInfoBtn = document.getElementById("backToInfo");
        
        // Стан плеєра
        this.isPlaying = false;
        this.isMuted = false;
        this.currentTime = 0;
        this.duration = 0;
        this.controlsVisible = true;
        this.controlsTimeout = null;
        this.currentVideoId = null;
        this.currentAnime = null;
        this.currentEpisode = null;

        this.init();
    }

    async init() {
        await this.setupEventListeners();
        await this.loadPlayer();
        this.setupAutoHideHeader();
    }

    async setupEventListeners() {
        // Навігація
        this.backToInfoBtn.onclick = () => this.goBackToInfo();
        this.prevBtn.onclick = () => this.goToPreviousEpisode();
        this.nextBtn.onclick = () => this.goToNextEpisode();

        // Контроли плеєра
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.playLargeBtn.addEventListener('click', () => this.startPlayback());
        this.toggleMuteBtn.addEventListener('click', () => this.toggleMute());
        this.toggleFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.youtubeQualitySelect.addEventListener('change', (e) => this.changeYouTubeQuality(e.target.value));

        // Прогрес бар
        this.progressBar.addEventListener('click', (e) => this.seekToClick(e));

        // Клік по відео
        this.playerElement.addEventListener('click', () => this.togglePlayPause());

        // Управління контролями
        this.setupControlsVisibility();
    }

    setupControlsVisibility() {
        this.playerContainer.addEventListener('mousemove', () => {
            this.showControls();
            this.resetControlsTimer();
        });
        
        this.playerContainer.addEventListener('mouseleave', () => {
            this.startControlsTimer();
        });
    }

    showControls() {
        this.simpleControls.classList.remove('hidden');
        this.controlsVisible = true;
    }

    hideControls() {
        if (this.isPlaying && this.controlsVisible) {
            this.simpleControls.classList.add('hidden');
            this.controlsVisible = false;
        }
    }

    resetControlsTimer() {
        if (this.controlsTimeout) clearTimeout(this.controlsTimeout);
        this.controlsTimeout = setTimeout(() => this.hideControls(), 3000);
    }

    startControlsTimer() {
        if (this.isPlaying) {
            this.controlsTimeout = setTimeout(() => this.hideControls(), 1000);
        }
    }

    async loadPlayer() {
        if (!this.animeId) {
            alert("Не вказано ID аніме!");
            return;
        }

        try {
            // Завантажуємо дані аніме
            const anime = await this.fetchAnimeData();
            this.currentAnime = anime;
            
            // Налаштовуємо сторінку
            this.setupPage(anime);
            
            // Знаходимо епізод
            const episode = this.findCurrentEpisode();
            if (!episode) throw new Error("Епізод не знайдено");
            
            this.currentEpisode = episode;
            this.updateEpisodeInfo();
            
            // Витягуємо ID відео
            const firstDubbing = episode.dubbing[0];
            const firstQuality = firstDubbing.quality[0];
            this.currentVideoId = this.extractYouTubeId(firstQuality.videoUrl);
            
            // Ініціалізуємо YouTube плеєр
            await this.initializeYouTubePlayer();
            
            // Налаштовуємо навігацію
            this.setupNavigationButtons();

        } catch (err) {
            console.error('Помилка:', err);
            alert("Помилка при завантаженні плеєра: " + err.message);
        }
    }

    async fetchAnimeData() {
        const resp = await fetch(`anime/${encodeURIComponent(this.animeId)}.json`);
        if (!resp.ok) throw new Error("Не вдалося завантажити аніме");
        return await resp.json();
    }

    setupPage(anime) {
        const animeBg = document.getElementById("anime-bg");
        if (animeBg) {
            animeBg.style.backgroundImage = `url('${anime.background}')`;
        }
        document.title = `Дивитися — ${anime.title}`;
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
                'rel': 0,
                'modestbranding': 1,
                'showinfo': 0,
                'controls': 0,
                'autoplay': 0
            },
            events: {
                'onReady': (event) => this.onPlayerReady(event, resolve),
                'onStateChange': (event) => this.onPlayerStateChange(event),
                'onError': (event) => this.onPlayerError(event)
            }
        });
    }

    onPlayerReady(event, resolve) {
        // Отримуємо тривалість
        this.duration = event.target.getDuration();
        this.updateDurationDisplay();
        
        // Завантажуємо якості
        this.loadYouTubeQualityLevels();
        
        resolve();
    }

    loadYouTubeQualityLevels() {
        if (!this.player || !this.player.getAvailableQualityLevels) return;
        
        try {
            const qualityLevels = this.player.getAvailableQualityLevels();
            
            // Очищаємо список
            this.youtubeQualitySelect.innerHTML = '';
            
            // Додаємо опцію авто якості
            const autoOption = document.createElement('option');
            autoOption.value = 'auto';
            autoOption.textContent = 'Авто якість';
            this.youtubeQualitySelect.appendChild(autoOption);
            
            // Додаємо доступні якості
            qualityLevels.forEach(quality => {
                const option = document.createElement('option');
                option.value = quality;
                option.textContent = this.formatQualityLabel(quality);
                this.youtubeQualitySelect.appendChild(option);
            });
            
            // Встановлюємо поточну якість
            const currentQuality = this.player.getPlaybackQuality();
            this.youtubeQualitySelect.value = currentQuality;
            
        } catch (error) {
            console.warn('Не вдалося завантажити якості YouTube:', error);
        }
    }

    formatQualityLabel(quality) {
        const qualityMap = {
            'tiny': '144p',
            'small': '240p',
            'medium': '360p',
            'large': '480p',
            'hd720': '720p',
            'hd1080': '1080p',
            'hd1440': '1440p',
            'hd2160': '4K'
        };
        
        return qualityMap[quality] || quality;
    }

    changeYouTubeQuality(quality) {
        if (!this.player || !this.player.setPlaybackQuality) return;
        
        try {
            this.player.setPlaybackQuality(quality);
            console.log('Якість змінено на:', quality);
        } catch (error) {
            console.error('Помилка зміни якості:', error);
        }
    }

    onPlayerStateChange(event) {
        const state = event.data;
        
        switch (state) {
            case YT.PlayerState.PLAYING:
                this.isPlaying = true;
                this.updatePlayPauseButton();
                this.videoPoster.classList.add('hidden');
                this.startUIUpdate();
                this.startControlsTimer();
                break;
                
            case YT.PlayerState.PAUSED:
                this.isPlaying = false;
                this.updatePlayPauseButton();
                this.showControls();
                break;
                
            case YT.PlayerState.ENDED:
                this.isPlaying = false;
                this.updatePlayPauseButton();
                this.showControls();
                break;
                
            case YT.PlayerState.BUFFERING:
                setTimeout(() => this.loadYouTubeQualityLevels(), 1000);
                break;
        }
    }

    onPlayerError(event) {
        console.error('YouTube помилка:', event.data);
        alert('Помилка завантаження відео');
    }

    startUIUpdate() {
        setInterval(() => {
            if (this.player && this.player.getCurrentTime && this.isPlaying) {
                const currentTime = this.player.getCurrentTime();
                this.currentTime = currentTime;
                this.updateProgressBar(currentTime);
                this.updateTimeDisplay(currentTime);
            }
        }, 100);
    }

    updateProgressBar(currentTime) {
        const progress = (currentTime / this.duration) * 100;
        this.progressFilled.style.width = `${progress}%`;
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
        if (!this.player) return;
        
        if (this.isPlaying) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

    startPlayback() {
        if (!this.player) return;
        
        this.videoPoster.classList.add('hidden');
        this.player.playVideo();
    }

    seekToClick(e) {
        if (!this.player || !this.progressBar) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const seekTime = this.duration * Math.max(0, Math.min(1, percent));
        
        this.player.seekTo(seekTime, true);
    }

    toggleMute() {
        if (!this.player) return;
        
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

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.playerContainer.requestFullscreen().catch(err => {
                console.log('Помилка повноекранного режиму:', err);
            });
            this.playerContainer.classList.add('fullscreen');
        } else {
            document.exitFullscreen();
            this.playerContainer.classList.remove('fullscreen');
        }
    }

    // Навігація
    setupNavigationButtons() {
        if (this.movieNumber) return;

        const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
        const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
        
        // Попередня серія
        this.prevBtn.disabled = (this.episodeNumber === 1 && this.seasonNumber === 1);
        
        // Наступна серія
        this.nextBtn.disabled = (this.episodeNumber >= currentSeason.episodes.length && !nextSeason);
    }

    goBackToInfo() {
        window.location.href = `anime-info.html?id=${encodeURIComponent(this.animeId)}`;
    }

    goToPreviousEpisode() {
        if (this.episodeNumber > 1) {
            window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber-1}`;
        } else if (this.seasonNumber > 1) {
            const prevSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber - 1);
            if (prevSeason) {
                const lastEpisode = prevSeason.episodes.length;
                window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber-1}&episode=${lastEpisode}`;
            }
        }
    }

    goToNextEpisode() {
        const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
        
        if (this.episodeNumber < currentSeason.episodes.length) {
            window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber+1}`;
        } else {
            const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
            if (nextSeason) {
                window.location.href = `player yt.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber+1}&episode=1`;
            }
        }
    }

    setupAutoHideHeader() {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('header');
        if (!header) return;
        
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
    }
}

// Запуск плеєра
document.addEventListener('DOMContentLoaded', () => {
    window.simplePlayer = new SimpleYouTubePlayer();
});