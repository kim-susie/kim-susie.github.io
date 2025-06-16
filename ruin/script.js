document.addEventListener('DOMContentLoaded', () => {

  const groupAImages = [
    'images/A/1.png', 'images/A/2.png', 'images/A/3.png', 'images/A/4.png',
    'images/A/5.png', 'images/A/6.png', 'images/A/7.png', 'images/A/8.png',
    'images/A/9.png', 'images/A/10.png', 'images/A/11.png', 'images/A/12.png',
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

  const mainContainer = document.getElementById('main-container');
  const resultContainer = document.getElementById('result-container');
  const collectedDiv = document.getElementById('collected');
  const connectBtn = document.getElementById('connect-microbit');

  connectBtn.addEventListener('click', connectMicrobit);

  // 오디오 세팅
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  let analyser;
  let dataArray;
  let source;

  async function setupSoundDetection() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      checkSound();
      drawSoundVisual();
    } catch (e) {
      console.error('오디오 권한 요청 실패:', e);
    }
  }

  function checkSound() {
    analyser.getByteTimeDomainData(dataArray);
    let max = Math.max(...dataArray);
    let min = Math.min(...dataArray);
    let volume = max - min;
    if (volume > 50 && !finished) {
      handleSignal();
    }
    requestAnimationFrame(checkSound);
  }

  // 소리 시각화
  const canvas = document.getElementById('sound-visual');
  const ctx = canvas.getContext('2d');

  function drawSoundVisual() {
    requestAnimationFrame(drawSoundVisual);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();

    let sliceWidth = canvas.width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * canvas.height) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  // 마이크로비트 연결
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
      alert('마이크로비트 연결 성공!');
    } catch (e) {
      console.error('마이크로비트 연결 실패:', e);
      alert('마이크로비트 연결 실패. 콘솔을 확인하세요.');
    }
  }

  // 신호 처리
  function handleSignal() {
    if (finished) return;
    signalCount++;
    if (signalCount > totalSignals) return;

    if (signalCount % 2 === 1) {
      let idx = Math.floor(Math.random() * groupAImages.length);
      let imgTag = `<img src="${groupAImages[idx]}" alt="A image" width="80">`;
      collected.push(imgTag);
      showTemp(imgTag);
    } else {
      let idx = Math.floor(Math.random() * groupBTexts.length);
      let spanTag = `<span>${groupBTexts[idx]}</span>`;
      collected.push(spanTag);
      showTemp(`<span style="font-size:2em">${groupBTexts[idx]}</span>`);
    }

    if (signalCount === totalSignals) finishGame();
  }

  // 임시 표시 후 원복
  function showTemp(html) {
    mainContainer.innerHTML = html;
    setTimeout(() => {
      mainContainer.innerHTML = `
        <img id="glass-image" src="assets/glass.png" alt="깨지지 않은 유리잔" />
        <h1 id="main-text">try to ruin it!</h1>
        <button id="connect-microbit">마이크로비트 연결</button>
      `;
      document.getElementById('connect-microbit').addEventListener('click', connectMicrobit);
    }, 800);
  }

  // 종료 처리
  function finishGame() {
    finished = true;
    mainContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    collectedDiv.innerHTML = collected.join('');
  }

  // 앱 초기화 (리셋)
  function resetApp() {
    signalCount = 0;
    totalSignals = Math.floor(Math.random() * 5) + 5;
    collected = [];
    finished = false;
    mainContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    mainContainer.innerHTML = `
      <img id="glass-image" src="assets/glass.png" alt="깨지지 않은 유리잔" />
      <h1 id="main-text">try to ruin it!</h1>
      <button id="connect-microbit">마이크로비트 연결</button>
    `;
    document.getElementById('connect-microbit').addEventListener('click', connectMicrobit);
  }

  // 큰 소리 감지해서 리셋 (결과 화면일 때만)
  function listenForLoudSound() {
    if (!analyser) {
      setTimeout(listenForLoudSound, 500);
      return;
    }

    const tempData = new Uint8Array(analyser.frequencyBinCount);

    function checkVolume() {
      analyser.getByteTimeDomainData(tempData);
      let total = 0;
      for (let i = 0; i < tempData.length; i++) {
        let deviation = tempData[i] - 128;
        total += deviation * deviation;
      }
      let rms = Math.sqrt(total / tempData.length);

      if (rms > 20 && finished) {
        console.log('🔊 Loud sound detected – resetting app');
        resetApp();
      }
      requestAnimationFrame(checkVolume);
    }
    checkVolume();
  }

  setupSoundDetection().then(() => {
    listenForLoudSound();
  });

});
