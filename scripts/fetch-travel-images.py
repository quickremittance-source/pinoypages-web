"""Dev-only: pick and download licensed Wikimedia Commons photos for /travel, convert to WebP.
Writes public/travel/<slug>.webp and content/travel-credits.json. Accepts PD, CC0, CC BY, CC BY-SA only."""
import json, re, subprocess, sys, urllib.parse, urllib.request
from pathlib import Path

UA = {"User-Agent": "PinoyPagesTravelBot/1.0 (dev script; pinoypages.ca)"}
OUT = Path("public/travel"); OUT.mkdir(parents=True, exist_ok=True)
QUERIES = {
  "cn-tower-waterfront": "CN Tower Toronto",
  "toronto-islands": "Toronto Islands skyline ferry",
  "distillery-district": "Distillery District Toronto Gooderham",
  "kensington-market": "Kensington Market Toronto",
  "casa-loma": "Casa Loma exterior",
  "scarborough-bluffs": "Scarborough Bluffs",
  "high-park-cherry-blossoms": "High Park Toronto cherry",
  "royal-ontario-museum": "Royal Ontario Museum Crystal",
  "niagara-falls": "Horseshoe Falls Niagara",
  "niagara-on-the-lake": "Niagara-on-the-Lake Queen Street",
  "muskoka": "Muskoka Lakes",
  "blue-mountain": "Blue Mountain ski resort Ontario",
  "muskoka": r"(?i)muskoka", "manila": r"(?i)(cathedral|fort santiago|intramuros)", "algonquin": "Algonquin Park lake",
  "sandbanks": "Sandbanks Provincial Park",
  "elora-gorge": "Elora Gorge",
  "little-manila": "Little Manila Toronto",
  "manila": "Manila Cathedral Intramuros",
  "cebu": "Magellan's Cross Cebu",
  "boracay": "Boracay White Beach",
  "palawan": "El Nido Palawan",
  "bohol": "Chocolate Hills Bohol",
  "florida": "Miami Beach Florida",
  "las-vegas": "Las Vegas Strip",
  "new-york": "Manhattan skyline New York",
  "vancouver-banff": "Banff National Park Moraine Lake",
  "hawaii": "Waikiki Beach Diamond Head",
  "mexico-cuba": "Havana Malecon Cuba",
}

REQUIRE = {"muskoka": r"(?i)muskoka", "manila": r"(?i)(cathedral|fort santiago|intramuros)", "algonquin": r"(?i)algonquin.*(lake|park|canoe)", "cebu": r"(?i)(magellan|basilica|cebu city|cross)",
  "distillery-district": r"(?i)distillery", "casa-loma": r"(?i)casa.?loma(?!.*(skyline|from))", "high-park-cherry-blossoms": r"(?i)high.?park",
  "blue-mountain": r"(?i)blue.?mountain", "sandbanks": r"(?i)sandbanks", "little-manila": r"(?i)(manila|bathurst)"}
EXCLUDE = r"(?i)(muskoka lake on\.jpg|aerial|taxi|cockfight|condo|argia|insect|dragonfly|map|logo)"

def ok_licence(lic: str) -> str | None:
    l = lic.strip().lower()
    if l in ("public domain", "pd") or l.startswith("pd-") or "cc0" in l: return "Public domain"
    if l.startswith("cc by-sa"): return lic.strip().upper().replace("CC BY-SA", "CC BY-SA")
    if l.startswith("cc by ") or l == "cc by": return lic.strip()
    return None

def strip(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()

PINNED = {"casa-loma": "File:Flickr - paul bica - casa loma.jpg",
          "muskoka": "File:Muskoka Chairs - Port Carling - Canada (5159311050).jpg"}

def search(q, slug=None):
    if slug in PINNED:
        p = urllib.parse.urlencode({"action":"query","titles":PINNED[slug],"prop":"imageinfo","iiprop":"url|extmetadata|mime|size","iiurlwidth":1600,"format":"json"})
        with urllib.request.urlopen(urllib.request.Request(f"https://commons.wikimedia.org/w/api.php?{p}", headers=UA), timeout=30) as r:
            return list(json.load(r)["query"]["pages"].values())
    p = urllib.parse.urlencode({"action":"query","generator":"search","gsrsearch":f"{q} filetype:bitmap","gsrnamespace":6,
        "gsrlimit":15,"prop":"imageinfo","iiprop":"url|extmetadata|mime|size","iiurlwidth":1600,"format":"json"})
    with urllib.request.urlopen(urllib.request.Request(f"https://commons.wikimedia.org/w/api.php?{p}", headers=UA), timeout=30) as r:
        pages = json.load(r).get("query", {}).get("pages", {})
    return sorted(pages.values(), key=lambda x: x.get("index", 99))

CRED = Path("content/travel-credits.json")
prev = {c["slug"]: c for c in json.loads(CRED.read_text())["credits"]} if CRED.exists() else {}
credits, missing = [], []
for slug, q in QUERIES.items():
    if slug in prev and (OUT / f"{slug}.webp").exists():
        credits.append(prev[slug]); continue
    pick = None
    for page in search(q, slug):
        info = (page.get("imageinfo") or [{}])[0]
        if slug not in PINNED and re.search(EXCLUDE, page["title"]) or (slug not in PINNED and slug in REQUIRE and not re.search(REQUIRE[slug], page["title"])): continue
        if info.get("mime") != "image/jpeg" or info.get("width", 0) < 1000: continue
        m = info.get("extmetadata") or {}
        lic = ok_licence((m.get("LicenseShortName") or {}).get("value", ""))
        if not lic: continue
        author = strip((m.get("Artist") or {}).get("value", "")) or "Unknown"
        pick = {"slug": slug, "title": page["title"].removeprefix("File:"), "source": info["descriptionurl"],
                "image": info.get("thumburl") or info["url"], "author": author[:160], "licence": lic,
                "licenceUrl": (m.get("LicenseUrl") or {}).get("value", ""),
                "attributionRequired": lic != "Public domain", "provider": "Wikimedia Commons"}
        break
    if not pick:
        missing.append(slug); print("MISS", slug); continue
    raw = OUT / f"{slug}.jpg"
    with urllib.request.urlopen(urllib.request.Request(pick["image"], headers=UA), timeout=60) as r: raw.write_bytes(r.read())
    subprocess.run(["node", "-e", f"require('sharp')('{raw}').resize({{width:1200,withoutEnlargement:true}}).webp({{quality:78}}).toFile('{OUT}/{slug}.webp').then(()=>0)"], check=True)
    raw.unlink()
    pick["file"] = f"/travel/{slug}.webp"; del pick["image"]
    credits.append(pick); print("OK", slug, pick["licence"], "|", pick["title"][:70])

Path("content/travel-credits.json").write_text(json.dumps({"note": "Photo credits for /travel. Real photos only; source, author, licence per file.", "credits": credits, "noPhoto": missing}, indent=2, ensure_ascii=False) + "\n")
print("TOTAL", len(credits), "MISSING", missing)
