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

// 페이지 로드 시 누적 결과 불러오기 + 마이크로비트 연결
window.addEventListener('load', () => {
  const saved = localStorage.getItem('accumulatedResults');
  if (saved) {
    document.getElementById('collected').innerHTML = saved;
    document.getElementById('result-container').style.display = 'block';
  }
  connectMicrobit();
});

// 소리 감지 및 시각화 설정
setupSoundDetection();
listenForLoudSound();

// 사용자 인터랙션 방지
['click','mousedown','mouseup','keydown','keyup','scroll','touchstart','touchend'].forEach(ev => {
  window.addEventListener(ev, e => {
    e.preventDefault();
    return false;
  }, {passive: false});
});

// ▶ 소리로 신호 입력 감지
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
      if (max - min > 30 && !finished) {  // 감도 조절
        handleSignal();
      }
      requestAnimationFrame(checkSound);
    }

    checkSound();
  });
}

// ▶ 큰 소리로 앱 리셋 (UI 시각화 포함)
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

      // 🔊 사운드 시각화
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, rms * 15, canvas.height);

      // 소리 인식 후 앱 리셋
      if (rms > 15 && !listening) {  // 감도 조절
        console.log('🔊 Loud sound detected – resetting app');
        resetApp();
      }

      requestAnimationFrame(checkVolume);
    }

    checkVolume();
  } catch (e) {
    console.error('Audio input error:', e);
  }
}

// ▶ 마이크로비트 연결
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

// ▶ 신호 처리
function handleSignal() {
  signalCount++;
  if (signalCount > totalSignals) return;

  if (signalCount % 2 === 1) {
    // A 이미지
    let idx = Math.floor(Math.random() * groupAImages.length);
    collected.push(`<img src="${groupAImages[idx]}" width="80">`);
    showTemp(`<img src="${groupAImages[idx]}" width="120">`);
  } else {
    // B 텍스트
    let idx = Math.floor(Math.random() * groupBTexts.length);
    collected.push(`<span>${groupBTexts[idx]}</span>`);
    showTemp(`<span style="font-size:2em">${groupBTexts[idx]}</span>`);
  }

  if (signalCount === totalSignals) finishGame();
}

// ▶ 이미지/글자 잠깐 보여주기
function showTemp(html) {
  const main = document.getElementById('main-container');
  main.innerHTML = html;
  setTimeout(() => {
    main.innerHTML = `
      <img id="glass-image" src="assets/glass.png" alt="깨지 않은 유리잔" width="150">
      <h1 id="main-text">try to ruin it!</h1>
    `;
  }, 2000);
}

// ▶ 결과 화면 - 누적 저장 및 표시
function finishGame() {
  finished = true;
  listening = false;
  document.getElementById('main-container').style.display = 'none';
  document.getElementById('result-container').style.display = 'block';

  // 기존 저장된 결과 불러오기
  let existing = localStorage.getItem('accumulatedResults') || '';

  // 이번에 수집한 내용 추가
  existing += collected.join('') + '<br><hr><br>';

  // 로컬스토리지에 저장
  localStorage.setItem('accumulatedResults', existing);

  // 화면에 누적 결과 표시
  document.getElementById('collected').innerHTML = existing;
}

// ▶ 앱 초기화 - 저장도 초기화 (필요 시)
function resetApp() {
  finished = false;
  listening = true;
  signalCount = 0;
  collected = [];

  // 저장 초기화 (원치 않으면 주석처리)
  localStorage.removeItem('accumulatedResults');

  const main = document.getElementById('main-container');
  const result = document.getElementById('result-container');

  main.style.display = 'flex';   // flex 유지 필수
  result.style.display = 'none';
  main.innerHTML = `
    <img id="glass-image" src="assets/glass.png" alt="깨지 않은 유리잔" width="150">
    <h1 id="main-text">try to ruin it!</h1>
  `;
}
