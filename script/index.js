let animeList = [];
let loadedAnimeData = [];
let loadedCount = 0;
const batchSize = 20;
let currentFlippedCard = null;

// Налаштування з localStorage
let sortSettings = JSON.parse(localStorage.getItem('sortSettings')) || {
    by: 'title',
    order: 'asc'
};

let viewSettings = JSON.parse(localStorage.getItem('viewSettings')) || {
    view: 'grid'
};

// Змінні для фільтрів
let activeFilters = {
    genres: [],
    statuses: [],
    years: []
};

// Функція для підрахунку загальної кількості серій
function calculateTotalEpisodes(anime) {
    let total = 0;
    
    if (anime.seasons && Array.isArray(anime.seasons)) {
        anime.seasons.forEach(season => {
            if (season.episodes && Array.isArray(season.episodes)) {
                total += season.episodes.length;
            }
        });
    }
    
    if (anime.movies && Array.isArray(anime.movies)) {
        total += anime.movies.length;
    }
    
    return total > 0 ? total : 0;
}

function calculateTotalSeasons(anime) {
    if (anime.seasons && Array.isArray(anime.seasons)) {
        return anime.seasons.length;
    }
    return 0;
}

function getReleaseYear(anime) {
    if (anime.seasons && anime.seasons.length > 0 && anime.seasons[0].year) {
        return parseInt(anime.seasons[0].year);
    }
    return 0;
}

function getRating(anime) {
    if (anime.rating && typeof anime.rating === 'string') {
        const match = anime.rating.match(/(\d+\.?\d?)/);
        return match ? parseFloat(match[1]) : 0;
    }
    return 0;
}

function sortAnimeData(animeData) {
    return [...animeData].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortSettings.by) {
            case 'title':
                aValue = a.title || '';
                bValue = b.title || '';
                break;
            case 'rating':
                aValue = getRating(a);
                bValue = getRating(b);
                break;
            case 'episodes':
                aValue = calculateTotalEpisodes(a);
                bValue = calculateTotalEpisodes(b);
                break;
            case 'year':
                aValue = getReleaseYear(a);
                bValue = getReleaseYear(b);
                break;
            default:
                aValue = a.title || '';
                bValue = b.title || '';
        }
        
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        let result = 0;
        if (aValue < bValue) result = -1;
        if (aValue > bValue) result = 1;
        
        return sortSettings.order === 'desc' ? -result : result;
    });
}

function filterAnimeData(animeData) {
    return animeData.filter(anime => {
        // Фільтр по жанрам (AND логіка - всі вибрані жанри повинні бути присутні)
        if (activeFilters.genres.length > 0) {
            const hasAllGenres = activeFilters.genres.every(genre => 
                anime.tags && anime.tags.includes(genre)
            );
            if (!hasAllGenres) return false;
        }

        // Фільтр по статусам (OR логіка - достатньо одного статусу)
        if (activeFilters.statuses.length > 0) {
            if (!activeFilters.statuses.includes(anime.status)) return false;
        }

        // Фільтр по рокам (OR логіка - достатньо одного року)
        if (activeFilters.years.length > 0) {
            const year = getReleaseYear(anime);
            if (!activeFilters.years.includes(year.toString())) return false;
        }

        return true;
    });
}

// Функція для фільтрації з переданими фільтрами
function filterAnimeDataWithFilters(animeData, filters) {
    return animeData.filter(anime => {
        // Фільтр по жанрам (AND логіка - всі вибрані жанри повинні бути присутні)
        if (filters.genres.length > 0) {
            const hasAllGenres = filters.genres.every(genre => 
                anime.tags && anime.tags.includes(genre)
            );
            if (!hasAllGenres) return false;
        }

        // Фільтр по статусам (OR логіка - достатньо одного статусу)
        if (filters.statuses.length > 0) {
            if (!filters.statuses.includes(anime.status)) return false;
        }

        // Фільтр по рокам (OR логіка - достатньо одного року)
        if (filters.years.length > 0) {
            const year = getReleaseYear(anime);
            if (!filters.years.includes(year.toString())) return false;
        }

        return true;
    });
}

// Функція для отримання поточних фільтрів з модального вікна
function getCurrentFiltersFromModal() {
    const tempFilters = {
        genres: [],
        statuses: [],
        years: []
    };

    document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
        const type = checkbox.dataset.type;
        const value = checkbox.value;

        if (type === 'genre') {
            tempFilters.genres.push(value);
        } else if (type === 'status') {
            tempFilters.statuses.push(value);
        } else if (type === 'year') {
            tempFilters.years.push(value);
        }
    });

    return tempFilters;
}

// Функція для оновлення лічильника результатів
function updateResultsCounter() {
    const tempFilters = getCurrentFiltersFromModal();
    const filteredData = filterAnimeDataWithFilters(loadedAnimeData, tempFilters);
    const count = filteredData.length;
    document.getElementById('results-count').textContent = count;
}

function updateDisplay() {
    const grid = document.getElementById('anime-grid');
    const list = document.getElementById('anime-list');
    
    grid.innerHTML = '';
    list.innerHTML = '';
    
    const filteredData = filterAnimeData(loadedAnimeData);
    const sortedData = sortAnimeData(filteredData);
    
    if (sortedData.length === 0) {
        showNoResultsMessage(true);
        return;
    }
    
    showNoResultsMessage(false);
    
    sortedData.forEach(anime => {
        grid.appendChild(createAnimeCard(anime));
        list.appendChild(createAnimeListItem(anime));
    });
    
    changeView(viewSettings.view);
}

function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.classList.add('anime-card');

    const front = document.createElement('div');
    front.classList.add('front');
    front.innerHTML = `
      <div class="image-container">
        <img src="${anime.img || 'N/A'}" alt="${anime.title || 'N/A'}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
      </div>
      <div class="title-container">
        <h3>${anime.title || 'N/A'}</h3>
      </div>`;

    const totalEpisodes = calculateTotalEpisodes(anime);
    const totalSeasons = calculateTotalSeasons(anime);
    
    const back = document.createElement('div');
    back.classList.add('back');
    back.innerHTML = `
        <div class="back-content">
            <h4>${anime.title || 'N/A'}</h4>
            <div class="back-info">
                <p><strong>Серії:</strong> ${totalEpisodes}</p>
                <p><strong>Сезони:</strong> ${totalSeasons}</p>
                <p><strong>Рейтинг:</strong> ${anime.rating || 'N/A'}</p>
                <p><strong>Жанри:</strong> ${anime.tags && anime.tags.length > 0 ? anime.tags.join(', ') : 'N/A'}</p>
            </div>
            <button class="details-btn">Детальніше</button>
        </div>
    `;
    
    back.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        window.location.href = `anime-info.html?id=${encodeURIComponent(anime.id)}`;
    };

    card.appendChild(front);
    card.appendChild(back);
    
    card.onclick = (e) => {
        if (e.target.classList.contains('details-btn')) {
            return;
        }
        
        if (currentFlippedCard && currentFlippedCard !== card) {
            currentFlippedCard.classList.remove('flipped');
        }
        
        card.classList.toggle('flipped');
        
        if (card.classList.contains('flipped')) {
            currentFlippedCard = card;
        } else {
            currentFlippedCard = null;
        }
    };

    return card;
}

function createAnimeListItem(anime) {
    const item = document.createElement('div');
    item.classList.add('anime-list-item');

    const totalEpisodes = calculateTotalEpisodes(anime);
    const totalSeasons = calculateTotalSeasons(anime);
    const year = getReleaseYear(anime);

    item.innerHTML = `
        <img class="list-item-image" src="${anime.img || 'N/A'}" alt="${anime.title || 'N/A'}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
        <div class="list-item-content">
            <h3 class="list-item-title">${anime.title || 'N/A'}</h3>
            <div class="list-item-meta">
                <span><strong>Серії:</strong> ${totalEpisodes}</span>
                <span><strong>Сезони:</strong> ${totalSeasons}</span>
                <span><strong>Рейтинг:</strong> ${anime.rating || 'N/A'}</span>
                <span><strong>Рік:</strong> ${year || 'N/A'}</span>
            </div>
            <div class="list-item-tags">
                ${anime.tags && anime.tags.length > 0 ? anime.tags.join(', ') : 'N/A'}
            </div>
            <div class="list-item-actions">
                <button class="list-details-btn">Детальніше</button>
            </div>
        </div>
    `;
    
    item.querySelector('.list-details-btn').onclick = () => {
        window.location.href = `anime-info.html?id=${encodeURIComponent(anime.id)}`;
    };

    return item;
}

async function loadAnimeList() {
    try {
        const resp = await fetch('anime/anime-list.json');
        if (!resp.ok) throw new Error('Не вдалося завантажити anime-list.json');
        animeList = await resp.json();
        loadNextBatch();
    } catch (err) {
        console.error('Помилка при завантаженні списку аніме:', err);
    }
}

async function loadNextBatch() {
    if (loadedCount >= animeList.length) return;

    const loadingText = document.getElementById('loading');
    loadingText.style.display = 'block';
    
    const nextBatch = animeList.slice(loadedCount, loadedCount + batchSize);

    for (const animeId of nextBatch) {
        try {
            const resp = await fetch(`anime/${encodeURIComponent(animeId)}.json`);
            if (!resp.ok) continue;
            const anime = await resp.json();
            loadedAnimeData.push(anime);
            updateFilterOptions(anime);
        } catch (err) {
            console.error(`Не вдалося завантажити ${animeId}.json`, err);
        }
    }

    loadedCount += nextBatch.length;
    loadingText.style.display = 'none';
    
    updateDisplay();
}

// ===== ФУНКЦІЇ ДЛЯ ФІЛЬТРІВ =====

function initializeFilters() {
    const filtersBtn = document.getElementById('filters-btn');
    const filtersModal = document.getElementById('filters-modal');
    const closeFilters = document.getElementById('close-filters');
    const applyFilters = document.getElementById('apply-filters');
    const resetFilters = document.getElementById('reset-filters');

    // Відкриття модального вікна
    filtersBtn.addEventListener('click', () => {
        filtersModal.style.display = 'flex';
        // Встановити поточні фільтри в модальне вікно
        setModalFiltersFromActive();
        updateResultsCounter(); // Оновити лічильник при відкритті
    });

    // Закриття модального вікна
    closeFilters.addEventListener('click', () => {
        filtersModal.style.display = 'none';
    });

    // Застосування фільтрів
    applyFilters.addEventListener('click', () => {
        updateActiveFilters();
        updateFiltersCount();
        updateDisplay();
        filtersModal.style.display = 'none';
    });

    // Скидання фільтрів
    resetFilters.addEventListener('click', () => {
        resetAllFilters();
        updateFiltersCount();
        updateResultsCounter(); // Оновити лічильник
    });

    // Слухачі подій для чекбоксів
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('filter-checkbox')) {
            updateResultsCounter(); // Оновити лічильник при зміні будь-якого чекбокса
        }
    });

    // Закриття по кліку поза вікном
    filtersModal.addEventListener('click', (e) => {
        if (e.target === filtersModal) {
            filtersModal.style.display = 'none';
        }
    });
}

function updateFilterOptions(anime) {
    const genreOptions = document.getElementById('genre-options');
    const yearOptions = document.getElementById('year-options');

    // Оновлення жанрів
    if (anime.tags) {
        anime.tags.forEach(tag => {
            if (!document.querySelector(`#genre-options input[value="${tag}"]`)) {
                const label = document.createElement('label');
                label.className = 'checkbox-label';
                label.innerHTML = `
                    <input type="checkbox" value="${tag}" class="filter-checkbox" data-type="genre">
                    <span class="checkmark"></span>
                    ${tag}
                `;
                genreOptions.appendChild(label);
            }
        });
    }

    // Оновлення років
    const year = getReleaseYear(anime);
    if (year > 0 && !document.querySelector(`#year-options input[value="${year}"]`)) {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${year}" class="filter-checkbox" data-type="year">
            <span class="checkmark"></span>
            ${year}
        `;
        yearOptions.appendChild(label);
    }
}

function updateActiveFilters() {
    activeFilters = {
        genres: [],
        statuses: [],
        years: []
    };

    document.querySelectorAll('.filter-checkbox:checked').forEach(checkbox => {
        const type = checkbox.dataset.type;
        const value = checkbox.value;

        if (type === 'genre') {
            activeFilters.genres.push(value);
        } else if (type === 'status') {
            activeFilters.statuses.push(value);
        } else if (type === 'year') {
            activeFilters.years.push(value);
        }
    });
}

// Функція для встановлення фільтрів у модальному вікні з активних фільтрів
function setModalFiltersFromActive() {
    // Скинути всі чекбокси
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Встановити активні фільтри
    activeFilters.genres.forEach(genre => {
        const checkbox = document.querySelector(`#genre-options input[value="${genre}"]`);
        if (checkbox) checkbox.checked = true;
    });

    activeFilters.statuses.forEach(status => {
        const checkbox = document.querySelector(`#status-options input[value="${status}"]`);
        if (checkbox) checkbox.checked = true;
    });

    activeFilters.years.forEach(year => {
        const checkbox = document.querySelector(`#year-options input[value="${year}"]`);
        if (checkbox) checkbox.checked = true;
    });
}

function resetAllFilters() {
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    activeFilters = {
        genres: [],
        statuses: [],
        years: []
    };
}

function updateFiltersCount() {
    const count = activeFilters.genres.length + activeFilters.statuses.length + activeFilters.years.length;
    document.getElementById('filters-count').textContent = count;
}

// ===== КІНЕЦЬ ФУНКЦІЙ ДЛЯ ФІЛЬТРІВ =====

function showNoResultsMessage(show) {
    let message = document.getElementById('no-results-message');
    
    if (show && !message) {
        message = document.createElement('div');
        message.id = 'no-results-message';
        message.classList.add('no-results');
        message.textContent = 'За вашим запитом нічого не знайдено. Спробуйте змінити фільтри.';
        
        const grid = document.getElementById('anime-grid');
        grid.appendChild(message);
    } else if (!show && message) {
        message.remove();
    }
}

function changeView(view) {
    viewSettings.view = view;
    localStorage.setItem('viewSettings', JSON.stringify(viewSettings));
    
    const grid = document.getElementById('anime-grid');
    const list = document.getElementById('anime-list');
    const viewSelect = document.getElementById('view-select');
    
    viewSelect.value = view;
    
    if (view === 'list') {
        grid.style.display = 'none';
        list.style.display = 'flex';
    } else {
        grid.style.display = 'grid';
        list.style.display = 'none';
        grid.classList.toggle('compact', view === 'compact');
    }
}

function saveSortSettings() {
    localStorage.setItem('sortSettings', JSON.stringify(sortSettings));
}

function initializeUI() {
    document.getElementById('sort-by').value = sortSettings.by;
    document.getElementById('sort-order').textContent = sortSettings.order === 'asc' ? '▲' : '▼';
    document.getElementById('sort-order').dataset.order = sortSettings.order;
    
    changeView(viewSettings.view);
    initializeFilters();
}

// Обробники подій
document.getElementById('sort-by').addEventListener('change', (e) => {
    sortSettings.by = e.target.value;
    saveSortSettings();
    updateDisplay();
});

document.getElementById('sort-order').addEventListener('click', () => {
    sortSettings.order = sortSettings.order === 'asc' ? 'desc' : 'asc';
    document.getElementById('sort-order').textContent = sortSettings.order === 'asc' ? '▲' : '▼';
    document.getElementById('sort-order').dataset.order = sortSettings.order;
    saveSortSettings();
    updateDisplay();
});

document.getElementById('view-select').addEventListener('change', (e) => {
    changeView(e.target.value);
});

document.getElementById('search').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filteredData = filterAnimeData(loadedAnimeData).filter(anime => {
        // Пошук по назві
        const titleMatch = anime.title && anime.title.toLowerCase().includes(query);
        // Пошук по ID
        const idMatch = anime.id && anime.id.toLowerCase().includes(query);
        
        return titleMatch || idMatch;
    });
    
    const grid = document.getElementById('anime-grid');
    const list = document.getElementById('anime-list');
    
    grid.innerHTML = '';
    list.innerHTML = '';
    
    if (filteredData.length === 0) {
        showNoResultsMessage(true);
        return;
    }
    
    showNoResultsMessage(false);
    
    const sortedData = sortAnimeData(filteredData);
    sortedData.forEach(anime => {
        grid.appendChild(createAnimeCard(anime));
        list.appendChild(createAnimeListItem(anime));
    });
});

document.getElementById('surprise').addEventListener('click', () => {
    if (loadedAnimeData.length === 0) return;
    const filteredData = filterAnimeData(loadedAnimeData);
    if (filteredData.length === 0) return;
    const randomAnime = filteredData[Math.floor(Math.random() * filteredData.length)];
    window.location.href = `anime-info.html?id=${encodeURIComponent(randomAnime.id)}`;
});

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadNextBatch();
    }
});

document.addEventListener('click', (e) => {
    if (currentFlippedCard && !currentFlippedCard.contains(e.target)) {
        currentFlippedCard.classList.remove('flipped');
        currentFlippedCard = null;
    }
});

// Auto-hide header
let lastScrollY = window.scrollY;
const header = document.querySelector('header');
const headerHeight = header.offsetHeight;

document.querySelector('main').style.paddingTop = headerHeight + 'px';

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

// Ініціалізація
loadAnimeList();
initializeUI();