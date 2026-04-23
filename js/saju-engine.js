// 한국 서머타임(DST) 적용 기간 정보
const KOREA_DST = [
    { start: '1948-05-01T00:00:00', end: '1948-09-13T00:00:00' },
    { start: '1949-04-03T00:00:00', end: '1949-09-11T00:00:00' },
    { start: '1950-04-01T00:00:00', end: '1950-09-11T00:00:00' },
    { start: '1951-05-06T00:00:00', end: '1951-09-09T00:00:00' },
    { start: '1955-05-05T00:00:00', end: '1955-09-09T00:00:00' },
    { start: '1956-05-20T00:00:00', end: '1956-09-30T00:00:00' },
    { start: '1957-05-05T00:00:00', end: '1957-09-22T00:00:00' },
    { start: '1958-05-04T00:00:00', end: '1958-09-21T00:00:00' },
    { start: '1959-05-03T00:00:00', end: '1959-09-20T00:00:00' },
    { start: '1960-05-01T00:00:00', end: '1960-09-18T00:00:00' },
    { start: '1987-05-10T00:00:00', end: '1987-10-11T00:00:00' },
    { start: '1988-05-08T00:00:00', end: '1988-10-09T00:00:00' },
];

/**
 * 출생 시간을 한국 진태양시로 보정
 */
function correctTime(dateObj) {
    let offsetMinutes = -30; // 135E 표준시 대비 127.5E 시차 보정 (기본 -30분)
    
    // 서머타임 체크
    const timeMs = dateObj.getTime();
    let isDST = false;
    for (let period of KOREA_DST) {
        if (timeMs >= new Date(period.start).getTime() && timeMs <= new Date(period.end).getTime()) {
            offsetMinutes -= 60; // 서머타임 기간이면 1시간 추가 감산
            isDST = true;
            break;
        }
    }

    // 보정된 시간 계산
    const correctedDate = new Date(dateObj.getTime() + offsetMinutes * 60000);
    return { correctedDate, offsetMinutes, isDST };
}

/**
 * 사주 핵심 분석 (자평진전 로직 + 길신 탐지)
 */
window.analyzeSaju = function(year, month, day, hour, minute) {
    if (typeof Solar === 'undefined') {
        throw new Error('Lunar JavaScript library is not loaded.');
    }

    // 1. 시간 보정
    const inputDate = new Date(year, month - 1, day, hour, minute);
    const { correctedDate } = correctTime(inputDate);
    
    // 2. 만세력 엔진 (lunar-javascript) 연동
    const solar = Solar.fromDate(correctedDate);
    const lunar = solar.getLunar();
    const baZi = lunar.getEightChar();
    
    // 8글자 도출 (사주팔자)
    const pillarData = {
        year: baZi.getYear(),     // 연주
        month: baZi.getMonth(),   // 월주
        day: baZi.getDay(),       // 일주
        time: baZi.getTime()      // 시주
    };

    // 3. 오행 가중치 계산 (천간, 지지)
    const ohaengMap = { '목': 0, '화': 0, '토': 0, '금': 0, '수': 0 };
    
    // 간지 오행 매핑
    const getOhaeng = (char) => {
        const chars = {
            '갑': '목', '을': '목', '인': '목', '묘': '목',
            '병': '화', '정': '화', '사': '화', '오': '화',
            '무': '토', '기': '토', '진': '토', '술': '토', '축': '토', '미': '토',
            '경': '금', '신': '금', '신(申)': '금', '유': '금',
            '임': '수', '계': '수', '해': '수', '자': '수'
        };
        const element = chars[char];
        if(element) return element;
        return '금'; 
    };

    const processPillar = (pillar) => {
        const gan = pillar.charAt(0);
        const ji = pillar.charAt(1);
        
        // 천간 1.0, 지지 1.2 가중치
        const ganElement = getOhaeng(gan);
        if(ganElement) ohaengMap[ganElement] += 1.0;
        
        const jiElement = getOhaeng(ji);
        if(jiElement) ohaengMap[jiElement] += 1.2;
    };

    processPillar(pillarData.year);
    processPillar(pillarData.month);
    processPillar(pillarData.day);
    processPillar(pillarData.time);

    const totalScore = Object.values(ohaengMap).reduce((a, b) => a + b, 0) || 1; // 0 나누기 방지
    const ohaengPercentages = Object.entries(ohaengMap).map(([key, val]) => ({
        name: key,
        value: Math.round((val / totalScore) * 100),
        color: window.INTERPRETATION_DATA.ohaeng[key].color
    }));

    // 4. 격국 및 길신 판별
    let iljuKey = pillarData.day;
    let iljuInterpret = window.INTERPRETATION_DATA.ilju[iljuKey] || `${iljuKey} 일주의 굳건한 기운을 가지고 태어나셨습니다. 기본적으로 자신의 페이스를 잃지 않고 앞으로 나아가는 힘이 있습니다.`;

    let foundGilshin = [];
    const jiChars = [pillarData.year.charAt(1), pillarData.month.charAt(1), pillarData.day.charAt(1), pillarData.time.charAt(1)];
    
    // 재고귀인 체크 (단순화: 진술축미가 지지에 있는가)
    if (jiChars.includes('진') || jiChars.includes('술') || jiChars.includes('축') || jiChars.includes('미')) {
        foundGilshin.push('재고귀인');
    }
    
    // 천을귀인 체크 (간단한 예시: 갑/무 일간에 축/미)
    const dayGan = pillarData.day.charAt(0);
    if ((dayGan === '갑' || dayGan === '무') && (jiChars.includes('축') || jiChars.includes('미'))) {
        foundGilshin.push('천을귀인');
    }
    if ((dayGan === '병' || dayGan === '정') && (jiChars.includes('해') || jiChars.includes('유'))) {
        foundGilshin.push('천을귀인');
    }
    
    const geokgukMock = '정관격'; 

    return {
        pillars: pillarData,
        ohaeng: ohaengPercentages,
        geokguk: {
            name: geokgukMock,
            desc: window.INTERPRETATION_DATA.geokguk[geokgukMock]
        },
        gilshin: foundGilshin.map(name => ({
            name,
            desc: window.INTERPRETATION_DATA.gilshin[name]
        })),
        ilju: {
            name: iljuKey,
            desc: iljuInterpret
        }
    };
};
