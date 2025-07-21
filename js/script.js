let characters = [
  {
    id: 1,
    name: 'Сергей',
    role: 'player',
    stats: [8, 2, 6, 7, 6],
    statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
    color: { background: 'rgba(163,138,255,0.3)', border: '#6228d6' }
  },
  {
    id: 2,
    name: 'Дима',
    role: 'player',
    stats: [8, 3, 7, 8, 8],
    statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
    color: { background: 'rgba(255, 107, 107, 0.3)', border: '#ff6b6b' }
  },
  {
    id: 3,
    name: 'Витя',
    role: 'player',
    stats: [6, 7, 4, 7, 2],
    statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
    color: { background: 'rgba(78, 205, 196, 0.3)', border: '#4ecdc4' }
  },
  {
    id: 4,
    name: 'Денис',
    role: 'player',
    stats: [2, 2, 8, 2, 7],
    statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
    color: { background: 'rgba(69, 183, 209, 0.3)', border: '#45b7d1' }
  },
  {
    id: 5,
    name: 'Настя',
    role: 'dm',
    stats: [8, 8, 5, 9, 5],
    statsLabels: ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'],
    color: { background: 'rgba(153, 102, 255, 0.3)', border: '#9966ff' }
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

const playerColors = [
  { background: 'rgba(255, 107, 107, 0.3)', border: '#ff6b6b' },
  { background: 'rgba(78, 205, 196, 0.3)', border: '#4ecdc4' },
  { background: 'rgba(69, 183, 209, 0.3)', border: '#45b7d1' },
  { background: 'rgba(163,138,255,0.3)', border: '#6228d6' },
  { background: 'rgba(255, 193, 7, 0.3)', border: '#ffc107' },
  { background: 'rgba(233, 30, 99, 0.3)', border: '#e91e63' }
];

let nextId = 6;
let chartInstances = {};
let comparisonChart = null;

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
  });

  updateAllCards();
  updateComparisonChart();
}

function updateCharacterStatLabel(characterId, index, value) {
  const character = characters.find(c => c.id === characterId);
  if (character) {
    if (value.trim() === '') {
      character.statsLabels[index] = globalStatShortLabels[index];
    } else {
      character.statsLabels[index] = value.trim();
    }
    updateChart(character);
    updateComparisonChart();
  }
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

  for (let i = 1; i <= 5; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', (maxRadius * i) / 5);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);
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

    svg.appendChild(text);
  }

  if (isComparison) {
    characters.forEach(char => {
      createDataPolygon(svg, char, center, maxRadius, angleStep);
    });
  } else {
    createDataPolygon(svg, character, center, maxRadius, angleStep);
  }

  container.appendChild(svg);
}

function createDataPolygon(svg, character, center, maxRadius, angleStep) {
  const points = [];
  for (let i = 0; i < character.stats.length; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const value = character.stats[i];
    const radius = (maxRadius * value) / 10;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', points.join(' '));
  polygon.setAttribute('fill', character.color.background);
  polygon.setAttribute('stroke', character.color.border);
  polygon.setAttribute('stroke-width', '2');
  svg.appendChild(polygon);

  for (let i = 0; i < character.stats.length; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const value = character.stats[i];
    const radius = (maxRadius * value) / 10;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', character.color.border);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
  }
}

function createCharacterCard(character) {
  const container = document.getElementById('charts-container');
  const cardDiv = document.createElement('div');
  cardDiv.className = `chart-card ${character.role}-card`;
  cardDiv.id = `card-${character.id}`;

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
                    <input type="number" class="stat-input" min="0" max="10" value="${stat}"
                           onchange="updateStat(${character.id}, ${i}, parseInt(this.value))">
                    <input type="range" class="stat-slider" min="0" max="10" value="${stat}"
                           oninput="updateStat(${character.id}, ${i}, parseInt(this.value)); this.previousElementSibling.value = this.value">
                </div>
            `).join('')}
        </div>
    `;

  container.appendChild(cardDiv);
  updateChart(character);
  updateExportMenu();
}

function updateChart(character) {
  const chartContainer = document.getElementById(`chart-${character.id}`);
  if (!chartContainer) return;

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
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 2,
              backdropColor: 'rgba(0, 0, 0, 0)',
              color: 'rgba(255, 255, 255, 0.7)'
            },
            pointLabels: {
              font: { size: 12, weight: 'bold' },
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
          legend: { display: false }
        }
      }
    });
  } else {
    createSVGRadarChart(chartContainer, character);
  }
}

function updateComparisonChart() {
  const chartContainer = document.getElementById('comparison-chart');
  if (!chartContainer) return;

  if (typeof Chart !== 'undefined') {
    if (comparisonChart) {
      comparisonChart.destroy();
    }

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
        datasets: characters.map(character => ({
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
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 2,
              backdropColor: 'rgba(0, 0, 0, 0)',
              color: 'rgba(255, 255, 255, 0.7)'
            },
            pointLabels: {
              font: { size: 12, weight: 'bold' },
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
              font: { size: 12 },
              padding: 15
            }
          }
        }
      }
    });
  } else {
    createSVGRadarChart(chartContainer, null, true);
  }
}

function updateStat(characterId, statIndex, value) {
  value = Math.max(0, Math.min(10, value));
  const character = characters.find(c => c.id === characterId);
  if (character) {
    character.stats[statIndex] = value;
    updateChart(character);
    updateComparisonChart();

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
    character.name = name;
    updateChart(character);
    updateComparisonChart();
    updateExportMenu();
  }
}

function addPlayer() {
  const colorIndex = characters.filter(c => c.role === 'player').length % playerColors.length;
  const newPlayer = {
    id: nextId++,
    name: 'Новый игрок',
    role: 'player',
    stats: [5, 5, 5, 5, 5],
    statsLabels: [...globalStatShortLabels],
    color: playerColors[colorIndex]
  };
  characters.push(newPlayer);
  createCharacterCard(newPlayer);
  updateComparisonChart();
}

function addDM() {
  const newDM = {
    id: nextId++,
    name: 'Новый ДМ',
    role: 'dm',
    stats: [5, 5, 5, 5, 5],
    statsLabels: [...globalStatShortLabels],
    color: { background: 'rgba(153, 102, 255, 0.3)', border: '#9966ff' }
  };
  characters.push(newDM);
  createCharacterCard(newDM);
  updateComparisonChart();
}

function deleteCharacter(characterId) {
  if (confirm('Удалить этого персонажа?')) {
    characters = characters.filter(c => c.id !== characterId);
    const card = document.getElementById(`card-${characterId}`);
    if (card) {
      card.remove();
    }
    if (chartInstances[characterId]) {
      chartInstances[characterId].destroy();
      delete chartInstances[characterId];
    }
    updateComparisonChart();
    updateExportMenu();
  }
}

function resetAll() {
  if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
    characters = [];
    globalStatLabels = [
      'Ролеплей/Нарратив',
      'Импровизация',
      'Знание правил',
      'Социальность/Справедливость',
      'Тактика/Подготовка'
    ];
    globalStatShortLabels = ['Ролеплей', 'Импровизация', 'Правила', 'Социальность', 'Тактика'];
    document.getElementById('charts-container').innerHTML = '';
    Object.values(chartInstances).forEach(chart => chart.destroy());
    chartInstances = {};
    createLabelsEditor();
    updateComparisonChart();
    updateExportMenu();
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

    originalInputs.push({ nameInput, numberInput, sliderInput });

    nameInput.parentNode.replaceChild(nameDiv, nameInput);
    numberInput.parentNode.replaceChild(numberDiv, numberInput);
    sliderInput.style.display = 'none';
  });

  html2canvas(card, {
    backgroundColor: null,
    scale: 4,
    useCORS: true
  }).then(canvas => {
    statEditors.forEach((editor, index) => {
      const { nameInput, numberInput, sliderInput } = originalInputs[index];
      const nameDiv = editor.querySelector('.stat-name-input');
      const numberDiv = editor.querySelector('.stat-input');

      nameDiv.parentNode.replaceChild(nameInput, nameDiv);
      numberDiv.parentNode.replaceChild(numberInput, numberDiv);
      sliderInput.style.display = '';
    });

    const link = document.createElement('a');
    link.download = `${character.name}_PRGTeamProfile.png`;
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

  html2canvas(comparisonSection, {
    backgroundColor: null,
    scale: 4,
    useCORS: true
  }).then(canvas => {
    comparisonSection.style.cssText = originalStyle;

    const link = document.createElement('a');
    link.download = 'сравнительный_анализ_команды.png';
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

        originalInputs.push({ nameInput, numberInput, sliderInput });

        nameInput.parentNode.replaceChild(nameDiv, nameInput);
        numberInput.parentNode.replaceChild(numberDiv, numberInput);
        sliderInput.style.display = 'none';
      });

      const promise = html2canvas(card, {
        backgroundColor: null,
        scale: 4,
        useCORS: true
      }).then(canvas => {
        statEditors.forEach((editor, index) => {
          const { nameInput, numberInput, sliderInput } = originalInputs[index];
          const nameDiv = editor.querySelector('.stat-name-input');
          const numberDiv = editor.querySelector('.stat-input');

          nameDiv.parentNode.replaceChild(nameInput, nameDiv);
          numberDiv.parentNode.replaceChild(numberInput, numberDiv);
          sliderInput.style.display = '';
        });

        const dataUrl = canvas.toDataURL('image/png');
        zip.file(`${character.name}_характеристики.png`, dataUrl.split(',')[1], { base64: true });
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

    const promise = html2canvas(comparisonSection, {
      backgroundColor: null,
      scale: 4,
      useCORS: true
    }).then(canvas => {
      comparisonSection.style.cssText = originalStyle;
      const dataUrl = canvas.toDataURL('image/png');
      zip.file('сравнительный_анализ_команды.png', dataUrl.split(',')[1], { base64: true });
    });
    promises.push(promise);
  }

  Promise.all(promises).then(() => {
    zip.generateAsync({ type: 'blob' }).then(blob => {
      saveAs(blob, 'rpg_charts.zip');
    });
  });
}

function initialize() {
  createLabelsEditor();
  characters.forEach(character => {
    createCharacterCard(character);
  });
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
