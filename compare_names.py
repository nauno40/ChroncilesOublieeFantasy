import re
import json

md_path = "/home/nauno/project/ChroniquesOubliées/Ressources/Chroniques Oubliées/Version 2/monstres_formate.md"
json_path = "/home/nauno/project/ChroniquesOubliées/backend/data/creatures_v2.json"

with open(md_path, 'r', encoding='utf-8') as f:
    md_content = f.read()

md_names = re.findall(r'^(?:###+|####+)\s+(.*?)\s+\(NC', md_content, re.MULTILINE)

with open(json_path, 'r', encoding='utf-8') as f:
    json_creatures = json.load(f)

json_names = [c['name'] for c in json_creatures]

print(f"MD Names count: {len(md_names)}")
print(f"JSON Names count: {len(json_names)}")

missing = [name for name in md_names if name not in json_names]
if missing:
    print("Missing in JSON:")
    for m in missing:
        print(f"- {m}")
else:
    print("No missing names found (but check duplicates or format mismatches).")

extra = [name for name in json_names if name not in md_names]
if extra:
    print("Extra in JSON (check parsing):")
    for e in extra:
        print(f"+ {e}")
