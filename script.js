// 한국 시간 포맷팅 함수
function getKoreanTime() {
    const now = new Date();
    const koreanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));

    const year = koreanTime.getFullYear();
    const month = String(koreanTime.getMonth() + 1).padStart(2, '0');
    const day = String(koreanTime.getDate()).padStart(2, '0');
    const hours = String(koreanTime.getHours()).padStart(2, '0');
    const minutes = String(koreanTime.getMinutes()).padStart(2, '0');
    const seconds = String(koreanTime.getSeconds()).padStart(2, '0');

    return {
        full: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
        time: `${hours}:${minutes}:${seconds}`,
        dateTime: `${year}-${month}-${day}`,
        timestamp: koreanTime.getTime()
    };
}

// 현재 시간 표시 업데이트
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    const time = getKoreanTime();
    timeElement.textContent = `현재 시간: ${time.full}`;
}

// 기록 데이터 저장
let records = JSON.parse(localStorage.getItem('meetRecords') || '[]');
let participants = JSON.parse(localStorage.getItem('meetParticipants') || '[]');
let selectedParticipant = localStorage.getItem('selectedParticipant') || null;

function saveRecords() {
    localStorage.setItem('meetRecords', JSON.stringify(records));
}

function saveParticipants() {
    localStorage.setItem('meetParticipants', JSON.stringify(participants));
    localStorage.setItem('selectedParticipant', selectedParticipant);
}

function loadRecords() {
    records = JSON.parse(localStorage.getItem('meetRecords') || '[]');
    participants = JSON.parse(localStorage.getItem('meetParticipants') || '[]');
    selectedParticipant = localStorage.getItem('selectedParticipant') || null;
    displayHistory();
    displayParticipants();
    updateSelectedDisplay();
}

// 참여자 추가
function addParticipant() {
    const input = document.getElementById('participantInput');
    const name = input.value.trim();

    if (name === '') {
        alert('참여자 이름을 입력해주세요.');
        return;
    }

    if (participants.includes(name)) {
        alert('이미 존재하는 참여자입니다.');
        return;
    }

    participants.push(name);
    saveParticipants();
    displayParticipants();
    input.value = '';

    // 첫 번째 참여자면 자동 선택
    if (participants.length === 1) {
        selectParticipant(name);
    }
}

// 참여자 삭제
function deleteParticipant(name) {
    const index = participants.indexOf(name);
    if (index > -1) {
        participants.splice(index, 1);
        saveParticipants();
        displayParticipants();

        // 선택된 참여자가 삭제되면 선택 해제
        if (selectedParticipant === name) {
            selectedParticipant = null;
            saveParticipants();
            updateSelectedDisplay();
        }
    }
}

// 참여자 선택
function selectParticipant(name) {
    selectedParticipant = name;
    saveParticipants();
    updateSelectedDisplay();

    // 참여자 목록 UI 업데이트
    document.querySelectorAll('.participant-chip').forEach(chip => {
        if (chip.getAttribute('data-name') === name) {
            chip.classList.add('selected');
        } else {
            chip.classList.remove('selected');
        }
    });
}

// 참여자 목록 표시
function displayParticipants() {
    const container = document.getElementById('participantsList');

    if (participants.length === 0) {
        container.innerHTML = '<div style="color: #999; font-size: 0.9em;">참여자를 추가해주세요.</div>';
        return;
    }

    container.innerHTML = participants.map(name => `
        <div class="participant-chip ${selectedParticipant === name ? 'selected' : ''}"
             data-name="${name}"
             onclick="selectParticipant('${name}')">
            <span>${name}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteParticipant('${name}')">×</button>
        </div>
    `).join('');
}

// 선택된 참여자 표시 업데이트
function updateSelectedDisplay() {
    const displayElement = document.getElementById('selectedName');
    displayElement.textContent = selectedParticipant || '없음';
}

// 이모지 버튼 클릭 핸들러
function handleEmojiClick(event) {
    // 참여자 선택 확인
    if (!selectedParticipant) {
        alert('먼저 참여자를 선택해주세요.');
        return;
    }

    const button = event.currentTarget;
    const emoji = button.getAttribute('data-emoji');
    const name = button.getAttribute('data-name');
    const time = getKoreanTime();

    // 버튼 애니메이션
    button.classList.add('clicked');
    setTimeout(() => {
        button.classList.remove('clicked');
    }, 300);

    // 시간 표시 업데이트
    const timeDisplay = button.querySelector('.time-display');
    timeDisplay.textContent = time.time;

    // 기록에 추가
    const record = {
        emoji: emoji,
        name: name,
        participant: selectedParticipant,
        time: time.full,
        timestamp: time.timestamp
    };

    records.unshift(record); // 최신 기록이 위에 오도록
    saveRecords();
    displayHistory();

    // 페이지 맨 위로 스크롤 (새 기록 표시)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 기록 내역 표시
function displayHistory() {
    const historyContainer = document.getElementById('history');

    if (records.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">기록된 내용이 없습니다.<br>이모지를 클릭하여 기록을 시작하세요.</div>';
        return;
    }

    historyContainer.innerHTML = records.map(record => {
        // 미팅 구분선인 경우
        if (record.type === 'meeting-divider') {
            return `
            <div class="history-divider">
                <span class="history-divider-text">📌 ${record.meetingId}</span>
            </div>
        `;
        }

        // 일반 기록인 경우
        const participant = record.participant || '알 수 없음';
        return `
        <div class="history-item">
            <div class="history-text">
                <span class="history-emoji">${record.emoji}</span>
                <span><strong>${participant}</strong> - ${record.name}</span>
            </div>
            <div class="history-time">${record.time}</div>
        </div>
    `;
    }).join('');
}

// 전체 삭제 기능
function handleClearHistory() {
    if (records.length === 0) return;

    if (confirm('모든 기록을 삭제하시겠습니까?')) {
        records = [];
        saveRecords();
        displayHistory();

        // 모든 시간 표시 초기화
        document.querySelectorAll('.time-display').forEach(display => {
            display.textContent = '';
        });
    }
}

// 미팅 구분선 추가
function addMeetingDivider() {
    const input = document.getElementById('meetingIdInput');
    const meetingId = input.value.trim();

    if (meetingId === '') {
        alert('미팅 ID를 입력해주세요.');
        return;
    }

    const time = getKoreanTime();

    const divider = {
        type: 'meeting-divider',
        meetingId: meetingId,
        time: time.full,
        timestamp: time.timestamp
    };

    records.unshift(divider);
    saveRecords();
    displayHistory();
    input.value = '';

    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 데이터 내보내기
function exportData() {
    const data = {
        records: records,
        participants: participants,
        selectedParticipant: selectedParticipant,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `meet-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('데이터가 내보내졌습니다!');
}

// 데이터 불러오기
function importData() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
}

// 파일 선택 처리
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (confirm('현재 데이터를 불러온 데이터로 교체하시겠습니까?')) {
                records = data.records || [];
                participants = data.participants || [];
                selectedParticipant = data.selectedParticipant || null;

                saveRecords();
                saveParticipants();

                displayHistory();
                displayParticipants();
                updateSelectedDisplay();

                // 모든 시간 표시 초기화
                document.querySelectorAll('.time-display').forEach(display => {
                    display.textContent = '';
                });

                alert('데이터를 불러왔습니다!');
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다. 올바른 JSON 파일인지 확인해주세요.');
            console.error(error);
        }
    };

    reader.readAsText(file);
    // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
    event.target.value = '';
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    // 모든 이모지 버튼에 클릭 이벤트 추가
    document.querySelectorAll('.emoji-btn').forEach(button => {
        button.addEventListener('click', handleEmojiClick);
    });

    // 전체 삭제 버튼
    document.getElementById('clearBtn').addEventListener('click', handleClearHistory);

    // 내보내기/불러오기 버튼
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', importData);
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);

    // 참여자 추가 버튼
    document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);

    // Enter 키로 참여자 추가
    document.getElementById('participantInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });

    // 미팅 ID 추가 버튼
    document.getElementById('addMeetingIdBtn').addEventListener('click', addMeetingDivider);

    // Enter 키로 미팅 ID 추가
    document.getElementById('meetingIdInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addMeetingDivider();
        }
    });

    // 현재 시간 업데이트
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // 저장된 기록 로드
    loadRecords();

    // 페이지를 열 때 스크롤을 맨 위로
    window.scrollTo(0, 0);
});

// 페이지를 떠날 때 경고 (실수로 닫는 것 방지)
window.addEventListener('beforeunload', function(e) {
    if (records.length > 0) {
        e.preventDefault();
        e.returnValue = '기록이 남아있습니다. 정말 나가시겠습니까?';
        return e.returnValue;
    }
});

