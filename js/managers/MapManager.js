const CsvParser = require('../utils/CsvParser');
const fs = require('fs');
const path = require('path');

class MapManager {
    constructor() {
        this.basePath = "";
        this.rulesFile = "run_levels_data_export.Group.csv";
        this.nodeKeys = {
            'StoryHero': '희망의 성소 (Shrine)',
            'Hospital': '야전 병원 (Hospital)',
            'Store': '골동품상 (Hoarder)',
            'Oasis': '오아시스 (Oasis)',
            'Cache': '보급품 (Cache)',
            'CreatureDen': '야수 소굴 (Creature Den)',
            'StoryCosmic': '학문적 견해 (Academic Study)',
            'StoryCultist': '이단자 숙소 (Cultist Encampment)',
            'StoryAssist': '난민 (Assistance Encounter)',
            'StoryResist': '전투 (Resistance Encounter)'
        };
    }

    setPath(basePath) { this.basePath = basePath; }

    loadData() {
        if (!this.basePath) return;
        const filePath = path.join(this.basePath, this.rulesFile);
        if (!fs.existsSync(filePath)) return;

        const lines = CsvParser.readCSVLines(filePath);
        const data = {};
        for (const key of Object.keys(this.nodeKeys)) data[key] = 0; // Default multiplier

        let currentId = null;
        let currentType = null;
        
        for (const line of lines) {
            const parts = line.split(',').map(p => p.trim());
            if (parts[0] === 'element_start') {
               currentId = parts[1];
               currentType = parts[2];
            } else if (parts[0] === 'element_end') {
               currentId = null;
               currentType = null;
            } else if (currentId === 'base' && currentType === 'RunDataStats' && parts[0] === 'sub_stat' && parts[1] === 'map_generation_node_spawn_multiplier') {
                if (this.nodeKeys[parts[2]]) data[parts[2]] = parseFloat(parts[3]);
            }
        }

        this.renderUI(data);
    }

    saveData(newData) {
        const filePath = path.join(this.basePath, this.rulesFile);
        if (!fs.existsSync(filePath)) return;
        
        const lines = CsvParser.readCSVLines(filePath);
        
        let newLines = [];
        let insideBaseRunDataStats = false;
        let processedKeys = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) { newLines.push(lines[i]); continue; }
            const parts = line.split(',');
            
            if (parts[0] === 'element_start' && parts[1] === 'base' && parts[2] === 'RunDataStats') {
                insideBaseRunDataStats = true;
                newLines.push(lines[i]);
            } else if (insideBaseRunDataStats && parts[0] === 'element_end') {
                // Add any missing keys before closing the block
                for (const [key, val] of Object.entries(newData)) {
                    if (!processedKeys.has(key) && parseFloat(val) !== 0) {
                        newLines.push(`sub_stat,map_generation_node_spawn_multiplier,${key},${val},`);
                    }
                }
                insideBaseRunDataStats = false;
                newLines.push(lines[i]);
            } else if (insideBaseRunDataStats && parts[0] === 'sub_stat' && parts[1] === 'map_generation_node_spawn_multiplier') {
                const nodeKey = parts[2];
                if (newData[nodeKey] !== undefined) {
                    if (parseFloat(newData[nodeKey]) !== 0) {
                        newLines.push(`sub_stat,map_generation_node_spawn_multiplier,${nodeKey},${newData[nodeKey]},`);
                    }
                    processedKeys.add(nodeKey);
                } else {
                    newLines.push(lines[i]);
                }
            } else {
                newLines.push(lines[i]);
            }
        }

        CsvParser.saveCSVLines(filePath, newLines);
        alert("맵 생성 규칙이 성공적으로 저장되었습니다.");
        this.loadData();
    }

    renderUI(data) {
        const container = document.getElementById('map-grid');
        if (!container) return;

        let html = `
            <div style="background: var(--surface-color); border: 1px solid var(--primary-color); padding: 30px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 900px; margin: 0 auto;">
                <h3 style="font-family: 'Cinzel', serif; color: var(--primary-color); margin-top: 0; border-bottom: 2px solid var(--primary-color); padding-bottom: 15px; margin-bottom: 25px;">
                   🗺️ 맵 노드(성소, 병원 등) 생성 규칙
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        `;

        // Sort keys to put Shrine at the top
        const keys = Object.keys(this.nodeKeys).sort((a,b) => (a === 'StoryHero' ? -1 : (b === 'StoryHero' ? 1 : 0)));

        for (const key of keys) {
            const label = this.nodeKeys[key];
            const val = data[key] || 0;
            const isShrine = key === 'StoryHero';
            html += `
                <div style="background: #111; padding: 20px; border-radius: 6px; border-left: 4px solid ${isShrine ? '#ffcc00' : '#444'};">
                    <label style="display: block; color: #fff; font-weight: bold; margin-bottom: 10px; font-size: 1rem;">
                        ${isShrine ? '🌟 ' : ''}${label}
                    </label>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="number" step="0.1" class="map-input" data-key="${key}" value="${val}" 
                            style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 1.1rem; text-align: center;" />
                        <span style="color: #666; font-size: 0.9rem;">추가 가중치</span>
                    </div>
                </div>
            `;
        }

        html += `
                </div>

                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; border-top: 1px solid #333; margin-bottom: 25px;">
                    <p style="margin: 0; color: #888; font-size: 0.85rem; line-height: 1.5;">
                        * <b>가중치(Weight)</b>: 기본 생성 확률에 더해지는 수치입니다.<br>
                        * <b>2.0 이상</b>으로 설정 시 아주 높은 확률로 맵에 등장하게 됩니다.<br>
                        * 성소(Shrine) 스킬 개방이 필요하다면 성소 가중치를 높여보세요.
                    </p>
                </div>

                <button id="save-map-btn" 
                    style="width: 100%; padding: 15px; background: var(--primary-color); color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1.1rem; transition: background 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                    맵 생성 규칙 저장하기
                </button>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('save-map-btn').onclick = () => {
            const inputs = document.querySelectorAll('.map-input');
            const newData = {};
            inputs.forEach(input => {
                newData[input.dataset.key] = input.value;
            });
            this.saveData(newData);
        };
    }
}

module.exports = MapManager;
