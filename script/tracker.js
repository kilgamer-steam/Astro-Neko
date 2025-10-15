// Глобальний трекер для AstroNeko
class AstroNekoTracker {
    constructor() {
        this.version = '1.0';
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupPlayerTracking();
    }

    trackPageView() {
        const visitData = {
            page: window.location.pathname + window.location.search,
            referrer: document.referrer || 'direct',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            title: document.title,
            // Додаткові дані для аналізу
            pageType: this.getPageType(),
            animeData: this.extractAnimeData()
        };

        this.saveVisit(visitData);
    }

    getPageType() {
        const path = window.location.pathname;
        if (path.includes('player.html')) return 'player';
        if (path.includes('anime-info.html')) return 'anime_info';
        if (path.includes('index.html') || path === '/') return 'home';
        return 'other';
    }

    extractAnimeData() {
        const url = window.location.href;
        const data = {
            animeId: null,
            season: null,
            episode: null,
            movie: null,
            animeTitle: null
        };

        try {
            if (url.includes('anime-info.html') || url.includes('player.html')) {
                const params = new URLSearchParams(window.location.search);
                data.animeId = params.get('id');
                
                if (url.includes('player.html')) {
                    data.season = params.get('season');
                    data.episode = params.get('episode');
                    data.movie = params.get('movie');
                    
                    // Спроба отримати назву аніме
                    if (data.animeId) {
                        data.animeTitle = this.getAnimeTitle(data.animeId);
                    }
                }
            }
        } catch (error) {
            console.log('Error extracting anime data:', error);
        }

        return data;
    }

    getAnimeTitle(animeId) {
        // Можна додати логіку для отримання назви аніме
        // Наразі повертаємо ID, але можна зберігати назви в localStorage
        try {
            const animeCache = JSON.parse(localStorage.getItem('astro_neko_anime_cache') || '{}');
            return animeCache[animeId] || animeId;
        } catch {
            return animeId;
        }
    }

    saveVisit(visitData) {
        try {
            const visits = JSON.parse(localStorage.getItem('astro_neko_visits') || '[]');
            
            // Додаємо новий запис
            visits.push(visitData);
            
            // Обмежуємо розмір (останні 1000 записів)
            if (visits.length > 1000) {
                visits.splice(0, visits.length - 1000);
            }
            
            localStorage.setItem('astro_neko_visits', JSON.stringify(visits));
            
            console.log('Visit tracked:', visitData.page);
        } catch (error) {
            console.log('Error saving visit:', error);
        }
    }

    // Трекінг для плеєра
    setupPlayerTracking() {
        if (this.getPageType() !== 'player') return;

        // Трекінг якості відео
        this.trackPlayerQuality();
        
        // Трекінг налаштувань
        this.trackPlayerSettings();
        
        // Трекінг прогресу перегляду
        this.trackPlaybackProgress();
    }

    trackPlayerQuality() {
        // Це буде викликатися при зміні якості в плеєрі
        window.trackPlayerQualityChange = (quality, audioTrack) => {
            const stats = JSON.parse(localStorage.getItem('astro_neko_player_stats') || '{}');
            
            // Статистика якості
            if (!stats.qualityUsage) stats.qualityUsage = {};
            stats.qualityUsage[quality] = (stats.qualityUsage[quality] || 0) + 1;
            
            // Статистика озвучки
            if (!stats.audioUsage) stats.audioUsage = {};
            stats.audioUsage[audioTrack] = (stats.audioUsage[audioTrack] || 0) + 1;
            
            stats.lastQualityUpdate = new Date().toISOString();
            
            localStorage.setItem('astro_neko_player_stats', JSON.stringify(stats));
        };
    }

    trackPlayerSettings() {
        // Трекінг налаштувань плеєра
        window.trackPlayerSettings = (settings) => {
            const stats = JSON.parse(localStorage.getItem('astro_neko_player_stats') || '{}');
            
            stats.autoSkipEnabled = settings.autoSkipEnabled || false;
            stats.autoNextEnabled = settings.autoNextEnabled || false;
            stats.defaultQuality = settings.defaultQuality || 'auto';
            stats.lastSettingsUpdate = new Date().toISOString();
            stats.totalSessions = (stats.totalSessions || 0) + 1;
            
            localStorage.setItem('astro_neko_player_stats', JSON.stringify(stats));
        };
    }

    trackPlaybackProgress() {
        // Трекінг прогресу перегляду (для плеєра)
        window.trackPlaybackProgress = (animeId, episode, progress, duration) => {
            const progressData = {
                animeId: animeId,
                episode: episode,
                progress: progress,
                duration: duration,
                timestamp: new Date().toISOString(),
                type: 'playback_progress'
            };
            
            this.saveVisit(progressData);
        };
    }

    // Статичний метод для отримання статистики
    static getStats() {
        try {
            const visits = JSON.parse(localStorage.getItem('astro_neko_visits') || '[]');
            const playerStats = JSON.parse(localStorage.getItem('astro_neko_player_stats') || '{}');
            
            return {
                visits: visits,
                playerStats: playerStats,
                totalVisits: visits.length,
                lastVisit: visits[visits.length - 1]
            };
        } catch (error) {
            return {
                visits: [],
                playerStats: {},
                totalVisits: 0,
                lastVisit: null
            };
        }
    }
}

// Автоматична ініціалізація трекера
document.addEventListener('DOMContentLoaded', () => {
    new AstroNekoTracker();
});

// Додаткові функції для трекінгу з інших частин коду
window.AstroNekoTracker = {
    trackCustomEvent: (eventType, data) => {
        const eventData = {
            type: 'custom_event',
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname + window.location.search
        };
        
        try {
            const visits = JSON.parse(localStorage.getItem('astro_neko_visits') || '[]');
            visits.push(eventData);
            
            if (visits.length > 1000) {
                visits.splice(0, visits.length - 1000);
            }
            
            localStorage.setItem('astro_neko_visits', JSON.stringify(visits));
        } catch (error) {
            console.log('Error tracking custom event:', error);
        }
    }
};