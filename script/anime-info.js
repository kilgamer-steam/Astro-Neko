// Отримуємо ID аніме з URL
    const params = new URLSearchParams(window.location.search);
    const animeId = params.get("id");
    
    // Елементи для управління станом завантаження
    const loadingOverlay = document.getElementById('loading-overlay');
    const contentWrapper = document.getElementById('content-wrapper');
    
    // Показуємо індикатор завантаження
    loadingOverlay.classList.remove('hidden');
    contentWrapper.classList.remove('loaded');
    
    if (!animeId) {
      showError("Аніме не знайдено 😿", "Не вдалося отримати ID аніме з URL.");
    } else {
      loadAnime(animeId);
    }

    async function loadAnime(id) {
      try {
        console.log("Завантажую аніме з ID:", id);
        const response = await fetch(`anime/${encodeURIComponent(id)}.json`);
        console.log("Статус відповіді:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const anime = await response.json();
        console.log("Аніме успішно завантажено:", anime.title);
        
        // Ховаємо індикатор завантаження та показуємо контент
        setTimeout(() => {
          loadingOverlay.classList.add('hidden');
          contentWrapper.classList.add('loaded');
          displayAnimeInfo(anime);
        }, 500);
        
      } catch (error) {
        console.error("Деталі помилки:", error);
        showError("Помилка при завантаженні аніме 😿", error.message);
      }
    }

    function showError(title, message) {
      document.body.innerHTML = `
        <div class="error-message">
          <h2>${title}</h2>
          <p>${message}</p>
          <a href="index.html" class="back-button">Повернутися на головну</a>
        </div>
      `;
    }

    // Функція для форматування тривалості
    function formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours} год ${minutes} хв`;
      } else {
        return `${minutes} хв`;
      }
    }

    // Функція для форматування дати
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    function displayAnimeInfo(anime) {
      document.title = `${anime.title} — AstroNeko`;
      document.getElementById("anime-bg").style.backgroundImage = `url('${anime.background}')`;
      document.getElementById("anime-image").src = anime.img;
      document.getElementById("anime-title").textContent = anime.title;
      document.getElementById("anime-description").textContent = anime.description;
      document.getElementById("anime-tags").textContent = anime.tags.join(", ");
      document.getElementById("anime-status").textContent = anime.status;
      document.getElementById("anime-age").textContent = anime.age;
      document.getElementById("anime-rating").textContent = anime.rating || "N/A";

      const seasonList = document.getElementById("season-list");
      seasonList.innerHTML = "";

      // Відображення сезонів
      anime.seasons.forEach(season => {
        const seasonDiv = document.createElement("div");
        seasonDiv.classList.add("season");

        const seasonTitle = document.createElement("h4");
        seasonTitle.textContent = `Сезон ${season.seasonNumber}: "${season.title}"`;
        seasonDiv.appendChild(seasonTitle);

        // Додаємо інформацію про рік та кількість серій
        const seasonMeta = document.createElement("div");
        seasonMeta.classList.add("season-meta");
        seasonMeta.innerHTML = `
          <span class="season-year">${season.year} рік</span>
          <span class="season-episodes">${season.episodeCount} серій</span>
        `;
        seasonDiv.appendChild(seasonMeta);

        const episodeContainer = document.createElement("div");
        episodeContainer.classList.add("episode-container");

        season.episodes.forEach((ep, idx) => {
          const btn = document.createElement("button");
          btn.classList.add("episode-btn");
          btn.textContent = ep.title || `Серія ${idx + 1}`;
          btn.onclick = () => {
            const url = `player.html?id=${encodeURIComponent(anime.id)}&season=${season.seasonNumber}&episode=${idx+1}`;
            window.location.href = url;
          };
          episodeContainer.appendChild(btn);
        });

        seasonDiv.appendChild(episodeContainer);
        seasonList.appendChild(seasonDiv);
      });

      // Відображення фільмів
      if (anime.movies && anime.movies.length > 0) {
        const moviesBlock = document.createElement("div");
        moviesBlock.classList.add("movies-block");

        const moviesTitle = document.createElement("h4");
        moviesTitle.textContent = "Фільми";
        moviesBlock.appendChild(moviesTitle);

        // Створюємо таблицю для фільмів
        const moviesTable = document.createElement("table");
        moviesTable.classList.add("movies-table");
        
        // Заголовки таблиці
        const tableHeader = document.createElement("tr");
        tableHeader.innerHTML = `
          <th class="num-tab">№</th>
          <th class="name-tab">Назва фільму</th>
          <th class="data-tab">Дата релізу</th>
          <th class="time-tab">Тривалість</th>
          <th class="button-tab"></th>
        `;
        moviesTable.appendChild(tableHeader);

        // Заповнюємо таблицю даними
        anime.movies.forEach((movie, idx) => {
          const row = document.createElement("tr");
          row.classList.add("movie-row");
          
          // Конвертуємо секунди в читабельний формат
          const duration = formatDuration(movie.duration);
          
          row.innerHTML = `
            <td class="movie-number">${movie.movieNumber}</td>
            <td class="movie-title">${movie.name}</td>
            <td class="movie-date">${formatDate(movie.releaseDate)}</td>
            <td class="movie-duration">${duration}</td>
            <td class="movie-action">
              <button class="watch-movie-btn" data-movie="${idx + 1}">Дивитися</button>
            </td>
          `;
          
          // Обробник кнопки "Дивитися"
          const watchBtn = row.querySelector('.watch-movie-btn');
          watchBtn.onclick = () => {
            const url = `player.html?id=${encodeURIComponent(anime.id)}&movie=${idx + 1}`;
            window.location.href = url;
          };
          
          moviesTable.appendChild(row);
        });

        moviesBlock.appendChild(moviesTable);
        seasonList.appendChild(moviesBlock);
      }
      
      // Додаємо обробники для кнопок дій
      setupActionButtons(anime);
    }
    
    function setupActionButtons(anime) {
      const bookmarkBtn = document.getElementById('bookmark-btn');
      const rateBtn = document.getElementById('rate-btn');
      const shareBtn = document.getElementById('share-btn');
      
      // Перевіряємо, чи аніме вже в закладках
      const bookmarks = JSON.parse(localStorage.getItem('animeBookmarks') || '[]');
      const isBookmarked = bookmarks.some(item => item.id === anime.id);
      
      if (isBookmarked) {
        bookmarkBtn.classList.add('active');
        bookmarkBtn.innerHTML = '<span>★</span> В закладках';
      }
      
      // Обробник для кнопки закладок
      bookmarkBtn.addEventListener('click', () => {
        let bookmarks = JSON.parse(localStorage.getItem('animeBookmarks') || '[]');
        const existingIndex = bookmarks.findIndex(item => item.id === anime.id);
        
        if (existingIndex >= 0) {
          // Видаляємо з закладок
          bookmarks.splice(existingIndex, 1);
          bookmarkBtn.classList.remove('active');
          bookmarkBtn.innerHTML = '<span>★</span> В закладки';
        } else {
          // Додаємо в закладки
          bookmarks.push({
            id: anime.id,
            title: anime.title,
            img: anime.img,
            added: new Date().toISOString()
          });
          bookmarkBtn.classList.add('active');
          bookmarkBtn.innerHTML = '<span>★</span> В закладках';
        }
        
        localStorage.setItem('animeBookmarks', JSON.stringify(bookmarks));
      });
      
      // Обробник для кнопки оцінки
      rateBtn.addEventListener('click', () => {
        const rating = prompt('Оцініть це аніме від 1 до 10:');
        if (rating && !isNaN(rating) && rating >= 1 && rating <= 10) {
          let ratings = JSON.parse(localStorage.getItem('animeRatings') || '{}');
          ratings[anime.id] = {
            rating: parseInt(rating),
            date: new Date().toISOString()
          };
          localStorage.setItem('animeRatings', JSON.stringify(ratings));
          alert(`Дякуємо за оцінку: ${rating}/10!`);
        } else if (rating !== null) {
          alert('Будь ласка, введіть число від 1 до 10.');
        }
      });
      
      // Обробник для кнопки поділитися
      shareBtn.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: anime.title,
            text: anime.description.substring(0, 100) + '...',
            url: window.location.href
          });
        } else {
          // Копіювання посилання в буфер обміну для старих браузерів
          navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Посилання скопійовано в буфер обміну!');
          });
        }
      });
    }

    // Auto-hide header functionality
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    const headerHeight = header.offsetHeight;

    // Встановлюємо правильний відступ для контенту
    document.querySelector('.content-wrapper').style.paddingTop = headerHeight + 'px';

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