const CsvParser = require('../utils/CsvParser');
const fs = require('fs');
const path = require('path');

class RelationshipManager {
    constructor() {
        this.basePath = "";
        this.rulesFile = "story_rules_data_export.Group.csv";
        this.effectsFile = "effect_data_export.Group.csv";
        this.overstressFile = "overstress_data_export.Group.csv";
        this.currenciesFile = "loot_data_export_CURRENCIES.Group.csv";

        // Target effect IDs used by the game's story rules
        this.ruleEffectIds = {
            harmonious: "affinity_1_100pct_nocrit",
            disharmonious: "affinity_neg2_100pct_nocrit"
        };
    }

    setPath(basePath) {
        this.basePath = basePath;
    }

    loadData() {
        if (!this.basePath) return;

        const rulesPath = path.join(this.basePath, this.rulesFile);
        const effectsPath = path.join(this.basePath, this.effectsFile);
        const overstressPath = path.join(this.basePath, this.overstressFile);

        if (!fs.existsSync(rulesPath) || !fs.existsSync(effectsPath)) {
            console.error("Rules or Effects file not found");
            return;
        }

        const data = {
            harmoniousValue: 1,
            disharmoniousValue: -2,
            meltdownChance: 80,
            resoluteChance: 20,
            candles: {
                one: 1,
                two: 2,
                three: 3,
                four: 4,
                five: 5
            }
        };

        // 1. Read story_rules
        const rulesLines = CsvParser.readCSVLines(rulesPath);
        rulesLines.forEach(line => {
            const parts = line.split(',');
            if (parts[0] === 'harmonious_effects') this.ruleEffectIds.harmonious = parts[1];
            if (parts[0] === 'disharmonious_effects') this.ruleEffectIds.disharmonious = parts[1];
        });

        // 2. Read existing levels from effect_data
        const effectElements = CsvParser.parseDarkestDungeonCSV(effectsPath);
        const hEffect = effectElements.find(el => el.id === this.ruleEffectIds.harmonious);
        const dEffect = effectElements.find(el => el.id === this.ruleEffectIds.disharmonious);

        if (hEffect && hEffect.data.m_AffinityLeaningChange) {
            data.harmoniousValue = parseInt(hEffect.data.m_AffinityLeaningChange[0]);
        }
        if (dEffect && dEffect.data.m_AffinityLeaningChange) {
            data.disharmoniousValue = parseInt(dEffect.data.m_AffinityLeaningChange[0]);
        }

        // 3. Read Overstress chances
        if (fs.existsSync(overstressPath)) {
            const overstressLines = CsvParser.readCSVLines(overstressPath);
            let currentId = null;
            overstressLines.forEach(line => {
                const parts = line.split(',');
                if (parts[0] === 'element_start') currentId = parts[1];
                else if (parts[0] === 'element_end') currentId = null;
                else if (parts[0] === 'm_Chance' && currentId === 'meltdown') data.meltdownChance = Math.round(parseFloat(parts[1]) * 100);
                else if (parts[0] === 'm_Chance' && currentId === 'resolute') data.resoluteChance = Math.round(parseFloat(parts[1]) * 100);
            });
        }

        // 4. Read Candles from currencies
        const currenciesPath = path.join(this.basePath, this.currenciesFile);
        if (fs.existsSync(currenciesPath)) {
            const lines = CsvParser.readCSVLines(currenciesPath);
            let currentId = null;
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts[0] === 'element_start') currentId = parts[1];
                else if (parts[0] === 'element_end') currentId = null;
                else if (parts[0] === 'm_qtys') {
                    if (currentId === 'CANDLES_ONE') data.candles.one = parseInt(parts[1]);
                    else if (currentId === 'CANDLES_TWO') data.candles.two = parseInt(parts[1]);
                    else if (currentId === 'CANDLES_THREE') data.candles.three = parseInt(parts[1]);
                    else if (currentId === 'CANDLES_FOUR') data.candles.four = parseInt(parts[1]);
                    else if (currentId === 'CANDLES_FIVE') data.candles.five = parseInt(parts[1]);
                }
            });
        }

        this.renderUI(data);
    }

    saveData(harmoniousValue, disharmoniousValue, meltdownChance, resoluteChance, candleData) {
        const effectsPath = path.join(this.basePath, this.effectsFile);
        const overstressPath = path.join(this.basePath, this.overstressFile);
        const currenciesPath = path.join(this.basePath, this.currenciesFile);

        // 1. Update effect_data_export.Group.csv
        const effectsLines = CsvParser.readCSVLines(effectsPath);
        let effId = null;
        for (let i = 0; i < effectsLines.length; i++) {
            const line = effectsLines[i].trim();
            if (!line) continue;
            const parts = line.split(',');
            if (parts[0] === 'element_start') effId = parts[1];
            else if (parts[0] === 'element_end') effId = null;
            else if (effId === this.ruleEffectIds.harmonious && parts[0] === 'm_AffinityLeaningChange') effectsLines[i] = `m_AffinityLeaningChange,${harmoniousValue},`;
            else if (effId === this.ruleEffectIds.disharmonious && parts[0] === 'm_AffinityLeaningChange') effectsLines[i] = `m_AffinityLeaningChange,${disharmoniousValue},`;
        }
        CsvParser.saveCSVLines(effectsPath, effectsLines);

        // 2. Update overstress_data_export.Group.csv
        if (fs.existsSync(overstressPath)) {
            const ovrLines = CsvParser.readCSVLines(overstressPath);
            let ovrId = null;
            for (let i = 0; i < ovrLines.length; i++) {
                const parts = ovrLines[i].trim().split(',');
                if (parts[0] === 'element_start') ovrId = parts[1];
                else if (parts[0] === 'element_end') ovrId = null;
                else if (parts[0] === 'm_Chance' && ovrId === 'meltdown' && meltdownChance !== undefined) {
                    ovrLines[i] = `m_Chance,${(meltdownChance / 100).toFixed(2)},`;
                } else if (parts[0] === 'm_Chance' && ovrId === 'resolute' && resoluteChance !== undefined) {
                    ovrLines[i] = `m_Chance,${(resoluteChance / 100).toFixed(2)},`;
                }
            }
            CsvParser.saveCSVLines(overstressPath, ovrLines);
        }

        // 3. Update currencies (Candles)
        if (fs.existsSync(currenciesPath) && candleData) {
            const lines = CsvParser.readCSVLines(currenciesPath);
            let currentId = null;
            for (let i = 0; i < lines.length; i++) {
                const parts = lines[i].trim().split(',');
                if (parts[0] === 'element_start') currentId = parts[1];
                else if (parts[0] === 'element_end') currentId = null;
                else if (parts[0] === 'm_qtys') {
                    if (currentId === 'CANDLES_ONE') lines[i] = `m_qtys,${candleData.one},`;
                    else if (currentId === 'CANDLES_TWO') lines[i] = `m_qtys,${candleData.two},`;
                    else if (currentId === 'CANDLES_THREE') lines[i] = `m_qtys,${candleData.three},`;
                    else if (currentId === 'CANDLES_FOUR') lines[i] = `m_qtys,${candleData.four},`;
                    else if (currentId === 'CANDLES_FIVE') lines[i] = `m_qtys,${candleData.five},`;
                }
            }
            CsvParser.saveCSVLines(currenciesPath, lines);
        }

        alert("모든 설정이 성공적으로 저장되었습니다.");
        this.loadData();
    }

    renderUI(data) {
        const container = document.getElementById('relationship-grid');
        if (!container) return;

        container.innerHTML = `
            <div style="background: var(--surface-color); border: 1px solid var(--primary-color); padding: 30px; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 900px; margin: 0 auto;">
                <h3 style="font-family: 'Cinzel', serif; color: var(--primary-color); margin-top: 0; border-bottom: 2px solid var(--primary-color); padding-bottom: 15px; margin-bottom: 25px;">
                    관계 및 시스템 통합 설정 (Relationship & Overstress)
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <!-- Relationship Section -->
                    <div style="grid-column: span 2;">
                        <h4 style="font-family: 'Cinzel', serif; color: var(--secondary-color); margin-bottom: 15px;">사건 선택지 호감도 보상</h4>
                    </div>

                    <div style="background: #111; padding: 20px; border-radius: 6px; border-left: 4px solid #4CAF50;">
                        <label style="display: block; color: #fff; font-weight: bold; margin-bottom: 8px; font-size: 1rem;">✅ 의견 일치 (Harmony)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: #4CAF50; font-weight: bold;">호감도(양수입력)</span>
                            <input type="number" id="rel-harmonious" value="${data.harmoniousValue}" style="width: 80px; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center;" />
                        </div>
                    </div>

                    <div style="background: #111; padding: 20px; border-radius: 6px; border-left: 4px solid #f44336;">
                        <label style="display: block; color: #fff; font-weight: bold; margin-bottom: 8px; font-size: 1rem;">❌ 의견 불일치 (Disharmony)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: #f44336; font-weight: bold;">호감도(음수입력)</span>
                            <input type="number" id="rel-disharmonious" value="${data.disharmoniousValue}" style="width: 80px; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center;" />
                        </div>
                    </div>

                    <!-- Overstress Section -->
                    <div style="grid-column: span 2; margin-top: 20px;">
                        <h4 style="font-family: 'Cinzel', serif; color: var(--secondary-color); margin-bottom: 15px;">스트레스 폭발 확률 (Overstress Chance)</h4>
                        <p style="color: #666; font-size: 0.85rem; margin-top: -10px; margin-bottom: 15px;">* 스트레스가 10에 도달했을 때 발생하는 확률입니다.</p>
                    </div>

                    <div style="background: #111; padding: 20px; border-radius: 6px; border-top: 4px solid #f44336;">
                        <label style="display: block; color: #fff; font-weight: bold; margin-bottom: 8px; font-size: 1rem;">💀 붕괴 확률 (Meltdown)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" id="overstress-meltdown" value="${data.meltdownChance}" style="width: 80px; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center;" />
                            <span style="color: #aaa; font-weight: bold; font-size: 1.2rem;">%</span>
                        </div>
                    </div>

                    <div style="background: #111; padding: 20px; border-radius: 6px; border-top: 4px solid #ffcc00;">
                        <label style="display: block; color: #fff; font-weight: bold; margin-bottom: 8px; font-size: 1rem;">🌟 결의 확률 (Resolute)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" id="overstress-resolute" value="${data.resoluteChance}" style="width: 80px; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center;" />
                            <span style="color: #aaa; font-weight: bold; font-size: 1.2rem;">%</span>
                        </div>
                    </div>
                </div>

                <!-- Candle Section -->
                <div style="background: rgba(209, 42, 42, 0.05); border: 1px solid var(--primary-color); padding: 25px; border-radius: 8px; margin-bottom: 30px;">
                    <h4 style="font-family: 'Cinzel', serif; color: var(--secondary-color); margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                        🕯️ 희망의 촛불 획득량 설정 (Candle Rewards)
                    </h4>
                    <p style="color: #666; font-size: 0.85rem; margin-top: -15px; margin-bottom: 20px;">* 게임 내에서 획득하는 촛불 묶음의 기본 수량을 수정합니다.</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
                        <div style="background: #111; padding: 15px; border-radius: 6px; text-align: center;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 8px;">Bundle 1</label>
                            <input type="number" id="candle-one" value="${data.candles.one}" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center; font-weight: bold;" />
                        </div>
                        <div style="background: #111; padding: 15px; border-radius: 6px; text-align: center;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 8px;">Bundle 2</label>
                            <input type="number" id="candle-two" value="${data.candles.two}" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center; font-weight: bold;" />
                        </div>
                        <div style="background: #111; padding: 15px; border-radius: 6px; text-align: center;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 8px;">Bundle 3</label>
                            <input type="number" id="candle-three" value="${data.candles.three}" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center; font-weight: bold;" />
                        </div>
                        <div style="background: #111; padding: 15px; border-radius: 6px; text-align: center;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 8px;">Bundle 4</label>
                            <input type="number" id="candle-four" value="${data.candles.four}" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center; font-weight: bold;" />
                        </div>
                        <div style="background: #111; padding: 15px; border-radius: 6px; text-align: center;">
                            <label style="display: block; color: #aaa; font-size: 0.8rem; margin-bottom: 8px;">Bundle 5</label>
                            <input type="number" id="candle-five" value="${data.candles.five}" style="width: 100%; padding: 8px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px; text-align: center; font-weight: bold;" />
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <button id="save-relationship-btn" 
                        style="flex: 1; padding: 15px; background: var(--primary-color); color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1.1rem; transition: background 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                        모든 설정 저장하기
                    </button>
                    <button id="reset-relationship-btn" 
                        style="padding: 15px; background: #555; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 1.1rem; transition: background 0.3s;">
                        기본값 복구
                    </button>
                </div>
            </div>
        `;

        document.getElementById('save-relationship-btn').addEventListener('click', () => {
            const hVal = document.getElementById('rel-harmonious').value;
            const dVal = document.getElementById('rel-disharmonious').value;
            const mChance = document.getElementById('overstress-meltdown').value;
            const rChance = document.getElementById('overstress-resolute').value;
            
            const candleData = {
                one: document.getElementById('candle-one').value,
                two: document.getElementById('candle-two').value,
                three: document.getElementById('candle-three').value,
                four: document.getElementById('candle-four').value,
                five: document.getElementById('candle-five').value
            };

            this.saveData(hVal, dVal, mChance, rChance, candleData);
        });

        document.getElementById('reset-relationship-btn').addEventListener('click', () => {
            if (confirm("설정을 게임 기본값(호감도 +1/-2, 붕괴 80%, 결의 20%)으로 복구하시겠습니까?")) {
                this.saveData(1, -2, 80, 20);
            }
        });
    }
}

module.exports = RelationshipManager;
