import subprocess
import os

# Шляхи до портативного ffmpeg/ffprobe
ffmpeg_path = r"C:\Users\ROMA\source\repos\videodownloader\videodownloader\bin\Debug\net8.0\ffmpeg-2025-02-13-git-19a2d26177-full_build\bin\ffmpeg.exe"  # <- змінити на свій шлях
ffprobe_path = ffmpeg_path.replace("ffmpeg.exe", "ffprobe.exe")

# Збережені роздільності
resolutions = {
    "1080": "1920x1080",
    "720": "1280x720",
    "480": "854x480",
    "360": "640x360"
}

def get_video_resolution(path):
    """Повертає (width, height) відео"""
    cmd = [
        ffprobe_path,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height",
        "-of", "csv=p=0",
        path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        w, h = map(int, result.stdout.strip().split(','))
        return w, h
    except:
        return None, None

def compress_video(input_path, target_res):
    """Стискає відео до target_res тільки якщо потрібно і замінює файл"""
    target_w, target_h = map(int, resolutions[target_res].split('x'))
    w, h = get_video_resolution(input_path)
    if w is None:
        print(f"Не вдалося отримати роздільність: {input_path}")
        return
    if w <= target_w and h <= target_h:
        print(f"Пропускаємо {input_path}, бо вже <= {target_res}p")
        return
    
    # Тимчасовий файл для перезапису
    temp_path = input_path + ".tmp.mp4"
    cmd = [
        ffmpeg_path,
        "-i", input_path,
        "-vf", f"scale='min({target_w},iw)':'min({target_h},ih)':force_original_aspect_ratio=decrease",
        "-c:a", "copy",
        "-y",  # автоматично перезаписує тимчасовий файл, якщо існує
        temp_path
    ]
    subprocess.run(cmd)
    
    # Замінюємо оригінальний файл
    os.replace(temp_path, input_path)
    print(f"Стиснуто і замінено: {input_path} -> {target_res}p")

def main():
    folder = input("Введіть шлях до папки з відео: ").strip()
    if not os.path.isdir(folder):
        print("Папка не знайдена")
        return

    print("Доступні роздільності: 1080, 720, 480, 360")
    target_res = input("Введіть потрібну роздільність: ").strip()
    if target_res not in resolutions:
        print("Невірна роздільність")
        return

    for file in os.listdir(folder):
        if file.lower().endswith((".mp4", ".mkv", ".mov", ".avi")):
            compress_video(os.path.join(folder, file), target_res)

if __name__ == "__main__":
    main()
