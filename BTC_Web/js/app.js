"use strict";

// Contenido de los acertijos transcrito de Pistas.txt. Algunas tareas y ubicaciones siguen provisionales.
const PISTAS = [
  {
    acertijo: [
      "Nazco de la tierra pero parezco una nube,",
      "al mirarme tan suave, mi valor siempre sube.",
      "Si el fuego me toca me vuelvo ceniza,",
      "pero si el agua me roza, mi cuerpo se desriza.",
      "En la botica curé mil heridas con celo,",
      "y dulce en las ferias te llevo hasta el cielo.",
      "",
      "¿Qué soy?"
    ].join("\n"),
    respuesta: "ALGODÓN",
    alternativas: ["algodón de azúcar", "algodón dulce"],
    tarea: "¡Haz 5 sentadillas!", ubicacion: "el chaise longue del sofá", video: "assets/video/Squat_Time.mp4"
  },
  {
    acertijo: [
      "Atrapo la sombra de un tiempo extinguido,",
      "un rostro de luz en la piel retenido.",
      "Ni hablo ni respiro, pero hago dudar,",
      "si aquello que muestro volvió a suceder",
      "o es solo un fantasma que no ha de regresar.",
      "Detengo la vida en un marco de plata,",
      "si el sol me acaricia, con los años me mata.",
      "Quien me mira en silencio suele recordar,",
      "lo que el viento y la mente suelen olvidar.",
      "",
      "¿Qué soy?"
    ].join("\n"),
    respuesta: "FOTOGRAFIA",
    alternativas: ["foto"],
    tarea: "¡Ve a comprar unos churros!", ubicacion: "La Zona de Vinilos", imagen: "assets/images/churros-pista-2.jpg", imagenAlt: "Churros con chocolate"
  },
  {
    acertijo: [
      "No tengo cuerpo ni cara, mas puedo herir o sanar,",
      "puedo volar en el aire sin alas para volar.",
      "Si me dices en voz alta me pierdo en el viento frío,",
      "pero si rompo un silencio, te lleno de escalofrío.",
      "En un papel me dibujas, en la boca me construyes,",
      "si me faltas a la fe, para siempre te destruyes.",
      "",
      "¿Qué soy?"
    ].join("\n"),
    respuesta: "PALABRA",
    alternativas: [],
    tarea: "Tienes que hacerte esta foto con la Suka", ubicacion: "Arriba de la máquina de Aerotermia", imagen: "assets/images/foto-suka-pista-3.jpg", imagenAlt: "Una chica y su perro chocan la mano en la playa", cameraTask: true
  },
  {
    acertijo: [
      "Tengo abrigo de piel verde o corazón amarillo,",
      "de verde fino o crujiente me sirves en el plato o platillo.",
      "Me buscas en la alacena para calmar tu afán,",
      "a veces me cocinan, a veces soy solo pan.",
      "Si me faltas un solo día, el cuerpo pierde su fuerza,",
      "y con un toque de sal hasta el más triste almuerza.",
      "",
      "¿Qué soy?"
    ].join("\n"),
    respuesta: "COMIDA",
    alternativas: ["alimento", "alimentos"],
    tarea: "Texto tarea", ubicacion: "El barullo de bolsas de la habitación desastre", imagen: "assets/images/regalo-provisional.png"
  },
  {
    acertijo: [
      "Soy un mundo de madera donde nacen mil vidas,",
      "entre luces brillantes y sombras escondidas.",
      "Aquí el llanto es de mentira y el amor es inventado,",
      "pero el aplauso que escucho es sincero y regalado.",
      "Risas, tragedia y comedia guardo bajo mi telón,",
      "donde la ilusión empieza con la primera función.",
      "",
      "¿Qué soy?"
    ].join("\n"),
    respuesta: "TEATRO",
    alternativas: [],
    tarea: "Texto tarea", ubicacion: "Debajo del teclado de tu novio.", imagen: "assets/images/regalo-provisional.png"
  }
];

const AUDIO_BASE = "assets/audio/";
const AUDIO_FALLBACK_MS = 3600;
const HOLD_MS = 5000;
const RECOVERY_CODE = "1994";
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");
const shell = document.getElementById("app-shell");
const scene = document.getElementById("scene");
const profile = document.getElementById("profile");
const jumpDialog = document.getElementById("jump-dialog");
const jumpList = document.getElementById("jump-list");
const closeJump = document.getElementById("close-jump");

let pistaActual = 0;
let fase = "login";
let sceneTimer = null;
let fallbackTimer = null;
let holdTimer = null;
let audio = null;
let audioRun = 0;
let sceneRun = 0;
let cameraStream = null;
let cameraRun = 0;
let cameraPhotoUrl = null;

function normalizarNombre(value) {
  return value.trim().replace(/\s+/g, " ").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function normalizarRespuesta(value) {
  return String(value).normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^es\s+/, "")
    .replace(/^(el|la|los|las|un|una)\s+/, "");
}

function respuestaCorrecta(index, value) {
  const pista = PISTAS[index];
  const entrada = normalizarRespuesta(value);
  return entrada !== "" && [pista.respuesta, ...pista.alternativas]
    .some(posible => normalizarRespuesta(posible) === entrada);
}

function createParticles() {
  const layer = document.getElementById("particles");
  let seed = 29;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 32; i++) {
    const dot = document.createElement("span");
    dot.className = i % 6 === 0 ? "particle particle-cross" : "particle";
    dot.style.setProperty("--x", `${4 + random() * 92}%`);
    dot.style.setProperty("--y", `${3 + random() * 94}%`);
    dot.style.setProperty("--size", `${1.5 + random() * 2.2}px`);
    dot.style.setProperty("--delay", `${-random() * 12}s`);
    dot.style.setProperty("--duration", `${7 + random() * 9}s`);
    layer.append(dot);
  }
}

function clearAudio() {
  audioRun++;
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio = null;
  }
}

function releaseCamera() {
  cameraRun++;
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
  if (cameraPhotoUrl) {
    URL.revokeObjectURL(cameraPhotoUrl);
    cameraPhotoUrl = null;
  }
}

function setScene(nextPhase, markup, afterRender) {
  clearTimeout(sceneTimer);
  if (nextPhase !== "camera") releaseCamera();
  const run = ++sceneRun;
  scene.classList.add("leaving");
  const delay = REDUCED_MOTION.matches ? 0 : 260;
  sceneTimer = setTimeout(() => {
    if (run !== sceneRun) return;
    fase = nextPhase;
    scene.innerHTML = markup;
    scene.dataset.phase = nextPhase;
    scene.classList.remove("leaving");
    scene.classList.add("entering");
    scene.scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.remove("entering")));
    if (afterRender) afterRender();
  }, delay);
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function showLogin() {
  clearAudio();
  pistaActual = 0;
  profile.hidden = true;
  closeJumpDialog();
  setScene("login", `
    <div class="content login-content">
      <div class="welcome-mark" aria-hidden="true">✦ <span>✧</span> ✦</div>
      <p class="eyebrow">TE ESTABA ESPERANDO</p>
      <h1>Inicia sesión,<br><em>querida.</em></h1>
      <p class="lead">Nos lo vamos a pasar bien… Aunque tu novio quizá no tanto. <span aria-hidden="true">✷</span></p>
      <form id="login-form" class="form-card" novalidate>
        <label for="full-name">Nombre y dos apellidos</label>
        <input id="full-name" name="full-name" type="text" autocomplete="off" autocapitalize="words" placeholder="Escribe tu nombre completo" required>
        <p class="field-help">Pista: escribe tu nombre y tus dos apellidos.</p>
        <label for="password">Contraseña</label>
        <input id="password" name="password" type="password" autocomplete="off" placeholder="La que tú quieras">
        <p id="login-error" class="form-error" role="alert" hidden></p>
        <button class="primary-button" type="submit">Entrar en mi juego <span aria-hidden="true">✦</span></button>
      </form>
      <p class="whisper">La bruja siempre se entera de todo.</p>
    </div>`, () => {
    document.getElementById("login-form").addEventListener("submit", event => {
      event.preventDefault();
      const name = document.getElementById("full-name");
      if (normalizarNombre(name.value) !== "sonia lara garcia") {
        const error = document.getElementById("login-error");
        error.textContent = "Uy, querida… ¿Qué sucede? ¿Ya no te acuerdas de tu nombre? Que nivel...";
        error.hidden = false;
        name.focus();
        return;
      }
      profile.hidden = false;
      startWitch(0);
    });
  });
}

function witchMarkup(index, finalMessage) {
  const number = finalMessage ? 6 : index + 1;
  return `
    <div class="content witch-content">
      <p class="witch-label${finalMessage ? " witch-label-final" : ""}">${finalMessage ? "Una última cosita" : `Mensaje ${number}`}</p>
      <div class="witch-aura" id="witch-aura">
        <span class="orbit orbit-one" aria-hidden="true">✦</span>
        <span class="orbit orbit-two" aria-hidden="true">✧</span>
        <span class="orbit orbit-three" aria-hidden="true">✦</span>
        <img class="witch-image" src="assets/images/bruja-provisional.png" alt="Una bruja mayor y sonriente vuela sobre su escoba entre destellos dorados">
      </div>
      <p class="audio-status sr-only" id="audio-status" aria-live="polite">Preparando el mensaje mágico…</p>
      <button class="secondary-button audio-button" id="play-audio" type="button" hidden>Escuchar mensaje</button>
    </div>`;
}

function audioCandidates(number) {
  const names = [`audio ${number}`, `audio-${number}`];
  return names.flatMap(name => ["mp3", "m4a", "wav", "ogg"].map(ext => `${AUDIO_BASE}${name}.${ext}`));
}

function startWitch(index, finalMessage = false) {
  clearAudio();
  pistaActual = index;
  const run = audioRun;
  const statusText = () => document.getElementById("audio-status");
  const playButton = () => document.getElementById("play-audio");
  let finished = false;
  let candidateIndex = 0;
  let activeAttempt = 0;
  const candidates = audioCandidates(finalMessage ? 6 : index + 1);

  const finish = () => {
    if (finished || run !== audioRun) return;
    finished = true;
    clearTimeout(fallbackTimer);
    const aura = document.getElementById("witch-aura");
    if (aura) aura.classList.add("fly-away");
    const status = statusText();
    if (status) status.textContent = "¡Allá voy!";
    setTimeout(() => {
      if (run !== audioRun) return;
      clearAudio();
      if (finalMessage) showFinal(); else showRiddle(index);
    }, REDUCED_MOTION.matches ? 100 : 850);
  };

  const noAudio = () => {
    if (run !== audioRun || finished) return;
    const status = statusText();
    if (status) status.textContent = "La bruja está preparando su voz…";
    fallbackTimer = setTimeout(finish, AUDIO_FALLBACK_MS);
  };

  const tryCandidate = () => {
    if (run !== audioRun || finished) return;
    if (candidateIndex >= candidates.length) { noAudio(); return; }
    if (audio) audio.pause();
    audio = new Audio(candidates[candidateIndex++]);
    const attempt = ++activeAttempt;
    audio.preload = "auto";
    audio.addEventListener("ended", finish, { once: true });
    const fail = () => {
      if (attempt !== activeAttempt || run !== audioRun || finished) return;
      activeAttempt++;
      tryCandidate();
    };
    audio.addEventListener("error", fail, { once: true });
    audio.addEventListener("playing", () => {
      if (attempt !== activeAttempt) return;
      const status = statusText();
      if (status) status.textContent = "Escucha bien, querida…";
      const button = playButton();
      if (button) button.hidden = true;
    });
    const promise = audio.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(error => {
        if (run !== audioRun || finished) return;
        if (error.name === "NotAllowedError") {
          const status = statusText();
          if (status) status.textContent = "Toca para escuchar a la bruja.";
          const button = playButton();
          if (button) button.hidden = false;
        } else fail();
      });
    }
  };

  setScene("witch", witchMarkup(index, finalMessage), () => {
    document.getElementById("play-audio").addEventListener("click", () => {
      if (!audio) { tryCandidate(); return; }
      audio.play().catch(error => {
        if (error.name === "NotAllowedError") {
          const status = statusText();
          if (status) status.textContent = "Toca de nuevo para escuchar el mensaje.";
        } else tryCandidate();
      });
    });
    tryCandidate();
  });
}

function showRiddle(index) {
  const clue = PISTAS[index];
  const poemLines = clue.acertijo.split("\n");
  const poem = poemLines.map((line, lineIndex) => line
    ? `<span class="poem-verse">${lineIndex === 0 ? "“" : ""}${esc(line)}${lineIndex === poemLines.length - 1 ? "”" : ""}</span>`
    : `<span class="poem-break" aria-hidden="true"></span>`).join("");
  setScene("riddle", `
    <div class="content clue-content">
      <div class="chapter"><span class="chapter-line"></span> PISTA ${String(index + 1).padStart(2, "0")} <span class="chapter-line"></span></div>
      <blockquote>${poem}</blockquote>
      <form id="answer-form" class="answer-form">
        <label for="answer">Tu respuesta</label>
        <input id="answer" type="text" autocomplete="off" autocapitalize="sentences" placeholder="Escribe aquí tu respuesta" aria-describedby="answer-error">
        <p id="answer-error" class="form-error answer-error" role="alert" hidden></p>
        <button class="primary-button" type="submit">Responder <span aria-hidden="true">✦</span></button>
      </form>
    </div>`, () => {
    const answer = document.getElementById("answer");
    const error = document.getElementById("answer-error");
    answer.addEventListener("input", () => {
      if (answer.value.trim() === RECOVERY_CODE) answer.value = clue.respuesta;
      error.hidden = true;
      answer.removeAttribute("aria-invalid");
    });
    document.getElementById("answer-form").addEventListener("submit", event => {
      event.preventDefault();
      if (!respuestaCorrecta(index, answer.value)) {
        error.textContent = answer.value.trim() ? "MUAHAHA... Casi, querida. Dale otra vuelta." : "Escribe una respuesta antes de seguir, querida.";
        error.hidden = false;
        answer.setAttribute("aria-invalid", "true");
        answer.focus();
        return;
      }
      showTask(index);
    });
  });
}

function showTask(index) {
  const clue = PISTAS[index];
  const media = clue.video
    ? `<video class="task-video" src="${esc(clue.video)}" controls autoplay muted loop playsinline preload="metadata" aria-label="Vídeo de la tarea: cinco sentadillas">Tu navegador no puede reproducir este vídeo.</video>`
    : `<img src="${esc(clue.imagen)}" alt="${esc(clue.imagenAlt || "Regalo mágico provisional")}" class="gift-image">`;
  setScene("task", `
    <div class="content task-content">
      <div class="chapter"><span class="chapter-line"></span> LA BRUJA TE RETA <span class="chapter-line"></span></div>
      <h1>Tarea:</h1>
      <div class="gift-aura${clue.video ? " gift-aura-video" : ""}">${media}</div>
      <p class="task-copy${clue.cameraTask ? " task-copy-photo" : ""}"><em>${esc(clue.tarea)}</em></p>
      <button class="primary-button" id="task-done" type="button">${clue.cameraTask ? "Hacer foto" : "Tarea completada"} <span aria-hidden="true">✦</span></button>
    </div>`, () => document.getElementById("task-done").addEventListener("click", () => {
      if (clue.cameraTask) showCamera(index); else showLocation(index);
    }));
}

function isMobileCameraDevice() {
  return Boolean(navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
}

function showCamera(index) {
  const clue = PISTAS[index];
  const mobile = isMobileCameraDevice();
  const run = ++cameraRun;
  let capturedBlob = null;
  let capturedExtension = "jpg";
  let streamRequest = null;
  let cameraFallback = mobile && !navigator.mediaDevices?.getUserMedia;

  // La petición nace del toque en «Tarea completada», también en Safari móvil.
  if (mobile && navigator.mediaDevices?.getUserMedia) {
    streamRequest = navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "user" } } });
  }

  const status = message => {
    const element = document.getElementById("camera-status");
    if (element) element.textContent = message;
  };
  const showLive = () => {
    const video = document.getElementById("camera-live");
    const poster = document.getElementById("camera-poster");
    if (!video || !cameraStream || capturedBlob) return;
    video.srcObject = cameraStream;
    video.hidden = false;
    poster.hidden = true;
    video.play().then(() => status("Cuando estéis listas, pulsa Hacer foto.")).catch(() => {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
      video.hidden = true;
      poster.hidden = false;
      status("Pulsa Hacer foto para abrir la cámara del móvil.");
    });
  };

  setScene("camera", `
    <div class="content camera-content">
      <div class="chapter"><span class="chapter-line"></span> LA BRUJA TE RETA <span class="chapter-line"></span></div>
      <h1>La foto con Suka</h1>
      <div class="camera-frame" role="group" aria-label="Vista de la cámara">
        <img id="camera-poster" src="${esc(clue.imagen)}" alt="Referencia para la foto con Suka">
        <video id="camera-live" autoplay muted playsinline hidden aria-label="Cámara frontal en directo"></video>
        <canvas id="camera-snapshot" hidden aria-label="Foto tomada"></canvas>
        <span class="camera-corner camera-corner-one" aria-hidden="true"></span>
        <span class="camera-corner camera-corner-two" aria-hidden="true"></span>
      </div>
      <p class="camera-status" id="camera-status" role="status">${mobile ? "Activando la cámara del móvil…" : "Vista de prueba en ordenador. La foto real se hace en el móvil."}</p>
      <div class="camera-actions">
        <button class="secondary-button" id="camera-shoot" type="button">Hacer foto</button>
        <button class="primary-button" id="camera-send" type="button" disabled>Enviar</button>
      </div>
      <input class="sr-only" id="camera-file" type="file" accept="image/*" capture="user" tabindex="-1" aria-label="Hacer foto con la cámara del móvil">
    </div>`, () => {
    const video = document.getElementById("camera-live");
    const poster = document.getElementById("camera-poster");
    const canvas = document.getElementById("camera-snapshot");
    const shoot = document.getElementById("camera-shoot");
    const send = document.getElementById("camera-send");
    const fileInput = document.getElementById("camera-file");

    if (cameraStream) showLive();
    else if (cameraFallback) status("Pulsa Hacer foto para abrir la cámara del móvil.");

    const finishCapture = extension => {
      shoot.disabled = true;
      send.disabled = true;
      let settled = false;
      let watchdog;
      const settle = blob => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        if (run !== cameraRun) return;
        shoot.disabled = false;
        if (!blob) {
          canvas.hidden = true;
          video.hidden = !cameraStream;
          poster.hidden = Boolean(cameraStream);
          status("No se pudo guardar la foto. Inténtalo otra vez.");
          return;
        }
        capturedBlob = blob;
        capturedExtension = extension;
        send.disabled = false;
        status("Foto lista. Pulsa Enviar para guardarla y descubrir el regalo.");
      };
      watchdog = setTimeout(() => settle(null), 8000);
      try {
        canvas.toBlob(settle, "image/jpeg", .9);
      } catch (_) {
        settle(null);
      }
    };

    shoot.addEventListener("click", () => {
      if (mobile && (!cameraStream || video.readyState < 2)) {
        fileInput.value = "";
        fileInput.click();
        return;
      }
      capturedBlob = null;
      canvas.width = mobile ? 1080 : 800;
      canvas.height = canvas.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) { status("No se pudo preparar la foto. Inténtalo otra vez."); return; }
      if (mobile) {
        const edge = Math.min(video.videoWidth, video.videoHeight);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, (video.videoWidth - edge) / 2, (video.videoHeight - edge) / 2,
          edge, edge, 0, 0, canvas.width, canvas.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#653076");
        gradient.addColorStop(1, "#1d0b2d");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#f6d96b";
        ctx.lineWidth = 8;
        ctx.strokeRect(100, 100, 600, 600);
        ctx.fillStyle = "#f6d96b";
        ctx.fillRect(215, 275, 370, 260);
        ctx.fillRect(280, 235, 120, 55);
        ctx.fillStyle = "#3b1b50";
        ctx.beginPath();
        ctx.arc(400, 405, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f6d96b";
        ctx.beginPath();
        ctx.arc(400, 405, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff0ad";
        ctx.font = "bold 37px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("FOTO DE PRUEBA", canvas.width / 2, 605);
        ctx.font = "26px sans-serif";
        ctx.fillText("Haz la foto real en el móvil", canvas.width / 2, 650);
      }
      poster.hidden = true;
      video.hidden = true;
      canvas.hidden = false;
      finishCapture("jpg");
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      capturedBlob = file;
      capturedExtension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      if (cameraPhotoUrl) URL.revokeObjectURL(cameraPhotoUrl);
      cameraPhotoUrl = URL.createObjectURL(file);
      poster.src = cameraPhotoUrl;
      poster.hidden = false;
      video.hidden = true;
      canvas.hidden = true;
      send.disabled = false;
      status("Foto lista. Pulsa Enviar para guardarla y descubrir el regalo.");
    });

    send.addEventListener("click", () => {
      if (!capturedBlob) return;
      const downloadUrl = URL.createObjectURL(capturedBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${mobile ? "foto-con-suka" : "foto-de-prueba-suka"}.${capturedExtension}`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      showLocation(index);
    });
  });

  if (streamRequest) {
    streamRequest.then(stream => {
      if (run !== cameraRun || capturedBlob) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      cameraStream = stream;
      showLive();
    }).catch(() => {
      if (run === cameraRun) {
        cameraFallback = true;
        status("Pulsa Hacer foto para abrir la cámara del móvil.");
      }
    });
  }
}

function showLocation(index) {
  const clue = PISTAS[index];
  setScene("location", `
    <div class="content location-content">
      <div class="location-icon" aria-hidden="true">✦</div>
      <div class="chapter"><span class="chapter-line"></span> ¡Fantástico! <span class="chapter-line"></span></div>
      <h1>Tu regalo está en...</h1>
      <p class="location-name">${esc(clue.ubicacion)}</p>
      <button class="primary-button" id="gift-found" type="button">Regalo encontrado <span aria-hidden="true">✦</span></button>
    </div>`, () => document.getElementById("gift-found").addEventListener("click", () => {
    if (index < PISTAS.length - 1) startWitch(index + 1); else startWitch(index, true);
  }));
}

function showFinal() {
  setScene("final", `
    <div class="content final-content">
      <span class="final-spark" aria-hidden="true">✦</span>
      <h1>¡Felices 29 querida! ¡BESITOS ENVENENADOS!</h1>
      <div class="final-heart" role="img" aria-label="Corazón lila">💜</div>
      <button class="restart-button" id="restart" type="button">Volver al inicio</button>
    </div>`, () => document.getElementById("restart").addEventListener("click", showLogin));
}

function openJumpDialog() {
  if (profile.hidden || jumpDialog.open) return;
  jumpList.innerHTML = PISTAS.map((_, i) => `<button type="button" data-index="${i}">Pista ${i + 1}<span aria-hidden="true">✦</span></button>`).join("");
  jumpDialog.showModal();
  profile.setAttribute("aria-expanded", "true");
}

function closeJumpDialog() {
  if (jumpDialog.open) jumpDialog.close();
  profile.setAttribute("aria-expanded", "false");
}

function beginHold(event) {
  if (profile.hidden || jumpDialog.open || holdTimer) return;
  if (event.type === "keydown" && ![" ", "Enter"].includes(event.key)) return;
  if (event.type === "pointerdown" && event.button !== 0) return;
  profile.classList.add("holding");
  holdTimer = setTimeout(() => {
    holdTimer = null;
    profile.classList.remove("holding");
    if (navigator.vibrate) navigator.vibrate(45);
    openJumpDialog();
  }, HOLD_MS);
}

function cancelHold() {
  clearTimeout(holdTimer);
  holdTimer = null;
  profile.classList.remove("holding");
}

profile.addEventListener("pointerdown", beginHold);
profile.addEventListener("pointerup", cancelHold);
profile.addEventListener("pointercancel", cancelHold);
profile.addEventListener("pointerleave", cancelHold);
profile.addEventListener("keydown", beginHold);
profile.addEventListener("keyup", cancelHold);
profile.addEventListener("blur", cancelHold);
profile.addEventListener("click", event => event.preventDefault());
profile.addEventListener("contextmenu", event => event.preventDefault());
closeJump.addEventListener("click", closeJumpDialog);
jumpDialog.addEventListener("close", () => profile.setAttribute("aria-expanded", "false"));
jumpList.addEventListener("click", event => {
  const button = event.target.closest("button[data-index]");
  if (!button) return;
  const index = Number(button.dataset.index);
  closeJumpDialog();
  startWitch(index);
});

createParticles();
showLogin();
