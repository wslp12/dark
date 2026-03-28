const CsvParser = require('../utils/CsvParser');
const EffectManager = require('./EffectManager');
const fs = require('fs');
const path = require('path');

class HeroManager {
    static HERO_DATA = {
        hel: {
            title: "Hellion Stats", fileName: "hero_hel_data_export.Group.csv", originalJson: "original_stats_hel.json",
            baseActorId: "hellion",
            baseSkillIds: ['hel_wicked_hack', 'hel_iron_swan', 'hel_barbaric_yawp', 'hel_if_it_bleeds', 'hel_toe_to_toe', 'hel_adrenaline_rush', 'hel_bleed_out', 'hel_breakthrough', 'hel_bloodlust', 'hel_howling_end', 'hel_raucous_revelry'],
            skillNameMap: { 'hel_wicked_hack': '강력한 난도질 (Wicked Hack)', 'hel_iron_swan': '강철의 추모곡 (Iron Swan)', 'hel_barbaric_yawp': '야만스러운 함성! (Barbaric YAWP!)', 'hel_if_it_bleeds': '유혈사태 (If It Bleeds)', 'hel_toe_to_toe': '정면 승부 (Toe to Toe)', 'hel_adrenaline_rush': '아드레날린 분출 (Adrenaline Rush)', 'hel_bleed_out': '출혈 (Bleed Out)', 'hel_breakthrough': '돌파 (Breakthrough)', 'hel_bloodlust': '혈욕 (Bloodlust)', 'hel_howling_end': '단말마의 일격 (Howling End)', 'hel_raucous_revelry': '난잡한 술잔치 (Raucous Revelry)' },
            paths: [{ id: 'wanderer', name: '방랑자 (Wanderer)', suffix: '' }, { id: 'ravager', name: '유린자 (Ravager)', suffix: '_p1' }, { id: 'berserker', name: '광전사 (Berserker)', suffix: '_p2' }, { id: 'carcass', name: '사냥감 (Carcass)', suffix: '_p3' }]
        },
        pd: {
            title: "Plague Doctor Stats", fileName: "hero_pd_data_export.Group.csv", originalJson: "original_stats_pd.json",
            baseActorId: "pd",
            baseSkillIds: ['pd_noxious_blast', 'pd_plague_grenade', 'pd_blinding_gas', 'pd_incision', 'pd_battlefield_medicine', 'pd_emboldening_vapours', 'pd_disorienting_blast', 'pd_ounce_of_prevention', 'pd_indiscriminate_science', 'pd_cause_of_death', 'pd_magnesium_rain'],
            skillNameMap: { 'pd_noxious_blast': '유독 기체 폭발 (Noxious Blast)', 'pd_plague_grenade': '역병 수류탄 (Plague Grenade)', 'pd_blinding_gas': '실명 가스 (Blinding Gas)', 'pd_incision': '절개 (Incision)', 'pd_battlefield_medicine': '야전 의술 (Battlefield Medicine)', 'pd_emboldening_vapours': '고양의 증기 (Emboldening Vapours)', 'pd_disorienting_blast': '혼란 기체 폭발 (Disorienting Blast)', 'pd_ounce_of_prevention': '예방 조치 (Ounce of Prevention)', 'pd_indiscriminate_science': '무차별적 과학 (Indiscriminate Science)', 'pd_cause_of_death': '사인 (Cause of Death)', 'pd_magnesium_rain': '마그네슘 비 (Magnesium Rain)' },
            paths: [{ id: 'wanderer', name: '방랑자 (Wanderer)', suffix: '' }, { id: 'surgeon', name: '외과의 (Surgeon)', suffix: '_p1' }, { id: 'alchemist', name: '연금술사 (Alchemist)', suffix: '_p2' }, { id: 'physician', name: '내과의 (Physician)', suffix: '_p3' }]
        }
    };

    constructor() {
        this.currentHeroKey = 'pd';
        this.currentPathId = 'wanderer';
        this.globalSkillsData = null;
        this.basePath = "";
    }

    setPath(basePath) { this.basePath = basePath; }
    
    resetOriginalData() {
        Object.values(HeroManager.HERO_DATA).forEach(hero => {
            const fullPath = path.join(process.cwd(), hero.originalJson);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`[Reset] Deleted ${hero.originalJson}`);
            }
        });
    }

    getFilePath(heroKey) { return this.basePath ? path.join(this.basePath, HeroManager.HERO_DATA[heroKey].fileName) : ""; }

    buildSkillsData(elements) {
        const skills = {};
        elements.forEach(el => {
            if (['ActorDataSkill', 'ActorDataStats', 'ActorDataEffects'].includes(el.type)) {
                if (!skills[el.id]) skills[el.id] = { id: el.id, launchRanks: [], targetRanks: [], stats: {}, tags: [], effects: [] };
                if (el.type === 'ActorDataSkill') {
                    if (el.data.launch_ranks) skills[el.id].launchRanks = el.data.launch_ranks;
                    if (el.data.m_LaunchRanks) skills[el.id].launchRanks = el.data.m_LaunchRanks.map(v => (parseInt(v) + 1).toString());
                    if (el.data.target_ranks) skills[el.id].targetRanks = el.data.target_ranks;
                    if (el.data.m_Tags) skills[el.id].tags = el.data.m_Tags;
                    if (el.data.m_Limit) skills[el.id].limit = el.data.m_Limit[0];
                    if (el.data.m_IsFriendly) skills[el.id].isFriendly = el.data.m_IsFriendly[0] === 'True';
                    if (el.data.m_Cooldown) skills[el.id].cooldown = el.data.m_Cooldown[0];
                    if (el.data.m_IsFreeAction) {
                        if (el.data.m_IsFreeAction[0] === 'True') skills[el.id].effects.push('is_free_action');
                    }
                    ['performer_buffs', 'target_buffs', 'token_ignores', 'm_AllConditionIds', 'm_RequirementIds'].forEach(field => {
                        if (el.data[field]) skills[el.id].effects.push(...el.data[field].filter(e => EffectManager.effectNameMap[e]));
                    });
                } else if (el.type === 'ActorDataStats') {
                    const keyMap = el.data.key_map || [];
                    const addStats = el.data.add_stats || [];
                    for (let i = 0; i < keyMap.length; i++) skills[el.id].stats[keyMap[i]] = addStats[i] || '0';
                } else if (el.type === 'ActorDataEffects') {
                    const effectFields = ['target_effects', 'target_apply_limit_effects', 'performer_effects', 'performer_per_crit_effects', 'on_hit_as_performer_to_performer_effects', 'on_crit_as_performer_to_target_effects', 'performer_apply_limit_effects', 'performer_after_target_effects', 'performer_team_others_effects', 'performer_team_others_apply_limit_effects', 'performer_from_target_effects'];
                    effectFields.forEach(field => {
                        if (el.data[field]) {
                            if (field === 'target_effects') skills[el.id].effects.push(...el.data[field]);
                            else if (field === 'on_crit_as_performer_to_target_effects') {
                                const critEffects = el.data[field].map(e => (e === 'prime_combo' || e === 'add_1_weak_hidden' || e === 'add_1_weak' || e === 'remove_all_bleed') ? e + '_on_crit' : e);
                                skills[el.id].effects.push(...critEffects.filter(e => EffectManager.effectNameMap[e]));
                            } else if (field === 'performer_team_others_effects') {
                                 const teamEffects = el.data[field].map(e => (e === 'remove_all_horror') ? e + '_team' : e);
                                 skills[el.id].effects.push(...teamEffects.filter(e => EffectManager.effectNameMap[e]));
                             } else skills[el.id].effects.push(...el.data[field].filter(e => EffectManager.effectNameMap[e]));
                        }
                    });
                    skills[el.id].effects = Array.from(new Set(skills[el.id].effects.filter(e => e)));
                }
            }
        });
        return skills;
    }

    processCSVUpdate(filePath, skillId, newSkillData) {
        let effectsWithCompanions = [...newSkillData.effects];
        for (const [parent, companions] of Object.entries(EffectManager.COMPANION_EFFECTS)) {
            if (newSkillData.effects.includes(parent)) {
                companions.forEach(comp => { if (!effectsWithCompanions.includes(comp)) effectsWithCompanions.push(comp); });
            }
        }
        newSkillData = { ...newSkillData, effects: effectsWithCompanions };

        const lines = CsvParser.readCSVLines(filePath);
        let currentId = null; let currentType = null;
        let keyMapIndexes = {}; let seenFields = new Set();

        for (let i = 0; i < lines.length; i++) {
            const lineStr = lines[i].trim().replace(/\r/g, ''); if (!lineStr) continue;
            const parts = lineStr.split(',');
            if (parts[0] === 'element_start') { currentId = parts[1]; currentType = parts[2]; seenFields.clear(); }
            else if (parts[0] === 'element_end') {
                if (currentId === skillId) {
                    const checkAndInsert = (fieldsArr) => {
                        fieldsArr.forEach(field => {
                            if (!seenFields.has(field)) {
                                const managed = EffectManager.FIELD_MANAGED_EFFECTS[field] || [];
                                const selected = newSkillData.effects.filter(e => managed.includes(e)).map(e => e.replace('_on_crit', '').replace('_team', ''));
                                if (selected.length > 0) {
                                    lines.splice(i, 0, `${field},${selected.join(',')},`); i++;
                                    if (field.includes('apply_limit_effects')) { lines.splice(i, 0, `${field.replace('_effects', '')},1,`); i++; }
                                }
                            }
                        });
                    };
                    if (currentType === 'ActorDataSkill') checkAndInsert(['performer_buffs', 'target_buffs', 'token_ignores', 'm_AllConditionIds', 'm_RequirementIds']);
                    if (currentType === 'ActorDataEffects') checkAndInsert(Object.keys(EffectManager.FIELD_MANAGED_EFFECTS).filter(f => f.includes('effects') && f !== 'target_effects'));
                }
                currentId = null; currentType = null;
            } else if (currentId === skillId) {
                seenFields.add(parts[0]);
                if (currentType === 'ActorDataSkill') {
                    if (parts[0] === 'launch_ranks') lines[i] = `${parts[0]},${newSkillData.launchRanks.join(',')},`;
                    else if (parts[0] === 'm_LaunchRanks') lines[i] = `${parts[0]},${newSkillData.launchRanks.map(v => (parseInt(v) - 1).toString()).join(',')},`;
                    else if (parts[0] === 'target_ranks') lines[i] = `target_ranks,${newSkillData.targetRanks.join(',')},`;
                    else if (parts[0] === 'm_Limit') { if (newSkillData.limit !== undefined) lines[i] = `m_Limit,${newSkillData.limit},`; }
                    else if (parts[0] === 'm_Cooldown') { if (newSkillData.cooldown !== undefined) lines[i] = `m_Cooldown,${newSkillData.cooldown},`; }
                    else if (parts[0] === 'm_IsFreeAction') {
                        const isFree = newSkillData.effects.includes('is_free_action');
                        lines[i] = `m_IsFreeAction,${isFree ? 'True' : 'False'},`;
                    }
                    else if (EffectManager.FIELD_MANAGED_EFFECTS[parts[0]]) {
                        const managed = EffectManager.FIELD_MANAGED_EFFECTS[parts[0]];
                        const oldUnknowns = parts.slice(1).filter(e => e && !managed.includes(e) && !EffectManager.effectNameMap[e]);
                        const selected = newSkillData.effects.filter(e => managed.includes(e)).map(e => e.replace('_on_crit', '').replace('_team', ''));
                        const combined = [...oldUnknowns, ...selected];
                        lines[i] = combined.length > 0 ? `${parts[0]},${combined.join(',')},` : `${parts[0]},`;
                    }
                } else if (currentType === 'ActorDataStats') {
                    if (parts[0] === 'key_map') {
                        keyMapIndexes = {}; for (let j = 1; j < parts.length; j++) if (parts[j]) keyMapIndexes[parts[j]] = j;
                    } else if (parts[0] === 'add_stats') {
                        const newStats = [...parts];
                        for (const [key, val] of Object.entries(newSkillData.stats)) if (keyMapIndexes[key]) newStats[keyMapIndexes[key]] = val;
                        lines[i] = newStats.join(',');
                    }
                } else if (currentType === 'ActorDataEffects') {
                    if (parts[0] === 'target_effects') {
                        const targetManaged = EffectManager.FIELD_MANAGED_EFFECTS['target_effects'] || [];
                        const otherManaged = Object.entries(EffectManager.FIELD_MANAGED_EFFECTS)
                            .filter(([k, v]) => k !== 'target_effects')
                            .map(([k, v]) => v).flat();
                        
                        const selectedForTarget = newSkillData.effects.filter(e => targetManaged.includes(e));
                        const unknowns = newSkillData.effects.filter(e => e && !otherManaged.includes(e) && !targetManaged.includes(e) && !e.includes('til_') && !(['heal', 'move'].some(ex => e.includes(ex) && !EffectManager.effectNameMap[e])));
                        const combined = [...selectedForTarget, ...unknowns];
                        lines[i] = combined.length > 0 ? `target_effects,${combined.join(',')},` : `target_effects,`;
                    } else if (EffectManager.FIELD_MANAGED_EFFECTS[parts[0]]) {
                        const managed = EffectManager.FIELD_MANAGED_EFFECTS[parts[0]];
                        const oldUnknowns = parts.slice(1).filter(e => e && !managed.includes(e) && !EffectManager.effectNameMap[e]);
                        const selected = newSkillData.effects.filter(e => managed.includes(e)).map(e => e.replace('_on_crit', '').replace('_team', ''));
                        const combined = [...oldUnknowns, ...selected];
                        lines[i] = combined.length > 0 ? `${parts[0]},${combined.join(',')},` : `${parts[0]},`;
                    }
                }
            }
        }
        CsvParser.saveCSVLines(filePath, lines);
    }
    cloneSkillToPath(filePath, baseSkillId, newSkillId) {
        const lines = CsvParser.readCSVLines(filePath);
        const blocksToClone = []; let capturing = false; let currentBlock = []; let currentType = null;
        for (const line of lines) {
            const lineStr = line.trim().replace(/\r/g, ''); if (!lineStr) continue;
            const parts = lineStr.split(',');
            if (parts[0] === 'element_start' && parts[1] === newSkillId) return false;
            if (parts[0] === 'element_start' && parts[1] === baseSkillId) { capturing = true; currentType = parts[2]; currentBlock = [`element_start,${newSkillId},${currentType}`]; }
            else if (capturing && parts[0] === 'element_end') {
                if (currentType === 'ActorDataSkill') {
                    if (!currentBlock.some(l => l.startsWith('m_ConditionIdOverride'))) currentBlock.push(`m_ConditionIdOverride,${baseSkillId},`);
                    if (!currentBlock.some(l => l.startsWith('m_SkillHistoryIdOverride'))) currentBlock.push(`m_SkillHistoryIdOverride,${baseSkillId},`);
                }
                currentBlock.push('element_end'); blocksToClone.push(currentBlock.join('\n')); capturing = false; currentBlock = []; currentType = null;
            } else if (capturing) currentBlock.push(line.replace(/\r/g, ''));
        }
        if (blocksToClone.length === 0) return false;
        const newContent = lines.join('\n').trimEnd() + '\n' + blocksToClone.join('\n') + '\n';
        fs.writeFileSync(filePath, newContent);

        // [New Logic] actor_paths_data_export.Group.csv 자동 갱신
        this.updatePathReplacementFile(baseSkillId, newSkillId);

        return true;
    }

    updatePathReplacementFile(baseSkillId, newSkillId) {
        const pathFilePath = path.join(this.basePath, "actor_paths_data_export.Group.csv");
        if (!fs.existsSync(pathFilePath)) return;

        const hero = HeroManager.HERO_DATA[this.currentHeroKey];
        const pathInfo = hero.paths.find(p => newSkillId.includes(p.suffix) && p.suffix !== '');
        if (!pathInfo) return;

        const fullPathId = `${this.currentHeroKey}_${pathInfo.id}`;
        const lines = CsvParser.readCSVLines(pathFilePath);
        
        let skillReplacementsLineIdx = -1;
        let foundExisting = false;
        let gatheringSkillReplacements = false;
        let targetPathFound = false;

        const replacementId = `${pathInfo.id}_${baseSkillId.replace(this.currentHeroKey + '_', '')}_replacement`;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 해당 경로의 스킬 교체 섹션 찾기
            if (line.startsWith(`element_start,${fullPathId},ActorDataSkillReplacement`)) {
                gatheringSkillReplacements = true;
            } else if (gatheringSkillReplacements && line.startsWith('skill_replacements')) {
                skillReplacementsLineIdx = i;
                if (line.includes(replacementId)) foundExisting = true;
            } else if (line === 'element_end' && gatheringSkillReplacements) {
                gatheringSkillReplacements = false;
            }
            if (line.startsWith(`element_start,${replacementId},SkillReplacement`)) foundExisting = true;
        }

        if (!foundExisting && skillReplacementsLineIdx !== -1) {
            // 1. skill_replacements 목록에 추가
            const parts = lines[skillReplacementsLineIdx].split(',');
            parts.splice(parts.length - 1, 0, replacementId);
            lines[skillReplacementsLineIdx] = parts.join(',');

            // 2. SkillReplacement 블록 생성 및 삽입 (파일 끝에 추가)
            const newBlock = [
                `element_start,${replacementId},SkillReplacement`,
                `m_FromActorDataSkillId,${baseSkillId},`,
                `m_ToActorDataSkillId,${newSkillId},`,
                `m_IsPathComparisonValid,False,`,
                `element_end`
            ];
            lines.push(...newBlock);
            CsvParser.saveCSVLines(pathFilePath, lines);
            console.log(`[PathUpdate] Added replacement for ${newSkillId} in ${fullPathId}`);
        }
    }

    removePathReplacement(targetBaseId) {
        const pathFilePath = path.join(this.basePath, "actor_paths_data_export.Group.csv");
        if (!fs.existsSync(pathFilePath)) return;

        const hero = HeroManager.HERO_DATA[this.currentHeroKey];
        const pathInfo = hero.paths.find(p => p.id === this.currentPathId);
        if (!pathInfo || pathInfo.suffix === '') return;

        const fullPathId = `${this.currentHeroKey}_${pathInfo.id}`;
        const replacementId = `${pathInfo.id}_${targetBaseId.replace(this.currentHeroKey + '_', '')}_replacement`;
        
        let lines = CsvParser.readCSVLines(pathFilePath);
        let updated = false;

        // 1. 목록에서 제거
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(`element_start,${fullPathId},ActorDataSkillReplacement`)) {
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].startsWith('skill_replacements')) {
                        let parts = lines[j].split(',');
                        const idx = parts.indexOf(replacementId);
                        if (idx !== -1) {
                            parts.splice(idx, 1);
                            lines[j] = parts.join(',');
                            updated = true;
                        }
                        break;
                    }
                    if (lines[j] === 'element_end') break;
                }
            }
        }

        // 2. 블록 제거
        let finalLines = [];
        let capturing = false;
        for (const line of lines) {
            if (line.trim().startsWith(`element_start,${replacementId},SkillReplacement`)) {
                capturing = true;
                updated = true;
                continue;
            }
            if (capturing && line.trim() === 'element_end') {
                capturing = false;
                continue;
            }
            if (!capturing) finalLines.push(line);
        }

        if (updated) {
            CsvParser.saveCSVLines(pathFilePath, finalLines);
            console.log(`[PathUpdate] Removed replacement for ${targetBaseId}`);
        }
    }

    createRanksHTML(ranksArray, type) {
        const activeClass = type === 'launch' ? 'active-launch' : 'active-target';
        let html = '<div class="ranks">';
        const indices = type === 'launch' ? [4, 3, 2, 1] : [1, 2, 3, 4];
        indices.forEach(i => { html += `<div class="rank-circle ${ranksArray.includes(i.toString()) ? activeClass : ''}"></div>`; });
        return html + '</div>';
    }

    createEditFormHTML(skill, baseId, isUpgraded) {
        let crtText = skill.stats.crit_chance ? (parseFloat(skill.stats.crit_chance) * 100).toFixed(0) : '0';
        let launchCheckboxHTML = [4, 3, 2, 1].map(r => `<label style="color:#fff; margin-right:6px; cursor:pointer;"><input type="checkbox" name="launch_${r}" value="${r}" ${skill.launchRanks.includes(r.toString()) ? 'checked' : ''}> Rank ${r}</label>`).join('');
        let targetCheckboxHTML = [1, 2, 3, 4].map(r => `<label style="color:#fff; margin-right:6px; cursor:pointer;"><input type="checkbox" name="target_${r}" value="${r}" ${skill.targetRanks.includes(r.toString()) ? 'checked' : ''}> Rank ${r}</label>`).join('');

        return `
            <div style="padding:15px; background:#1e1e1e; border-radius:8px; border:1px solid #444; margin-top:15px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                <h4 style="color:var(--secondary-color); margin-top:0; border-bottom: 1px solid #333; padding-bottom: 8px;">스킬 수정 ${isUpgraded ? '(강화) ' : ''}</h4>
                <div style="margin-bottom:12px;"><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px; font-weight:bold;">Launch Ranks</label>${launchCheckboxHTML}</div>
                <div style="margin-bottom:12px;"><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px; font-weight:bold;">Target Ranks</label>${targetCheckboxHTML}</div>
                <div style="display:flex; gap:15px; margin-bottom:12px;">
                    <div><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">사용 횟수</label><input type="number" class="edit-limit" value="${skill.limit || ''}" style="width:70px; padding:6px; background:#111; border:1px solid #444; color:#fff; border-radius:4px;" /></div>
                    <div><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">쿨다운</label><input type="number" class="edit-cooldown" value="${skill.cooldown || ''}" style="width:70px; padding:6px; background:#111; border:1px solid #444; color:#fff; border-radius:4px;" /></div>
                </div>
                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">데미지</label><input type="number" class="edit-dmg" value="${skill.stats.health_damage || '0'}" style="width:70px; padding:6px; background:#111; border:1px solid #444; color:#fff; border-radius:4px;" /></div>
                    <div><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">편차</label><input type="number" class="edit-dmg-rng" value="${skill.stats.health_damage_range || '0'}" style="width:70px; padding:6px; background:#111; border:1px solid #444; color:#fff; border-radius:4px;" /></div>
                    <div><label style="display:block; color:#aaa; font-size:12px; margin-bottom:5px;">CRIT (%)</label><input type="number" class="edit-crit" value="${crtText}" style="width:70px; padding:6px; background:#111; border:1px solid #444; color:#fff; border-radius:4px;" /></div>
                </div>
                <!-- Effects editing is now moved to a separate modal via the "Edit Effects" button in the view mode -->
                <div style="display:flex; gap:10px;">
                    <button class="save-edit-btn" style="flex:1; padding:10px; background:#4CAF50; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; transition: opacity 0.2s;">저장</button>
                    <button class="cancel-edit-btn" style="flex:1; padding:10px; background:#555; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">취소</button>
                    <button class="reset-default-btn" style="padding:10px; background:#ff9800; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">기본값 복구</button>
                </div>
            </div>`;
    }

    getSkillHTML(skill, skillName, isUpgraded, hasUpgrade, baseId) {
        let dmgRange = parseFloat(skill.stats.health_damage_range || '0');
        let damageText = skill.stats.health_damage ? (dmgRange > 0 ? `${parseFloat(skill.stats.health_damage)} - ${parseFloat(skill.stats.health_damage) + dmgRange}` : `${parseFloat(skill.stats.health_damage)}`) : '0';
        let critText = skill.stats.crit_chance ? (parseFloat(skill.stats.crit_chance) * 100).toFixed(0) + '%' : '0%';
        let translatedEffects = skill.effects.filter(eff => !EffectManager.HIDDEN_EFFECTS.includes(eff)).map(eff => ({id: eff, name: EffectManager.effectNameMap[eff] || eff})).filter(m => m.name && !m.name.includes('do_nothing') && !m.name.includes('combo_ignore'));

        let displayTitle = skillName; let enTitle = '';
        if (skillName.includes(' (')) { const parts = skillName.split(' ('); displayTitle = parts[0]; enTitle = `(${parts[1]}`; }

        return `
            <div class="skill-header" style="align-items: flex-start;">
                <div style="display: flex; flex-direction: column; gap: 4px; padding-top: 2px;">
                    <h3 class="skill-title" style="line-height:1.2;">${displayTitle} ${isUpgraded ? '<span style="color:#ffcc00; font-size:0.8em; margin-left: 5px;">(강화)</span>' : ''}</h3>
                    ${enTitle ? `<div style="font-size:0.8rem; color:#888; font-weight:normal;">${enTitle}</div>` : ''}
                </div>
                <div style="display: flex; gap: 5px; align-items: flex-start;">
                    <button class="edit-btn" style="background:#555; color:#fff; border:none; border-radius:4px; padding:6px 10px; cursor:pointer; font-size: 0.8rem; font-weight: 500;">수정</button>
                    ${hasUpgrade ? `<button class="upgrade-toggle-btn" style="background:var(--primary-color); color:#fff; border:none; border-radius:4px; padding:6px 10px; cursor:pointer; font-weight: 600; font-size: 0.8rem;">${isUpgraded ? '일반 보기 ↺' : '강화 보기 ✦'}</button>` : ''}
                </div>
            </div>
            <div class="view-content">
                <div class="stat-row"><span class="stat-label">Launch</span><span class="stat-value">${this.createRanksHTML(skill.launchRanks, 'launch')}</span></div>
                <div class="stat-row"><span class="stat-label">Target</span><span class="stat-value">${this.createRanksHTML(skill.targetRanks, 'target')}</span></div>
                ${skill.limit ? `<div class="stat-row"><span class="stat-label">사용 횟수</span><span class="stat-value" style="color:#4db8ff;">${skill.limit}회</span></div>` : ''}
                ${skill.cooldown ? `<div class="stat-row"><span class="stat-label">쿨다운</span><span class="stat-value" style="color:#f48fb1;">${skill.cooldown}턴</span></div>` : ''}
                ${skill.stats.health_damage ? `<div class="stat-row"><span class="stat-label">Damage</span><span class="stat-value">${damageText}</span></div>` : ''}
                ${skill.stats.crit_chance ? `<div class="stat-row"><span class="stat-label">CRIT</span><span class="stat-value">${critText}</span></div>` : ''}
                <div class="stat-row" style="margin-top: 15px; flex-direction: column; gap: 6px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span class="stat-label">효과</span>
                        <button class="edit-effects-btn" style="background:#444; color:#ffcc00; border:1px solid #555; border-radius:4px; padding:2px 8px; cursor:pointer; font-size: 0.75rem; font-weight: bold;">편집</button>
                    </div>
                    ${translatedEffects.length > 0 ? translatedEffects.map(e => `<span class="stat-value" style="color: #ffd54f; font-size: 0.9em; text-align: left;">- ${e.name}</span>`).join('') : '<span style="color: #666; font-size: 0.85rem; font-style: italic;">(효과 없음)</span>'}
                </div>
                <div class="tags">${skill.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
            <div class="edit-content" style="display:none;">${this.createEditFormHTML(skill, baseId, isUpgraded)}</div>`;
    }

    renderHeroBaseStats() {
        const hero = HeroManager.HERO_DATA[this.currentHeroKey];
        const container = document.getElementById('base-stats-container');
        const sectionsTitle = document.getElementById('skills-section-title');
        
        container.innerHTML = '';
        const actorData = this.globalSkillsData[hero.baseActorId];
        
        if (actorData) {
            const hp = actorData.stats.health_max || '0';
            const speed = actorData.stats.speed || '0';
            
            const div = document.createElement('div');
            div.style.backgroundColor = 'var(--surface-color)';
            div.style.border = '1px solid var(--primary-color)';
            div.style.borderRadius = '8px';
            div.style.padding = '20px';
            div.style.boxShadow = '0 0 15px rgba(209, 42, 42, 0.2)';
            
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px;">
                    <h3 style="font-family: 'Cinzel', serif; color: var(--primary-color); margin: 0;">영웅 기본 능력치 (Base Stats)</h3>
                    <button class="save-base-stats-btn" style="background:var(--primary-color); color:#fff; border:none; border-radius:4px; padding:8px 20px; cursor:pointer; font-weight: bold;">능력치 저장</button>
                </div>
                <div style="display: flex; gap: 30px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; color: var(--secondary-color); font-weight: bold; margin-bottom: 8px;">최대 체력 (Max HP)</label>
                        <input type="number" id="base-hp" value="${hp}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 1.2rem;" />
                    </div>
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; color: var(--secondary-color); font-weight: bold; margin-bottom: 8px;">기본 속도/이동 (Speed)</label>
                        <input type="number" id="base-speed" value="${speed}" style="width: 100%; padding: 10px; background: #111; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 1.2rem;" />
                    </div>
                    <div style="flex: 2; min-width: 250px; display: flex; align-items: flex-end;">
                        <p style="margin: 0; color: #666; font-size: 0.9rem; font-style: italic;">
                            * 원본 파일(${hero.fileName})의 베이스 캐릭터 정보를 수정합니다.<br>
                            * 수정한 능력치는 모든 경로(Paths)에 동일하게 적용됩니다.
                        </p>
                    </div>
                </div>
            `;
            
            div.querySelector('.save-base-stats-btn').addEventListener('click', () => {
                const newHp = document.getElementById('base-hp').value;
                const newSpeed = document.getElementById('base-speed').value;
                
                try {
                    const fPath = this.getFilePath(this.currentHeroKey);
                    const updatedData = {
                        id: hero.baseActorId,
                        stats: {
                            health_max: newHp,
                            speed: newSpeed
                        },
                        effects: []
                    };
                    
                    this.processCSVUpdate(fPath, hero.baseActorId, updatedData);
                    alert(`[영웅 수정] 체력:${newHp}, 속도:${newSpeed} 저장 완료!`);
                    this.loadHeroData(this.currentHeroKey, this.currentPathId);
                } catch (e) {
                    alert('저장 실패: ' + e.message);
                }
            });
            
            container.appendChild(div);
            sectionsTitle.style.display = 'block';
        }
    }

    renderSkills() {
        this.renderHeroBaseStats();
        const hero = HeroManager.HERO_DATA[this.currentHeroKey];
        const container = document.getElementById('skills-container');
        container.innerHTML = '';
        const suffix = (hero.paths.find(p => p.id === this.currentPathId) || hero.paths[0]).suffix;

        hero.baseSkillIds.forEach(baseId => {
            let nId = baseId + suffix; let nFallback = false; if (!this.globalSkillsData[nId]) { nId = baseId; nFallback = suffix !== ''; }
            let uId = baseId + suffix + '_u'; let uFallback = false; if (!this.globalSkillsData[uId]) { uId = baseId + '_u'; uFallback = suffix !== ''; }

            // [New Logic] 방랑자가 아닌 경로일 때, 방랑자 스킬을 공유 중(fallback)이면 아예 렌더링하지 않음
            if (suffix !== '' && nFallback && uFallback) {
                return;
            }

            if (this.globalSkillsData[nId]) {
                const div = document.createElement('div');
                div.className = `skill-card ${this.globalSkillsData[nId].isFriendly ? 'friendly-card' : ''}`;
                const rawName = hero.skillNameMap[baseId] || nId.toUpperCase().replace(/_/g, ' ');

                const wandererName = hero.paths[0].name.split(' (')[0];
                const normalDiv = document.createElement('div');
                normalDiv.innerHTML = (nFallback ? `<div class="fallback-badge">📋 ${wandererName}와 공유중</div>` : '') + this.getSkillHTML(this.globalSkillsData[nId], rawName, false, !!this.globalSkillsData[uId], baseId);
                const upgradedDiv = document.createElement('div');
                if (this.globalSkillsData[uId]) {
                    upgradedDiv.innerHTML = (uFallback ? `<div class="fallback-badge">📋 ${wandererName}와 공유중 (강화)</div>` : '') + this.getSkillHTML(this.globalSkillsData[uId], rawName, true, true, baseId);
                }
                upgradedDiv.style.display = 'none';
                div.appendChild(normalDiv); div.appendChild(upgradedDiv);

                div.querySelectorAll('.upgrade-toggle-btn').forEach(btn => btn.addEventListener('click', () => {
                    const toggle = normalDiv.style.display === 'none';
                    normalDiv.style.display = toggle ? 'block' : 'none';
                    upgradedDiv.style.display = toggle ? 'none' : 'block';
                }));

                [normalDiv, upgradedDiv].forEach((cDiv, idx) => {
                    if (!cDiv.innerHTML) return;
                    const skillRef = idx === 0 ? this.globalSkillsData[nId] : this.globalSkillsData[uId];
                    const isFallback = idx === 0 ? nFallback : uFallback;

                    cDiv.querySelector('.edit-btn')?.addEventListener('click', () => { 
                        if (isFallback) {
                            alert("방랑자에서 수정해 주세요");
                            return;
                        }
                        cDiv.querySelector('.view-content').style.display = 'none'; cDiv.querySelector('.edit-content').style.display = 'block'; 
                    });
                    cDiv.querySelector('.cancel-edit-btn')?.addEventListener('click', () => { 
                        cDiv.querySelector('.view-content').style.display = 'block'; cDiv.querySelector('.edit-content').style.display = 'none'; 
                    });

                    cDiv.querySelector('.edit-effects-btn')?.addEventListener('click', () => {
                        if (isFallback) {
                            alert("방랑자에서 수정해 주세요");
                            return;
                        }
                        this.openEffectModal(skillRef, (updatedEffects) => {
                            skillRef.effects = updatedEffects;
                            try {
                                const fPath = this.getFilePath(this.currentHeroKey);
                                this.processCSVUpdate(fPath, skillRef.id, skillRef);
                                if (suffix) this.updatePathReplacementFile(idx === 1 ? baseId + '_u' : baseId, skillRef.id);
                                alert("효과 저장 완료!");
                                this.loadHeroData(this.currentHeroKey, this.currentPathId);
                            } catch (e) { alert('효과 저장 실패: ' + e.message); }
                        });
                    });

                    cDiv.querySelector('.save-edit-btn')?.addEventListener('click', () => {
                        const edit = cDiv.querySelector('.edit-content');
                        const newSkill = JSON.parse(JSON.stringify(skillRef));
                        newSkill.launchRanks = Array.from(edit.querySelectorAll('input[name^="launch_"]:checked')).map(el => el.value).sort((a, b) => parseInt(a) - parseInt(b));
                        newSkill.targetRanks = Array.from(edit.querySelectorAll('input[name^="target_"]:checked')).map(el => el.value).sort((a, b) => parseInt(a) - parseInt(b));
                        const lim = edit.querySelector('.edit-limit').value; if (lim) newSkill.limit = lim; else delete newSkill.limit;
                        const cd = edit.querySelector('.edit-cooldown').value; if (cd) newSkill.cooldown = cd; else delete newSkill.cooldown;
                        newSkill.stats.health_damage = edit.querySelector('.edit-dmg').value;
                        newSkill.stats.health_damage_range = edit.querySelector('.edit-dmg-rng').value;
                        const crt = edit.querySelector('.edit-crit').value; if (crt) newSkill.stats.crit_chance = (parseFloat(crt)/100).toString();
                        
                        try {
                            const fPath = this.getFilePath(this.currentHeroKey);
                            if (isFallback && suffix) {
                                const tId = baseId + suffix + (idx === 1 ? '_u' : '');
                                this.cloneSkillToPath(fPath, skillRef.id, tId);
                                this.globalSkillsData = this.buildSkillsData(CsvParser.parseDarkestDungeonCSV(fPath));
                                
                                const targetRef = this.globalSkillsData[tId];
                                const updatedSkill = JSON.parse(JSON.stringify(newSkill));
                                updatedSkill.id = tId;
                                
                                this.processCSVUpdate(fPath, tId, updatedSkill);
                                if (suffix) this.updatePathReplacementFile(idx === 1 ? baseId + '_u' : baseId, tId);
                                alert("전용 블록 생성 및 저장 완료!");
                            } else { 
                                this.processCSVUpdate(fPath, newSkill.id, newSkill); 
                                if (suffix) this.updatePathReplacementFile(idx === 1 ? baseId + '_u' : baseId, newSkill.id);
                                alert("저장 완료!"); 
                            }
                            this.loadHeroData(this.currentHeroKey, this.currentPathId);
                        } catch (e) { alert('저장 실패: ' + e.message); }
                    });

                    cDiv.querySelector('.reset-default-btn')?.addEventListener('click', () => {
                        if (confirm('복구하시겠습니까? (전용 설정을 삭제하고 방랑자 기술을 공유합니다)')) {
                            try {
                                const fPath = this.getFilePath(this.currentHeroKey);
                                const baseSkillIdWithU = baseId + (idx === 1 ? '_u' : '');

                                // 1. 경로 파일에서 리다이렉션 삭제
                                if (suffix) this.removePathReplacement(baseSkillIdWithU);
                                
                                // 2. 원본 데이터로 덮어쓰기 (공용 스킬 정보로 복구)
                                const orig = JSON.parse(fs.readFileSync(hero.originalJson, 'utf8'))[baseSkillIdWithU];
                                if (orig) {
                                    this.processCSVUpdate(fPath, skillRef.id, orig);
                                }
                                
                                alert("복구 완료! (방랑자 기술 공유 상태로 복구됨)");
                                this.loadHeroData(this.currentHeroKey, this.currentPathId);
                            } catch (e) { alert('복구 실패: ' + e.message); }
                        }
                    });
                });
                container.appendChild(div);
            }
        });
    }

    openEffectModal(skill, onSave) {
        const modal = document.getElementById('effect-modal');
        const list = document.getElementById('modal-effects-list');
        const search = document.getElementById('effect-search');
        const title = document.getElementById('modal-skill-title');
        
        modal.style.display = 'block';
        title.innerText = `스킬 효과 편집: ${skill.id}`;
        search.value = '';
        
        let currentSelection = [...skill.effects];
        
        const renderList = (filter = '') => {
            list.innerHTML = '';
            const query = filter.toLowerCase();
            
            const entries = Object.entries(EffectManager.effectNameMap)
                .filter(([id, name]) => {
                    if (EffectManager.HIDDEN_EFFECTS.includes(id)) return false;
                    return id.toLowerCase().includes(query) || name.toLowerCase().includes(query);
                })
                .sort(([idA, nameA], [idB, nameB]) => {
                    const selA = currentSelection.includes(idA);
                    const selB = currentSelection.includes(idB);
                    if (selA && !selB) return -1;
                    if (!selA && selB) return 1;
                    return nameA.localeCompare(nameB, 'ko'); // Sort by name (supporting Korean)
                });
            
            entries.forEach(([id, name]) => {
                    const isSelected = currentSelection.includes(id);
                    const item = document.createElement('div');
                    item.className = `effect-item ${isSelected ? 'selected' : ''}`;
                    
                    // Find category
                    let category = '';
                    for (const [cat, items] of Object.entries(EffectManager.FIELD_MANAGED_EFFECTS)) {
                        if (items.includes(id)) {
                            category = cat.replace('_effects', '').replace('m_', '');
                            break;
                        }
                    }
                    
                    item.innerHTML = `
                        <input type="checkbox" ${isSelected ? 'checked' : ''} style="pointer-events:none;">
                        <div class="effect-info">
                            <span class="effect-label">${name}</span>
                            <span class="effect-id">${id}</span>
                            ${category ? `<span class="effect-category">${category}</span>` : ''}
                        </div>
                    `;
                    
                    item.addEventListener('click', () => {
                        if (currentSelection.includes(id)) {
                            currentSelection = currentSelection.filter(e => e !== id);
                        } else {
                            currentSelection.push(id);
                        }
                        renderList(search.value);
                    });
                    list.appendChild(item);
                });
        };
        
        renderList();
        
        search.oninput = (e) => renderList(e.target.value);
        
        const close = () => { modal.style.display = 'none'; };
        document.querySelector('.close-modal').onclick = close;
        document.getElementById('cancel-effects-btn').onclick = close;
        
        document.getElementById('confirm-effects-btn').onclick = () => {
            // Keep manually added effects that aren't in the map (unknowns)
            const unknowns = skill.effects.filter(e => !EffectManager.effectNameMap[e]);
            onSave([...new Set([...currentSelection, ...unknowns])]);
            close();
        };
        
        window.onclick = (e) => { if (e.target === modal) close(); };
    }

    loadHeroData(heroKey, initialPath) {
        this.currentHeroKey = heroKey; const hero = HeroManager.HERO_DATA[heroKey];
        document.getElementById('hero-title').innerText = hero.title;
        document.getElementById('hero-desc').innerText = "";
        try {
            const fPath = this.getFilePath(heroKey);
            if (!fPath) { document.getElementById('error-msg').innerText = "경로 설정을 먼저 해주세요."; return; }
            this.globalSkillsData = this.buildSkillsData(CsvParser.parseDarkestDungeonCSV(fPath));
            if (!fs.existsSync(hero.originalJson)) fs.writeFileSync(hero.originalJson, JSON.stringify(this.globalSkillsData, null, 2));

            const tabs = document.getElementById('path-tabs'); tabs.innerHTML = '';
            hero.paths.forEach(p => {
                const btn = document.createElement('button'); btn.className = `tab-btn ${p.id === initialPath ? 'active' : ''}`;
                btn.innerText = p.name; btn.addEventListener('click', (e) => {
                    document.querySelectorAll('#path-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active'); this.currentPathId = p.id; this.renderSkills();
                });
                tabs.appendChild(btn);
            });
            this.currentPathId = initialPath; this.renderSkills();
        } catch (error) { console.error(error); document.getElementById('error-msg').innerText = `로드 에러: ${error.message}`; }
    }
}

module.exports = HeroManager;
