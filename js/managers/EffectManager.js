const CsvParser = require('../utils/CsvParser');
const fs = require('fs');
const path = require('path');

class EffectManager {
    static effectNameMap = {
        'remove_all_dots': '모든 도트 해제 (출혈, 독, 화상)',
        'heal_20pct_target_threshold_high': '대상 체력 50% 미만 시 20% 회복',
        'heal_25pct_target_threshold_high': '대상 체력 50% 미만 시 25% 회복',
        'heal_5pct': '체력 5% 회복',
        'heal_10pct': '체력 10% 회복',
        'skill_dot_medium_bleed': '출혈3, 3턴',
        'skill_dot_large_bleed': '출혈4, 4턴',
        'skill_dot_massive_bleed': '출혈6, 3턴',
        'remove_all_bleed': '모든 출혈 제거',
        'remove_all_bleed_on_crit': '대상 모든 출혈 제거 (치명타 시)',
        'remove_all_blight': '모든 중독 제거',
        'remove_all_burn': '모든 화상 제거',
        'add_1_winded': '자신: 숨가쁨 토큰 추가',
        'add_1_winded_p1': '자신: 숨가쁨 토큰 추가 (유린자)',
        'move_forward_1': '앞으로 1열 이동',
        'end_combo': '대상 연계 제거',
        'prime_combo': '콤보 생성',
        'combo_damage_boost_50pct': '연계 대상 데미지 50%증가',
        'add_1_weak': '대상 약화 추가',
        'remove_all_stealth': '대상 은신 무시 및 해제',
        'til_ignore_blind': '내 실명 무시',
        'til_ignore_stealth': '대상 은신 무시',
        'add_1_strength': '치명타 적중시 자신에게 힘 부여 (데미지 50% 증가)',
        'add_1_winded_per_target': '명중한 대상마다 숨가쁨 토큰 1개 획득',
        'combo_add_1_stun': '연계 대상 기절',
        'til_ignore_winded_tool_tip': '자신의 숨가쁨 토큰 무시',
        'til_piercing': '대상 방어 토큰 관통 및 제거 (Piercing + Ignore/Remove Block)',
        'til_ignore_block': '대상 방어 토큰 무시',
        'ignored_token_remove_1_block': '대상 방어 토큰 제거',
        'ignored_token_remove_1_block_plus': '대상 방어+ 토큰 제거',
        'heal_25pct_self_threshold_high': '자신 체력 50% 미만 시 25% 회복',
        'heal_33pct_self_threshold_high': '자신 체력 50% 미만 시 33% 회복',
        'stress_heal_2_performer_at_threshold': '자신 스트레스 5 이상일 때 -2 회복',
        'stress_heal_3_performer_at_threshold': '자신 스트레스 5 이상일 때 -3 회복',
        'remove_all_horror': '자신: 공포토큰 제거',
        'remove_all_horror_team': '아군: 공포토큰 제거',
        'stress_heal_1_target_at_threshold': '대상: 스트레스 5 이상일 때 스트레스 -1',
        'heal_amount_2': '대상 아군 체력 2 회복',
        'add_1_speed_if_1_winded': '자신 숨가쁨 1개일 때 속도 버프',
        'add_1_strength_if_2_winded': '자신 숨가쁨 2개일 때 힘 버프',
        'add_1_crit_if_3_winded': '자신 숨가쁨 3개일 때 치명타 버프',
        'remove_hel_bloodlust_buff': '혈욕 버프 제거',
        'add_1_immobilize_nr': '자신 이동 불가 토큰 추가',
        'add_2_immobilize_nr': '자신 이동 불가 토큰 2개 추가',
        'combo_ignore_30pct_bleed_resist': '연계 대상의 출혈 저항 30% 무시',
        'combo_increase_bleed_duration_1': '연계 타격 시 출혈 지속시간 +1',
        'hel_adrenaline_winded_heal_bonus': '숨가쁨 토큰당 치유 +100%',
        'hel_toe_to_toe_convert_winded': '숨가쁨 토큰을 도발(Taunt) 토큰으로 변환',
        'add_1_winded_p2_per_target': '명중한 대상마다 숨가쁨 토큰 1개 획득',
        'add_1_winded_hidden': '명중한 대상마다 숨가쁨 토큰 1개 획득',
        'prime_combo_25pct': '25% 확률로 콤보 생성',
        'remove_all_dodge': '대상 회피 토큰 무시 및 제거 (Dodge + Ignore/Remove Dodge)',
        'remove_all_dodge_plus': '대상 회피+(Dodge+) 토큰 제거',
        'til_ignore_dodge': '대상 회피 무시',
        'ignored_token_remove_1_dodge_plus': '대상 회피+(Dodge+) 토큰 무시 및 제거',
        'ignored_token_remove_1_dodge': '대상 회피(Dodge) 토큰 무시 및 제거',
        'add_1_weak_hidden': '대상 약화 추가',
        'add_1_weak_on_crit': '대상 약화 추가 (치명타 시)',
        'add_2_taunt_nr': '자신 도발(Taunt) 토큰 2개 추가',
        'remove_all_winded': '자신 모든 숨가쁨 제거',
        'hel_adrenaline_on_hit_heal_1_turn_e': '제거된 숨가쁨당 재생 15% 및 효과 지속시간 +1턴',
        'prime_combo_on_crit': '콤보 생성 (치명타 시)',
        'move_backward_1': '뒤로 1열 이동',
        'performer_has_1_or_more_winded': '자신: 숨가쁨 토큰 1개 이상 필요',
        'performer_has_3_winded': '자신: 숨가쁨 토큰 3개 필요',
        'performer_health_under_50pct': '자신 체력 50% 미만 필요',
        'remove_all_winded_p1': '자신 모든 숨가쁨 제거 (유린자)',
        'add_1_winded_p2': '자신: 숨가쁨 토큰 추가 (광전사)',
        'prime_combo_33pct': '33% 확률로 콤보 생성',
        'remove_anti_dodge_debuff': '회피 저하 디버프 해제',
        'anti_dodge_2_rounds_e': '2턴간 회피 불가',
        'convert_winded_p1_to_dodge': '숨가쁨 토큰을 회피(Dodge) 토큰으로 변환',
        'convert_winded_p1_to_dodge_plus': '숨가쁨 토큰을 회피+(Dodge+) 토큰으로 변환',
        'hel_howling_end_p1_deaths_door_dmg': '죽음의 문턱일때 주는 피해 50%증가',
        'hel_bloodlust_p1_damage_winded_0': '주는 피해 5, 제거된 숨가쁨토큰 하나당 피해량 +5',
        'hel_bloodlust_p1_u_damage_winded_0': '주는 피해 7, 제거된 숨가쁨토큰 하나당 피해량 +5',
        'is_free_action': '턴을 종료하지 않음',
        'hel_bloodlust_p1_passive_e': '장착 시: 죽음의 문턱 상태일 때 처형 3 제공',
        'hel_adrenaline_p1_regen_1': '자신: 재생1 (3턴), 제거된 숨가쁨 토큰당 재생 +1 (유린자)',
        'hel_adrenaline_p1_u_regen_2': '자신: 재생2 (3턴), 제거된 숨가쁨 토큰당 재생 +1 (유린자)',
        'hel_adrenaline_rush_p1_bleed_res_1': '자신: 제거된 숨가쁨 토큰당 출혈 저항 10% (3턴) (유린자)',
        'hel_adrenaline_rush_p1_u_dot_res_1': '자신: 제거된 숨가쁨 토큰당 출혈, 중독, 화상 저항 10% (3턴) (유린자)',
        'hel_adrenaline_rush_p1_passive_e': '장착 시: 죽음의 문턱 진입 시 은신 및 모든 도트 제거 (전투당 1번)',
        'hel_bloodlust_u_execution_winded_1_e': '숨가쁨 1개당 처형 확률 부여 (강화 혈욕)',
        'skill_dot_small_bleed': '출혈2, 3턴',
        'move_pull_1': '대상 1열 당기기',
        'til_nondamaging_attack': '비데미지 공격',
        'remove_all_winded_p2': '자신 모든 숨가쁨 제거 (광전사)',
        'remove_bloodlust_p2_crit_buffs': '혈욕 치명타 버프 제거 (광전사)',
        'remove_bloodlust_p2_blocking_buff': '혈욕 연계 버프 제거 (광전사)',
        'hel_bloodlust_p2_passive_blocked_e': '장착 시: 근접 기술 처형 2 제공 (광전사)',
        'hel_bloodlust_p2_u_passive_blocked_e': '장착 시: 근접 기술 처형 3 제공 (광전사)',
        'add_1_winded_p3_enemy': '대상에게 숨가쁨 토큰 1개 추가 (사냥감)',
        'add_2_winded_p3_enemy': '대상에게 숨가쁨 토큰 2개 추가 (사냥감)',
        'add_3_winded_p3_enemy': '대상에게 숨가쁨 토큰 3개 추가 (사냥감)',
        'add_1_winded_if_target_is_large': '타겟이 정예(Large)일 경우 숨가쁨 1개 획득 (사냥감)',
        'hel_add_1_taunt_winded_1': '숨가쁨 1개 소모: 도발(Taunt) 1개 획득 (사냥감)',
        'hel_add_2_taunt_winded_2': '숨가쁨 2개 소모: 도발(Taunt) 2개 획득 (사냥감)',
        'hel_add_3_taunt_winded_3': '숨가쁨 3개 소모: 도발(Taunt) 3개 획득 (사냥감)',
        'convert_all_block_to_block_plus': '자신의 모든 방어(Block)를 방어+(Block+)로 변환',
        'remove_all_guard': '대상 모든 수호(Guard) 무시 및 제거',
        'til_ignore_guard': '내 공격 수호(Guard) 무시',
        'ignored_token_remove_1_guard': '대상 수호(Guard) 제거',
        'move_pull_2': '대상 2열 당기기',
        'add_1_speed': '속도 버프 1',
        'add_1_winded_p3': '자신: 숨가쁨 토큰 추가 (사냥감)'
    };

    static FIELD_MANAGED_EFFECTS = {
        'target_effects': ['add_1_weak', 'add_1_weak_hidden', 'prime_combo', 'remove_all_dodge', 'remove_all_dodge_plus', 'ignored_token_remove_1_dodge_plus', 'ignored_token_remove_1_dodge', 'ignored_token_remove_1_block_plus', 'ignored_token_remove_1_block', 'hel_adrenaline_rush_p1_bleed_res_1', 'hel_adrenaline_rush_p1_u_dot_res_1', 'skill_dot_small_bleed', 'skill_dot_medium_bleed', 'skill_dot_large_bleed', 'skill_dot_massive_bleed', 'move_pull_1', 'move_pull_2', 'add_1_winded_p3_enemy', 'add_2_winded_p3_enemy', 'add_3_winded_p3_enemy', 'remove_all_guard', 'ignored_token_remove_1_guard', 'remove_all_bleed', 'remove_all_blight', 'remove_all_burn'],
        'm_AllConditionIds': ['performer_has_1_or_more_winded', 'performer_has_3_winded', 'performer_health_under_50pct'],
        'm_RequirementIds': ['performer_has_1_or_more_winded', 'performer_has_3_winded', 'performer_health_under_50pct'],
        'target_buffs': ['combo_ignore_30pct_bleed_resist'],
        'performer_buffs': ['combo_increase_bleed_duration_1', 'combo_damage_boost_50pct', 'hel_adrenaline_winded_heal_bonus', 'hel_howling_end_p1_deaths_door_dmg'],
        'token_ignores': ['til_ignore_blind', 'til_ignore_stealth', 'til_ignore_winded_tool_tip', 'til_piercing', 'til_ignore_block', 'til_ignore_dodge', 'til_nondamaging_attack', 'til_ignore_guard'],
        'target_apply_limit_effects': ['remove_all_stealth', 'prime_combo_25pct', 'prime_combo_33pct'],
        'performer_per_crit_effects': ['add_1_strength'],
        'on_hit_as_performer_to_performer_effects': ['add_1_winded_per_target', 'add_1_winded_p2_per_target', 'add_1_winded_hidden'],
        'on_crit_as_performer_to_target_effects': ['prime_combo_on_crit', 'add_1_weak_on_crit', 'remove_all_bleed_on_crit'],
        'performer_effects': ['is_free_action', 'stress_heal_2_performer_at_threshold', 'stress_heal_3_performer_at_threshold', 'remove_all_horror', 'add_1_speed_if_1_winded', 'add_1_strength_if_2_winded', 'add_1_crit_if_3_winded', 'remove_hel_bloodlust_buff', 'add_2_taunt_nr', 'move_forward_1', 'move_backward_1', 'convert_winded_p1_to_dodge', 'convert_winded_p1_to_dodge_plus', 'add_1_winded', 'add_1_winded_p1', 'add_1_winded_p2', 'hel_adrenaline_rush_p1_passive_e', 'hel_bloodlust_p1_passive_e', 'remove_bloodlust_p2_crit_buffs', 'remove_bloodlust_p2_blocking_buff', 'hel_bloodlust_p2_passive_blocked_e', 'hel_bloodlust_p2_u_passive_blocked_e', 'add_1_speed', 'convert_all_block_to_block_plus'],
        'performer_apply_limit_effects': ['heal_25pct_self_threshold_high', 'heal_33pct_self_threshold_high', 'hel_toe_to_toe_convert_winded', 'hel_adrenaline_on_hit_heal_1_turn_e', 'hel_bloodlust_p1_damage_winded_0', 'hel_bloodlust_p1_u_damage_winded_0', 'hel_adrenaline_p1_regen_1', 'hel_adrenaline_p1_u_regen_2', 'hel_bloodlust_u_execution_winded_1_e', 'hel_add_1_taunt_winded_1', 'hel_add_2_taunt_winded_2', 'hel_add_3_taunt_winded_3'],
        'performer_after_target_effects': ['add_1_immobilize_nr', 'add_2_immobilize_nr', 'remove_all_winded', 'remove_all_winded_by_tag_hidden', 'remove_all_winded_p1', 'remove_all_winded_p2'],
        'performer_team_others_effects': ['stress_heal_1_target_at_threshold', 'remove_all_horror_team'],
        'performer_team_others_apply_limit_effects': ['heal_amount_2'],
        'performer_from_target_effects': ['add_1_winded_if_target_is_large']
    };

    static COMPANION_EFFECTS = {
        'remove_all_winded': ['remove_all_winded_by_tag_hidden'],
        'til_piercing': ['til_ignore_block', 'ignored_token_remove_1_block', 'ignored_token_remove_1_block_plus'],
        'remove_all_stealth': ['til_ignore_stealth'],
        'remove_all_dodge': ['til_ignore_dodge', 'remove_all_dodge_plus', 'ignored_token_remove_1_dodge_plus', 'ignored_token_remove_1_dodge'],
        'remove_all_guard': ['til_ignore_guard', 'ignored_token_remove_1_guard']
    };
    static HIDDEN_EFFECTS = ['til_ignore_block', 'ignored_token_remove_1_block', 'ignored_token_remove_1_block_plus', 'remove_all_winded_by_tag_hidden', 'til_ignore_stealth', 'til_ignore_dodge', 'remove_all_dodge_plus', 'ignored_token_remove_1_dodge_plus', 'ignored_token_remove_1_dodge', 'hel_adrenaline_rush_p1_bleed_res_2', 'hel_adrenaline_rush_p1_bleed_res_3', 'hel_adrenaline_rush_p1_u_dot_res_2', 'hel_adrenaline_rush_p1_u_dot_res_3', 'hel_adrenaline_p1_regen_2', 'hel_adrenaline_p1_regen_3', 'hel_adrenaline_p1_regen_4', 'hel_adrenaline_p1_u_regen_3', 'hel_adrenaline_p1_u_regen_4', 'hel_adrenaline_p1_u_regen_5', 'til_ignore_guard', 'ignored_token_remove_1_guard', 'hel_add_1_taunt_winded_2', 'hel_add_1_taunt_winded_3', 'hel_add_2_taunt_winded_1', 'hel_add_2_taunt_winded_3', 'hel_add_3_taunt_winded_1', 'hel_add_3_taunt_winded_2'];

    constructor() {
        this.globalEffectsDatabase = [];
        this.basePath = "";
    }

    setPath(basePath) {
        this.basePath = basePath;
    }

    get BUFF_FILE_PATH() { return path.join(this.basePath, "buff_data_export.Group.csv"); }
    get EFFECT_FILE_PATH() { return path.join(this.basePath, "effect_data_export.Group.csv"); }

    async loadEffectsData() {
        this.globalEffectsDatabase = [];
        try {
            const buffElements = this.basePath && fs.existsSync(this.BUFF_FILE_PATH) ? CsvParser.parseDarkestDungeonCSV(this.BUFF_FILE_PATH) : [];
            const effectElements = this.basePath && fs.existsSync(this.EFFECT_FILE_PATH) ? CsvParser.parseDarkestDungeonCSV(this.EFFECT_FILE_PATH) : [];

            const effectsMap = {};
            buffElements.forEach(el => {
                if (!effectsMap[el.id]) effectsMap[el.id] = { id: el.id, source: 'buff', root: el.data, components: {} };
                effectsMap[el.id].components[el.type] = el.data;
                if (el.type === 'Buff') effectsMap[el.id].root = el.data;
            });
            effectElements.forEach(el => {
                if (!effectsMap[el.id]) effectsMap[el.id] = { id: el.id, source: 'effect', root: el.data, components: {} };
                effectsMap[el.id].components[el.type] = el.data;
                if (el.type === 'Effect') effectsMap[el.id].root = el.data;
            });

            Object.keys(EffectManager.effectNameMap).forEach(id => {
                if (effectsMap[id]) {
                    const effObj = effectsMap[id];
                    const item = {
                        id: id,
                        name: EffectManager.effectNameMap[id],
                        source: effObj.source,
                        stats: effObj.components['ActorDataStats'] || {},
                        effData: {}
                    };
                    if (effObj.source === 'effect' && effObj.root) {
                        if (effObj.root.m_HealthHealPercent) item.effData.m_HealthHealPercent = effObj.root.m_HealthHealPercent[0];
                    }
                    item.editable = (Object.keys(item.stats).length > 0) || (Object.keys(item.effData).length > 0);
                    this.globalEffectsDatabase.push(item);
                } else {
                    this.globalEffectsDatabase.push({ id: id, name: EffectManager.effectNameMap[id], source: 'unknown', stats: {}, effData: {}, editable: false });
                }
            });
            this.renderEffectEditor();
        } catch (err) {
            console.error("Effect load error:", err);
            document.getElementById('error-msg').innerText = `이펙트 로딩 에러: ${err.message}`;
        }
    }

    processEffectCSVUpdate(csvPath, effId, elemType, keyMapUpdates) {
        const lines = CsvParser.readCSVLines(csvPath);
        let currentId = null;
        let currentType = null;
        let keyMapIndexes = {};

        for (let i = 0; i < lines.length; i++) {
            const lineStr = lines[i].trim().replace(/\r/g, '');
            if (!lineStr) continue;
            const parts = lineStr.split(',');

            if (parts[0] === 'element_start') { currentId = parts[1]; currentType = parts[2]; }
            else if (parts[0] === 'element_end') { currentId = null; currentType = null; }
            else if (currentId === effId && currentType === elemType) {
                if (elemType === 'ActorDataStats') {
                    if (parts[0] === 'key_map') {
                        keyMapIndexes = {};
                        for (let j = 1; j < parts.length; j++) if (parts[j]) keyMapIndexes[parts[j]] = j;
                    } else if (parts[0] === 'add_stats') {
                        const newStats = [...parts];
                        for (const [key, val] of Object.entries(keyMapUpdates)) {
                            if (keyMapIndexes[key]) newStats[keyMapIndexes[key]] = val;
                        }
                        lines[i] = newStats.join(',');
                    }
                } else if (elemType === 'Effect' && keyMapUpdates[parts[0]] !== undefined) {
                    lines[i] = `${parts[0]},${keyMapUpdates[parts[0]]},`;
                }
            }
        }
        CsvParser.saveCSVLines(csvPath, lines);
    }

    renderEffectEditor() {
        const container = document.getElementById('effect-grid');
        container.innerHTML = '';

        this.globalEffectsDatabase.forEach(eff => {
            let editorHtml = '';
            if (eff.editable) {
                if (eff.stats && eff.stats.key_map && eff.stats.add_stats) {
                    for (let i = 0; i < eff.stats.key_map.length; i++) {
                        editorHtml += `
                            <div style="margin-bottom: 10px; padding: 10px; background: #111; border-radius: 4px; border: 1px solid #333;">
                                <label style="color:#aaa; font-size:12px; display:block; margin-bottom: 5px;">스탯 수치 조정: <b>${eff.stats.key_map[i]}</b></label>
                                <div style="display:flex; align-items:center;">
                                    <input type="number" step="0.01" class="eff-stat-input" data-cat="ActorDataStats" data-key="${eff.stats.key_map[i]}" value="${eff.stats.add_stats[i]}" style="width:100px; padding: 5px; background: var(--card-bg); color: #fff; border: 1px solid #555; border-radius: 3px;" />
                                </div>
                            </div>`;
                    }
                }
                if (eff.effData && eff.effData.m_HealthHealPercent !== undefined) {
                    editorHtml += `
                            <div style="margin-bottom: 10px; padding: 10px; background: #111; border-radius: 4px; border: 1px solid #333;">
                            <label style="color:#aaa; font-size:12px; display:block; margin-bottom: 5px;">기본 옵션: <b>m_HealthHealPercent</b><br><span style="color:#666">(1.0 = 최대 체력의 100%)</span></label>
                            <div style="display:flex; align-items:center;">
                                <input type="number" step="0.01" class="eff-stat-input" data-cat="Effect" data-key="m_HealthHealPercent" value="${eff.effData.m_HealthHealPercent}" style="width:100px; padding: 5px; background: var(--card-bg); color: #fff; border: 1px solid #555; border-radius: 3px;" />
                            </div>
                        </div>`;
                }
                editorHtml += `<button class="save-eff-btn" data-id="${eff.id}" data-source="${eff.source}" style="margin-top:10px; width:100%; padding:10px; background:#4CAF50; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">수치 영구 저장하기</button>`;
            } else {
                editorHtml += `<div style="padding:15px; background:#1e1e1e; border: 1px dashed #555; text-align:center; color:#888; font-size: 13px;">수치가 고정된 스위치형 이펙트거나<br>상세 속성이 다른 파일에 잠겨 있는 이펙트입니다.<br/>(자체 수치 설정 불가)</div>`;
            }

            container.innerHTML += `
                <div class="skill-card" data-eff-id="${eff.id}">
                    <div class="skill-header"><h3 class="skill-title">${eff.name}</h3></div>
                    <p style="font-size:12px; color:#aaa; font-family:'Courier New', monospace; margin-top:0;">ID: <span style="color:#ffcc00;">${eff.id}</span></p>
                    <div class="view-content" style="margin-top:15px;">${editorHtml}</div>
                </div>`;
        });

        container.querySelectorAll('.save-eff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const source = e.target.getAttribute('data-source');
                const card = e.target.closest('.skill-card');
                const statsUpdates = {};
                const effectUpdates = {};

                card.querySelectorAll('.eff-stat-input').forEach(input => {
                    const cat = input.getAttribute('data-cat');
                    const key = input.getAttribute('data-key');
                    if (cat === 'ActorDataStats') statsUpdates[key] = input.value;
                    if (cat === 'Effect') effectUpdates[key] = input.value;
                });

                try {
                    const targetFilePath = source === 'buff' ? this.BUFF_FILE_PATH : this.EFFECT_FILE_PATH;
                    if (Object.keys(statsUpdates).length > 0) this.processEffectCSVUpdate(targetFilePath, id, 'ActorDataStats', statsUpdates);
                    if (Object.keys(effectUpdates).length > 0) this.processEffectCSVUpdate(targetFilePath, id, 'Effect', effectUpdates);
                    alert('[' + id + '] 수치가 완전히 게임 파일에 저장되었습니다!');
                    this.loadEffectsData();
                } catch (err) { alert('버프 저장 에러: ' + err.message); }
            });
        });
    }
}

module.exports = EffectManager;
