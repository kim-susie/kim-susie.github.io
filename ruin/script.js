const groupAImages = [
  'assets/A/1.png', 'assets/A/2.png', 'assets/A/3.png', 'assets/A/4.png',
  'assets/A/5.png', 'assets/A/6.png', 'assets/A/7.png', 'assets/A/8.png',
  'assets/A/9.png', 'assets/A/10.png', 'assets/A/11.png', 'assets/A/12.png',
];

const groupBTexts = [
  "HI", "!", "?", "OK", "NO", "SAID", "CAN", "CANNOT",
  "IS", "SILENT", "FAIL", "BROKEN", "ECHO", "BIRTH",
  "BUY", "REPEAT", ",", "ADD", "EXCEPT"
];

let signalCount = 0;
let totalSignals = Math.floor(Math.random() * 5) + 5;
let collected = [];
let finished = false;
let listening = true;

const mainContainer = document.getElementById('main-container');
const resultContainer = document.getElementById('result-container');
const collectedDiv = document.getElementById('collected');
const displayArea = document.getElementById('display-area');
const glassImage = document.getElementById('glass-image');
const mainText = document.getElementById('main-text');
const connectBtn = document.getElementById('connect-microbit');

// 초기화 및 로컬스토리지에 저장된 결과 불러오기
window.addEventListener('load', () => {
  const savedResults = localStorage.getItem('accumulatedResults');
  if (savedResults) {
    collectedDiv.innerHTML = savedResults;
    showResultContainer();
  }
});

// 마이크로비트 연결 버튼 이벤트
connectBtn.addEventListener('click', () => {
  connectMicrobit();
});

// 소리 감지 및 시각화 시작
setupSoundDetection();
listenForLoudSound();

// 사용자 인터랙션 차단
['click','mousedown','mouseup','keydown','keyup','scroll','touchstart','touchend'].forEach(ev => {
  window.addEventListener(ev, e => {
    e.preventDefault();
    return false;
  }, {passive: false});
});

function setupSoundDetection() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    const mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    function checkSound() {
      analyser.getByteTimeDomainData(data);
      let max = Math.max(...data);
      let min = Math.min(...data);
      if (max - min > 30 && !finished) {
        handleSignal();
      }
      requestAnimationFrame(checkSound);
    }

    checkSound();
  });
}

async function listenForLoudSound() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const mic = audioContext.createMediaStreamSource(stream);
    mic.connect(analyser);
    const dataArray = new Uint8Array(analyser.fftSize);
    const canvas = document.getElementById('sound-visual');
    const ctx = canvas.getContext('2d');

    function checkVolume() {
      analyser.getByteTimeDomainData(dataArray);
      let total = 0;
      for (let i = 0; i < dataArray.length; i++) {
        let deviation = dataArray[i] - 128;
        total += deviation * deviation;
      }
      let rms = Math.sqrt(total / dataArray.length);

      // 사운드 시각화
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, rms * 15, canvas.height);

      if (rms > 15 && !listening) {
        resetApp();
      }
      requestAnimationFrame(checkVolume);
    }

    checkVolume();
  } catch (e) {
    console.error('Audio input error:', e);
  }
}

async function connectMicrobit() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'micro:bit' }],
      optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    const characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
    characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', () => {
      if (!finished) handleSignal();
    });
  } catch (e) {
    console.log('❌ 마이크로비트 자동 연결 실패:', e);
  }
}

function handleSignal() {
  signalCount++;
  if (signalCount > totalSignals) return;

  if (signalCount % 2 === 1) {
    let idx = Math.floor(Math.random() * groupAImages.length);
    collected.push(`<img src="${groupAImages[idx]}" width="80">`);
    showTemp(`<img src="${groupAImages[idx]}" width="120">`);
  } else {
    let idx = Math.floor(Math.random() * groupBTexts.length);
    collected.push(`<span>${groupBTexts[idx]}</span>`);
    showTemp(`<span style="font-size:2em">${groupBTexts[idx]}</span>`);
  }

  if (signalCount === totalSignals) finishGame();
}

function showTemp(html) {
  displayArea.innerHTML = html;
  setTimeout(() => {
    displayArea.innerHTML = '';
  }, 2000);
}

function finishGame() {
  finished = true;
  listening = false;
  mainContainer.style.display = 'none';
  showResultContainer();

  let existing = localStorage.getItem('accumulatedResults') || '';

  // 한 줄씩 결과를 <div>로 묶어서 줄마다 쌓이게 처리
  const newLine = `<div style="white-space: nowrap; margin-bottom: 10px;">${collected.join('')}</div>`;

  existing += newLine;

  localStorage.setItem('accumulatedResults', existing);

  collectedDiv.innerHTML = existing;
}
function resetApp() {
  finished = false;
  listening = true;
  signalCount = 0;
  collected = [];

  // 만약 초기화시 저장된 결과도 비우고 싶으면 아래 주석 해제
  // localStorage.removeItem('accumulatedResults');

  mainContainer.style.display = 'flex';
  resultContainer.style.display = 'none';
  displayArea.innerHTML = '';
}

function showResultContainer() {
  resultContainer.style.display = 'flex';
}
