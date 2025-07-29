let characters = [
    {
        id: 1,
        name: 'Сергей',
        role: 'player',
        stats: [8, 2, 6, 7, 6],
        statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
        color: {background: 'rgba(163,138,255,0.3)', border: '#6228d6'}
    },
    {
        id: 2,
        name: 'Дима',
        role: 'player',
        stats: [8, 3, 7, 8, 8],
        statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
        color: {background: 'rgba(255, 107, 107, 0.3)', border: '#ff6b6b'}
    },
    {
        id: 3,
        name: 'Витя',
        role: 'player',
        stats: [6, 7, 4, 7, 2],
        statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
        color: {background: 'rgba(78, 205, 196, 0.3)', border: '#4ecdc4'}
    },
    {
        id: 4,
        name: 'Денис',
        role: 'player',
        stats: [2, 2, 8, 2, 7],
        statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
        color: {background: 'rgba(69, 183, 209, 0.3)', border: '#45b7d1'}
    },
    {
        id: 5,
        name: 'Настя',
        role: 'dm',
        stats: [8, 8, 3, 9, 3],
        statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
        color: {background: 'rgba(153, 102, 255, 0.3)', border: '#9966ff'}
    }
];

let globalStatLabels = [
    'Ролеплей/Нарратив',
    'Импровизация',
    'Знание правил',
    'Социальность/Справедливость',
    'Тактика/Подготовка'
];

let globalStatShortLabels = ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'];

const statDescriptions = {
    'Ролеплей': 'Способность глубоко вживаться в роль персонажа, создавая убедительную историю.',
    'Импровизация': 'Умение быстро реагировать и придумывать решения в неожиданных ситуациях.',
    'Правила': 'Знание игровой механики и правил системы настольной ролевой игры.',
    'Социальность': 'Навыки взаимодействия с другими игроками, поддержание атмосферы и справедливости.',
    'Тактика': 'Умение планировать действия и эффективно использовать игровые ресурсы.'
};

const playerColors = [
    {background: 'rgba(255, 107, 107, 0.3)', border: '#ff6b6b'},
    {background: 'rgba(78, 205, 196, 0.3)', border: '#4ecdc4'},
    {background: 'rgba(69, 183, 209, 0.3)', border: '#45b7d1'},
    {background: 'rgba(163,138,255,0.3)', border: '#6228d6'},
    {background: 'rgba(255, 193, 7, 0.3)', border: '#ffc107'},
    {background: 'rgba(233, 30, 99, 0.3)', border: '#e91e63'}
];

let nextId = 6;
let chartInstances = {};
let comparisonChart = null;
let visibleCharacters = characters.map(c => c.id);
let scoreSystem = '0-10';

function wrapText(text, maxLength) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length > maxLength) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });

    if (currentLine) lines.push(currentLine.trim());
    return lines;
}

function createLabelsEditor() {
    const container = document.getElementById('labels-editor');
    container.innerHTML = '';
    globalStatShortLabels.forEach((label, i) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="text" class="stat-name-input" value="${label}"
                   placeholder="${globalStatLabels[i]}" onchange="updateGlobalStatLabel(${i}, this.value)">
        `;
        container.appendChild(div);
    });
}

function updateGlobalStatLabel(index, value) {
    if (value.trim() === '') {
        globalStatShortLabels[index] = globalStatLabels[index].split('/')[0].trim();
    } else {
        globalStatShortLabels[index] = value.trim();
    }
    globalStatLabels[index] = globalStatShortLabels[index];

    characters.forEach(character => {
        character.statsLabels[index] = globalStatShortLabels[index];
        const chart = chartInstances[character.id];
        if (chart) {
            chart.data.labels[index] = globalStatShortLabels[index];
            chart.update();
        }
    });

    if (comparisonChart) {
        comparisonChart.data.labels[index] = globalStatShortLabels[index];
        comparisonChart.update();
    }

    updateAllCards();
}

function updateCharacterStatLabel(characterId, index, value) {
    const character = characters.find(c => c.id === characterId);
    if (character) {
        if (value.trim() === '') {
            character.statsLabels[index] = globalStatShortLabels[index];
        } else {
            character.statsLabels[index] = value.trim();
        }
        const chart = chartInstances[characterId];
        if (chart) {
            chart.data.labels[index] = character.statsLabels[index];
            chart.update();
        }
        if (comparisonChart) {
            comparisonChart.update();
        }
    }
}

function changeScoreSystem(newSystem) {
    if (newSystem === scoreSystem) return;

    const oldSystem = scoreSystem;
    scoreSystem = newSystem;
    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;

    characters.forEach(character => {
        character.stats = character.stats.map(stat => {
            if (oldSystem === '0-10' && newSystem === '-5-5') {
                return (stat - 5) * 1;
            } else if (oldSystem === '-5-5' && newSystem === '0-10') {
                return (stat + 5) * 1;
            }
            return stat;
        });
        const chart = chartInstances[character.id];
        if (chart) {
            chart.data.datasets[0].data = character.stats;
            chart.options.scales.r.min = minValue;
            chart.options.scales.r.max = maxValue;
            chart.options.scales.r.beginAtZero = scoreSystem === '0-10';
            chart.options.scales.r.ticks.stepSize = scoreSystem === '0-10' ? 2 : 2;
            chart.update();
        }
    });

    if (comparisonChart) {
        comparisonChart.data.datasets = characters
            .filter(c => visibleCharacters.includes(c.id))
            .map(c => ({
                label: `${c.role === 'dm' ? 'ДМ ' : ''}${c.name}`,
                data: c.stats,
                backgroundColor: c.color.background,
                borderColor: c.color.border,
                borderWidth: 2,
                pointBackgroundColor: c.color.border,
                pointBorderColor: '#fff',
                pointRadius: 5
            }));
        comparisonChart.options.scales.r.min = minValue;
        comparisonChart.options.scales.r.max = maxValue;
        comparisonChart.options.scales.r.beginAtZero = scoreSystem === '0-10';
        comparisonChart.options.scales.r.ticks.stepSize = scoreSystem === '0-10' ? 2 : 2;
        comparisonChart.update();
    }

    updateAllCards();
}

function updateAllCards() {
    const container = document.getElementById('charts-container');
    container.innerHTML = '';
    characters.forEach(character => createCharacterCard(character));
}

function createSVGRadarChart(container, character, isComparison = false) {
    const size = 380;
    const center = size / 2;
    const maxRadius = size * 0.35;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'radar-svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', '380');
    svg.setAttribute('height', '380');

    container.innerHTML = '';

    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;
    const step = scoreSystem === '0-10' ? 2 : 2;
    const ticks = (maxValue - minValue) / step;

    for (let i = 0; i <= ticks; i++) {
        const radius = (maxRadius * i) / ticks;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', center);
        circle.setAttribute('cy', center);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        circle.setAttribute('stroke-width', '1');
        svg.appendChild(circle);

        const labelValue = minValue + (i * step);
        const labelY = center - radius - 10;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', center);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '10px');
        text.textContent = labelValue;
        svg.appendChild(text);
    }

    const angleStep = (2 * Math.PI) / globalStatShortLabels.length;
    for (let i = 0; i < globalStatShortLabels.length; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const x2 = center + maxRadius * Math.cos(angle);
        const y2 = center + maxRadius * Math.sin(angle);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', center);
        line.setAttribute('y1', center);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);

        const labelX = center + (maxRadius + 40) * Math.cos(angle);
        const labelY = center + (maxRadius + 40) * Math.sin(angle);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '12px');
        text.setAttribute('font-weight', 'bold');

        const labelText = isComparison ? globalStatShortLabels[i] : (character ? character.statsLabels[i] : globalStatShortLabels[i]);
        const lines = wrapText(labelText, 12);
        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.setAttribute('x', labelX);
            tspan.setAttribute('dy', index === 0 ? '-0.5em' : '1em');
            if (index === 0) tspan.setAttribute('y', labelY);
            tspan.textContent = line;
            text.appendChild(tspan);
        });

        if (isComparison && statDescriptions[labelText]) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = statDescriptions[labelText];
            text.appendChild(title);
        }

        svg.appendChild(text);
    }

    if (isComparison) {
        characters.forEach(char => {
            if (visibleCharacters.includes(char.id)) {
                createDataPolygon(svg, char, center, maxRadius, angleStep);
            }
        });
    } else {
        createDataPolygon(svg, character, center, maxRadius, angleStep);
    }

    container.appendChild(svg);
}

function createDataPolygon(svg, character, center, maxRadius, angleStep) {
    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;
    const points = [];
    for (let i = 0; i < character.stats.length; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const value = character.stats[i];
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const radius = maxRadius * normalizedValue;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', character.color.background);
    polygon.setAttribute('stroke', character.color.border);
    polygon.setAttribute('stroke-width', '2');
    polygon.setAttribute('class', 'data-polygon');
    svg.appendChild(polygon);

    for (let i = 0; i < character.stats.length; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const value = character.stats[i];
        const normalizedValue = (value - minValue) / (maxValue - minValue);
        const radius = maxRadius * normalizedValue;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', character.color.border);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'data-point');
        svg.appendChild(circle);
    }
}

function createCharacterCard(character) {
    const container = document.getElementById('charts-container');
    const cardDiv = document.createElement('div');
    cardDiv.className = `chart-card ${character.role}-card`;
    cardDiv.id = `card-${character.id}`;

    const minValue = scoreSystem === '0-10' ? 0 : -5;
    const maxValue = scoreSystem === '0-10' ? 10 : 5;

    cardDiv.innerHTML = `
        <button class="delete-btn" onclick="deleteCharacter(${character.id})">×</button>
        <div class="chart-header">
            <span class="role-badge ${character.role}-badge">
                ${character.role === 'player' ? '🎲 Игрок' : '🎭 ДМ'}
            </span>
            <input type="text" class="name-input chart-title" value="${character.name}"
                   onchange="updateCharacterName(${character.id}, this.value)">
        </div>
        <div class="chart-canvas">
            <div class="radar-chart" id="chart-${character.id}"></div>
        </div>
        <div class="stats-editor">
            ${character.stats.map((stat, i) => `
                <div class="stat-editor">
                    <input type="text" class="stat-name-input" value="${character.statsLabels[i]}"
                           onchange="updateCharacterStatLabel(${character.id}, ${i}, this.value)">
                    <input type="number" class="stat-input" min="${minValue}" max="${maxValue}" value="${stat}"
                           onchange="updateStat(${character.id}, ${i}, parseInt(this.value))">
                    <input type="range" class="stat-slider" min="${minValue}" max="${maxValue}" value="${stat}"
                           oninput="updateStat(${character.id}, ${i}, parseInt(this.value)); this.previousElementSibling.value = this.value">
                </div>
            `).join('')}
        </div>
    `;

    container.appendChild(cardDiv);
    updateChart(character);
    updateCharacterToggles();
    updateExportMenu();
}

function updateChart(character) {
    const chartContainer = document.getElementById(`chart-${character.id}`);
    if (!chartContainer) return;

    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;

    if (typeof Chart !== 'undefined') {
        if (chartInstances[character.id]) {
            chartInstances[character.id].destroy();
        }

        const canvas = document.createElement('canvas');
        canvas.width = 380;
        canvas.height = 380;
        chartContainer.innerHTML = '';
        chartContainer.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        chartInstances[character.id] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: character.statsLabels,
                datasets: [{
                    label: character.name,
                    data: character.stats,
                    backgroundColor: character.color.background,
                    borderColor: character.color.border,
                    borderWidth: 3,
                    pointBackgroundColor: character.color.border,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: true,
                animation: {
                    duration: 800,
                    easing: 'easeOutCubic'
                },
                scales: {
                    r: {
                        beginAtZero: scoreSystem === '0-10',
                        min: minValue,
                        max: maxValue,
                        ticks: {
                            stepSize: scoreSystem === '0-10' ? 2 : 2,
                            backdropColor: 'rgba(0, 0, 0, 0)',
                            color: 'rgba(255, 255, 255, 0.7)'
                        },
                        pointLabels: {
                            font: {size: 12, weight: 'bold'},
                            color: '#ffffff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {display: false}
                }
            }
        });
    } else {
        createSVGRadarChart(chartContainer, character);
    }
}

function updateCharacterToggles() {
    const container = document.getElementById('character-toggles');
    container.innerHTML = '';
    characters.forEach(character => {
        const div = document.createElement('div');
        div.className = 'character-toggle';
        div.innerHTML = `
            <input type="checkbox" id="toggle-${character.id}" 
                   ${visibleCharacters.includes(character.id) ? 'checked' : ''} 
                   onchange="toggleCharacterVisibility(${character.id}, this.checked)">
            <label for="toggle-${character.id}">${character.role === 'dm' ? '🎭' : '🎲'} ${character.name}</label>
        `;

        div.addEventListener('click', function(e) {
            // Предотвращаем двойное срабатывание, если клик по checkbox или label
            if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL') return;

            const checkbox = div.querySelector('input[type="checkbox"]');
            checkbox.checked = !checkbox.checked;
            toggleCharacterVisibility(character.id, checkbox.checked);
        });

        container.appendChild(div);
    });
}

function toggleCharacterVisibility(characterId, isVisible) {
    if (isVisible) {
        if (!visibleCharacters.includes(characterId)) {
            visibleCharacters.push(characterId);
        }
    } else {
        visibleCharacters = visibleCharacters.filter(id => id !== characterId);
    }
    updateComparisonChart();
}

function updateComparisonChart() {
    const chartContainer = document.getElementById('comparison-chart');
    if (!chartContainer) return;

    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;

    if (typeof Chart !== 'undefined') {
        if (comparisonChart) {
            comparisonChart.data.datasets = characters
                .filter(character => visibleCharacters.includes(character.id))
                .map(character => ({
                    label: `${character.role === 'dm' ? 'ДМ ' : ''}${character.name}`,
                    data: character.stats,
                    backgroundColor: character.color.background,
                    borderColor: character.color.border,
                    borderWidth: 2,
                    pointBackgroundColor: character.color.border,
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }));
            comparisonChart.update();
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 380;
            canvas.height = 380;
            chartContainer.innerHTML = '';
            chartContainer.appendChild(canvas);
            const ctx = canvas.getContext('2d');

            comparisonChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: globalStatShortLabels,
                    datasets: characters
                        .filter(character => visibleCharacters.includes(character.id))
                        .map(character => ({
                            label: `${character.role === 'dm' ? 'ДМ ' : ''}${character.name}`,
                            data: character.stats,
                            backgroundColor: character.color.background,
                            borderColor: character.color.border,
                            borderWidth: 2,
                            pointBackgroundColor: character.color.border,
                            pointBorderColor: '#fff',
                            pointRadius: 5
                        }))
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: true,
                    animation: {
                        duration: 800,
                        easing: 'easeOutCubic'
                    },
                    scales: {
                        r: {
                            beginAtZero: scoreSystem === '0-10',
                            min: minValue,
                            max: maxValue,
                            ticks: {
                                stepSize: scoreSystem === '0-10' ? 2 : 2,
                                backdropColor: 'rgba(0, 0, 0, 0)',
                                color: 'rgba(255, 255, 255, 0.7)'
                            },
                            pointLabels: {
                                font: {size: 12, weight: 'bold'},
                                color: '#ffffff'
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.2)'
                            },
                            angleLines: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                font: {size: 12},
                                padding: 15
                            }
                        }
                    }
                }
            });
        }
    } else {
        createSVGRadarChart(chartContainer, null, true);
    }
}

function updateStat(characterId, statIndex, value) {
    const maxValue = scoreSystem === '0-10' ? 10 : 5;
    const minValue = scoreSystem === '0-10' ? 0 : -5;
    value = Math.max(minValue, Math.min(maxValue, value));
    const character = characters.find(c => c.id === characterId);
    if (character) {
        character.stats[statIndex] = value;

        const chart = chartInstances[characterId];
        if (chart) {
            chart.data.datasets[0].data[statIndex] = value;
            chart.update();
        } else {
            const chartContainer = document.getElementById(`chart-${characterId}`);
            if (chartContainer) {
                createSVGRadarChart(chartContainer, character);
            }
        }

        if (comparisonChart) {
            const datasetIndex = comparisonChart.data.datasets.findIndex(
                ds => ds.label === `${character.role === 'dm' ? 'ДМ ' : ''}${character.name}`
            );
            if (datasetIndex !== -1) {
                comparisonChart.data.datasets[datasetIndex].data[statIndex] = value;
                comparisonChart.update();
            }
        } else {
            const chartContainer = document.getElementById('comparison-chart');
            if (chartContainer) {
                createSVGRadarChart(chartContainer, null, true);
            }
        }

        const card = document.getElementById(`card-${characterId}`);
        const statEditor = card.querySelector(`.stat-editor:nth-child(${statIndex + 1})`);
        const numberInput = statEditor.querySelector('.stat-input');
        const sliderInput = statEditor.querySelector('.stat-slider');
        numberInput.value = value;
        sliderInput.value = value;
    }
}

function updateCharacterName(characterId, name) {
    const character = characters.find(c => c.id === characterId);
    if (character) {
        const oldName = character.name;
        character.name = name;
        const chart = chartInstances[characterId];
        if (chart) {
            chart.data.datasets[0].label = name;
            chart.update();
        }
        if (comparisonChart) {
            const datasetIndex = comparisonChart.data.datasets.findIndex(
                ds => ds.label === `${character.role === 'dm' ? 'ДМ ' : ''}${oldName}`
            );
            if (datasetIndex !== -1) {
                comparisonChart.data.datasets[datasetIndex].label = `${character.role === 'dm' ? 'ДМ ' : ''}${name}`;
                comparisonChart.update();
            }
        }
        updateCharacterToggles();
        updateExportMenu();
    }
}

function addPlayer() {
    const colorIndex = characters.filter(c => c.role === 'player').length % playerColors.length;
    const defaultStats = scoreSystem === '0-10' ? [5, 5, 5, 5, 5] : [0, 0, 0, 0, 0];
    const newPlayer = {
        id: nextId++,
        name: 'Новый игрок',
        role: 'player',
        stats: defaultStats,
        statsLabels: [...globalStatShortLabels],
        color: playerColors[colorIndex]
    };
    characters.push(newPlayer);
    visibleCharacters.push(newPlayer.id);
    createCharacterCard(newPlayer);
    updateComparisonChart();
}

function addDM() {
    const defaultStats = scoreSystem === '0-10' ? [5, 5, 5, 5, 5] : [0, 0, 0, 0, 0];
    const newDM = {
        id: nextId++,
        name: 'Новый ДМ',
        role: 'dm',
        stats: defaultStats,
        statsLabels: [...globalStatShortLabels],
        color: {background: 'rgba(153, 102, 255, 0.3)', border: '#9966ff'}
    };
    characters.push(newDM);
    visibleCharacters.push(newDM.id);
    createCharacterCard(newDM);
    updateComparisonChart();
}

function deleteCharacter(characterId) {
    if (confirm('Удалить этого персонажа?')) {
        characters = characters.filter(c => c.id !== characterId);
        visibleCharacters = visibleCharacters.filter(id => id !== characterId);
        const card = document.getElementById(`card-${characterId}`);
        if (card) {
            card.remove();
        }
        if (chartInstances[characterId]) {
            chartInstances[characterId].destroy();
            delete chartInstances[characterId];
        }
        updateComparisonChart();
        updateCharacterToggles();
        updateExportMenu();
    }
}

function saveTeamToURL() {
    const teamData = {
        characters: characters.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            stats: c.stats,
            statsLabels: c.statsLabels,
            color: c.color
        })),
        globalStatLabels,
        scoreSystem
    };
    const jsonString = JSON.stringify(teamData);
    const compressed = pako.gzip(jsonString);
    const base64Data = btoa(String.fromCharCode.apply(null, compressed));
    const url = `${window.location.origin}${window.location.pathname}?team=${encodeURIComponent(base64Data)}`;

    navigator.clipboard.writeText(url).then(() => {
        alert('Ссылка на профили команды скопирована в буфер обмена!');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        alert(`Ссылка: ${url}\nСкопируйте её вручную.`);
    });
}

function loadTeamFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const teamData = urlParams.get('team');
    if (teamData) {
        try {
            const decoded = decodeURIComponent(teamData);
            const binary = atob(decoded);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }
            const jsonString = pako.ungzip(bytes, { to: 'string' });
            const data = JSON.parse(jsonString);

            characters = data.characters || [];
            globalStatLabels = data.globalStatLabels || globalStatLabels;
            globalStatShortLabels = globalStatLabels.map(label => label.split('/')[0].trim());
            scoreSystem = data.scoreSystem || '0-10';
            nextId = characters.length > 0 ? Math.max(...characters.map(c => c.id)) + 1 : 1;
            visibleCharacters = characters.map(c => c.id);

            document.getElementById('score-system').value = scoreSystem;
        } catch (e) {
            console.error('Ошибка загрузки данных из URL:', e);
            alert('Не удалось загрузить профили команды. Проверьте ссылку.');
        }
    }
}

function resetAll() {
    if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
        characters = [];
        visibleCharacters = [];
        globalStatLabels = [
            'Ролеплей/Нарратив',
            'Импровизация',
            'Знание правил',
            'Социальность/Справедливость',
            'Тактика/Подготовка'
        ];
        globalStatShortLabels = ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'];
        scoreSystem = '0-10';
        nextId = 1;

        document.getElementById('score-system').value = '0-10';
        document.getElementById('charts-container').innerHTML = '';
        document.getElementById('character-toggles').innerHTML = '';
        document.getElementById('comparison-chart').innerHTML = '';
        Object.values(chartInstances).forEach(chart => chart.destroy());
        chartInstances = {};
        if (comparisonChart) {
            comparisonChart.destroy();
            comparisonChart = null;
        }
        createLabelsEditor();
        updateAllCards();
        updateCharacterToggles();
        updateComparisonChart();
        updateExportMenu();
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function updateExportMenu() {
    const individualExports = document.getElementById('individual-exports');
    individualExports.innerHTML = '';

    characters.forEach(character => {
        const option = document.createElement('div');
        option.className = 'export-option';
        option.innerHTML = `${character.role === 'dm' ? '🎭' : '🎲'} ${character.name}`;
        option.onclick = () => exportCharacterChart(character.id);
        individualExports.appendChild(option);
    });
}

function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    menu.classList.toggle('show');

    setTimeout(() => {
        const closeMenu = (e) => {
            if (!e.target.closest('.export-dropdown')) {
                menu.classList.remove('show');
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 0);
}

function exportCharacterChart(characterId) {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    const card = document.getElementById(`card-${characterId}`);
    if (!card) return;

    const statEditors = card.querySelectorAll('.stat-editor');
    const originalInputs = [];
    statEditors.forEach((editor, index) => {
        const nameInput = editor.querySelector('.stat-name-input');
        const numberInput = editor.querySelector('.stat-input');
        const sliderInput = editor.querySelector('.stat-slider');

        const nameValue = nameInput.value;
        const numberValue = numberInput.value;

        const nameDiv = document.createElement('div');
        nameDiv.className = 'stat-name-input';
        nameDiv.style.padding = '6px 10px';
        nameDiv.style.textAlign = 'center';
        nameDiv.style.fontSize = '0.8rem';
        nameDiv.textContent = nameValue;

        const numberDiv = document.createElement('div');
        numberDiv.className = 'stat-input';
        numberDiv.style.display = 'flex';
        numberDiv.style.alignItems = 'center';
        numberDiv.style.justifyContent = 'center';
        numberDiv.textContent = numberValue;

        originalInputs.push({nameInput, numberInput, sliderInput});

        nameInput.parentNode.replaceChild(nameDiv, nameInput);
        numberInput.parentNode.replaceChild(numberDiv, numberInput);
        sliderInput.style.display = 'none';
    });

    html2canvas(card, {
        backgroundColor: null,
        scale: 1,
        useCORS: true
    }).then(canvas => {
        statEditors.forEach((editor, index) => {
            const {nameInput, numberInput, sliderInput} = originalInputs[index];
            const nameDiv = editor.querySelector('.stat-name-input');
            const numberDiv = editor.querySelector('.stat-input');

            nameDiv.parentNode.replaceChild(nameInput, nameDiv);
            numberDiv.parentNode.replaceChild(numberInput, numberDiv);
            sliderInput.style.display = '';
        });

        const link = document.createElement('a');
        link.download = `${character.name}_PRGTeamProfile_${scoreSystem}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function exportComparison() {
    const comparisonSection = document.getElementById('comparison-section');
    if (!comparisonSection) return;

    const originalStyle = comparisonSection.style.cssText;

    comparisonSection.style.maxWidth = '600px';
    comparisonSection.style.margin = '0 auto';
    comparisonSection.style.padding = '30px';

    const chartContainer = document.getElementById('comparison-chart');
    let tempCanvas = chartContainer.querySelector('canvas');
    if (!tempCanvas) {
        updateComparisonChart();
        tempCanvas = chartContainer.querySelector('canvas');
    }

    const toggleContainer = document.getElementById('character-toggles');
    const originalToggleDisplay = toggleContainer.style.display;
    toggleContainer.style.display = 'none';

    html2canvas(comparisonSection, {
        backgroundColor: null,
        scale: 1,
        useCORS: true
    }).then(canvas => {
        comparisonSection.style.cssText = originalStyle;
        toggleContainer.style.display = originalToggleDisplay;

        const link = document.createElement('a');
        link.download = `PRGTeamAllProfile_${scoreSystem}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function exportAllCharts() {
    const zip = new JSZip();
    const promises = [];

    characters.forEach(character => {
        const card = document.getElementById(`card-${character.id}`);
        if (card) {
            const statEditors = card.querySelectorAll('.stat-editor');
            const originalInputs = [];
            statEditors.forEach((editor, index) => {
                const nameInput = editor.querySelector('.stat-name-input');
                const numberInput = editor.querySelector('.stat-input');
                const sliderInput = editor.querySelector('.stat-slider');

                const nameValue = nameInput.value;
                const numberValue = numberInput.value;

                const nameDiv = document.createElement('div');
                nameDiv.className = 'stat-name-input';
                nameDiv.style.padding = '6px 10px';
                nameDiv.style.textAlign = 'center';
                nameDiv.style.fontSize = '0.8rem';
                nameDiv.textContent = nameValue;

                const numberDiv = document.createElement('div');
                numberDiv.className = 'stat-input';
                numberDiv.style.display = 'flex';
                numberDiv.style.alignItems = 'center';
                numberDiv.style.justifyContent = 'center';
                numberDiv.textContent = numberValue;

                originalInputs.push({nameInput, numberInput, sliderInput});

                nameInput.parentNode.replaceChild(nameDiv, nameInput);
                numberInput.parentNode.replaceChild(numberDiv, numberInput);
                sliderInput.style.display = 'none';
            });

            const promise = html2canvas(card, {
                backgroundColor: null,
                scale: 1,
                useCORS: true
            }).then(canvas => {
                statEditors.forEach((editor, index) => {
                    const {nameInput, numberInput, sliderInput} = originalInputs[index];
                    const nameDiv = editor.querySelector('.stat-name-input');
                    const numberDiv = editor.querySelector('.stat-input');

                    nameDiv.parentNode.replaceChild(nameInput, nameDiv);
                    numberDiv.parentNode.replaceChild(numberInput, numberDiv);
                    sliderInput.style.display = '';
                });

                const dataUrl = canvas.toDataURL('image/png');
                zip.file(`${character.name}_характеристики_${scoreSystem}.png`, dataUrl.split(',')[1], {base64: true});
            });
            promises.push(promise);
        }
    });

    const comparisonSection = document.getElementById('comparison-section');
    if (comparisonSection) {
        const originalStyle = comparisonSection.style.cssText;
        comparisonSection.style.maxWidth = '600px';
        comparisonSection.style.margin = '0 auto';
        comparisonSection.style.padding = '30px';

        const chartContainer = document.getElementById('comparison-chart');
        let tempCanvas = chartContainer.querySelector('canvas');
        if (!tempCanvas) {
            updateComparisonChart();
            tempCanvas = chartContainer.querySelector('canvas');
        }

        const toggleContainer = document.getElementById('character-toggles');
        const originalToggleDisplay = toggleContainer.style.display;
        toggleContainer.style.display = 'none';

        const promise = html2canvas(comparisonSection, {
            backgroundColor: null,
            scale: 1,
            useCORS: true
        }).then(canvas => {
            comparisonSection.style.cssText = originalStyle;
            toggleContainer.style.display = originalToggleDisplay;
            const dataUrl = canvas.toDataURL('image/png');
            zip.file(`PRGTeamAllProfile_${scoreSystem}.png`, dataUrl.split(',')[1], {base64: true});
        });
        promises.push(promise);
    }

    Promise.all(promises).then(() => {
        zip.generateAsync({type: 'blob'}).then(blob => {
            saveAs(blob, `rpg_charts_${scoreSystem}.zip`);
        });
    });
}

function initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('team')) {
        loadTeamFromURL();
    }
    createLabelsEditor();
    characters.forEach(character => {
        createCharacterCard(character);
    });
    updateCharacterToggles();
    updateComparisonChart();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

setTimeout(() => {
    if (typeof Chart !== 'undefined' && document.querySelectorAll('canvas').length === 0) {
        document.getElementById('charts-container').innerHTML = '';
        initialize();
    }
}, 1000);
