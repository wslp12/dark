import os
import re

csv_path = r"C:\Program Files (x86)\Steam\steamapps\common\Darkest Dungeon® II\Darkest Dungeon II_Data\StreamingAssets\Excel\hero_hel_data_export.Group.csv"
effect_manager_path = r"c:\Users\rusip\Documents\dark\js\managers\EffectManager.js"

# Read EffectManager to get existing map
with open(effect_manager_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Simple regex to get keys from effectNameMap
effect_name_map = {}
match = re.search(r'static effectNameMap = \{(.*?)\};', js_content, re.DOTALL)
if match:
    map_content = match.group(1)
    for kv in re.finditer(r"'([^']+)':\s*'([^']+)'", map_content):
        effect_name_map[kv.group(1)] = kv.group(2)

# Extract effects from CSV for Hellion Berserker (_p2)
p2_effects = set()
with open(csv_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

capturing = False
current_skill = ""
for line in lines:
    parts = line.strip().split(',')
    if not parts: continue
    
    if parts[0] == 'element_start':
        if '_p2' in parts[1] and 'hel_' in parts[1]:
            capturing = True
            current_skill = parts[1]
        else:
            capturing = False
    elif parts[0] == 'element_end':
        capturing = False
    elif capturing:
        # Check for effect/buff/token_ignore/condition fields
        if parts[0].endswith('_effects') or parts[0].endswith('_buffs') or parts[0] in ['token_ignores', 'm_AllConditionIds', 'm_RequirementIds']:
            for eff in parts[1:]:
                if eff and not eff.isdigit():
                    p2_effects.add(eff)

print(f"Total Unique Effects found in CSV for hel_..._p2: {len(p2_effects)}")
print("\n--- Missing from effectNameMap ---")
for eff in sorted(p2_effects):
    if eff not in effect_name_map:
        print(f"'{eff}'")

print("\n--- Current effectNameMap for reference ---")
# print(effect_name_map)
