class VisitorTracker {
    constructor() {
        this.apiUrl = 'api/track.php'; // Шлях до PHP-скрипта
        this.trackPageView();
    }

    async trackPageView() {
        try {
            const page = window.location.pathname + window.location.search;
            const referrer = document.referrer || 'direct';
            
            const data = {
                page: page,
                referrer: referrer,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };

            // Відправляємо дані на сервер
            await this.sendToServer(data);
            
        } catch (error) {
            console.log('Tracker error:', error);
        }
    }

    async sendToServer(data) {
        // Варіант A: Відправка на PHP-скрипт
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // Варіант B: Зберігання в LocalStorage (якщо немає сервера)
        this.saveToLocalStorage(data);
    }

    saveToLocalStorage(data) {
        try {
            const visits = JSON.parse(localStorage.getItem('site_visits') || '[]');
            visits.push({
                ...data,
                id: Date.now(),
                ip: 'local' // IP буде визначатися на сервері
            });
            
            // Зберігаємо максимум 1000 записів
            if (visits.length > 1000) {
                visits.splice(0, visits.length - 1000);
            }
            
            localStorage.setItem('site_visits', JSON.stringify(visits));
        } catch (error) {
            console.log('LocalStorage error:', error);
        }
    }

    // Метод для отримання статистики
    static getStats() {
        try {
            const visits = JSON.parse(localStorage.getItem('site_visits') || '[]');
            return {
                totalVisits: visits.length,
                uniquePages: [...new Set(visits.map(v => v.page))].length,
                lastVisit: visits[visits.length - 1]
            };
        } catch (error) {
            return { totalVisits: 0, uniquePages: 0, lastVisit: null };
        }
    }
}

// Автоматична ініціалізація трекера
document.addEventListener('DOMContentLoaded', () => {
    new VisitorTracker();
});