// Auto-hide header functionality
document.addEventListener('DOMContentLoaded', function() {
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    const headerHeight = header.offsetHeight;

    // Встановлюємо правильний відступ для контенту
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.style.paddingTop = headerHeight + 'px';
    }

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > headerHeight) {
            // Скролимо вниз - ховаємо хедер
            header.classList.add('hidden');
        } else {
            // Скролимо вгору - показуємо хедер
            header.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
    });

    // Додатково: показуємо хедер при ховері
    header.addEventListener('mouseenter', () => {
        header.classList.remove('hidden');
    });

    // Запобігаємо миттєвому хованню при виході курсора
    header.addEventListener('mouseleave', () => {
        lastScrollY = window.scrollY;
    });

    // Оновлюємо статистику профілю
    updateProfileStats();

    // Плавна анімація появи контенту профілю
    setTimeout(() => {
        const profileContainer = document.querySelector('.profile-container');
        if (profileContainer) {
            profileContainer.style.opacity = '1';
            profileContainer.style.transform = 'translateY(0)';
        }
    }, 100);

    // Демо-функціонал для показу можливостей
    document.querySelector('.profile-avatar').addEventListener('click', function() {
        showTempMessage('🎭 Демо-режим\n\nУ повнофункціональній версії тут буде можливість змінити аватар та налаштування профілю!');
    });

    // Демо-повідомлення для секцій
    document.querySelectorAll('.profile-section').forEach(section => {
        section.addEventListener('click', function() {
            const title = this.querySelector('.section-title').textContent;
            showTempMessage(`🔮 Демо-функція: ${title}\n\nЦя функція буде повністю доступна після реалізації системи користувачів!`);
        });
    });
});

// Функція для оновлення всієї статистики профілю
function updateProfileStats() {
    // Отримуємо дані з localStorage
    const bookmarks = JSON.parse(localStorage.getItem('animeBookmarks') || '[]');
    const ratings = JSON.parse(localStorage.getItem('animeRatings') || '{}');
    
    // Підраховуємо кількість оцінок
    const ratingsCount = Object.keys(ratings).length;
    
    // Оновлюємо числа в статистиці
    const bookmarkCountElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
    const ratingCountElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
    const watchedCountElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
    
    if (bookmarkCountElement) {
        bookmarkCountElement.textContent = bookmarks.length;
    }
    
    if (ratingCountElement) {
        ratingCountElement.textContent = ratingsCount;
    }
    
    if (watchedCountElement) {
        // Для переглянутих можна використати кількість оцінок як приблизний показник
        watchedCountElement.textContent = ratingsCount;
    }
    
    // Оновлюємо вміст секцій з даними
    updateBookmarksSection(bookmarks);
    updateRatingsSection(ratings);
}

// Функція для оновлення секції закладок
function updateBookmarksSection(bookmarks) {
    const bookmarksContainer = document.querySelector('.profile-section:nth-child(1)');
    const emptyState = bookmarksContainer.querySelector('.empty-state');
    
    if (!bookmarksContainer) return;
    
    // Знаходимо або створюємо контейнер для списку
    let bookmarksList = bookmarksContainer.querySelector('.profile-list');
    if (!bookmarksList) {
        bookmarksList = document.createElement('div');
        bookmarksList.classList.add('profile-list');
        bookmarksContainer.appendChild(bookmarksList);
    }
    
    // Очищаємо контейнер
    bookmarksList.innerHTML = '';
    
    if (bookmarks.length === 0) {
        // Показуємо стан "пусто"
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // Ховаємо стан "пусто"
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Додаємо закладки
    bookmarks.forEach(bookmark => {
        const bookmarkCard = document.createElement('a');
        bookmarkCard.classList.add('bookmark-card');
        bookmarkCard.href = `anime.html?id=${bookmark.id}`;
        
        // Тут ми б отримували додаткову інформацію про аніме з JSON файлів
        // Для демо використовуємо заглушки
        bookmarkCard.innerHTML = `
            <img src="${bookmark.img}" alt="${bookmark.title}" class="bookmark-card-image">
            <div class="bookmark-card-info">
                <div class="bookmark-card-title">${bookmark.title}</div>
                <div class="bookmark-card-meta">
                    <span>24 серії</span>
                    <span class="bookmark-card-status">Онґоїнг</span>
                    <span>★ 8.9</span>
                </div>
                <div class="bookmark-card-actions">
                    <a href="anime.html?id=${bookmark.id}" class="details-btn">Детальніше</a>
                    <button class="remove-btn" onclick="event.preventDefault(); removeBookmark('${bookmark.id}')">Видалити</button>
                </div>
            </div>
        `;
        
        bookmarksList.appendChild(bookmarkCard);
    });
}

// Функція для оновлення секції оцінок
function updateRatingsSection(ratings) {
    const ratingsContainer = document.querySelector('.profile-section:nth-child(2)');
    const emptyState = ratingsContainer.querySelector('.empty-state');
    
    if (!ratingsContainer) return;
    
    // Знаходимо або створюємо контейнер для списку
    let ratingsList = ratingsContainer.querySelector('.profile-list');
    if (!ratingsList) {
        ratingsList = document.createElement('div');
        ratingsList.classList.add('profile-list');
        ratingsContainer.appendChild(ratingsList);
    }
    
    // Очищаємо контейнер
    ratingsList.innerHTML = '';
    
    if (Object.keys(ratings).length === 0) {
        // Показуємо стан "пусто"
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        return;
    }
    
    // Ховаємо стан "пусто"
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Додаємо оцінки
    Object.entries(ratings).forEach(([animeId, ratingData]) => {
        const ratingCard = document.createElement('div');
        ratingCard.classList.add('rating-card');
        
        // Форматуємо дату
        const ratingDate = new Date(ratingData.date).toLocaleDateString('uk-UA');
        
        // Створюємо рядок зірочок
        const stars = '★'.repeat(ratingData.rating) + '☆'.repeat(10 - ratingData.rating);
        
        ratingCard.innerHTML = `
            <div class="rating-card-image" style="background: rgba(255, 105, 180, 0.2); display: flex; align-items: center; justify-content: center;">
                <span style="color: #ff69b4; font-size: 1.5em;">⭐</span>
            </div>
            <div class="rating-card-info">
                <div class="rating-card-title">Аніме ID: ${animeId}</div>
                <div class="rating-card-stars">${stars}</div>
                <div class="rating-card-date">Оцінено: ${ratingDate}</div>
            </div>
            <div class="rating-card-actions">
                <button class="delete-rating-btn" onclick="deleteRating('${animeId}')">×</button>
            </div>
        `;
        
        // Додаємо обробник кліку для переходу до аніме
        ratingCard.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-rating-btn')) {
                window.location.href = `anime.html?id=${animeId}`;
            }
        });
        
        ratingsList.appendChild(ratingCard);
    });
}

// Функція для видалення закладки
function removeBookmark(animeId) {
    if (confirm('Видалити цю закладку?')) {
        let bookmarks = JSON.parse(localStorage.getItem('animeBookmarks') || '[]');
        bookmarks = bookmarks.filter(item => item.id !== animeId);
        localStorage.setItem('animeBookmarks', JSON.stringify(bookmarks));
        
        // Оновлюємо інтерфейс
        updateProfileStats();
        showTempMessage('Закладку видалено 📕');
    }
}

// Функція для видалення оцінки
function deleteRating(animeId) {
    if (confirm('Видалити цю оцінку?')) {
        let ratings = JSON.parse(localStorage.getItem('animeRatings') || '{}');
        delete ratings[animeId];
        localStorage.setItem('animeRatings', JSON.stringify(ratings));
        
        // Оновлюємо інтерфейс
        updateProfileStats();
        showTempMessage('Оцінку видалено ⭐');
    }
}

// Функція для показу тимчасового повідомлення
function showTempMessage(message) {
    // Створюємо елемент повідомлення
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.classList.add('temp-message');
    
    document.body.appendChild(messageEl);
    
    // Анімація появи - плавно з'являється за 0.5 секунди
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 10);
    
    // Анімація зникнення - плавно зникає через 2 секунди
    setTimeout(() => {
        messageEl.classList.remove('show');
        
        // Видаляємо елемент після завершення анімації
        setTimeout(() => {
            if (document.body.contains(messageEl)) {
                document.body.removeChild(messageEl);
            }
        }, 500);
    }, 2000);
}