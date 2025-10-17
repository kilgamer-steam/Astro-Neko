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

    // Функція для оновлення статистики профілю
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
            // Або залишити 0, якщо немає окремої системи відстеження
            watchedCountElement.textContent = '0';
        }
        
        // Оновлюємо вміст секцій з даними
        updateBookmarksSection(bookmarks);
        updateRatingsSection(ratings);
    }

    // Функція для оновлення секції закладок
    function updateBookmarksSection(bookmarks) {
        const bookmarksContainer = document.querySelector('.bookmarks-grid');
        const emptyState = document.querySelector('.profile-section:nth-child(1) .empty-state');
        
        if (!bookmarksContainer) return;
        
        // Очищаємо контейнер
        bookmarksContainer.innerHTML = '';
        
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
        bookmarks.slice(0, 6).forEach(bookmark => { // Показуємо тільки перші 6
            const bookmarkItem = document.createElement('div');
            bookmarkItem.classList.add('bookmark-item');
            bookmarkItem.innerHTML = `
                <img src="${bookmark.img}" alt="${bookmark.title}" class="bookmark-image">
                <div class="bookmark-title">${bookmark.title}</div>
            `;
            
            // Додаємо обробник кліку для переходу до аніме
            bookmarkItem.addEventListener('click', () => {
                window.location.href = `anime.html?id=${bookmark.id}`;
            });
            
            bookmarksContainer.appendChild(bookmarkItem);
        });
        
        // Якщо закладок більше ніж 6, показуємо індикатор
        if (bookmarks.length > 6) {
            const moreItem = document.createElement('div');
            moreItem.classList.add('bookmark-item');
            moreItem.innerHTML = `
                <div style="height: 200px; display: flex; align-items: center; justify-content: center; background: rgba(255, 105, 180, 0.1);">
                    <span style="color: #ff69b4; font-size: 1.2em;">+${bookmarks.length - 6}</span>
                </div>
                <div class="bookmark-title">Ще ${bookmarks.length - 6}</div>
            `;
            
            moreItem.addEventListener('click', () => {
                showTempMessage(`У вас ${bookmarks.length} закладок! 🎉\n\nУ повнофункціональній версії буде повний список.`);
            });
            
            bookmarksContainer.appendChild(moreItem);
        }
    }

    // Функція для оновлення секції оцінок
    function updateRatingsSection(ratings) {
        const ratingsContainer = document.querySelector('.ratings-list');
        const emptyState = document.querySelector('.profile-section:nth-child(2) .empty-state');
        
        if (!ratingsContainer) return;
        
        // Очищаємо контейнер
        ratingsContainer.innerHTML = '';
        
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
        
        // Додаємо оцінки (обмежуємо кількість для демонстрації)
        Object.entries(ratings).slice(0, 3).forEach(([animeId, ratingData]) => {
            // Створюємо заглушку, оскільки ми не маємо повної інформації про аніме
            const ratingItem = document.createElement('div');
            ratingItem.classList.add('rating-item');
            ratingItem.innerHTML = `
                <div class="rating-image" style="background: rgba(255, 105, 180, 0.2); display: flex; align-items: center; justify-content: center;">
                    <span style="color: #ff69b4;">⭐</span>
                </div>
                <div class="rating-info">
                    <div class="rating-title">Аніме ID: ${animeId}</div>
                    <div class="rating-stars">${'★'.repeat(ratingData.rating)}${'☆'.repeat(10 - ratingData.rating)}</div>
                    <small style="color: #cc6096ff;">Оцінка: ${ratingData.rating}/10</small>
                </div>
            `;
            
            ratingsContainer.appendChild(ratingItem);
        });
        
        // Якщо оцінок більше ніж 3, показуємо індикатор
        if (Object.keys(ratings).length > 3) {
            const moreItem = document.createElement('div');
            moreItem.classList.add('rating-item');
            moreItem.innerHTML = `
                <div style="text-align: center; width: 100%; padding: 20px; color: #cc6096ff;">
                    <div style="font-size: 1.5em; margin-bottom: 10px;">📊</div>
                    <div>Ще ${Object.keys(ratings).length - 3} оцінок</div>
                </div>
            `;
            
            moreItem.addEventListener('click', () => {
                showTempMessage(`У вас ${Object.keys(ratings).length} оцінок! 🎯\n\nУ повнофункціональній версії буде повний список з постами аніме.`);
            });
            
            ratingsContainer.appendChild(moreItem);
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