const { ipcRenderer } = require('electron');
const HeroManager = require('./js/managers/HeroManager');
const EffectManager = require('./js/managers/EffectManager');
const RelationshipManager = require('./js/managers/RelationshipManager');
const MapManager = require('./js/managers/MapManager');

class AppController {
    constructor() {
        this.heroManager = new HeroManager();
        this.effectManager = new EffectManager();
        this.relationshipManager = new RelationshipManager();
        this.mapManager = new MapManager();
        
        this.currentBasePath = localStorage.getItem('dark_base_path') || "";
        this.updatePaths(this.currentBasePath);

        this.initIPC();
        this.initUI();
    }

    updatePaths(newPath) {
        this.currentBasePath = newPath;
        this.heroManager.setPath(newPath);
        this.effectManager.setPath(newPath);
        this.relationshipManager.setPath(newPath);
        this.mapManager.setPath(newPath);
    }

    initIPC() {
        ipcRenderer.on('switch-view', (event, viewId) => this.switchView(viewId));
        
        ipcRenderer.on('switch-to-hero', (event, heroKey) => {
            this.switchView('hero-view');
            if (this.currentBasePath) {
                this.heroManager.loadHeroData(heroKey, 'wanderer');
            }
        });

        ipcRenderer.on('show-current-path', () => {
            if (this.currentBasePath) alert(`현재 설정된 경로:\n${this.currentBasePath}`);
            else alert("경로 선택이 필요합니다. 상단 메뉴에서 경로 설정을 진행해 주세요.");
        });

        ipcRenderer.on('set-base-path', (event, newPath) => {
            localStorage.setItem('dark_base_path', newPath);
            this.updatePaths(newPath);
            alert('경로가 성공적으로 업데이트되었습니다.');
            
            // 경로 설정 완료 시 첫 번째 영웅(PD) 로드
            this.switchView('hero-view');
        });

        ipcRenderer.on('reset-base-path', () => {
             if (confirm('모든 경로 설정을 초기화하시겠습니까?')) {
                 localStorage.removeItem('dark_base_path');
                 this.heroManager.resetOriginalData();
                 this.updatePaths("");
                 alert('경로 설정이 초기화되었습니다.');
                 this.switchView('home-view');
             }
        });
    }

    initUI() {
        window.addEventListener('DOMContentLoaded', () => {
            // 초기 로드: 경로 여부에 따라 홈 또는 첫 영웅 화면
            if (!this.currentBasePath) {
                this.switchView('home-view');
            } else {
                this.switchView('hero-view');
            }
        });
    }

    switchView(viewId) {
        const homeView = document.getElementById('home-view-container');
        const hView = document.getElementById('hero-view-container');
        const eView = document.getElementById('effect-view-container');
        const rView = document.getElementById('relationship-view-container');
        const mView = document.getElementById('map-view-container');

        // 경로가 없는 상태에서 영웅/이펙트 관리 클릭 시 차단 및 홈 이동
        if (viewId !== 'home-view' && !this.currentBasePath) {
            alert("데이터 경로가 설정되지 않았습니다.\n홈 화면으로 이동합니다. 상단 메뉴에서 경로 설정을 완료해주세요.");
            this.switchView('home-view');
            return;
        }

        if (viewId === 'home-view') {
            homeView.style.display = 'block';
            hView.style.display = 'none';
            eView.style.display = 'none';
            rView.style.display = 'none';
            mView.style.display = 'none';
            document.getElementById('hero-title').innerText = "Darkest Dungeon II Editor";
            document.getElementById('hero-desc').innerText = "모딩을 시작하기 위해 게임 데이터(Excel) 경로를 설정해주세요.";
        } else if (viewId === 'effect-view') {
            homeView.style.display = 'none';
            hView.style.display = 'none'; 
            rView.style.display = 'none';
            mView.style.display = 'none';
            eView.style.display = 'block';
            document.getElementById('hero-title').innerText = "이펙트 & 버프 통합 관리자";
            document.getElementById('hero-desc').innerText = "스킬이 참조하는 공통 수치를 객체화하여 관리합니다.";
            this.effectManager.loadEffectsData();
        } else if (viewId === 'relationship-view') {
            homeView.style.display = 'none';
            hView.style.display = 'none';
            eView.style.display = 'none';
            mView.style.display = 'none';
            rView.style.display = 'block';
            document.getElementById('hero-title').innerText = "관계 및 시스템 설정";
            document.getElementById('hero-desc').innerText = "사건 이벤트 선택지의 공동 규칙 및 영웅 관계 수치를 관리합니다.";
            this.relationshipManager.loadData();
        } else if (viewId === 'map-view') {
            homeView.style.display = 'none';
            hView.style.display = 'none';
            eView.style.display = 'none';
            rView.style.display = 'none';
            mView.style.display = 'block';
            document.getElementById('hero-title').innerText = "맵 생성 규칙 설정";
            document.getElementById('hero-desc').innerText = "성소, 병원, 오아시스 등 맵 노드의 생성 빈도를 조절합니다.";
            this.mapManager.loadData();
        } else {
            // hero-view
            homeView.style.display = 'none';
            eView.style.display = 'none'; 
            rView.style.display = 'none';
            mView.style.display = 'none';
            hView.style.display = 'block';
            
            // 첫 영웅(pd) 데이터를 기본으로 로드
            this.heroManager.loadHeroData(this.heroManager.currentHeroKey || 'pd', this.heroManager.currentPathId || 'wanderer');
        }
    }
}

// Start the app
new AppController();
