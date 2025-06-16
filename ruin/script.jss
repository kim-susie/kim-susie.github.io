// A 그룹 이미지와 B 그룹 글자 정의
const groupAImages = [
  'images/A/1.png',
  'images/A/2.png',
  'images/A/3.png',
  'images/A/4.png',
   'images/A/5.png',
    'images/A/6.png',
     'images/A/7.png',
      'images/A/8.png',
       'images/A/9.png',
        'images/A/10.png',
         'images/A/11.png',
          'images/A/12.png',
];

const groupBTexts = [
  "HI",
  "!",
  "?",
  "OK",
  "NO",
  "SAID",
  "CAN",
  "CANNOT"
  "IS",
  "SILENT",
  "FAIL",
  "BROKEN"
  "ECHO"
  "BIRTH"
  "BUY"
  "REPEAT"
  ",",
  "ADD",
  "EXCEPT"
];

let signalCount = 0;
let totalSignals = Math.floor(Math.random() * 5) + 5; // 5~9회
let collected = [];
let finished = false;

// 마이크로비트 연결 버튼
document.getElementById('connect-microbit').addEventListener('click', connectMicrobit);

// 소리 감지
setupSoundDetection();

// 클릭, 스크롤, 타이핑 등 방지
['click','mousedown','mouseup','keydown','keyup','scroll','touchstart','touchend'].forEach(ev => {
  window.addEventListener(ev, e => {
    e.preventDefault();
    return false;
  }, {passive: false});
});

analyser.fftSize = 512;
const dataArray = new Uint8Array(analyser.fftSize);

function checkVolume() {
  analyser.getByteTimeDomainData(dataArray);
  let total = 0;
  for (let i = 0; i < dataArray.length; i++) {
    let deviation = dataArray[i] - 128;
    total += deviation * deviation;
  }
  let rms = Math.sqrt(total / dataArray.length);

  if (rms > 8 && !listening) {
    console.log('🔊 Loud sound detected – resetting app');
    resetApp();
  }

  requestAnimationFrame(checkVolume);
}


// 소리 감지 함수
function setupSoundDetection() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const mic = audioCtx.createMediaStreamSource(stream);
    mic.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);

    function checkSound() {
      analyser.getByteTimeDomainData(data);
      let max = Math.max(...data);
      let min = Math.min(...data);
      if (max - min > 50 && !finished) { // 임계값 조절 가능
        handleSignal();
      }
      requestAnimationFrame(checkSound);
    }
    checkSound();
  });
}

// window가 로드될 때 자동 연결 시도
window.addEventListener('load', connectMicrobit);

// 마이크로비트 연결 함수
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
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      if (!finished) handleSignal();
    });
  } catch (e) {
    console.log('마이크로비트 자동 연결 실패:', e);
    // 실패 시, 사용자가 직접 연결할 수 있도록 버튼을 남길 수도 있음
  }
}


// 신호 처리 (소리 또는 마이크로비트)
function handleSignal() {
  signalCount++;
  if (signalCount > totalSignals) return;
  if (signalCount % 2 === 1) {
    // 홀수: A 그룹 이미지
    let idx = Math.floor(Math.random() * A_IMAGES.length);
    collected.push(`<img src="${A_IMAGES[idx]}" width="80">`);
    showTemp(`<img src="${A_IMAGES[idx]}" width="120">`);
  } else {
    // 짝수: B 그룹 텍스트
    let idx = Math.floor(Math.random() * B_TEXTS.length);
    collected.push(`<span>${B_TEXTS[idx]}</span>`);
    showTemp(`<span style="font-size:2em">${B_TEXTS[idx]}</span>`);
  }
  if (signalCount === totalSignals) finishGame();
}

// 임시로 이미지/글자 보여주기
function showTemp(html) {
  const main = document.getElementById('main-container');
  main.innerHTML = html;
  setTimeout(() => {
    main.innerHTML = `
      <img id="glass-image" src="assets/glass.png" alt="깨지지 않은 유리잔">
      <h1 id="main-text">try to ruin it!</h1>
      <button id="connect-microbit">마이크로비트 연결</button>
    `;
    document.getElementById('connect-microbit').addEventListener('click', connectMicrobit);
  }, 800);
}

// 게임 종료 후 결과 표시
function finishGame() {
  finished = true;
  document.getElementById('main-container').style.display = 'none';
  document.getElementById('result-container').style.display = 'block';
  document.getElementById('collected').innerHTML = collected.join('');
}


function resetApp() {
  document.getElementById('display-area').innerHTML = '';
  document.getElementById('final-message').style.display = 'none';
  document.getElementById('glass').style.display = 'block';
  document.getElementById('prompt').innerText = 'try to ruin it!';
  collectedImages = [];
  collectedTexts = [];
  signalCount = 0;
  listening = true; // 다시 리스닝 시작
}

// 사운드 감지 시작
async function listenForLoudSound() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext();
    const mic = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    mic.connect(analyser);

    const dataArray = new Uint8Array(analyser.fftSize);

    function checkVolume() {
      analyser.getByteTimeDomainData(dataArray);
      let total = 0;
      for (let i = 0; i < dataArray.length; i++) {
        let deviation = dataArray[i] - 128;
        total += deviation * deviation;
      }
      let rms = Math.sqrt(total / dataArray.length);

      if (rms > 20 && !listening) { // 소리 임계값 + '결과 상태'일 때만
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

// 시작할 때 실행
listenForLoudSound();
