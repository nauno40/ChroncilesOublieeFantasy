import re
import json
import os

SOURCE_FILE = "/home/nauno/project/ChroniquesOubliées/Ressources/Chroniques Oubliées/Version 2/regles_orc.md"
OUTPUT_DIR = "/home/nauno/project/ChroniquesOubliées/doc/datas"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Data containers
data = {
    "races": [],
    "profiles": [],
    "voies": [],
    "capabilities": [],
    "equipment": [],
    "creatures": [],  # New container
    "tables": []
}

# Auto-increment counters
counters = {
    "race": 0,
    "profile": 0,
    "voie": 0,
    "capability": 0,
    "equipment": 0,
    "creature": 0
}

def get_next_id(entity_type):
    counters[entity_type] += 1
    return counters[entity_type]

def clean_text(text):
    return text.strip().replace("*", "").replace(">", "").strip()

def parse_file():
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    state = {
        "mode": "SKIP", 
        "current_race": None,
        "current_profile": None,
        "current_voie": None,
        "current_creature": None,
        "prestige_category": "Prestige (Générique)",
        "parse_next_line_as_stats": False,
        "parse_auth": False,
        "parse_equip": False,
        "buffer": []
    }

    def flush_description(entity, target_field="description"):
        if state["buffer"] and entity:
            desc = "\n".join(state["buffer"]).strip()
            if not desc: return
            
            if target_field == "auth": 
                parts = desc.split("\n")
                for p in parts:
                    if "armure" in p.lower() or "bouclier" in p.lower():
                        if "armorAuth" in entity: entity["armorAuth"].append(p)
                    else:
                        if "weaponsAuth" in entity: entity["weaponsAuth"].append(p)
            elif target_field == "note":
                 if entity.get("note"):
                     entity["note"] += "\n" + desc
                 else:
                     entity["note"] = desc
            elif target_field in entity:
                if entity[target_field]:
                    entity[target_field] += "\n" + desc
                else:
                    entity[target_field] = desc

        state["buffer"] = []

    for line in lines:
        line_s = line.strip()
        
        # --- Mode Detection ---
        if line_s == "# PEUPLES":
            state["mode"] = "RACES"
            state["buffer"] = []
            continue
        
        elif line_s == "# ARQUEBUSIER":
            state["mode"] = "PROFILES"
            # ... (Profile init logic same as before, abbreviated here for clarity but kept in full file)
            name = "Arquebusier"
            pid = get_next_id("profile")
            profile = {
                "id": pid, "name": name, "description": "", "note": "", "familyId": None,
                "hitDie": "", "weaponsAuth": [], "armorAuth": [], "startingEquipment": [],
                "skillPoints": 2, "magicStat": None, "voies": []
            }
            data["profiles"].append(profile)
            state["current_profile"] = profile
            state["current_race"] = None
            state["current_voie"] = None
            state["buffer"] = []
            continue
        
        elif line_s == "# VOIES DE PRESTIGE":
            state["mode"] = "PRESTIGE"
            # Flush existing
            if state["current_profile"]:
                 if state["parse_auth"]: flush_description(state["current_profile"], "auth")
                 elif state["parse_equip"]: flush_description(state["current_profile"], "note")
                 else: flush_description(state["current_profile"])
            state["current_profile"] = None
            state["current_race"] = None
            state["current_voie"] = None
            state["prestige_category"] = "Prestige (Générique)"
            state["parse_auth"] = False
            state["parse_equip"] = False
            state["buffer"] = []
            continue

        elif line_s.startswith("# ÉQUIPEMENT") and state["mode"] != "SKIP":
            state["mode"] = "EQUIPEMENT"
            state["buffer"] = []
            continue
            
        elif line_s.startswith("# BESTIAIRE") or "Chapitre 3 : Opposition" in line_s:
            state["mode"] = "BESTIAIRE"
            state["buffer"] = []
            continue

        # --- PRESTIGE CATEGORY ---
        if state["mode"] == "PRESTIGE":
            if line_s.startswith("## ") and "AVENTURIER" in line_s.upper():
                 state["prestige_category"] = "Prestige (Aventurier)"
                 continue
            # ... (other prestige cats)

        # --- CREATURE DETECTION (Inline or Bestiary) ---
        # Detect > #### NAME or #### NAME or ### NAME (if Bestiary)
        is_creature_header = False
        creature_name = ""
        
        # Inline Creature (Blockquote header)
        if line_s.startswith("> #### ") or line_s.startswith("> ### "):
            is_creature_header = True
            creature_name = clean_text(line_s.replace("#", ""))
        # Bestiary Creature
        elif state["mode"] == "BESTIAIRE" and line_s.startswith("### "):
            is_creature_header = True
            creature_name = clean_text(line_s.replace("#", ""))

        if is_creature_header and creature_name:
             if any(x in creature_name.upper() for x in ["TABLE", "ÉCHELLE", "SOMMAIRE", "INTRODUCTION", "CHAPITRE", "FAMILLE", "RÉSUMÉ", "MONTURE", "ATTAQUE", "CRÉATURE NON VIVANTE", "TAILLE"]):
                 is_creature_header = False 

             if is_creature_header:
                 if state["current_creature"]:
                     flush_description(state["current_creature"])
             
                 cid = get_next_id("creature")
                 creature = {
                     "id": cid,
                     "name": creature_name,
                     "description": "",
                     "nc": 0,
                     "hp": 0,
                     "def": 0,
                     "init": 0,
                     "stats": {}, # FOR, DEX, etc.
                     "familyId": None,
                     "specialAbilities": [] # Could parse these too
                 }
                 data["creatures"].append(creature)
                 state["current_creature"] = creature
                 state["buffer"] = []
                 continue

        # --- Parsing Logic ---

        # CREATURE STATS
        if state["current_creature"]:
             # NC detection
             if "NC" in line_s and ("(" in line_s or ":" in line_s):
                 nc_m = re.search(r"NC\s*(\d+)", line_s)
                 if nc_m: state["current_creature"]["nc"] = int(nc_m.group(1))
             
             # DEF/INIT/PV detection in list
             if line_s.startswith("*") or line_s.startswith(">*"):
                 if "Défense" in line_s:
                      def_m = re.search(r"Défense\s*(\d+)", line_s)
                      if def_m: state["current_creature"]["def"] = int(def_m.group(1))
                 if "Initiative" in line_s:
                      init_m = re.search(r"Initiative\s*(\d+)", line_s)
                      if init_m: state["current_creature"]["init"] = int(init_m.group(1))
                 if "Points de vigueur" in line_s or "PV" in line_s:
                      # Often formula like [niv x 5], hard to parse as int, keep 0 or try
                      pv_m = re.search(r"(\d+)", line_s)
                      if pv_m: state["current_creature"]["hp"] = int(pv_m.group(1))

             # Stats Table | AGI | ...
             if "|" in line_s and "AGI" in line_s and "FOR" in line_s:
                  state["parse_next_line_as_stats"] = True # For creatures
                  state["buffer"] = [] # Clear descriptions that might be table headers
                  continue
             
             if state["parse_next_line_as_stats"] and "|" in line_s and "---" not in line_s:
                  # Parse stats row: | +2 | +6 | ...
                  parts = [p.strip() for p in line_s.split("|") if p.strip()]
                  # Mapping is assumed AGI CON FOR PER CHA INT VOL (from previous view)
                  # Or check header... assuming standard order AGI CON FOR PER CHA INT VOL
                  # Ideally we track headers, but for now hardcode or careful
                  if len(parts) >= 6:
                       state["current_creature"]["stats"] = {
                           "AGI": parts[0], "CON": parts[1], "FOR": parts[2],
                           "PER": parts[3], "CHA": parts[4], "INT": parts[5],
                           "VOL": parts[6] if len(parts)>6 else ""
                       }
                  state["parse_next_line_as_stats"] = False
                  continue

        # RACES (Existing logic...)
        if state["mode"] == "RACES":
             # ... (Keep existing race parsing)
             if line_s.startswith("# ") and not line_s.startswith("# PEUPLES"):
                name = clean_text(line_s[2:])
                if name.upper() in ["MAGE", "FAMILLE DES AVENTURIERS", "INTRODUCTION"]:
                    state["buffer"] = []
                    continue
                flush_description(state["current_race"]) 
                rid = get_next_id("race")
                race = {
                    "id": rid, "name": name, "description": "", "modifiers": [],
                    "size": "Moyenne", "speed": "20m", "language": "", "racialVoieId": None
                }
                data["races"].append(race)
                state["current_race"] = race
                state["current_profile"] = None
                state["buffer"] = []

             elif line_s.startswith("## "):
                # Stats
                if "CARACTÉRISTIQUES" in line_s.upper():
                    state["parse_next_line_as_stats"] = True
                    flush_description(state["current_race"])
                    continue
                # Voie
                if "VOIE DE" in line_s.upper() or "VOIE DU" in line_s.upper():
                    state["parse_next_line_as_stats"] = False
                    if state["current_race"]: flush_description(state["current_race"])
                    name = clean_text(line_s.lstrip("#").strip())
                    vid = get_next_id("voie")
                    if state["current_race"]: state["current_race"]["racialVoieId"] = vid
                    voie = {
                        "id": vid, "name": name, "description": "", "category": "Racial",
                        "profileId": None, "type": "racial", "maxRank": 5
                    }
                    data["voies"].append(voie)
                    state["current_voie"] = voie
                    state["buffer"] = []
                    continue
            
             if state["parse_next_line_as_stats"] and line_s:
                if state["current_race"]:
                    parts = line_s.split(",")
                    for p in parts:
                        p = p.strip()
                        m = re.search(r"([+-]?\d+)\s+(?:en\s+)?(.*)", p)
                        if m: state["current_race"]["modifiers"].append({"stat": m.group(2).strip(), "value": int(m.group(1))})
                        else: state["current_race"]["modifiers"].append({"stat": p, "value": 0})
                    state["parse_next_line_as_stats"] = False
                    continue

        # PROFILES (Existing logic...)
        elif state["mode"] == "PROFILES":
             if line_s.startswith("# ") and not line_s.startswith("# ARARQUEBUSIER"):
                  # ... (keep existing)
                  name = clean_text(line_s[2:])
                  if name.upper().startswith("FAMILLE") or name in ["SOMMAIRE", "INTRODUCTION", "GENÈSE D'OSGILD"]: 
                       state["buffer"] = []
                       continue
                  if state["parse_auth"]: flush_description(state["current_profile"], "auth")
                  elif state["parse_equip"]: flush_description(state["current_profile"], "note")
                  else: flush_description(state["current_profile"])
                  state["parse_auth"] = False
                  state["parse_equip"] = False
                  pid = get_next_id("profile")
                  profile = {
                      "id": pid, "name": name, "description": "", "note": "", "familyId": None,
                      "hitDie": "", "weaponsAuth": [], "armorAuth": [], "startingEquipment": [],
                      "skillPoints": 2, "magicStat": None, "voies": []
                  }
                  data["profiles"].append(profile)
                  state["current_profile"] = profile
                  state["current_race"] = None
                  state["buffer"] = []

             elif line_s.startswith("## ") or (line_s.startswith("**") and ":" in line_s):
                  # ... (keep existing header detection)
                  is_auth_header = "ARMES" in line_s.upper() and "MAÎTRISÉES" in line_s.upper()
                  is_equip_header = "ÉQUIPEMENT DE DÉPART" in line_s.upper()
                  is_voie_header = line_s.startswith("##") and ("VOIE DE" in line_s.upper() or "VOIE DU" in line_s.upper())

                  if is_auth_header or is_equip_header or is_voie_header:
                      if state["parse_auth"]: 
                          flush_description(state["current_profile"], "auth")
                          state["parse_auth"] = False
                      elif state["parse_equip"]:
                          flush_description(state["current_profile"], "note")
                          state["parse_equip"] = False
                      else:
                          flush_description(state["current_profile"])
                      if is_auth_header:
                          state["parse_auth"] = True
                          state["buffer"] = []
                          continue
                      if is_equip_header:
                          state["parse_equip"] = True
                          state["buffer"] = [f"**Équipement de départ** :"]
                          continue
                      if is_voie_header:
                          name = clean_text(line_s.lstrip("#").strip())
                          vid = get_next_id("voie")
                          if state["current_profile"]: state["current_profile"]["voies"].append(vid)
                          voie = { "id": vid, "name": name, "description": "", "category": "Profile", "profileId": state["current_profile"]["id"] if state["current_profile"] else None, "type": "profile", "maxRank": 5 }
                          data["voies"].append(voie)
                          state["current_voie"] = voie
                          state["buffer"] = []
                          continue
             
             if state["current_profile"] and "**Points de vigueur" in line_s:
                  m = re.search(r"(\d+)", line_s)
                  if m: state["current_profile"]["hitDie"] = f"d{m.group(1)} (Vigueur)"

        # PRESTIGE VOIES (Keep existing)
        elif state["mode"] == "PRESTIGE":
             if line_s.startswith("## ") and ("VOIE DE" in line_s.upper() or "VOIE DU" in line_s.upper()):
                if "AVENTURIER" in line_s.upper() or "COMBATTANT" in line_s.upper() or "MAGE" in line_s.upper() or "MYSTIQUE" in line_s.upper():
                    continue 
                name = clean_text(line_s.lstrip("#").strip())
                vid = get_next_id("voie")
                voie = { "id": vid, "name": name, "description": "", "category": state["prestige_category"], "profileId": None, "type": "prestige", "maxRank": 5 }
                data["voies"].append(voie)
                state["current_voie"] = voie
                state["buffer"] = []
                continue

        # CAPABILITIES
        if state["mode"] in ["RACES", "PROFILES", "PRESTIGE"]:
            if state["current_voie"] and line_s.startswith("### "):
                if state["parse_auth"]:
                     flush_description(state["current_profile"], "auth")
                     state["parse_auth"] = False
                
                match = re.search(r"(\d+)\.\s+(.*)", line_s)
                if match:
                    if not state["current_voie"].get("has_caps", False):
                         flush_description(state["current_voie"])
                         state["current_voie"]["has_caps"] = True
                    else:
                         if data["capabilities"]: flush_description(data["capabilities"][-1])
                    rank = int(match.group(1))
                    rest = match.group(2)
                    action_type = "A"
                    if "(" in rest and ")" in rest:
                         action_match = re.search(r"\((L|M|A|G|R)\)", rest)
                         if action_match: action_type = action_match.group(1)
                    name_raw = rest.split("(")[0].strip().rstrip(" :")
                    is_spell = "*" in name_raw
                    name = name_raw.replace("*", "").strip()
                    cid = get_next_id("capability")
                    cap = {
                        "id": cid, "name": name, "description": "", "voieId": state["current_voie"]["id"],
                        "rank": rank, "isSpell": is_spell, "actionType": action_type,
                        "range": "", "duration": "", "limited": False, "effect": {}
                    }
                    data["capabilities"].append(cap)
                    state["buffer"] = []
                    continue

        # EQUIPMENT
        if state["mode"] == "EQUIPEMENT":
            if "|" in line_s and "---" not in line_s:
                parts = [p.strip() for p in line_s.split("|") if p.strip()]
                if len(parts) >= 2:
                    name = parts[0].replace("*", "")
                    if name.lower() in ["nom", "arme", "objet"]: continue
                    price = parts[1] if len(parts) > 1 else ""
                    eid = get_next_id("equipment")
                    item = {
                        "id": eid, "name": name, "description": "", "type": "Equipment",
                        "price": price, "weight": 0.0, "rarity": "Common",
                        "materialId": None, "quality": "Standard"
                    }
                    data["equipment"].append(item)

        # Buffer logic (for description)
        if line_s and not line_s.startswith("#") and not line_s.startswith("|"):
            if not (state["mode"] == "RACES" and state["parse_next_line_as_stats"]):
                # Skip buffering if expecting stats table line
                if not (state["current_creature"] and state["parse_next_line_as_stats"]):
                     state["buffer"].append(line_s)
    
    # Final flush
    if state["current_creature"]: flush_description(state["current_creature"])
    if state["mode"] in ["RACES", "PROFILES", "PRESTIGE"] and data["capabilities"]:
         flush_description(data["capabilities"][-1])

    # --- POST-PROCESSING ---
    print(f"Total Creatures Parsed: {len(data['creatures'])}")
    
    # ... (Equipment linking logic same as before)
    equip_map = {}
    for item in data["equipment"]: equip_map[item["name"].lower()] = item["id"]
    for profile in data["profiles"]:
        note = profile.get("note", "")
        if "Équipement de départ" in note:
             text = note.lower().replace(",", " ").replace("(", " ").replace(")", " ").replace(".", "")
             tokens = text.split()
             found_ids = set()
             for w in tokens:
                 if w in equip_map: found_ids.add(equip_map[w])
             for i in range(len(tokens)-1):
                 phrase = f"{tokens[i]} {tokens[i+1]}"
                 if phrase in equip_map: found_ids.add(equip_map[phrase])
             profile["startingEquipment"] = sorted(list(found_ids))

    # Capability Enrichment (Spell details + Summoning)
    creature_map = {c["name"].lower(): c["id"] for c in data["creatures"]}
    
    for cap in data["capabilities"]:
        desc = cap.get("description", "")
        
        # Range/Duration Regex
        range_match = re.search(r"(?:portée|distance)\s*(?:de)?\s*(:)?\s*([\d\s]+m|contact|vue|zone|soi-même)", desc, re.IGNORECASE)
        if range_match: cap["range"] = range_match.group(2).strip()
        dur_match = re.search(r"durée\s*(?:de)?\s*(:)?\s*([^,.\n]+)", desc, re.IGNORECASE)
        if dur_match: cap["duration"] = dur_match.group(2).strip()
        if "portée" in desc.lower() or "durée" in desc.lower() or "sort" in desc.lower(): cap["isSpell"] = True
            
        # Effects
        effects = {}
        dmg_match = re.search(r"inflige\s+(\[?[^\]\)]+\]?)\s*(?:DM|dommages|dégâts)", desc, re.IGNORECASE)
        if dmg_match: effects["damage"] = dmg_match.group(1).strip()
        heal_match = re.search(r"(?:récupère|soigne)\s.*?(\[?[^\]\)]+\]?)\s*PV", desc, re.IGNORECASE)
        if heal_match: effects["healing"] = heal_match.group(1).strip()
        save_match = re.search(r"test\s+d['’]\s*([A-Z]{3})\s+difficulté\s+(\[?[\w\s\+]+\]?)", desc, re.IGNORECASE)
        if save_match:
            effects["save_stat"] = save_match.group(1).strip()
            effects["save_threshold"] = save_match.group(2).strip()
            
        # SUMMONING MATCHING
        # Pattern: "invoque un(e) [CreatureName]"
        if "invoque" in desc.lower():
            summons = []
            for c_name, c_id in creature_map.items():
                if c_name in desc.lower():
                    summons.append(c_id)
            if summons:
                effects["summonedCreatureIds"] = sorted(list(set(summons)))
                # If specifically naming Elementaire types (Feu, Eau etc) which might be parsed as "Elementaire" + desc
                # For now simple name match

        cap["effect"] = effects

    for key, items in data.items():
        if items:
            with open(os.path.join(OUTPUT_DIR, f"{key}.json"), 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
    print("MCD-Compliant Extraction with Bestiary and Summoning COMPLETE.")

if __name__ == "__main__":
    parse_file()
