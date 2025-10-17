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
});

// Глобальні змінні для зберігання даних
let allBookmarks = [];
let allRatings = {};

// Функція для оновлення всієї статистики профілю
async function updateProfileStats() {
    // Отримуємо дані з localStorage
    allBookmarks = JSON.parse(localStorage.getItem('animeBookmarks') || '[]');
    allRatings = JSON.parse(localStorage.getItem('animeRatings') || '{}');
    
    // Підраховуємо кількість оцінок
    const ratingsCount = Object.keys(allRatings).length;
    
    // Оновлюємо числа в статистиці
    const bookmarkCountElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
    const ratingCountElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
    const watchedCountElement = document.querySelector('.stat-item:nth-child(3) .stat-number');
    
    if (bookmarkCountElement) {
        bookmarkCountElement.textContent = allBookmarks.length;
    }
    
    if (ratingCountElement) {
        ratingCountElement.textContent = ratingsCount;
    }
    
    if (watchedCountElement) {
        // ВИМКНЕНО: не рахуємо оцінки як переглянуті
        watchedCountElement.textContent = '0';
    }
    
    // Оновлюємо вміст секцій з даними
    await updateBookmarksPreview();
    await updateRatingsPreview();
}

// Функція для оновлення превью закладок
async function updateBookmarksPreview() {
    const bookmarksContainer = document.querySelector('.profile-section:nth-child(1)');
    const emptyState = bookmarksContainer.querySelector('.empty-state');
    
    if (!bookmarksContainer) return;
    
    // Знаходимо або створюємо контейнер для превью
    let previewContainer = bookmarksContainer.querySelector('.profile-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.classList.add('profile-preview');
        bookmarksContainer.appendChild(previewContainer);
    }
    
    // Очищаємо контейнер
    previewContainer.innerHTML = '';
    
    if (allBookmarks.length === 0) {
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
    
    // Беремо перші 3 закладки
    const previewBookmarks = allBookmarks.slice(0, 3);
    
    // Додаємо превью закладок
    for (const bookmark of previewBookmarks) {
        try {
            // Отримуємо повну інформацію про аніме
            const animeInfo = await loadAnimeInfo(bookmark.id);
            const previewItem = createBookmarkPreviewItem(bookmark, animeInfo);
            previewContainer.appendChild(previewItem);
        } catch (error) {
            console.error('Помилка завантаження інформації про аніме:', error);
            // Використовуємо базову інформацію з закладки
            const previewItem = createBookmarkPreviewItem(bookmark, null);
            previewContainer.appendChild(previewItem);
        }
    }
    
    // Додаємо кнопку "Показати всі" якщо закладок більше 3
    if (allBookmarks.length > 3) {
        const moreButton = document.createElement('div');
        moreButton.classList.add('preview-more');
        moreButton.innerHTML = `
            <div class="preview-more-text">Показати всі закладки</div>
            <div class="preview-more-count">+${allBookmarks.length - 3} ще</div>
        `;
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showBookmarksModal();
        });
        previewContainer.appendChild(moreButton);
    }
    
    // Додаємо обробник кліку на всю секцію
    bookmarksContainer.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-more') && !e.target.closest('.preview-item') && allBookmarks.length > 0) {
            showBookmarksModal();
        }
    });
}

// Функція для оновлення превью оцінок
async function updateRatingsPreview() {
    const ratingsContainer = document.querySelector('.profile-section:nth-child(2)');
    const emptyState = ratingsContainer.querySelector('.empty-state');
    
    if (!ratingsContainer) return;
    
    // Знаходимо або створюємо контейнер для превью
    let previewContainer = ratingsContainer.querySelector('.profile-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.classList.add('profile-preview');
        ratingsContainer.appendChild(previewContainer);
    }
    
    // Очищаємо контейнер
    previewContainer.innerHTML = '';
    
    if (Object.keys(allRatings).length === 0) {
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
    
    // Беремо перші 3 оцінки
    const previewRatings = Object.entries(allRatings).slice(0, 3);
    
    // Додаємо превью оцінок
    for (const [animeId, ratingData] of previewRatings) {
        try {
            // Отримуємо повну інформацію про аніме
            const animeInfo = await loadAnimeInfo(animeId);
            const previewItem = createRatingPreviewItem(animeId, ratingData, animeInfo);
            previewContainer.appendChild(previewItem);
        } catch (error) {
            console.error('Помилка завантаження інформації про аніме:', error);
            // Використовуємо базову інформацію
            const previewItem = createRatingPreviewItem(animeId, ratingData, null);
            previewContainer.appendChild(previewItem);
        }
    }
    
    // Додаємо кнопку "Показати всі" якщо оцінок більше 3
    if (Object.keys(allRatings).length > 3) {
        const moreButton = document.createElement('div');
        moreButton.classList.add('preview-more');
        moreButton.innerHTML = `
            <div class="preview-more-text">Показати всі оцінки</div>
            <div class="preview-more-count">+${Object.keys(allRatings).length - 3} ще</div>
        `;
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showRatingsModal();
        });
        previewContainer.appendChild(moreButton);
    }
    
    // Додаємо обробник кліку на всю секцію
    ratingsContainer.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-more') && !e.target.closest('.preview-item') && Object.keys(allRatings).length > 0) {
            showRatingsModal();
        }
    });
}

// Функція для створення елемента превью закладки
function createBookmarkPreviewItem(bookmark, animeInfo) {
    const previewItem = document.createElement('div');
    previewItem.classList.add('preview-item');
    previewItem.style.position = 'relative';
    
    const metaInfo = animeInfo ? `
        <div class="preview-item-meta">
            <div>${animeInfo.seasons ? animeInfo.seasons[0].episodeCount || 'N/A' : 'N/A'} серій</div>
            <div>${animeInfo.status || 'N/A'}</div>
            <div>★ ${animeInfo.rating || 'N/A'}</div>
        </div>
    ` : `
        <div class="preview-item-meta">
            <div>Інформація завантажується...</div>
        </div>
    `;
    
    previewItem.innerHTML = `
        <img src="${bookmark.img}" alt="${bookmark.title}" class="preview-item-image">
        <div class="preview-item-info">
            <div class="preview-item-title">${bookmark.title}</div>
            ${metaInfo}
            <div class="preview-item-actions">
                <a href="anime-info.html?id=${bookmark.id}" class="preview-details-btn">Детальніше</a>
                <button class="preview-remove-btn" onclick="event.stopPropagation(); confirmRemoveBookmark('${bookmark.id}', '${bookmark.title.replace(/'/g, "\\'")}')">Видалити</button>
            </div>
        </div>
    `;
    
    previewItem.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-item-actions')) {
            window.location.href = `anime-info.html?id=${bookmark.id}`;
        }
    });
    
    return previewItem;
}

// Функція для створення елемента превью оцінки
function createRatingPreviewItem(animeId, ratingData, animeInfo) {
    const previewItem = document.createElement('div');
    previewItem.classList.add('preview-item');
    previewItem.style.position = 'relative';
    
    const title = animeInfo ? animeInfo.title : `Аніме ID: ${animeId}`;
    const imageSrc = animeInfo ? animeInfo.img : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140" viewBox="0 0 100 140"><rect width="100" height="140" fill="%23943a67"/><text x="50" y="70" font-family="Arial" font-size="14" fill="white" text-anchor="middle">⭐</text></svg>';
    
    const stars = '★'.repeat(ratingData.rating) + '☆'.repeat(10 - ratingData.rating);
    
    previewItem.innerHTML = `
        <button class="preview-rating-remove" onclick="event.stopPropagation(); confirmDeleteRating('${animeId}', '${title.replace(/'/g, "\\'")}')">Видалити</button>
        <img src="${imageSrc}" alt="${title}" class="preview-item-image">
        <div class="preview-item-info">
            <div class="preview-item-title">${title}</div>
            <div class="preview-item-meta">
                <div style="color: #ffd700;">${stars}</div>
                <div>${ratingData.rating}/10</div>
            </div>
            <div class="preview-item-actions">
                <a href="anime-info.html?id=${animeId}" class="preview-details-btn">Детальніше</a>
            </div>
        </div>
    `;
    
    previewItem.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-rating-remove') && !e.target.closest('.preview-item-actions')) {
            window.location.href = `anime-info.html?id=${animeId}`;
        }
    });
    
    return previewItem;
}

// Функція для завантаження інформації про аніме
async function loadAnimeInfo(animeId) {
    try {
        const response = await fetch(`anime/${encodeURIComponent(animeId)}.json`);
        if (!response.ok) {
            throw new Error('Аніме не знайдено');
        }
        return await response.json();
    } catch (error) {
        console.error('Помилка завантаження аніме:', error);
        return null;
    }
}

// Функція для показу модального вікна з усіма закладками
async function showBookmarksModal() {
    const modalHTML = `
        <div class="profile-modal" id="bookmarks-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h3 class="profile-modal-title">Мої закладки (${allBookmarks.length})</h3>
                    <button class="profile-modal-close">&times;</button>
                </div>
                <div class="profile-modal-list" id="bookmarks-modal-list">
                    <!-- Тут будуть всі закладки -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('bookmarks-modal');
    const closeBtn = modal.querySelector('.profile-modal-close');
    const listContainer = document.getElementById('bookmarks-modal-list');
    
    // Заповнюємо список закладок
    for (const bookmark of allBookmarks) {
        try {
            const animeInfo = await loadAnimeInfo(bookmark.id);
            const bookmarkCard = document.createElement('a');
            bookmarkCard.classList.add('bookmark-card');
            bookmarkCard.href = `anime-info.html?id=${bookmark.id}`;
            
            const metaInfo = animeInfo ? `
                <div class="bookmark-card-meta">
                    <span>${animeInfo.seasons ? animeInfo.seasons[0].episodeCount || 'N/A' : 'N/A'} серій</span>
                    <span class="bookmark-card-status">${animeInfo.status || 'N/A'}</span>
                    <span>★ ${animeInfo.rating || 'N/A'}</span>
                </div>
            ` : `
                <div class="bookmark-card-meta">
                    <span>Інформація завантажується...</span>
                </div>
            `;
            
            bookmarkCard.innerHTML = `
                <img src="${bookmark.img}" alt="${bookmark.title}" class="bookmark-card-image">
                <div class="bookmark-card-info">
                    <div class="bookmark-card-title">${bookmark.title}</div>
                    ${metaInfo}
                    <div class="bookmark-card-actions">
                        <a href="anime-info.html?id=${bookmark.id}" class="details-btn">Детальніше</a>
                        <button class="remove-btn" onclick="event.preventDefault(); confirmRemoveBookmark('${bookmark.id}', '${bookmark.title.replace(/'/g, "\\'")}')">Видалити</button>
                    </div>
                </div>
            `;
            listContainer.appendChild(bookmarkCard);
        } catch (error) {
            console.error('Помилка завантаження інформації про аніме:', error);
        }
    }
    
    // Показуємо модальне вікно
    modal.style.display = 'flex';
    
    // Обробники закриття
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Функція для показу модального вікна з усіма оцінками
async function showRatingsModal() {
    const modalHTML = `
        <div class="profile-modal" id="ratings-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h3 class="profile-modal-title">Мої оцінки (${Object.keys(allRatings).length})</h3>
                    <button class="profile-modal-close">&times;</button>
                </div>
                <div class="profile-modal-list" id="ratings-modal-list">
                    <!-- Тут будуть всі оцінки -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('ratings-modal');
    const closeBtn = modal.querySelector('.profile-modal-close');
    const listContainer = document.getElementById('ratings-modal-list');
    
    // Заповнюємо список оцінок
    for (const [animeId, ratingData] of Object.entries(allRatings)) {
        try {
            const animeInfo = await loadAnimeInfo(animeId);
            const title = animeInfo ? animeInfo.title : `Аніме ID: ${animeId}`;
            const imageSrc = animeInfo ? animeInfo.img : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140" viewBox="0 0 100 140"><rect width="100" height="140" fill="%23943a67"/><text x="50" y="70" font-family="Arial" font-size="14" fill="white" text-anchor="middle">⭐</text></svg>';
            
            const ratingCard = document.createElement('div');
            ratingCard.classList.add('rating-card');
            ratingCard.innerHTML = `
                <img src="${imageSrc}" alt="${title}" class="rating-card-image">
                <div class="rating-card-info">
                    <div class="rating-card-title">${title}</div>
                    <div class="rating-card-stars">${'★'.repeat(ratingData.rating)}${'☆'.repeat(10 - ratingData.rating)}</div>
                    <div class="rating-card-date">Оцінено: ${new Date(ratingData.date).toLocaleDateString('uk-UA')}</div>
                </div>
                <div class="rating-card-actions">
                    <button class="delete-rating-btn" onclick="confirmDeleteRating('${animeId}', '${title.replace(/'/g, "\\'")}')">×</button>
                </div>
            `;
            
            ratingCard.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-rating-btn')) {
                    window.location.href = `anime-info.html?id=${animeId}`;
                }
            });
            
            listContainer.appendChild(ratingCard);
        } catch (error) {
            console.error('Помилка завантаження інформації про аніме:', error);
        }
    }
    
    // Показуємо модальне вікно
    modal.style.display = 'flex';
    
    // Обробники закриття
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Функція для підтвердження видалення закладки
function confirmRemoveBookmark(animeId, title) {
    const modalHTML = `
        <div class="confirmation-modal" id="confirm-bookmark-remove">
            <div class="confirmation-modal-content">
                <h3>Видалити закладку?</h3>
                <p>Ви дійсно хочете видалити "${title}" з закладок?</p>
                <div class="confirmation-modal-buttons">
                    <button class="confirm-btn" onclick="executeRemoveBookmark('${animeId}')">Так, видалити</button>
                    <button class="cancel-btn" onclick="closeConfirmationModal('confirm-bookmark-remove')">Скасувати</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirm-bookmark-remove');
    modal.style.display = 'flex';
}

// Функція для підтвердження видалення оцінки
function confirmDeleteRating(animeId, title) {
    const modalHTML = `
        <div class="confirmation-modal" id="confirm-rating-delete">
            <div class="confirmation-modal-content">
                <h3>Видалити оцінку?</h3>
                <p>Ви дійсно хочете видалити вашу оцінку для "${title}"?</p>
                <div class="confirmation-modal-buttons">
                    <button class="confirm-btn" onclick="executeDeleteRating('${animeId}')">Так, видалити</button>
                    <button class="cancel-btn" onclick="closeConfirmationModal('confirm-rating-delete')">Скасувати</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirm-rating-delete');
    modal.style.display = 'flex';
}

// Функція для виконання видалення закладки (без закриття модального вікна)
function executeRemoveBookmark(animeId) {
    allBookmarks = allBookmarks.filter(item => item.id !== animeId);
    localStorage.setItem('animeBookmarks', JSON.stringify(allBookmarks));
    
    // Закриваємо тільки модальне вікно підтвердження
    closeConfirmationModal('confirm-bookmark-remove');
    
    // Оновлюємо інтерфейс
    updateProfileStats();
    showTempMessage('Закладку видалено 📕');
    
    // Оновлюємо модальне вікно з закладками якщо воно відкрите
    const bookmarksModal = document.getElementById('bookmarks-modal');
    if (bookmarksModal) {
        // Видаляємо старе модальне вікно
        bookmarksModal.remove();
        // Відкриваємо нове з оновленими даними
        showBookmarksModal();
    }
}

// Функція для виконання видалення оцінки (без закриття модального вікна)
function executeDeleteRating(animeId) {
    delete allRatings[animeId];
    localStorage.setItem('animeRatings', JSON.stringify(allRatings));
    
    // Закриваємо тільки модальне вікно підтвердження
    closeConfirmationModal('confirm-rating-delete');
    
    // Оновлюємо інтерфейс
    updateProfileStats();
    showTempMessage('Оцінку видалено ⭐');
    
    // Оновлюємо модальне вікно з оцінками якщо воно відкрите
    const ratingsModal = document.getElementById('ratings-modal');
    if (ratingsModal) {
        // Видаляємо старе модальне вікно
        ratingsModal.remove();
        // Відкриваємо нове з оновленими даними
        showRatingsModal();
    }
}

// Функція для закриття модального вікна підтвердження
function closeConfirmationModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
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