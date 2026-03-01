import re
import json
import os

def parse_monstres(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by headings that look like creatures
    creature_blocks = re.split(r'\n(?=###|####)', content)
    
    creatures = []
    creature_id = 1000
    
    for block in creature_blocks:
        # Check if it's a creature block (has NC)
        nc_match = re.search(r'^(#+)\s+(.*?)\s+\(NC\s+(.*?)\)', block, re.MULTILINE)
        if not nc_match:
            continue
            
        name = nc_match.group(2).strip()
        nc_raw = nc_match.group(3).strip()
        
        # Clean NC
        nc = nc_raw
        if '/' in nc_raw:
            try:
                parts = nc_raw.split('/')
                nc = float(parts[0]) / float(parts[1])
            except:
                nc = 0
        elif '(' in nc_raw:
             nc = nc_raw.split('(')[0].strip()
             try:
                 nc = float(nc)
             except:
                 nc = 0
        else:
            try:
                nc = float(nc)
            except:
                nc = 0

        # Description
        desc_start = nc_match.end()
        stats_match = re.search(r'\|\s+AGI\s+\|', block)
        if stats_match:
            description = block[desc_start:stats_match.start()].strip()
        else:
            list_match = re.search(r'^\s*\*\s+', block, re.MULTILINE)
            if list_match:
                description = block[desc_start:list_match.start()].strip()
            else:
                description = block[desc_start:].strip()

        # Extra metadata from description or content
        category = "Vivant"
        size = "Moyen"
        environment = "Spécial"
        archetype = "Standard"
        
        # Tags like *CRÉATURE HUMANOÏDE*, *TAILLE GRANDE*
        tags = re.findall(r'\*(.*?)\*', block)
        for tag in tags:
            tag = tag.strip().upper()
            if "CRÉATURE" in tag:
                category = tag.replace("CRÉATURE", "").strip().title()
                description = description.replace(f"*{tag}*", "").strip()
            elif "TAILLE" in tag:
                size = tag.replace("TAILLE", "").strip().title()
                description = description.replace(f"*{tag}*", "").strip()

        # Clean description
        description = re.sub(r'^\s*[\*\-]\s*', '', description, flags=re.MULTILINE)
        description = re.sub(r'\n+', '\n', description).strip()

        # Stats Table
        stats = {"FOR": 0, "DEX": 0, "CON": 0, "INT": 0, "SAG": 0, "CHA": 0}
        if stats_match:
            lines = block[stats_match.start():].split('\n')
            if len(lines) >= 3:
                values = re.findall(r'\|\s*([+-]?\d+\*?)\s*', lines[2])
                if len(values) >= 6:
                    def clean_stat(s):
                        return int(s.replace('*', ''))
                    
                    # Order in MD: AGI, CON, FOR, PER, CHA, INT, VOL
                    stats["DEX"] = clean_stat(values[0])
                    stats["CON"] = clean_stat(values[1])
                    stats["FOR"] = clean_stat(values[2])
                    stats["SAG"] = clean_stat(values[3])
                    stats["CHA"] = clean_stat(values[4])
                    stats["INT"] = clean_stat(values[5])

        # Secondary Stats
        def_match = re.search(r'\*\s+\*\*Défense\s*:\s*\*\*\s*(\d+)', block, re.IGNORECASE)
        hp_match = re.search(r'\*\s+\*\*Points de vigueur\s*:\s*\*\*\s*(\d+)', block, re.IGNORECASE)
        init_match = re.search(r'\*\s+\*\*Initiative\s*:\s*\*\*\s*(\d+)', block, re.IGNORECASE)
        
        defense = int(def_match.group(1)) if def_match else 10
        hp = int(hp_match.group(1)) if hp_match else 10
        init = int(init_match.group(1)) if init_match else 10

        # Attacks
        attacks = []
        attacks_match = re.search(r'\*\s+\*\*Attaques\s*:\s*\*\*\s*\n(.*?)(?=\n\*|$)', block, re.DOTALL | re.IGNORECASE)
        if attacks_match:
            atk_section = attacks_match.group(1)
            atk_lines = re.findall(r'^\s*[\*\-]\s*\*\*(.*?)\*\*.*?\s*([+-]\d+).*?DM\s+(.*?)$', atk_section, re.MULTILINE)
            for atk_name, atk_test, atk_dm in atk_lines:
                clean_name = atk_name.strip().rstrip(' :')
                reach = None
                reach_match = re.search(r'\((\d+)\s*m\)', clean_name)
                if reach_match:
                    reach = reach_match.group(1)
                    clean_name = re.sub(r'\s*\(\d+\s*m\)', '', clean_name).strip()
                
                attacks.append({
                    "name": clean_name,
                    "test": atk_test.strip(),
                    "dm": atk_dm.strip(),
                    "special": None,
                    "reach": reach
                })

        # Special Abilities
        special_abilities_text = ""
        caps_match = re.search(r'\*\s+\*\*Capacités\s*:\s*\*\*\s*\n(.*?)(?=\n---|\n#|$)', block, re.DOTALL | re.IGNORECASE)
        if caps_match:
            special_abilities_text = caps_match.group(1).strip()
            # Basic Markdown to HTML conversion for the text field
            special_abilities_text = special_abilities_text.replace('\n', '<br>')
            special_abilities_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', special_abilities_text)

        creature = {
            "id": creature_id,
            "name": name,
            "description": description,
            "nc": nc,
            "hp": hp,
            "def": defense,
            "init": init,
            "stats": stats,
            "category": category,
            "environment": environment,
            "archetype": archetype,
            "size": size,
            "specialAbilities": {"text": special_abilities_text},
            "attacks": attacks,
            "capabilities": [],
            "familyId": None
        }
        creatures.append(creature)
        creature_id += 1
        
    return creatures

if __name__ == "__main__":
    filepath = "/home/nauno/project/ChroniquesOubliées/Ressources/Chroniques Oubliées/Version 2/monstres_formate.md"
    output_path = "/home/nauno/project/ChroniquesOubliées/backend/data/creatures_v2.json"
    
    creatures = parse_monstres(filepath)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(creatures, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully extracted {len(creatures)} creatures to {output_path}")
