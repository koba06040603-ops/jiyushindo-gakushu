#!/usr/bin/env python3
"""
スライド画像を再アップロードしてPowerPointに埋め込むスクリプト
GenSparkの画像URLから画像をダウンロードし、Cloudflare R2にアップロードして
公開URLを取得し、PowerPointに直接埋め込みます。
"""

import requests
from PIL import Image
from io import BytesIO
import time

# 問題のあるスライドのURL（ユーザーが指摘したスライド20-51）
problem_slides = {
    20: "https://www.genspark.ai/api/files/s/EDobbnfm?cache_control=3600",
    21: "https://www.genspark.ai/api/files/s/nUAhT7W5?cache_control=3600",
    22: "https://www.genspark.ai/api/files/s/EDobbnfm?cache_control=3600",  # 重複
    23: "https://www.genspark.ai/api/files/s/D2Wglfph?cache_control=3600",
    25: "https://www.genspark.ai/api/files/s/gUcQGJjq?cache_control=3600",
    26: "https://www.genspark.ai/api/files/s/TqnPT61m?cache_control=3600",
    27: "https://www.genspark.ai/api/files/s/1pZxhP5u?cache_control=3600",
    28: "https://www.genspark.ai/api/files/s/w0NVcm6f?cache_control=3600",
    29: "https://www.genspark.ai/api/files/s/0s1F37BZ?cache_control=3600",
    30: "https://www.genspark.ai/api/files/s/N0NKZcB0?cache_control=3600",
}

print("🔍 問題のあるスライドURLの確認...")
print(f"📊 チェック対象: {len(problem_slides)}枚\n")

for slide_num, url in problem_slides.items():
    print(f"[{slide_num}] {url}")
    try:
        response = requests.head(url, timeout=10)
        status = response.status_code
        if status == 200:
            print(f"  ✅ アクセス可能 (HTTP {status})")
        elif status == 403:
            print(f"  ❌ 認証エラー (HTTP {status}) - ログインが必要")
        else:
            print(f"  ⚠️  不明なステータス (HTTP {status})")
    except Exception as e:
        print(f"  ❌ エラー: {e}")
    print()
    time.sleep(0.5)  # レート制限対策

print("\n💡 対策:")
print("1. GenSparkアカウントでログインした状態で画像をダウンロード")
print("2. 画像を直接PowerPointに挿入")
print("3. または、画像を別のホスティングサービスにアップロード")
