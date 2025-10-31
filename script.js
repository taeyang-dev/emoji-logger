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
let meetingStartTime = localStorage.getItem('meetingStartTime') || null;
let requirements = JSON.parse(localStorage.getItem('requirements') || '[]');

function saveRecords() {
    localStorage.setItem('meetRecords', JSON.stringify(records));
}

function saveParticipants() {
    localStorage.setItem('meetParticipants', JSON.stringify(participants));
    localStorage.setItem('selectedParticipant', selectedParticipant);
}

function saveRequirements() {
    localStorage.setItem('requirements', JSON.stringify(requirements));
}

function loadRecords() {
    records = JSON.parse(localStorage.getItem('meetRecords') || '[]');
    participants = JSON.parse(localStorage.getItem('meetParticipants') || '[]');
    selectedParticipant = localStorage.getItem('selectedParticipant') || null;
    displayHistory();
    displayParticipants();
    updateSelectedDisplay();
    updateCurrentMeetingDisplay();
    updateMeetingTimeDisplay();
    displayRequirements();
}

// 현재 미팅 ID 표시 업데이트
function updateCurrentMeetingDisplay() {
    const displayElement = document.getElementById('currentMeetingDisplay');
    if (!displayElement) return;

    // records를 역순으로 확인하여 가장 최근 미팅 ID 찾기
    let currentMeetingId = null;
    for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].type === 'meeting-divider') {
            currentMeetingId = records[i].meetingId;
            break;
        }
    }

    if (currentMeetingId) {
        displayElement.textContent = `📌 ${currentMeetingId}`;
        displayElement.classList.add('show');
    } else {
        displayElement.classList.remove('show');
    }
}

// 참여자 추가
function addParticipant() {
    const input = document.getElementById('participantInput');
    const emailInput = document.getElementById('participantEmailInput');
    const name = input.value.trim();
    const email = emailInput.value.trim();

    if (name === '') {
        alert('참여자 이름을 입력해주세요.');
        return;
    }

    // 참여자 객체로 저장 (이름과 이메일)
    const participantObj = participants.find(p => p.name === name);
    if (participantObj) {
        alert('이미 존재하는 참여자입니다.');
        return;
    }

    participants.push({ name: name, email: email || '@scaled-solutions.ai' });
    saveParticipants();
    displayParticipants();
    input.value = '';
    emailInput.value = ''; // 기본값으로 리셋

    // 첫 번째 참여자면 자동 선택
    if (participants.length === 1) {
        selectParticipant(name);
    }
}

// 참여자 삭제
function deleteParticipant(name) {
    const index = participants.findIndex(p => p.name === name || p === name);
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

    container.innerHTML = participants.map(p => {
        const name = typeof p === 'string' ? p : p.name;
        return `
        <div class="participant-chip ${selectedParticipant === name ? 'selected' : ''}"
             data-name="${name}"
             onclick="selectParticipant('${name}')">
            <span>${name}</span>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteParticipant('${name}')">×</button>
        </div>
    `;
    }).join('');
}

// 선택된 참여자 표시 업데이트
function updateSelectedDisplay() {
    const displayElement = document.getElementById('selectedName');
    if (displayElement) {
        displayElement.textContent = selectedParticipant || '없음';
    }
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
}

// 기록 내역 표시
function displayHistory() {
    const historyContainer = document.getElementById('history');

    if (records.length === 0) {
        historyContainer.innerHTML = '<div class="empty-history">기록된 내용이 없습니다.<br>이모지를 클릭하여 기록을 시작하세요.</div>';
        return;
    }

    // 참여자별로 기록 분류
    const participantRecords = {};
    let meetingDividers = [];

    records.forEach(record => {
        if (record.type === 'meeting-divider') {
            meetingDividers.push(record);
        } else {
            const participant = record.participant || '알 수 없음';
            if (!participantRecords[participant]) {
                participantRecords[participant] = [];
            }
            participantRecords[participant].push(record);
        }
    });

    let html = '';

    // 미팅 구분선 표시
    meetingDividers.forEach(divider => {
        html += `
            <div class="history-divider">
                <span class="history-divider-text">📌 ${divider.meetingId}</span>
            </div>
        `;
    });

    // 참여자별로 기록 표시
    Object.keys(participantRecords).forEach(participant => {
        // 손 동작과 다른 이모지 분리 (손 내리기는 제외)
        const handsRecords = participantRecords[participant].filter(r => r.name === 'Hand Raises' || r.name === 'Hands Down');
        const handRaisesRecords = participantRecords[participant].filter(r => r.name === 'Hand Raises');
        const otherRecords = participantRecords[participant].filter(r => r.name !== 'Hand Raises' && r.name !== 'Hands Down');

        html += `
            <div class="participant-group">
                <div class="participant-group-header">
                    <strong>${participant}</strong>
                    <span class="participant-count">손: ${handRaisesRecords.length}회 / 리액션: ${otherRecords.length}회</span>
                </div>
                <div class="participant-records">
        `;

        // 손 동작 표시
        if (handsRecords.length > 0) {
            html += `<div class="hands-section">`;
            handsRecords.forEach(record => {
                html += `
                    <div class="history-item">
                        <div class="history-text">
                            <span class="history-emoji">${record.emoji}</span>
                            <span>${record.name}</span>
                        </div>
                        <div class="history-time">${record.time}</div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // 다른 이모지 표시
        if (otherRecords.length > 0) {
            html += `<div class="other-emoji-section">`;
            otherRecords.forEach(record => {
                html += `
                    <div class="history-item">
                        <div class="history-text">
                            <span class="history-emoji">${record.emoji}</span>
                            <span>${record.name}</span>
                        </div>
                        <div class="history-time">${record.time}</div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
                </div>
            </div>
        `;
    });

    historyContainer.innerHTML = html;
}

// 전체 삭제 기능
function handleClearHistory() {
    if (records.length === 0) return;

    if (confirm('모든 기록을 삭제하시겠습니까?')) {
        records = [];
        participants = [];
        selectedParticipant = null;
        meetingStartTime = null;
        requirements = [];
        saveRecords();
        saveParticipants();
        saveRequirements();
        localStorage.removeItem('meetingStartTime');
        displayHistory();
        displayParticipants();
        updateSelectedDisplay();
        updateCurrentMeetingDisplay();
        updateMeetingTimeDisplay();
        displayRequirements();

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
    updateCurrentMeetingDisplay();
    input.value = '';
}

// 미팅 시작
function startMeeting() {
    const time = getKoreanTime();
    meetingStartTime = time.timestamp;
    localStorage.setItem('meetingStartTime', meetingStartTime);
    updateMeetingTimeDisplay();
}

// 미팅 시간 표시 업데이트
function updateMeetingTimeDisplay() {
    const displayElement = document.getElementById('meetingTimeDisplay');

    if (meetingStartTime) {
        const startTime = new Date(parseInt(meetingStartTime));
        const endTime = new Date(parseInt(meetingStartTime) + 33 * 60 * 1000); // 33분 추가

        const formatTime = (date) => {
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };

        displayElement.innerHTML = `
            <div class="time-entry">
                <strong>시작 시간:</strong> ${formatTime(startTime)}
            </div>
            <div class="time-entry">
                <strong>종료 시간:</strong> ${formatTime(endTime)}
            </div>
        `;
        displayElement.classList.add('show');
    } else {
        displayElement.classList.remove('show');
    }
}

// 참여 요건 추가
function addRequirement() {
    const input = document.getElementById('requirementInput');
    const text = input.value.trim();

    if (text === '') {
        alert('참여 요건을 입력해주세요.');
        return;
    }

    requirements.push({ text: text, completed: false });
    saveRequirements();
    displayRequirements();
    input.value = '';
}

// 참여 요건 삭제
function deleteRequirement(index) {
    requirements.splice(index, 1);
    saveRequirements();
    displayRequirements();
}

// 참여 요건 완료 토글
function toggleRequirement(index) {
    requirements[index].completed = !requirements[index].completed;
    saveRequirements();
    displayRequirements();
}

// 참여 요건 표시
function displayRequirements() {
    const container = document.getElementById('requirementsList');

    if (requirements.length === 0) {
        container.innerHTML = '<div style="color: #999; font-size: 0.9em; padding: 10px;">참여 요건이 없습니다.</div>';
        return;
    }

    container.innerHTML = requirements.map((req, idx) => `
        <div class="requirement-item ${req.completed ? 'completed' : ''}">
            <input type="checkbox" ${req.completed ? 'checked' : ''} onchange="toggleRequirement(${idx})">
            <span>${req.text}</span>
            <button style="background: #ff6b6b; color: white; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer; font-size: 0.8em;" onclick="deleteRequirement(${idx})">삭제</button>
        </div>
    `).join('');
}

// 엑셀로 내보내기
function exportToExcel() {
    if (records.length === 0) {
        alert('내보낼 기록이 없습니다.');
        return;
    }

    // 고정된 이모지 순서
    const fixedEmojiOrder = [
        'Hand Raises',
        'Hands Down',
        'Thumbs Up',
        'Thumbs Down',
        'Clapping Hands',
        'Celebration',
        'Heart',
        'High-five',
        'Surprise',
        'Thinking Face',
        'Laugh',
        'Sad'
    ];

    // 미팅 구분선에 따라 데이터 그룹화
    // Find the first actual meeting ID if it exists
    let firstMeetingId = '미정';
    for (const record of records) {
        if (record.type === 'meeting-divider' && record.meetingId) {
            firstMeetingId = record.meetingId;
            break;
        }
    }

    const meetings = [];
    let currentMeeting = { name: firstMeetingId, records: [] }; // Start with the first found ID or '미정'

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        if (record.type === 'meeting-divider') {
            // 이전 미팅 저장
            if (currentMeeting.records.length > 0) {
                meetings.push(currentMeeting);
            }
            // 새 미팅 시작
            currentMeeting = { name: record.meetingId, records: [] };
        } else {
            currentMeeting.records.push(record);
        }
    }

    // 마지막 미팅 저장
    if (currentMeeting.records.length > 0) {
        meetings.push(currentMeeting);
    }

    // 워크북 생성
    const wb = XLSX.utils.book_new();

    // 각 미팅마다 시트 생성
    meetings.forEach(meeting => {
        // 시트 데이터 생성
        const sheetData = [];

        // 헤더 행 추가
        const headerRow = ['미팅 ID', '이메일', '참여자 이름'];
        headerRow.push(...fixedEmojiOrder);
        sheetData.push(headerRow);

        // 모든 기록을 시간순으로 정렬
        const sortedRecords = meeting.records
            .sort((a, b) => a.timestamp - b.timestamp);

        // 이 미팅에 참여한 참여자 수집 (객체 형식 지원)
        const meetingParticipants = [];
        meeting.records.forEach(r => {
            if (r.participant && !meetingParticipants.find(p => p.name === r.participant)) {
                const participantObj = participants.find(p => p.name === r.participant || p === r.participant);
                meetingParticipants.push({
                    name: r.participant,
                    email: participantObj && participantObj.email ? participantObj.email : '@scaled-solutions.ai'
                });
            }
        });

        // 각 참여자별로 행 생성
        meetingParticipants.forEach((participant, participantIdx) => {
            // 각 참여자의 각 이모지별 최대 행 수 계산
            const participantMaxRows = {};
            fixedEmojiOrder.forEach(emojiName => {
                const recordsForEmoji = sortedRecords.filter(r =>
                    r.participant === participant.name && r.name === emojiName
                );
                participantMaxRows[emojiName] = recordsForEmoji.length;
            });

            // 해당 참여자의 전체 최대 행 수 계산
            const maxRows = Math.max(...Object.values(participantMaxRows), 0);

            // 각 참여자의 각 이모지별 행 생성
            for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
                const row = [];
                let hasAnyData = false; // 실제 데이터가 있는지 확인

                // 미팅 제목 (항상)
                row.push(meeting.name || '미정');

                // 이메일 (항상)
                row.push(participant.email);

                // 참여자 이름 (첫 번째 행만)
                if (rowIdx === 0) {
                    row.push(participant.name);
                } else {
                    row.push('');
                }

                // 각 이모지 컬럼
                fixedEmojiOrder.forEach(emojiName => {
                    const participantEmojiRecords = sortedRecords
                        .filter(r => r.participant === participant.name && r.name === emojiName)
                        .sort((a, b) => a.timestamp - b.timestamp);

                    if (rowIdx < participantEmojiRecords.length) {
                        row.push(participantEmojiRecords[rowIdx].time.split(' ')[1]);
                        hasAnyData = true;
                    } else {
                        row.push('');
                    }
                });

            // 데이터가 있는 행만 추가
            if (hasAnyData) {
                sheetData.push(row);
            }
        }
    });

        // 시트 생성
        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        // 컬럼 너비 설정
        const colWidths = [
            { wch: 20 }, // 미팅제목
            { wch: 30 }, // 이메일
            { wch: 18 }, // 참여자 이름
            ...fixedEmojiOrder.map(() => ({ wch: 20 })) // 이모지 컬럼들
        ];
        ws['!cols'] = colWidths;

        // 시트를 워크북에 추가
        const sheetName = meeting.name || '미정';
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // 엑셀 시트 이름은 31자 제한
    });

    // 엑셀 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `미팅-기록-${today}.xlsx`);

    alert('엑셀 파일이 다운로드되었습니다!');
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

    // 엑셀로 내보내기 버튼
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

    // 참여자 추가 버튼
    document.getElementById('addParticipantBtn').addEventListener('click', addParticipant);

    // Enter 키로 참여자 추가
    document.getElementById('participantInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addParticipant();
        }
    });

    document.getElementById('participantEmailInput').addEventListener('keypress', function(e) {
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

    // 미팅 시작 버튼
    document.getElementById('startMeetingBtn').addEventListener('click', startMeeting);

    // 참여 요건 추가 버튼
    document.getElementById('addRequirementBtn').addEventListener('click', addRequirement);

    // Enter 키로 참여 요건 추가
    document.getElementById('requirementInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addRequirement();
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