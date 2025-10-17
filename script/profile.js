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

// Функція для завантаження актуальних даних з localStorage
function loadProfileData() {
    return {
        bookmarks: JSON.parse(localStorage.getItem('animeBookmarks') || '[]'),
        ratings: JSON.parse(localStorage.getItem('animeRatings') || '{}')
    };
}

// Функція для оновлення всієї статистики профілю
async function updateProfileStats() {
    // Завантажуємо актуальні дані
    const { bookmarks, ratings } = loadProfileData();
    
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
        // ВИМКНЕНО: не рахуємо оцінки як переглянуті
        watchedCountElement.textContent = '0';
    }
    
    // Оновлюємо вміст секцій з даними
    await updateBookmarksPreview(bookmarks);
    await updateRatingsPreview(ratings);
}

// Функція для оновлення превью закладок
async function updateBookmarksPreview(bookmarks = null) {
    const bookmarksContainer = document.querySelector('.profile-section:nth-child(1)');
    const emptyState = bookmarksContainer.querySelector('.empty-state');
    
    if (!bookmarksContainer) return;
    
    // Якщо bookmarks не передано, завантажуємо актуальні дані
    if (!bookmarks) {
        const data = loadProfileData();
        bookmarks = data.bookmarks;
    }
    
    // Знаходимо або створюємо контейнер для превью
    let previewContainer = bookmarksContainer.querySelector('.profile-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.classList.add('profile-preview');
        bookmarksContainer.appendChild(previewContainer);
    }
    
    // Очищаємо контейнер
    previewContainer.innerHTML = '';
    
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
    
    // Беремо перші 3 закладки
    const previewBookmarks = bookmarks.slice(0, 3);
    
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
    if (bookmarks.length > 3) {
        const moreButton = document.createElement('div');
        moreButton.classList.add('preview-more');
        moreButton.innerHTML = `
            <div class="preview-more-text">Показати всі закладки</div>
            <div class="preview-more-count">+${bookmarks.length - 3} ще</div>
        `;
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showBookmarksModal();
        });
        previewContainer.appendChild(moreButton);
    }
    
    // Додаємо обробник кліку на всю секцію
    bookmarksContainer.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-more') && !e.target.closest('.preview-item') && bookmarks.length > 0) {
            showBookmarksModal();
        }
    });
}

// Функція для оновлення превью оцінок
async function updateRatingsPreview(ratings = null) {
    const ratingsContainer = document.querySelector('.profile-section:nth-child(2)');
    const emptyState = ratingsContainer.querySelector('.empty-state');
    
    if (!ratingsContainer) return;
    
    // Якщо ratings не передано, завантажуємо актуальні дані
    if (!ratings) {
        const data = loadProfileData();
        ratings = data.ratings;
    }
    
    // Знаходимо або створюємо контейнер для превью
    let previewContainer = ratingsContainer.querySelector('.profile-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.classList.add('profile-preview');
        ratingsContainer.appendChild(previewContainer);
    }
    
    // Очищаємо контейнер
    previewContainer.innerHTML = '';
    
    const ratingsCount = Object.keys(ratings).length;
    
    if (ratingsCount === 0) {
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
    const previewRatings = Object.entries(ratings).slice(0, 3);
    
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
    if (ratingsCount > 3) {
        const moreButton = document.createElement('div');
        moreButton.classList.add('preview-more');
        moreButton.innerHTML = `
            <div class="preview-more-text">Показати всі оцінки</div>
            <div class="preview-more-count">+${ratingsCount - 3} ще</div>
        `;
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showRatingsModal();
        });
        previewContainer.appendChild(moreButton);
    }
    
    // Додаємо обробник кліку на всю секцію
    ratingsContainer.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-more') && !e.target.closest('.preview-item') && ratingsCount > 0) {
            showRatingsModal();
        }
    });
}

// Функція для створення елемента превью закладки
function createBookmarkPreviewItem(bookmark, animeInfo) {
    const previewItem = document.createElement('div');
    previewItem.classList.add('preview-item');
    
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
    
    const title = animeInfo ? animeInfo.title : `Аніме ID: ${animeId}`;
    const imageSrc = animeInfo ? animeInfo.img : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140" viewBox="0 0 100 140"><rect width="100" height="140" fill="%23943a67"/><text x="50" y="70" font-family="Arial" font-size="14" fill="white" text-anchor="middle">⭐</text></svg>';
    
    const stars = '★'.repeat(ratingData.rating) + '☆'.repeat(10 - ratingData.rating);
    
    previewItem.innerHTML = `
        <img src="${imageSrc}" alt="${title}" class="preview-item-image">
        <div class="preview-item-info">
            <div class="preview-item-title">${title}</div>
            <div class="preview-item-meta">
                <div style="color: #ffd700;">${stars}</div>
                <div>${ratingData.rating}/10</div>
            </div>
            <div class="preview-item-actions">
                <a href="anime-info.html?id=${animeId}" class="preview-details-btn">Детальніше</a>
                <button class="preview-remove-btn" onclick="event.stopPropagation(); confirmDeleteRating('${animeId}', '${title.replace(/'/g, "\\'")}')">Видалити</button>
            </div>
        </div>
    `;
    
    previewItem.addEventListener('click', (e) => {
        if (!e.target.closest('.preview-item-actions')) {
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
    // Завантажуємо актуальні дані
    const { bookmarks } = loadProfileData();
    
    // Видаляємо існуюче модальне вікно якщо воно є
    const existingModal = document.getElementById('bookmarks-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="profile-modal" id="bookmarks-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h3 class="profile-modal-title">Мої закладки (${bookmarks.length})</h3>
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
    
    // Додаємо обробник закриття по кліку поза модальним вікном
    const closeOnOutsideClick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    modal.addEventListener('click', closeOnOutsideClick);
    
    // Зберігаємо обробник для подальшого видалення
    modal._closeOnOutsideClick = closeOnOutsideClick;
    
    // Заповнюємо список закладок
    for (const bookmark of bookmarks) {
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
                        <button class="remove-btn" onclick="event.preventDefault(); handleRemoveBookmarkFromModal('${bookmark.id}', '${bookmark.title.replace(/'/g, "\\'")}')">Видалити</button>
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
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
}

// Функція для показу модального вікна з усіма оцінками
async function showRatingsModal() {
    // Завантажуємо актуальні дані
    const { ratings } = loadProfileData();
    const ratingsCount = Object.keys(ratings).length;
    
    // Видаляємо існуюче модальне вікно якщо воно є
    const existingModal = document.getElementById('ratings-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="profile-modal" id="ratings-modal">
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h3 class="profile-modal-title">Мої оцінки (${ratingsCount})</h3>
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
    
    // Додаємо обробник закриття по кліку поза модальним вікном
    const closeOnOutsideClick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
    
    modal.addEventListener('click', closeOnOutsideClick);
    
    // Зберігаємо обробник для подальшого видалення
    modal._closeOnOutsideClick = closeOnOutsideClick;
    
    // Заповнюємо список оцінок
    for (const [animeId, ratingData] of Object.entries(ratings)) {
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
                    <button class="delete-rating-btn" onclick="handleDeleteRatingFromModal('${animeId}', '${title.replace(/'/g, "\\'")}')">×</button>
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
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
}

// Функції для обробки видалення з модальних вікон
function handleRemoveBookmarkFromModal(animeId, title) {
    temporarilyDisableOutsideClick('bookmarks-modal', 300);
    confirmRemoveBookmark(animeId, title);
}

function handleDeleteRatingFromModal(animeId, title) {
    temporarilyDisableOutsideClick('ratings-modal', 300);
    confirmDeleteRating(animeId, title);
}

// Функція для підтвердження видалення закладки
function confirmRemoveBookmark(animeId, title) {
    // Видаляємо існуюче модальне вікно підтвердження якщо воно є
    const existingModal = document.getElementById('confirm-bookmark-remove');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="confirmation-modal" id="confirm-bookmark-remove">
            <div class="confirmation-modal-content">
                <h3>Видалити закладку?</h3>
                <p>Ви дійсно хочете видалити "${title}" з закладок?</p>
                <div class="confirmation-modal-buttons">
                    <button class="confirm-btn" onclick="handleConfirmRemoveBookmark('${animeId}')">Так, видалити</button>
                    <button class="cancel-btn" onclick="handleCancelRemoveBookmark()">Скасувати</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirm-bookmark-remove');
    modal.style.display = 'flex';
    
    // Додаємо обробник закриття по кліку поза модальним вікном
    const closeOnOutsideClick = (e) => {
        if (e.target === modal) {
            closeConfirmationModal('confirm-bookmark-remove');
        }
    };
    
    modal.addEventListener('click', closeOnOutsideClick);
    
    // Зберігаємо обробник для подальшого видалення
    modal._closeOnOutsideClick = closeOnOutsideClick;
}

// Функція для підтвердження видалення оцінки
function confirmDeleteRating(animeId, title) {
    // Видаляємо існуюче модальне вікно підтвердження якщо воно є
    const existingModal = document.getElementById('confirm-rating-delete');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="confirmation-modal" id="confirm-rating-delete">
            <div class="confirmation-modal-content">
                <h3>Видалити оцінку?</h3>
                <p>Ви дійсно хочете видалити вашу оцінку для "${title}"?</p>
                <div class="confirmation-modal-buttons">
                    <button class="confirm-btn" onclick="handleConfirmDeleteRating('${animeId}')">Так, видалити</button>
                    <button class="cancel-btn" onclick="handleCancelDeleteRating()">Скасувати</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirm-rating-delete');
    modal.style.display = 'flex';
    
    // Додаємо обробник закриття по кліку поза модальним вікном
    const closeOnOutsideClick = (e) => {
        if (e.target === modal) {
            closeConfirmationModal('confirm-rating-delete');
        }
    };
    
    modal.addEventListener('click', closeOnOutsideClick);
    
    // Зберігаємо обробник для подальшого видалення
    modal._closeOnOutsideClick = closeOnOutsideClick;
}

// Функції для обробки підтвердження з тимчасовим вимиканням
function handleConfirmRemoveBookmark(animeId) {
    temporarilyDisableOutsideClick('confirm-bookmark-remove', 300);
    executeRemoveBookmark(animeId);
}

function handleCancelRemoveBookmark() {
    temporarilyDisableOutsideClick('confirm-bookmark-remove', 300);
    closeConfirmationModal('confirm-bookmark-remove');
}

function handleConfirmDeleteRating(animeId) {
    temporarilyDisableOutsideClick('confirm-rating-delete', 300);
    executeDeleteRating(animeId);
}

function handleCancelDeleteRating() {
    temporarilyDisableOutsideClick('confirm-rating-delete', 300);
    closeConfirmationModal('confirm-rating-delete');
}

// Функція для тимчасового вимикання закриття по кліку поза вікном
function temporarilyDisableOutsideClick(modalId, duration = 300) {
    const modal = document.getElementById(modalId);
    if (modal && modal._closeOnOutsideClick) {
        // Тимчасово видаляємо обробник
        modal.removeEventListener('click', modal._closeOnOutsideClick);
        
        // Через вказаний час відновлюємо обробник
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.addEventListener('click', modal._closeOnOutsideClick);
            }
        }, duration);
    }
}

// Функція для закриття модального вікна підтвердження
function closeConfirmationModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Видаляємо обробник події
        if (modal._closeOnOutsideClick) {
            modal.removeEventListener('click', modal._closeOnOutsideClick);
        }
        modal.remove();
    }
}

// Функція для виконання видалення закладки
function executeRemoveBookmark(animeId) {
    // Завантажуємо актуальні дані
    const data = loadProfileData();
    let bookmarks = data.bookmarks;
    
    // Видаляємо закладку
    bookmarks = bookmarks.filter(item => item.id !== animeId);
    localStorage.setItem('animeBookmarks', JSON.stringify(bookmarks));
    
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
        setTimeout(() => {
            showBookmarksModal();
        }, 50);
    }
}

// Функція для виконання видалення оцінки
function executeDeleteRating(animeId) {
    // Завантажуємо актуальні дані
    const data = loadProfileData();
    let ratings = data.ratings;
    
    // Видаляємо оцінку
    delete ratings[animeId];
    localStorage.setItem('animeRatings', JSON.stringify(ratings));
    
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
        setTimeout(() => {
            showRatingsModal();
        }, 50);
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