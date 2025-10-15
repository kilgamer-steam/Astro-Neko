class AnimePlayer {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
    this.animeId = this.params.get("id");
    this.seasonNumber = parseInt(this.params.get("season"));
    this.episodeNumber = parseInt(this.params.get("episode"));
    this.movieNumber = parseInt(this.params.get("movie"));
    
    this.player = document.getElementById("anime-player");
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

    // Елементи завантаження
    this.loadingOverlay = this.createLoadingOverlay();
    this.loadingProgressBar = null;

    // Стан плеєра
    this.currentEpisode = null;
    this.currentAnime = null;
    this.currentDubbingStudio = null;
    this.currentQuality = null;
    this.autoSkipInterval = null;
    this.autoSkipEnabled = false;
    this.autoNextEnabled = false;
    this.isLoading = true;
    this.videoLoadAttempted = false;

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
      <div class="loading-subtext" id="loading-status">Підготовка плеєра</div>
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
    this.loadingOverlay.classList.remove('hidden');
    this.updateLoadingProgress(0, 'Підготовка плеєра...');
  }

  hideLoading() {
    this.isLoading = false;
    this.loadingOverlay.classList.add('hidden');
    
    // Анімація появи контенту
    setTimeout(() => {
      const playerWrapper = document.querySelector('.player-wrapper');
      const video = document.querySelector('video');
      const controls = document.querySelectorAll('.controls-row button, .controls-row span');
      
      if (playerWrapper) playerWrapper.classList.add('loaded');
      if (video) video.classList.add('loaded');
      
      controls.forEach((control, index) => {
        setTimeout(() => {
          control.classList.add('loaded');
        }, index * 100);
      });
    }, 300);
  }

  async init() {
    this.showLoading();
    this.setupEventListeners();
    await this.loadPlayer();
    this.setupAutoHideHeader();
  }

  setupEventListeners() {
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

    // Збереження прогресу
    this.player.addEventListener('timeupdate', () => this.throttledSaveProgress());
    this.player.addEventListener('volumechange', () => this.saveSettings());
    
    // Слухачі для індикації завантаження відео
    this.player.addEventListener('loadstart', () => {
      this.updateLoadingProgress(30, 'Завантаження відео...');
    });
    
    this.player.addEventListener('progress', () => {
      if (this.player.buffered.length > 0 && this.player.duration > 0) {
        const progress = (this.player.buffered.end(0) / this.player.duration) * 40 + 30;
        this.updateLoadingProgress(progress, 'Буферизація відео...');
      }
    });
    
    this.player.addEventListener('canplay', () => {
      this.updateLoadingProgress(90, 'Можна відтворювати...');
    });
    
    this.player.addEventListener('playing', () => {
      this.updateLoadingProgress(100, 'Готово!');
      setTimeout(() => this.hideLoading(), 500);
    });

    this.player.addEventListener('error', (e) => {
      console.warn('Помилка відео:', e);
      this.updateLoadingProgress(70, 'Перепідключення...');
    });

    window.addEventListener('beforeunload', () => {
      this.saveProgress();
      this.saveSettings();
    });
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
      
      this.updateLoadingProgress(60, 'Налаштування навігації...');
      this.setupNavigationButtons(); // Змінено з setupNavigation
      this.setupTooltip();

      // Автоматично ховаємо завантаження через 5 секунд
      setTimeout(() => {
        if (this.isLoading) {
          console.log('Автоматичне приховування завантаження через таймаут');
          this.hideLoading();
        }
      }, 2000);

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
    
    try {
      await this.loadVideo();
      this.restoreProgress();
      this.setupAutoFeatures();
    } catch (err) {
      console.warn('Попередження при завантаженні відео:', err);
    }
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
      this.prevBtn.style.display = "inline";
      this.nextBtn.style.display = "inline";
    }
    this.titleSpan.textContent = this.currentEpisode.name;
  }

  // НОВИЙ МЕТОД: Налаштування кнопок навігації
  setupNavigationButtons() {
    if (this.movieNumber) {
      // Для фільмів кнопки навігації не потрібні
      return;
    }

    // Перевірка для кнопки "Попередня серія"
    if (this.episodeNumber === 1 && this.seasonNumber === 1) {
      this.prevBtn.disabled = true;
      this.prevBtn.style.opacity = "0.5";
    } else {
      this.prevBtn.disabled = false;
      this.prevBtn.style.opacity = "1";
    }

    // Перевірка для кнопки "Наступна серія"
    const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
    const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
    
    if (this.episodeNumber >= currentSeason.episodes.length && !nextSeason) {
      this.nextBtn.disabled = true;
      this.nextBtn.style.opacity = "0.5";
    } else {
      this.nextBtn.disabled = false;
      this.nextBtn.style.opacity = "1";
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
    
    if (preferences.volume !== undefined) {
      this.player.volume = preferences.volume;
    }

    this.autoSkipEnabled = Boolean(preferences.autoSkip);
    this.autoNextEnabled = Boolean(preferences.autoNext);
  }

  async loadVideo() {
    const selectedDubbing = this.currentEpisode.dubbing.find(d => d.studio === this.currentDubbingStudio);
    const selectedQuality = selectedDubbing.quality.find(q => q.value === this.currentQuality);
    
    this.player.src = selectedQuality.videoUrl;
    this.videoLoadAttempted = true;
    
    return new Promise((resolve) => {
      const onCanPlayThrough = () => {
        this.player.removeEventListener('canplaythrough', onCanPlayThrough);
        this.player.removeEventListener('error', onError);
        resolve();
      };
      
      const onError = () => {
        this.player.removeEventListener('canplaythrough', onCanPlayThrough);
        this.player.removeEventListener('error', onError);
        resolve();
      };
      
      if (this.player.readyState >= 3) {
        resolve();
        return;
      }
      
      this.player.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
      this.player.addEventListener('error', onError, { once: true });
      
      setTimeout(() => {
        this.player.removeEventListener('canplaythrough', onCanPlayThrough);
        this.player.removeEventListener('error', onError);
        resolve();
      }, 1000);
    });
  }

  restoreProgress() {
    const progress = this.getEpisodeProgress();
    if (progress && progress.time) {
      if (this.player.readyState > 0) {
        this.player.currentTime = Math.min(progress.time, this.player.duration - 1);
      } else {
        this.player.addEventListener('loadedmetadata', () => {
          this.player.currentTime = Math.min(progress.time, this.player.duration - 1);
        }, { once: true });
      }
    }
  }

  setupAutoFeatures() {
    this.setupAutoSkip();
    this.setupAutoNext();
  }

  openSettings() {
    this.settingsModal.style.display = 'flex';
    setTimeout(() => {
      this.settingsModal.querySelector('.settings-content').classList.add('show');
    }, 10);
    this.loadCurrentSettings();
  }

  closeSettings() {
    const settingsContent = this.settingsModal.querySelector('.settings-content');
    settingsContent.classList.remove('show');
    setTimeout(() => {
      this.settingsModal.style.display = 'none';
    }, 300);
  }

  goBackToInfo() {
    this.saveProgress();
    window.location.href = `anime-info.html?id=${encodeURIComponent(this.animeId)}`;
  }

  goToPreviousEpisode() {
    this.saveProgress();
    if (this.episodeNumber > 1) {
      window.location.href = `player.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber-1}`;
    } else if (this.seasonNumber > 1) {
      const prevSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber - 1);
      if (prevSeason && prevSeason.episodes.length > 0) {
        const lastEpisodeInPrevSeason = prevSeason.episodes.length;
        window.location.href = `player.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber-1}&episode=${lastEpisodeInPrevSeason}`;
      }
    }
  }

  goToNextEpisode() {
    this.saveProgress();
    const currentSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber);
    
    if (this.episodeNumber < currentSeason.episodes.length) {
      window.location.href = `player.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber}&episode=${this.episodeNumber+1}`;
    } else {
      const nextSeason = this.currentAnime.seasons.find(s => s.seasonNumber === this.seasonNumber + 1);
      if (nextSeason && nextSeason.episodes.length > 0) {
        window.location.href = `player.html?id=${encodeURIComponent(this.animeId)}&season=${this.seasonNumber+1}&episode=1`;
      } else {
        alert("Це остання серія аніме!");
      }
    }
  }

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

  // Допоміжні методи для роботи з localStorage
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
    if (!this.animeId || !this.seasonNumber || !this.currentEpisode) return;
    
    const progress = {
      time: this.player.currentTime,
      duration: this.player.duration,
      timestamp: new Date().toISOString()
    };
    
    this.setEpisodeProgress(progress);
  }

  throttledSaveProgress() {
    if (!this.throttleTimer) {
      this.throttleTimer = setTimeout(() => {
        this.saveProgress();
        this.throttleTimer = null;
      }, 2000);
    }
  }

  saveSettings() {
    const prefs = this.getAnimePreferences();
    
    const updatedPrefs = {
      dubbing: this.currentDubbingStudio,
      quality: this.currentQuality,
      volume: this.player.volume,
      autoSkip: this.autoSkipEnabled,
      autoNext: this.autoNextEnabled,
      lastUpdated: new Date().toISOString()
    };
    
    this.setAnimePreferences(updatedPrefs);
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
    if (this.autoSkipEnabled) {
      this.autoSkipLink.classList.add('active');
      this.autoSkipLink.querySelector('.toggle-icon').textContent = '☑';
    } else {
      this.autoSkipLink.classList.remove('active');
      this.autoSkipLink.querySelector('.toggle-icon').textContent = '☐';
    }
    
    if (this.autoNextEnabled) {
      this.autoNextLink.classList.add('active');
      this.autoNextLink.querySelector('.toggle-icon').textContent = '☑';
    } else {
      this.autoNextLink.classList.remove('active');
      this.autoNextLink.querySelector('.toggle-icon').textContent = '☐';
    }
  }

  toggleAutoSkip(e) {
    e.preventDefault();
    this.autoSkipEnabled = !this.autoSkipEnabled;
    this.updateToggleDisplay();
    this.saveSettings();
    this.setupAutoSkip();
  }

  toggleAutoNext(e) {
    e.preventDefault();
    this.autoNextEnabled = !this.autoNextEnabled;
    this.updateToggleDisplay();
    this.saveSettings();
    this.setupAutoNext();
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
      
      this.updateVideoSource(highestQuality.videoUrl);
      this.saveSettings();
    }
  }

  applyQualityChange() {
    if (!this.settingsQualitySelect.value || !this.settingsAudioSelect.value) return;
    
    const selectedAudio = this.currentEpisode.dubbing.find(d => d.studio === this.settingsAudioSelect.value);
    const selectedQuality = selectedAudio.quality.find(q => q.value === this.settingsQualitySelect.value);
    
    if (selectedQuality) {
      this.currentQuality = selectedQuality.value;
      this.updateVideoSource(selectedQuality.videoUrl);
      this.saveSettings();
    }
  }

  updateVideoSource(videoUrl) {
    const currentTime = this.player.currentTime;
    const wasPaused = this.player.paused;
    
    this.player.src = videoUrl;
    
    this.player.addEventListener('loadedmetadata', function onLoad() {
      this.player.currentTime = Math.min(currentTime, this.player.duration - 1);
      this.player.removeEventListener('loadedmetadata', onLoad);
      
      if (!wasPaused) {
        this.player.play().catch(e => console.log('Auto-play prevented'));
      }
      
      this.setupAutoSkip();
    }.bind(this), { once: true });
  }

  setupAutoSkip() {
    if (this.autoSkipInterval) {
      clearInterval(this.autoSkipInterval);
      this.autoSkipInterval = null;
    }

    if (!this.autoSkipEnabled || !this.currentEpisode) {
      return;
    }
    
    const currentDubbing = this.currentEpisode.dubbing.find(d => d.studio === this.currentDubbingStudio);
    if (!currentDubbing) return;
    
    const [openingStart, openingEnd] = currentDubbing.opening || [0, 0];
    const [endingStart, endingEnd] = currentDubbing.ending || [0, 0];
    
    this.autoSkipInterval = setInterval(() => {
      if (this.player.paused || this.player.ended) return;
      
      const currentTime = this.player.currentTime;
      
      if (openingStart >= 0 && openingEnd > openingStart && 
          currentTime >= openingStart && currentTime <= openingEnd) {
        this.player.currentTime = openingEnd;
      }
      
      if (endingStart >= 0 && endingEnd > endingStart && 
          currentTime >= endingStart && currentTime <= endingEnd) {
        this.player.currentTime = endingEnd;
      }
    }, 500);
  }

  setupAutoNext() {
    this.player.removeEventListener('ended', this.handleVideoEnd);
    
    if (!this.autoNextEnabled) {
      return;
    }
    
    this.handleVideoEnd = () => {
      if (this.nextBtn.style.display !== 'none') {
        this.nextBtn.click();
      }
    };
    
    this.player.addEventListener('ended', this.handleVideoEnd);
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
}

// Ініціалізація плеєра при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
  new AnimePlayer();
});