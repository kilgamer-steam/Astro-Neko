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