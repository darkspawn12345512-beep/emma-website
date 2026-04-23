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

    // 한자 -> 한글 간지 변환 맵
    const CHINESE_TO_KOREAN = {
        '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
        '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'
    };

    const toKorean = (str) => {
        if (!str) return '';
        return str.split('').map(c => CHINESE_TO_KOREAN[c] || c).join('');
    };

    // 천간 및 지지 속성 정의
    const GAN_PROPS = {
        '갑': { ohaeng: '목', color: 'var(--color-mok)', yinYang: '+' },
        '을': { ohaeng: '목', color: 'var(--color-mok)', yinYang: '-' },
        '병': { ohaeng: '화', color: 'var(--color-hwa)', yinYang: '+' },
        '정': { ohaeng: '화', color: 'var(--color-hwa)', yinYang: '-' },
        '무': { ohaeng: '토', color: 'var(--color-to)', yinYang: '+' },
        '기': { ohaeng: '토', color: 'var(--color-to)', yinYang: '-' },
        '경': { ohaeng: '금', color: 'var(--color-geum)', yinYang: '+' },
        '신': { ohaeng: '금', color: 'var(--color-geum)', yinYang: '-' },
        '임': { ohaeng: '수', color: 'var(--color-su)', yinYang: '+' },
        '계': { ohaeng: '수', color: 'var(--color-su)', yinYang: '-' }
    };

    const JI_PROPS = {
        '자': { ohaeng: '수', color: 'var(--color-su)', yinYang: '-' },
        '축': { ohaeng: '토', color: 'var(--color-to)', yinYang: '-' },
        '인': { ohaeng: '목', color: 'var(--color-mok)', yinYang: '+' },
        '묘': { ohaeng: '목', color: 'var(--color-mok)', yinYang: '-' },
        '진': { ohaeng: '토', color: 'var(--color-to)', yinYang: '+' },
        '사': { ohaeng: '화', color: 'var(--color-hwa)', yinYang: '+' },
        '오': { ohaeng: '화', color: 'var(--color-hwa)', yinYang: '-' },
        '미': { ohaeng: '토', color: 'var(--color-to)', yinYang: '-' },
        '신': { ohaeng: '금', color: 'var(--color-geum)', yinYang: '+' },
        '유': { ohaeng: '금', color: 'var(--color-geum)', yinYang: '-' },
        '술': { ohaeng: '토', color: 'var(--color-to)', yinYang: '+' },
        '해': { ohaeng: '수', color: 'var(--color-su)', yinYang: '-' }
    };

    // 십신(육친) 도출 함수
    const OH_CYCLE = ['목', '화', '토', '금', '수'];
    const getTenGod = (dayGanProps, targetProps) => {
        if (!dayGanProps || !targetProps) return '';
        const dayIdx = OH_CYCLE.indexOf(dayGanProps.ohaeng);
        const targetIdx = OH_CYCLE.indexOf(targetProps.ohaeng);
        const diff = (targetIdx - dayIdx + 5) % 5;
        const sameYinYang = dayGanProps.yinYang === targetProps.yinYang;

        switch (diff) {
            case 0: return sameYinYang ? '비견' : '겁재';
            case 1: return sameYinYang ? '식신' : '상관';
            case 2: return sameYinYang ? '편재' : '정재';
            case 3: return sameYinYang ? '편관' : '정관';
            case 4: return sameYinYang ? '편인' : '정인';
            default: return '';
        }
    };

    // 1. 시간 보정
    const inputDate = new Date(year, month - 1, day, hour, minute);
    const { correctedDate } = correctTime(inputDate);
    
    // 2. 만세력 엔진 연동
    const solar = Solar.fromDate(correctedDate);
    const lunar = solar.getLunar();
    const baZi = lunar.getEightChar();
    
    // 8글자 도출 (사주팔자) - 상세 객체로 변환
    const yearStr = toKorean(baZi.getYear());
    const monthStr = toKorean(baZi.getMonth());
    const dayStr = toKorean(baZi.getDay());
    const timeStr = toKorean(baZi.getTime());

    const getPillarDetail = (pillarStr) => {
        const gan = pillarStr.charAt(0);
        const ji = pillarStr.charAt(1);
        return {
            gan: { char: gan, ...GAN_PROPS[gan] },
            ji: { char: ji, ...JI_PROPS[ji] }
        };
    };

    const dayDetail = getPillarDetail(dayStr);
    const dayGanProps = dayDetail.gan;

    const attachTenGods = (detail, isDayPillar = false) => {
        detail.gan.tenGod = isDayPillar ? '일간(나)' : getTenGod(dayGanProps, detail.gan);
        detail.ji.tenGod = getTenGod(dayGanProps, detail.ji);
        return detail;
    };

    const pillarData = {
        year: attachTenGods(getPillarDetail(yearStr)),
        month: attachTenGods(getPillarDetail(monthStr)),
        day: attachTenGods(dayDetail, true),
        time: attachTenGods(getPillarDetail(timeStr))
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
