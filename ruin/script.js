let collectedAll = [];  // 누적 결과 저장용
let isDetecting = false;  // 소리 감지 중복 방지
let canDetectSignal = true;  // 소리 감지 타이밍 제어

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

characteristic.addEventListener('characteristicvaluechanged', (event) => {
  const value = new TextDecoder().decode(event.target.value);
  if (value.trim() === "1") {
    console.log("📶 micro:bit 블루투스 신호 감지!");
    handleSignal();  // 소리 감지처럼 반응
  }
});

setupSoundDetection();
listenForLoudSound();

// 사용자 인터랙션 방지
['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'scroll', 'touchstart', 'touchend'].forEach(ev => {
  window.addEventListener(ev, e => {
    e.preventDefault();
    return false;
  }, { passive: false });
});

// 소리로 신호 감지
function setupSoundDetection() {
  if (isDetecting) return;
  isDetecting = true;

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

      if (max - min > 50 && !finished && canDetectSignal) {
        canDetectSignal = false;
        handleSignal();

        setTimeout(() => {
          canDetectSignal = true;
        }, 500);
      }

      requestAnimationFrame(checkSound);
    }

    checkSound();
  });
}

// 큰 소리로 앱 리셋 + 시각화
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

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(0, 0, rms * 15, canvas.height);

      if (rms > 15 && !listening) {
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

// 신호 처리
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

// 이미지/텍스트 잠깐 보여주기
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

// 결과 화면
function finishGame() {
  finished = true;
  listening = false;

  const newResultHTML = `<div style="white-space: nowrap; margin-bottom: 10px;">${collected.join('')}</div>`;
  collectedAll.push(newResultHTML);

  document.getElementById('main-container').style.display = 'none';
  document.getElementById('result-container').style.display = 'block';
  document.getElementById('collected').innerHTML = collectedAll.join('');
}

// 앱 리셋
function resetApp() {
  finished = false;
  listening = true;
  signalCount = 0;
  collected = [];

  const main = document.getElementById('main-container');
  const result = document.getElementById('result-container');

  main.style.display = 'flex';
  result.style.display = 'none';
  main.innerHTML = `
    <img id="glass-image" src="assets/glass.png" alt="깨지 않은 유리잔">
    <h1 id="main-text">try to ruin it!</h1>
  `;

  isDetecting = false;
  setupSoundDetection();
}
