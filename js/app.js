let ohaengChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('saju-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // 폼 제출로 인한 새로고침 방지
        
        const dateInput = document.getElementById('birth-date').value;
        const timeInput = document.getElementById('birth-time').value;
        
        if(!dateInput || !timeInput) {
            alert("생년월일과 태어난 시간을 모두 입력해주세요.");
            return;
        }
        
        const [year, month, day] = dateInput.split('-').map(Number);
        const [hour, minute] = timeInput.split(':').map(Number);
        
        try {
            // 사주 분석 실행 (window 전역 함수 호출)
            const result = window.analyzeSaju(year, month, day, hour, minute);
            
            // UI 업데이트
            renderDashboard(result);
            
            // 뷰 전환
            document.getElementById('input-section').style.display = 'none';
            const dashboard = document.getElementById('dashboard-section');
            dashboard.classList.add('active');
            
            // 차트 렌더링
            setTimeout(() => renderChart(result.ohaeng), 100);
            
        } catch (error) {
            console.error("분석 중 오류 발생:", error);
            alert("사주 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    });
});

function renderDashboard(result) {
    const container = document.getElementById('pillars-container');
    container.innerHTML = '';
    
    const pillarsArr = [
        { label: '연주 (Year)', value: result.pillars.year },
        { label: '월주 (Month)', value: result.pillars.month },
        { label: '일주 (Day)', value: result.pillars.day },
        { label: '시주 (Time)', value: result.pillars.time }
    ];
    
    pillarsArr.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'pillar-card';
        card.style.animation = `fadeInUp 0.5s ease-out ${index * 0.1}s both`;
        
        card.innerHTML = `
            <div class="label">${p.label}</div>
            <div class="ganji">${p.value}</div>
        `;
        container.appendChild(card);
    });
    
    document.getElementById('geokguk-badge').innerHTML = `<span class="badge">${result.geokguk.name}</span>`;
    document.getElementById('geokguk-desc').textContent = result.geokguk.desc;
    
    const gilshinContainer = document.getElementById('gilshin-badges');
    gilshinContainer.innerHTML = '';
    if(result.gilshin.length > 0) {
        // 중복 제거
        const uniqueGilshin = [...new Map(result.gilshin.map(item => [item['name'], item])).values()];
        uniqueGilshin.forEach(g => {
            gilshinContainer.innerHTML += `<span class="badge" style="background: rgba(167, 139, 250, 0.1); color: var(--accent-purple); border-color: rgba(167, 139, 250, 0.3);">${g.name}</span>`;
        });
        document.getElementById('gilshin-desc').textContent = uniqueGilshin.map(g => g.desc).join(' ');
    } else {
        gilshinContainer.innerHTML = `<span class="badge" style="background: rgba(255,255,255,0.1); color: #fff;">숨은 길신 대기중</span>`;
        document.getElementById('gilshin-desc').textContent = '현재 사주 원국에서 강력한 특수 길신이 겉으로 드러나지 않았으나, 대운의 흐름에 따라 언제든 발현될 수 있습니다.';
    }
    
    document.getElementById('ilju-desc').textContent = result.ilju.desc;
}

function renderChart(ohaengData) {
    const ctx = document.getElementById('ohaeng-chart').getContext('2d');
    
    if (ohaengChartInstance) {
        ohaengChartInstance.destroy();
    }
    
    const labels = ohaengData.map(d => d.name);
    const data = ohaengData.map(d => d.value);
    const colors = ohaengData.map(d => d.color);
    
    const maxOhaeng = [...ohaengData].sort((a, b) => b.value - a.value)[0];
    document.getElementById('ohaeng-interpretation').innerHTML = `
        당신의 사주에서 가장 강력한 에너지는 <strong style="color: ${maxOhaeng.color}">${maxOhaeng.name}</strong>입니다.<br>
        비율을 기반으로 본인만의 특성을 확인해보세요.
    `;

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Pretendard', sans-serif";

    ohaengChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw}%`;
                        }
                    }
                }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}
