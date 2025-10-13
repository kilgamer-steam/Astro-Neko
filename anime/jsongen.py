import os
import json
import re
import sys

def load_existing_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Перевіряємо і додаємо відсутні поля
            if "seasons" not in data:
                data["seasons"] = []
            if "movies" not in data:
                data["movies"] = []
            if "tags" not in data:
                data["tags"] = []
            return data
    return {
        "id": "",
        "title": "",
        "description": "",
        "tags": [],
        "rating": "",
        "status": "",
        "age": "",
        "img": "",
        "background": "",
        "preview": "",
        "seasons": [],
        "movies": []
    }

def find_season(anime_info, season_number):
    if "seasons" not in anime_info:
        anime_info["seasons"] = []
    
    for season in anime_info["seasons"]:
        if season["seasonNumber"] == season_number:
            return season
    return None

def find_movie(anime_info, movie_number):
    if "movies" not in anime_info:
        anime_info["movies"] = []
    
    for movie in anime_info["movies"]:
        if movie["movieNumber"] == movie_number:
            return movie
    return None

def episode_exists(season, ep_number, studio_name):
    if "episodes" not in season:
        season["episodes"] = []
    
    for ep in season["episodes"]:
        if ep["title"] == f"Епізод {ep_number}":
            # Перевіряємо студії
            if "dubbing" not in ep:
                ep["dubbing"] = []
            for dub in ep["dubbing"]:
                if dub["studio"] == studio_name:
                    return True
    return False

def movie_exists(anime_info, movie_number, studio_name):
    if "movies" not in anime_info:
        anime_info["movies"] = []
    
    for movie in anime_info["movies"]:
        if movie["movieNumber"] == movie_number:
            if "dubbing" not in movie:
                movie["dubbing"] = []
            for dub in movie["dubbing"]:
                if dub["studio"] == studio_name:
                    return True
    return False

def add_episode(season, episode, studio_name):
    # Перевіряємо наявність episodes
    if "episodes" not in season:
        season["episodes"] = []
    
    # Якщо епізод вже є — просто додаємо новий дубляж
    for ep in season["episodes"]:
        if ep["title"] == episode["title"]:
            if "dubbing" not in ep:
                ep["dubbing"] = []
            ep["dubbing"].append(episode["dubbing"][0])
            return
    
    # Якщо епізода немає — додаємо і сортуємо
    season["episodes"].append(episode)
    season["episodes"].sort(key=lambda e: int(re.search(r'\d+', e["title"]).group()))

def add_movie(anime_info, movie, studio_name):
    # Перевіряємо наявність movies
    if "movies" not in anime_info:
        anime_info["movies"] = []
    
    # Якщо фільм вже є — просто додаємо новий дубляж
    for mov in anime_info["movies"]:
        if mov["movieNumber"] == movie["movieNumber"]:
            if "dubbing" not in mov:
                mov["dubbing"] = []
            mov["dubbing"].append(movie["dubbing"][0])
            return
    
    # Якщо фільма немає — додаємо і сортуємо
    anime_info["movies"].append(movie)
    anime_info["movies"].sort(key=lambda m: m["movieNumber"])

base_path = input("Введіть шлях до папки аніме: ").strip()
anime_name = os.path.basename(base_path).strip()

# Папка, де лежить сам Python-скрипт
script_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
output_file = os.path.join(script_dir, f"{anime_name}.json")

# Завантажуємо існуючий JSON або створюємо новий
anime_info = load_existing_json(output_file)
anime_info["id"] = anime_name
anime_info["img"] = f"/anime/image/{anime_name}.jpg"
anime_info["background"] = f"/anime/background/{anime_name}_bg.jpg"
anime_info["preview"] = f"/anime/preview/{anime_name}_preview.jpg"

ep_pattern = re.compile(r'ep(\d+)\.mp4$', re.IGNORECASE)
movie_pattern = re.compile(r'movie(\d+)\.mp4$', re.IGNORECASE)

for item_name in sorted(os.listdir(base_path)):
    item_path = os.path.join(base_path, item_name)
    if not os.path.isdir(item_path):
        continue
    
    # Обробка сезонів
    if item_name.lower().startswith('season') or item_name.lower().startswith('seson'):
        season_number = int(''.join(filter(str.isdigit, item_name)) or 1)
        season = find_season(anime_info, season_number)
        if season is None:
            season = {"seasonNumber": season_number, "episodes": []}
            anime_info["seasons"].append(season)

        for studio_folder in sorted(os.listdir(item_path)):
            studio_path = os.path.join(item_path, studio_folder)
            if not os.path.isdir(studio_path):
                continue

            for ep_file in os.listdir(studio_path):
                match = ep_pattern.search(ep_file)
                if match:
                    ep_number = int(match.group(1))
                    if episode_exists(season, ep_number, studio_folder):
                        continue  # якщо серія вже є з цією студією
                    
                    episode = {
                        "title": f"Епізод {ep_number}",
                        "name": "",
                        "dubbing": [
                            {
                                "studio": studio_folder,
                                "videoUrl": f"/anime/videos/{anime_name}/{item_name}/{studio_folder}/{ep_file}"
                            }
                        ],
                        "opening": [0, 0],
                        "ending": [0, 0]
                    }
                    add_episode(season, episode, studio_folder)
    
    # Обробка фільмів
    elif item_name.lower() == 'movie' or item_name.lower() == 'movies':
        for studio_folder in sorted(os.listdir(item_path)):
            studio_path = os.path.join(item_path, studio_folder)
            if not os.path.isdir(studio_path):
                continue

            for movie_file in os.listdir(studio_path):
                match = movie_pattern.search(movie_file)
                if match:
                    movie_number = int(match.group(1))
                    if movie_exists(anime_info, movie_number, studio_folder):
                        continue  # якщо фільм вже є з цією студією
                    
                    movie = {
                        "movieNumber": movie_number,
                        "title": f"Фільм {movie_number}",
                        "name": "",
                        "dubbing": [
                            {
                                "studio": studio_folder,
                                "videoUrl": f"/anime/videos/{anime_name}/{item_name}/{studio_folder}/{movie_file}"
                            }
                        ],
                        "opening": [0, 0],
                        "ending": [0, 0]
                    }
                    add_movie(anime_info, movie, studio_folder)

# Сортуємо сезони за номером
if "seasons" in anime_info:
    anime_info["seasons"].sort(key=lambda s: s["seasonNumber"])

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(anime_info, f, ensure_ascii=False, indent=2)

print(f"Файл {output_file} оновлено або створено успішно!")