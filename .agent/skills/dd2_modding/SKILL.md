---
name: DD2 Modding Helper
description: Provides guidelines, file paths, and structural knowledge for modifying the Darkest Dungeon 2 Electron stat editor.
---

# Darkest Dungeon 2 Modding Editor Skill

이 스킬(Skill)은 Darkest Dungeon 2의 스킬과 스탯, 이펙트 및 버프를 편집하는 Electron 기반의 커스텀 에디터를 개발/유지보수할 때 참조해야 할 핵심 정보들을 담고 있습니다.

## 1. 프로젝트 구조 및 주요 파일 경로

- **에디터 프로젝트 위치**: `c:\Users\rusip\Documents\dark`
- **핵심 아키텍처 (OOP 분리 완료)**:
  - `renderer.js`: 앱 전체 흐름을 제어하는 **컨트롤러(AppController)**. IPC 통신 및 뷰 전환 관리.
  - `js/managers/HeroManager.js`: **영웅 및 스킬 관리 전담**. `HERO_DATA`, 스킬 렌더링, CSV 업데이트 로직 포함.
  - `js/managers/EffectManager.js`: **이펙트 및 버프 관리 전담**. `effectNameMap`, `FIELD_MANAGED_EFFECTS`, 효과 에디터 로직 포함.
  - `js/utils/CsvParser.js`: **CSV 파싱 유틸리티**. `element_start/end` 블록 분석 등 저수준 파일 조작 담당.
- **게임 원본 데이터(CSV) 경로**: 사용자가 에디터 상단 메뉴(`경로 설정`)를 통해 지정한 폴더 내 `Excel` 폴더.

### 주요 데이터 파일 목록
- **영웅별 데이터**: `hero_pd_data_export.Group.csv`, `hero_hel_data_export.Group.csv`
- **공통 효과 데이터**: `effect_data_export.Group.csv`, `buff_data_export.Group.csv`
- **롤백용 원본 캐시 파일**: `original_stats_pd.json`, `original_stats_hel.json` (프로젝트 루트 생성)

---

## 2. CSV 구조에 대한 이해

Darkest Dungeon 2의 CSV 파일은 `element_start` ~ `element_end` 블록으로 데이터를 구성합니다. 스킬 하나는 보통 3개의 블록에 나뉘어 선언되며, 이는 `HeroManager`에서 통합하여 처리합니다.
1. **ActorDataSkill**: 스킬의 타겟팅 랭크, 발사 위치, 재사용 대기시간(Cooldown), 사용 횟수(Limit), 시전자 버프(`performer_buffs`), 토큰 무시 옵션(`token_ignores`) 등을 담습니다.
2. **ActorDataStats**: 스킬의 기본 성질입니다. `key_map`과 `add_stats`를 통해 기본 데미지(`health_damage`), 데미지 편차(`health_damage_range`), 치명타 확률(`crit_chance`) 등을 정의합니다.
3. **ActorDataEffects**: 스킬이 발동될 때 적용되는 각 대상별 효과들입니다 (`target_effects`, `performer_effects` 등).

---

## 3. 기능 추가 및 수정 가이드

모듈화된 구조에 따라, 특정 기능을 수정할 때는 해당 매니저 클래스의 **정적(static) 속성**을 수정해야 합니다.

### A. 새로운 영웅 추가 시
1. **HeroManager.js**: `HeroManager.HERO_DATA` 정적 객체 안에 새 영웅의 고유 Key(예: `cru`)를 생성하고, `title`, `fileName`, `originalJson`, `baseActorId`, `baseSkillIds`, `skillNameMap`, `paths`를 정의합니다.
   - **중요**: `baseActorId`는 반드시 CSV 파일의 `ActorDataStats` 행에 정의된 이름(예: `plague_doctor`, `hellion` 등)과 정확히 일치해야 합니다. (이것이 틀리면 기본 능력치 수정 영역이 나타나지 않습니다.)
2. **main.js**: 상단 메뉴바의 `👤 영웅` 서브메뉴(submenu)에 새로운 자식 항목을 추가하여 `switch-to-hero` 이벤트를 발생시키도록 등록합니다.
3. **EffectManager.js**: 해당 영웅이 사용하는 고유 효과가 `effectNameMap`과 `FIELD_MANAGED_EFFECTS`에 등록되어 있는지 확인합니다.



### B. 새로운 스킬 효과(Effect) 활성화 시 (`EffectManager.js`)
효과를 에디터 UI에 노출시키고 정상 저장되도록 하려면 다음을 추가합니다.

1. **EffectManager.effectNameMap 등록**:
   - `[CSV 내부 ID]: '[한국어 설명]'` 포맷으로 추가합니다. 여기에 등록하면 UI에 체크박스로 자동 표시됩니다.
2. **EffectManager.FIELD_MANAGED_EFFECTS 매핑**:
   - 해당 이펙트가 실제로 저장되어야 할 CSV 필드명(예: `target_effects`, `performer_per_crit_effects` 등) 배열에 이펙트 ID를 추가합니다.
   - **중요**: 이를 통해 `processCSVUpdate`가 매핑 리스트를 참고하여, 에디터가 관리하는 이펙트와 아직 번역되지 않은 원본 Unknown 이펙트를 스마트하게 구분하여 저장합니다.

---

## 4. 트러블슈팅 및 작업 꿀팁

- **파일 분리 참조**: 렌더러 프로세스에서 `require`를 통해 모듈을 가져옵니다. 새로운 기능을 추가할 때 로직의 성격에 따라 `HeroManager` 또는 `EffectManager` 중 적절한 곳에 메서드를 추가하세요.
- **안전장치**: 저장 로직은 에디터가 인지하지 못하는 원본 효과(Unknown)를 유지하도록 설계되어 있습니다. 업데이트 로직 수정 시 `!managed.includes(e)` 패턴을 유지하여 데이터 손실을 방지하십시오.
- **경로 관리**: `AppController`(renderer.js)에서 관리하는 `currentBasePath`가 각 매니저의 `setPath()`를 통해 동기화됩니다. 파일 접근 시 각 매니저의 `getFilePath()` 또는 `BUFF_FILE_PATH` 등을 활용하세요.

## 5. 영웅의 길(Path) 파생 효과 처리 원칙 (Lessons Learned)

### ⚠️ 핵심 규칙: `_p1`, `_p2` 파생 효과는 effectNameMap에 절대 등록하지 않는다

CSV 원본을 조사한 결과, 게임은 **한 줄에 기저 효과와 파생 효과를 모두 나열**해 두고, 현재 장착한 영웅의 길에 맞는 것만 내부적으로 골라 발동시킵니다.

```csv
# hel_toe_to_toe 일반(Wanderer) 원본:
performer_apply_limit_effects,hel_toe_to_toe_convert_winded,hel_toe_to_toe_convert_winded_p1,hel_toe_to_toe_convert_winded_p2,
```

따라서:
- **effectNameMap에는 기저 효과(`hel_toe_to_toe_convert_winded`)만 등록**합니다. UI 체크박스 1개로 표현하면 충분합니다.
- **`_p1`, `_p2` 파생은 등록하지 않습니다.** 이들은 `effectNameMap`에도 `FIELD_MANAGED_EFFECTS`에도 없으므로, CSV 저장 시 `oldUnknowns`로 자동 보존됩니다.
- 이로써 사용자가 체크박스를 켜고 끄더라도, 게임 내부 메커니즘인 파생 효과들은 절대 삭제되지 않고 같은 줄에 안전하게 남아있게 됩니다.

### 영웅의 길별 독립 수정 구조 (cloneSkillToPath 시스템)

CSV 내에서 스킬은 영웅의 길에 따라 **완전히 별도의 element 블록**으로 존재할 수 있습니다.
- `hel_toe_to_toe` → 일반(Wanderer) 전용 블록
- `hel_toe_to_toe_p3` → 사냥감(Carcass) 전용 블록 (완전히 다른 효과 세트 사용)

에디터의 `renderSkills()`는 `baseId + suffix`(예: `hel_toe_to_toe_p1`)를 먼저 찾고, 없으면 기저 ID(`hel_toe_to_toe`)로 fallback합니다.

**핵심 기능: `cloneSkillToPath(filePath, baseSkillId, newSkillId)`**

사용자가 **fallback 상태인 스킬을 수정하고 저장**하면, 에디터는 자동으로:
1. 기저 스킬의 `ActorDataSkill`, `ActorDataStats`, `ActorDataEffects` 블록 3개를 복제
2. 새 ID(`baseId + suffix`, 예: `hel_toe_to_toe_p1`)로 이름을 변경
3. `m_ConditionIdOverride`와 `m_SkillHistoryIdOverride`를 기저 ID로 세팅 (게임 요구사항)
4. CSV 끝에 새 블록들을 삽입
5. 그 후 사용자의 수정사항을 새 블록에만 적용

이를 통해:
- **일반에서 수정 → 일반만 수정** (다른 경로에 사이드이펙트 없음)
- **유린자에서 수정 → 유린자 전용 블록이 자동 생성되어 유린자만 수정**
- **UI에 "📋 일반 공유중" 뱃지**가 표시되어 현재 fallback 상태임을 시각적으로 알려줌

### 기계적 검색 필수 규칙

1. **눈대중 스캔 절대 금지**: 스킬 효과를 추가/검토할 때 눈으로 훑지 말고, `grep_search` 또는 `Select-String`으로 해당 스킬 ID를 검색하여 모든 `_effects`, `_buffs` 라인을 기계적으로 추출하세요.
2. **파생 효과 발견 시 판단 기준**: 기저 효과와 함께 `_p1`, `_p2` 파생이 같은 CSV 라인에 나열되어 있다면, 그것은 게임 내부 자동 선택 메커니즘이므로 UI에 노출하지 않고 oldUnknowns로 보존합니다.

### ⚠️ 효과 누락의 근본 원인과 예방법

**근본 원인**: `buildSkillsData()`에서 `target_effects`를 제외한 모든 Effect 필드는 `.filter(e => effectNameMap[e])`를 거칩니다. 따라서 CSV에 실제로 존재하는 효과라도 `effectNameMap`에 등록하지 않으면 **조용히 걸러져서 UI에 아예 나타나지 않습니다**. 에러도 경고도 없이 사라지므로 발견이 매우 어렵습니다.

**새로운 영웅을 추가하거나 기존 영웅의 스킬을 검토할 때 반드시 수행할 체계적 검증 프로세스:**

1. **CSV에서 해당 영웅의 모든 스킬 ID를 기계적으로 검색** (`Select-String -Pattern "스킬ID"`)
2. **검색 결과에서 모든 `_effects`, `_buffs`, `token_ignores` 라인을 추출**
3. **각 라인에 포함된 모든 효과 ID를 리스트업**
4. **이 리스트를 현재 `effectNameMap`과 비교(diff)**하여, 등록되지 않은 ID가 있는지 확인
5. **미등록 ID 발견 시**: 의미를 파악하여 `effectNameMap`에 추가하고, 해당 효과가 속한 필드명을 `FIELD_MANAGED_EFFECTS`에도 등록
6. **같은 줄에 `_1`, `_2`, `_3`, `_4` 파생이 나열된 경우**: 기저 하나만 등록하고 나머지는 oldUnknowns로 자동 보존합니다.
    *   예: `hel_adrenaline_p1_regen_1`만 등록하면, 제거된 숨가쁨 토큰 수에 따라 게임이 `_2`~`_4`를 자동으로 선택하여 적용합니다. `bleed_res_1`도 동일합니다.
7. **장착형 패시브(Equipped Passive)**: 스킬을 장착했을 때만 발동하는 효과(예: 죽음의 문턱 진입 시 도트 제거)는 보통 경로(Path) 데이터나 별도의 효과 블록에 `skill_..._equipped` 조건과 함께 정의되어 있습니다. 이를 `effectNameMap`에 등록하면 UI에서 확인 및 관리가 용이합니다.

### 👯‍♂️ 동반 효과(Companion Effects) 및 효과 숨김(Hidden Effects)

게임 엔진의 특성상, 겉으로 보이는 효과 1개가 실제로는 보이지 않는 여러 보조 효과를 동반해야 하는 경우가 있습니다. (예: 관통, 숨가쁨 제거 등)

#### **1. 동반 효과 (COMPANION_EFFECTS)**
- **작동 방식**: `COMPANION_EFFECTS` 객체에 '부모-자식' 관계를 정의합니다.
- **저장 로직**: 사용자가 UI에서 부모 효과(예: `til_piercing`)를 선택하면, 저장 시 자식 효과들(예: `til_ignore_block`, `ignored_token_remove_1_block`)을 자동으로 데이터에 주입합니다.
- **이점**: 유저는 UI에서 체크박스 1개만 관리하면 되며, 데이터 무결성은 시스템이 보장합니다.

#### **⚠️ 동반 효과 설정 시 주의사항 (중요!)**
단순히 "자주 같이 쓰인다"는 이유로 묶어서는 안 됩니다. 다음 기준을 엄격히 따르십시오.

1.  **기술적 종속성 여부**: 특정 효과를 발동시키기 위해 다른 효과가 반드시 선행되어야 하는 경우에만 묶습니다.
    *   **권장(O)**: `remove_all_stealth`(은신 제거)를 위해 `til_ignore_stealth`(은신 무시)가 필요한 경우. (무시가 없으면 은신 대상을 선택조차 할 수 없으므로 기술적으로 종속됨)
    *   **금지(X)**: `remove_all_stealth`와 `til_ignore_blind`(실명 무시)를 묶는 행위. 실명 무시는 은신 제거와 기술적 상관관계가 없으며, 다른 스킬에서 독립적으로 쓰일 수 있으므로 **반드시 별개의 체크박스로 유지**해야 합니다.
2.  **동일한 대상(Target) 여부**: 부모와 자식 효과가 적용되는 대상이 동일해야 합니다.
    *   **권장(O)**: 대상의 방어를 무시하고(`til_ignore_block`) 대상의 방어를 제거(`ignored_token_remove_1_block`).
    *   **금지(X)**: 대상의 은신을 제거하되, **내(시전자)** 실명을 무시하는 것. (대상과 시전자가 다르므로 묶지 않음)

#### **2. 효과 숨김 (HIDDEN_EFFECTS)**
- **작동 방식**: 단순 보조용이거나 동반 효과의 자식 ID들을 `HIDDEN_EFFECTS` 배열에 등록합니다.
- **UI 및 저장 로직**: `getSkillHTML` 및 `createEditFormHTML` 렌더링 시 이 목록에 포함된 ID는 사용자에게 노출하지 않습니다.
- **주의**: 자식 효과는 유저에게 혼란을 주지 않도록 `effectNameMap`에서는 유지하되, `HIDDEN_EFFECTS`에 추가하여 UI 선택지만 제거합니다. 등록 자체를 지우면 CSV 로딩 시 무시되므로 주의하십시오.

### 🎯 트리거별 가상 효과 ID(Virtual IDs) 시스템

`prime_combo`(콤보 생성)나 `remove_all_bleed`(출혈 제거)처럼 **동일한 효과 ID가 여러 필드(트리거)에서 중복 사용되는 경우**, UI에서 이를 명확히 구분하고 에디터가 올바른 위치에 저장하도록 **가상 ID**를 사용합니다.

**작동 방식**:
- **로딩 시**: `on_crit_as_performer_to_target_effects` 등의 특정 필드에서 효과를 읽어올 때, 내부적으로 `_on_crit` 접미사를 붙여 가상 ID를 생성합니다. (예: `remove_all_bleed_on_crit`)
- **UI 표시**: `effectNameMap`에 가상 ID를 등록하여 **"대상 모든 출혈 제거 (치명타 시)"** 처럼 사용자에게 명확히 노출합니다.
- **저장 시**: `processCSVUpdate` 전용 로직이 가상 ID의 접미사를 제거하고(`remove_all_bleed`), 원래의 CSV 필드에 올바르게 기록합니다.

**사례 (중요!)**: 
- `remove_all_bleed`(출혈 제거)는 일반 타격 시와 치명타 시 모두 쓰일 수 있습니다. 이를 가상 ID 없이 등록하면 에디터 UI에서 어느 시점의 효과인지 알 수 없고, 저장 시 한쪽 필드가 유실될 수 있습니다. 반드시 `_on_crit` 가상 ID를 사용하세요.

**추가 방법**:
1. `effectNameMap`에 가상 ID와 한글 이름 등록 (예: `'remove_all_bleed_on_crit': '대상 모든 출혈 제거 (치명타 시)'`)
2. `FIELD_MANAGED_EFFECTS` 내 해당 트리거 필드(예: `on_crit...`)에 가상 ID 등록
3. `HeroManager.js`의 `buildSkillsData` 로드 로직에서 해당 필드 처리 시 `target_effects`가 아닌 특수 트리거(치명타/아군 등)인 경우 접미사를 붙여주는 로직 확인 및 추가
4. `HeroManager.js`의 `processCSVUpdate` 저장 로직에서 접미사를 제거하며 원본 ID로 역변환하는 로직 확인

### ⚠️ 스킬 속성(Property) 및 패시브 효과 누락 예방법

**사례: 야만인(Hellion) 유린자 '혈욕(Bloodlust)' 스킬 누락 건**
- **누락 항목**: 
  1. **턴을 종료하지 않음**: CSV의 `m_IsFreeAction` 필드 속성.
  2. **장착 시 죽음의 문턱 처형3 부여**: `hel_bloodlust_p1_passive_e` 효과.
- **발견된 문제점**: 
  - `m_IsFreeAction`은 체크박스 형태의 효과 리스트가 아닌 개별 필드여서 로직에서 누락되기 쉬움.
  - 패시브 효과는 `effectNameMap`에 이름이 없으면 `filter` 로직에 의해 UI에서 무음 삭제됨.
- **재발 방지 대책**:
  1. **가상 ID 시스템 적용**: `m_IsFreeAction` 같은 주요 속성은 `is_free_action`이라는 가상 ID를 부여하여 UI 효과 리스트에 노출하고, 저장 시 다시 해당 필드로 역매핑한다. (현재 `HeroManager.js`에 구현됨)
  2. **`ActorDataSkill` 전수 조사**: 스킬 분석 시 `ActorDataEffects` 뿐만 아니라 `ActorDataSkill` 블록의 모든 속성(`m_IsFreeAction`, `m_IsFriendly` 등)을 기계적으로 전수 조사하여 UI에 반영해야 할 정보가 있는지 확인한다.
  3. **미등록 패시브(`_passive_e`) 상시 감시**: CSV 검색 시 `_passive_e` 또는 `_equipped`가 붙은 효과가 있다면, 즉시 `effectNameMap`에 등록하여 UI에서 증발하는 것을 방지한다.
  4. **원본 백업(`original_stats_*.json`) 동기화 (필수!)**: 새로운 효과 매핑(가상 ID 등)을 추가하거나 파싱 로직을 개선하여 기존에 누락되었던 원본 효과를 에디터가 인식하게 될 경우, **반드시 프로젝트 루트의 `original_stats_*.json` 파일들도 해당 데이터를 포함하도록 갱신해야 한다.** 
     *   **이유**: 이 파일은 에디터가 "기본값 복원" 기능을 수행할 때 참조하는 기준점이다. 로직만 고치고 백업 JSON을 갱신하지 않으면, 사용자가 복원을 실행하는 순간 다시 누락된 과거의 잘못된 상태로 되돌아가게 된다. (예: `combo_damage_boost_50pct` 누락 사건)
