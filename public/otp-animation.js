/* =====================================================================
   OTP giriş animasyonu — bağımsız paket (vMon'dan çıkarılmıştır)
   Köken: hasib41/otp-verification-v3 (MIT License, Copyright (c) 2026 Hasib)
   https://github.com/hasib41/otp-verification-v3

   Bağımlılık yok (vanilla JS, Web Animations API). Tema içermez.

   Kullanım:
     const otp = OtpAnimation.mount(document.querySelector(".otp-card"), {
       length: 6,
       verify: async (code) => {                 // SİZİN sunucu doğrulamanız
         const r = await fetch("/api/otp/verify", { method: "POST",
           headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
         if (r.ok) return { ok: true, redirect: "/dashboard" };
         return { ok: false, message: (await r.json()).message };
       },
       onSuccess: (result) => { location.href = result.redirect; },   // animasyon bittikten sonra
     });

   verify(code) dönüşü:  true | false | { ok: boolean, message?: string, redirect?: string }
   verify() hata fırlatırsa "network" mesajı gösterilir.

   HTML'de yalnız şu iskelet yeter (gerisini mount() kurar):
     <div class="otp-card" data-state="idle">
       <form><div class="code-wrap"><div class="code"></div></div>
             <button class="otp-actions">Doğrula</button></form>
     </div>
   Hane kutularını, çemberi, mührü ve hata satırını JS üretir; isterseniz
   kendiniz de yazabilirsiniz (README'de tam yapı) — JS var olanı kullanır.

   Bileşen bir durum makinesidir. Tek doğruluk kaynağı .otp-card üzerindeki
   data-state'tir (idle | filling | checking | ok | error); görsel her şey o
   öznitelikten okur. Bu dosya yalnız CSS'in yapamadığını üstlenir: satırı
   çembere saran polar matematik ve vidalanma.
   ===================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OtpAnimation = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const TAU = Math.PI * 2;

  const DEFAULT_MESSAGES = {
    checking: "Kod doğrulanıyor…",
    wrong: "Kod doğru değil — mesajlarınızı kontrol edin.",
    network: "Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.",
    ok: "Kod doğrulandı. Giriş yapılıyor.",
    group: "{n} haneli doğrulama kodu",
    digit: "Hane {i} / {n}",
  };

  const SR_ONLY = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)";

  const ORBIT_HTML =
    '<div class="orbit" aria-hidden="true">' +
      '<svg class="orbit__ring" data-track viewBox="0 0 100 100" focusable="false">' +
        '<circle class="orbit__path" cx="50" cy="50" r="50" pathLength="1" vector-effect="non-scaling-stroke" />' +
      "</svg>" +
      '<span class="orbit__hub" data-hub></span>' +
    "</div>";

  const SEAL_HTML =
    '<div class="seal" aria-hidden="true">' +
      '<span class="seal__ring"></span>' +
      '<span class="seal__ring seal__ring--wide"></span>' +
      '<span class="seal__tile">' +
        '<span class="seal__sheen"></span>' +
        '<svg viewBox="0 0 40 40" fill="none" focusable="false">' +
          '<path class="seal__check" d="M11 20.5 L17.5 27 L29 15" pathLength="1" stroke-linecap="round" stroke-linejoin="round" />' +
        "</svg>" +
      "</span>" +
    "</div>";

  const BURST_HTML = '<div class="burst" data-burst aria-hidden="true"></div>';

  const fmt = (s, i, n) => s.replace("{i}", i).replace("{n}", n);

  /* Eksik parçaları kurar; var olanlara dokunmaz. */
  function ensureStructure(card, N, msg, inputName) {
    const form = card.querySelector("form");
    const host = form || card;

    let wrap = card.querySelector(".code-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "code-wrap";
      host.insertBefore(wrap, host.firstChild);
    }

    let code = wrap.querySelector(".code");
    if (!code) {
      code = document.createElement("div");
      code.className = "code";
      wrap.appendChild(code);
    }
    code.setAttribute("role", "group");
    if (!code.getAttribute("aria-label")) code.setAttribute("aria-label", fmt(msg.group, 0, N));

    if (!code.querySelector(".slot")) {
      let html = "";
      for (let i = 0; i < N; i += 1) {
        /* İlk kutu tam kodu da kabul eder: yapıştırma ve işletim sistemi
           oto-doldurması buraya iner; JS yoksa N hane düz yazılıp gönderilir. */
        const input = i === 0
          ? `<input class="slot__input" type="text" name="${inputName}" inputmode="numeric" pattern="[0-9]*" maxlength="${N}" autocomplete="one-time-code" enterkeyhint="done" autofocus />`
          : '<input class="slot__input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" enterkeyhint="done" />';
        html +=
          '<label class="slot">' +
            `<span class="sr-only" style="${SR_ONLY}">${fmt(msg.digit, i + 1, N)}</span>` +
            input +
            '<span class="slot__win" aria-hidden="true"><span class="slot__digit"></span></span>' +
            '<span class="slot__glow" aria-hidden="true"></span>' +
          "</label>";
      }
      code.innerHTML = html;
    }

    if (!wrap.querySelector(".orbit")) wrap.insertAdjacentHTML("afterbegin", ORBIT_HTML);
    if (!wrap.querySelector(".seal")) wrap.insertAdjacentHTML("beforeend", SEAL_HTML);
    if (!wrap.querySelector("[data-burst]")) wrap.insertAdjacentHTML("beforeend", BURST_HTML);

    let errEl = card.querySelector("[data-err]");
    if (!errEl) {
      errEl = document.createElement("p");
      errEl.className = "otp-err";
      errEl.setAttribute("data-err", "");
      errEl.setAttribute("aria-live", "polite");
      wrap.insertAdjacentElement("afterend", errEl);
    }

    let live = document.querySelector("[data-live]");
    if (!live) {
      live = document.createElement("p");
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      live.setAttribute("data-live", "");
      live.style.cssText = SR_ONLY;
      document.body.appendChild(live);
    }
    return { form, wrap, errEl, live };
  }

  function mount(card, options) {
    if (!card) throw new Error("OtpAnimation.mount: kart elemanı bulunamadı");
    const opts = Object.assign({ length: 6, autoSubmit: true, inputName: "code", verify: null, onSuccess: null, onError: null }, options || {});
    if (typeof opts.verify !== "function") throw new Error("OtpAnimation.mount: options.verify(code) zorunludur");

    /* Mesaj önceliği: options.messages > data-msg-* öznitelikleri > varsayılan */
    const msg = Object.assign({}, DEFAULT_MESSAGES, {
      checking: card.dataset.msgChecking,
      wrong: card.dataset.msgWrong,
      network: card.dataset.msgNetwork,
      ok: card.dataset.msgOk,
    }, opts.messages || {});
    Object.keys(msg).forEach((k) => { if (msg[k] == null) msg[k] = DEFAULT_MESSAGES[k]; });

    /* Girdi kutuları ancak JS varken gizlenir (html.js .slot__input) */
    document.documentElement.classList.add("js");

    const N = opts.length;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { form, wrap, errEl, live } = ensureStructure(card, N, msg, opts.inputName);

    const slots  = [...card.querySelectorAll(".slot")].slice(0, N);
    if (slots.length !== N) throw new Error(`OtpAnimation.mount: ${N} hane bekleniyor, ${slots.length} .slot bulundu`);
    const inputs = slots.map((s) => s.querySelector(".slot__input"));
    const digits = slots.map((s) => s.querySelector(".slot__digit"));
    const wins   = slots.map((s) => s.querySelector(".slot__win"));
    const glows  = slots.map((s) => s.querySelector(".slot__glow"));
    const track  = card.querySelector("[data-track]");
    const hub    = card.querySelector("[data-hub]");
    const burst  = card.querySelector("[data-burst]");

    /* ---------- zamanlama (referans değerleri) ---------- */
    const ORBIT_R   = 1.35;   // 6 kutu daha geniş bir satır → çember biraz büyür
    const TURNS     = 1.25;   // tam tur + çeyrek: her kutu bir sonraki işarete oturur
    const CURL_MS   = 660;
    const CURL_LAG  = 34;
    const SPIN_MS   = 800;
    const HOLD_MS   = 340;
    const SCREW_MS  = 520;
    const SCREW_LAG = 26;

    let state = "idle";
    let runId = 0;
    const running = [];
    const ac = new AbortController();
    const on = (el, ev, fn) => el.addEventListener(ev, fn, { signal: ac.signal });

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const round = (n) => Math.round(n * 100) / 100;
    const outCubic = (t) => 1 - (1 - t) ** 3;
    const outBack = (t, s = 1.5) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;

    const play = (el, frames, o) => {
      const a = el.animate(frames, o);
      running.push(a);
      return a;
    };

    function setState(next) {
      state = next;
      card.dataset.state = next;
    }
    function say(text) { if (live) live.textContent = text; }

    const valueOf = () => inputs.map((i) => i.value).join("");
    const isComplete = () => valueOf().length === N;
    const firstEmpty = () => {
      const i = inputs.findIndex((el) => !el.value);
      return i === -1 ? N - 1 : i;
    };

    function focusSlot(i) {
      const el = inputs[Math.max(0, Math.min(N - 1, i))];
      el.focus({ preventScroll: true });
      el.select();
    }

    /* Rakam inişi: küçük bir "pop" — transform'la, yerleşim kımıldamaz. */
    function setDigit(i, ch) {
      digits[i].textContent = ch;
      slots[i].classList.toggle("is-filled", !!ch);
      if (ch && !reduced) {
        play(digits[i], [
          { transform: "scale(0.4) translateY(6px)", opacity: 0 },
          { transform: "scale(1.12)", opacity: 1, offset: 0.7 },
          { transform: "scale(1)", opacity: 1 },
        ], { duration: 200, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.3)" });
      }
    }

    /* ---------- yazma ---------- */
    function distribute(str, from) {
      const ds = str.replace(/\D/g, "").slice(0, N - (str.length >= N ? 0 : from)).split("");
      const start = ds.length >= N ? 0 : from;           // tam kod her yerden yapıştırılabilir
      inputs.forEach((el, i) => { if (i >= start && ds[i - start] !== undefined) el.value = ds[i - start]; });
      inputs.forEach((el, i) => setDigit(i, el.value));
      setState("filling");
      focusSlot(firstEmpty());
      maybeSubmit();
    }

    inputs.forEach((el, i) => {
      on(el, "input", (e) => {
        if (state === "checking" || state === "ok") return;
        if (state === "error") { setState("filling"); errEl.textContent = ""; }
        const typed = e.target.value.replace(/\D/g, "");
        if (!typed) { e.target.value = ""; setDigit(i, ""); return; }
        if (typed.length > 1) { e.target.value = ""; distribute(typed, i); return; }
        e.target.value = typed;
        setDigit(i, typed);
        if (i < N - 1) focusSlot(!inputs[i + 1].value ? i + 1 : firstEmpty());
        maybeSubmit();
      });

      on(el, "keydown", (e) => {
        if (state === "checking" || state === "ok") { e.preventDefault(); return; }
        if (e.key === "Backspace" && !el.value && i > 0) {
          e.preventDefault();
          inputs[i - 1].value = "";
          setDigit(i - 1, "");
          focusSlot(i - 1);
        } else if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); focusSlot(i - 1); }
        else if (e.key === "ArrowRight" && i < N - 1) { e.preventDefault(); focusSlot(i + 1); }
        else if (e.key === "Enter" && !form) { e.preventDefault(); if (isComplete()) submit(); else focusSlot(firstEmpty()); }
      });

      on(el, "focus", () => el.select());
      on(el, "paste", (e) => {
        e.preventDefault();
        distribute((e.clipboardData || window.clipboardData).getData("text"), i);
      });
    });

    function maybeSubmit() { if (opts.autoSubmit && isComplete() && state !== "checking") submit(); }

    /* ---------- doğrulama: sizin verify() fonksiyonunuz ---------- */
    async function submit() {
      if (state === "checking" || state === "ok") return;
      setState("checking");
      errEl.textContent = "";
      inputs.forEach((el) => { el.disabled = true; });
      say(msg.checking);

      let result;
      try {
        result = await opts.verify(valueOf());
      } catch (err) {
        return fail(msg.network, err);
      }
      if (result === true) result = { ok: true };
      else if (!result || typeof result !== "object") result = { ok: false };

      if (result.ok) {
        await gyre(++runId);
        succeed(result);
        return;
      }
      fail(result.message || msg.wrong, result);
    }

    function succeed(result) {
      setState("ok");
      document.body.dataset.otpOk = "";
      say(msg.ok);
      if (!reduced) throwMotes();
      setTimeout(() => {
        if (typeof opts.onSuccess === "function") opts.onSuccess(result);
        else if (result.redirect) window.location.href = result.redirect;
      }, reduced ? 500 : 1100);
    }

    function fail(text, detail) {
      setState("error");
      errEl.textContent = text;
      say(text);
      inputs.forEach((el) => { el.disabled = false; el.setAttribute("aria-invalid", "true"); });
      focusSlot(0);
      if (typeof opts.onError === "function") opts.onError(text, detail);

      /* Yanlış rakamları okunacak kadar tut, sonra yazıldıkları yönün tersine
         sağdan sola sil — düzeltme yarım-yanlış bir satırdan değil boş satırdan başlar. */
      const myRun = ++runId;
      setTimeout(async () => {
        if (runId !== myRun || state !== "error") return;
        for (let i = N - 1; i >= 0; i -= 1) {
          inputs[i].value = "";
          setDigit(i, "");
          if (!reduced) await wait(45);
        }
        inputs.forEach((el) => el.removeAttribute("aria-invalid"));
        setState("filling");
        focusSlot(0);
      }, 900);
    }

    /* ---------- çember matematiği ---------------------------------------- */
    function measureOrbit() {
      const r = slots.map((s) => s.getBoundingClientRect());
      const box = wrap.getBoundingClientRect();
      const w = r[0].width, h = r[0].height;
      const cx = (r[0].left + r[N - 1].right) / 2;
      const cy = r[0].top + h / 2;
      const R = w * ORBIT_R;
      const p = r.map((b) => [b.left + b.width / 2, b.top + b.height / 2]);
      const a0 = p.map(([x]) => (x < cx ? Math.PI : 0));
      const r0 = p.map(([x]) => Math.abs(x - cx));
      /* Satır SAAT YÖNÜNDE, soldan başlayarak çembere sarılır — N kutu eşit aralıkla. */
      const a1 = slots.map((_, i) => Math.PI + (i * TAU) / N);
      const turn = a1.map((a, i) => {
        let d = (a - a0[i]) % TAU;
        if (d < 0) d += TAU;
        if (d > Math.PI) d -= TAU;
        return d;
      });
      return { w, h, R, cx, cy, box, p, a0, r0, a1, turn };
    }

    function at(g, i, ang, rad, rot, sc) {
      const x = g.cx + Math.cos(ang) * rad - g.p[i][0];
      const y = g.cy + Math.sin(ang) * rad - g.p[i][1];
      return `translate(${round(x)}px, ${round(y)}px) rotate(${round(rot)}deg) scale(${round(sc)})`;
    }

    function ringDelta(g, i) {
      return [
        round(g.cx + Math.cos(g.a1[i]) * g.R - g.p[i][0]),
        round(g.cy + Math.sin(g.a1[i]) * g.R - g.p[i][1]),
      ];
    }

    function layoutOrbit(g) {
      const L = g.box.left, O = g.box.top, d = g.R * 2;
      track.style.width = `${round(d)}px`;
      track.style.height = `${round(d)}px`;
      track.style.left = `${round(g.cx - g.R - L)}px`;
      track.style.top = `${round(g.cy - g.R - O)}px`;
      hub.style.left = `${round(g.cx - L)}px`;
      hub.style.top = `${round(g.cy - O)}px`;
    }

    /**
     * Dönüşün kendisi: üç vuruş, yerleşim hiçbirinde akmaz.
     *   1. nefes + satırın çembere KIVRILMASI (polar örnekleme — düz çizgi olsaydı
     *      çembere giden yol kendini ele verirdi)
     *   2. tek katı halka olarak tam tur + çeyrek (transform-origin numarası:
     *      örneklenmez, iki keyframe — örneklenmiş tur kirişten kısılıp titrer)
     *   3. yarıçap sıfıra: altı kutu göbeğe VİDALANIR (spiral, yine iki keyframe)
     */
    async function gyre(myRun) {
      if (reduced) return;             // hareket azaltma: CSS'in sade mührü yeter
      const g = measureOrbit();
      layoutOrbit(g);

      /* 1 — kıvrılma */
      const CURL_STEPS = 20;
      slots.forEach((s, i) => {
        const frames = [
          { transform: at(g, i, g.a0[i], g.r0[i], 0, 1), offset: 0 },
          { transform: at(g, i, g.a0[i], g.r0[i], 0, 0.9), offset: 0.16 },
        ];
        for (let k = 1; k <= CURL_STEPS; k += 1) {
          const t = k / CURL_STEPS;
          const ang = g.a0[i] + g.turn[i] * outCubic(t);
          const rad = g.r0[i] + (g.R - g.r0[i]) * outBack(t);
          frames.push({
            transform: at(g, i, ang, rad, 0, 0.9 + 0.1 * outCubic(t)),
            offset: 0.16 + 0.84 * t,
          });
        }
        play(s, frames, { duration: CURL_MS, delay: i * CURL_LAG, easing: "linear", fill: "forwards" });
      });

      track.style.opacity = "1";
      play(track, [
        { transform: "scale(0.72) rotate(-24deg)", opacity: 0 },
        { transform: "scale(1) rotate(0deg)", opacity: 1 },
      ], { duration: CURL_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" });

      await wait(CURL_MS + CURL_LAG * (N - 1) + 60);
      if (myRun !== runId) return;

      /* 2 — tur: origin göbeğe taşınır, düz rotate() kusursuz çember çizer */
      const total = TURNS * 360;
      const REST = total % 360;

      slots.forEach((s, i) => {
        s.style.transformOrigin =
          `${round(g.cx - g.p[i][0] + g.w / 2)}px ${round(g.cy - g.p[i][1] + g.h / 2)}px`;
        const d = ringDelta(g, i);
        play(s, [
          { transform: `rotate(0deg) translate(${d[0]}px, ${d[1]}px)` },
          { transform: `rotate(${total}deg) translate(${d[0]}px, ${d[1]}px)` },
        ], { duration: SPIN_MS, easing: "cubic-bezier(0.62, 0, 0.38, 1)", fill: "forwards" });

        /* Rakamlar çeyreği geri verir: hızlı bölümde kutuyla döner (takla),
           frende REST'i çözerek dik iner — yön hiç tersine dönmez. */
        play(wins[i], [
          { transform: "rotate(0deg)", offset: 0 },
          { transform: "rotate(0deg)", offset: 0.62 },
          { transform: `rotate(${-REST}deg)`, offset: 1 },
        ], { duration: SPIN_MS, easing: "cubic-bezier(0.32, 0, 0.2, 1)", fill: "forwards" });
      });

      /* iz halkayla BİRLİKTE ama daha yavaş döner — ayrışma parallakstan gelir */
      play(track, [
        { transform: "scale(1) rotate(0deg)", opacity: 1, offset: 0 },
        { transform: "scale(1.05) rotate(34deg)", opacity: 0.85, offset: 0.5 },
        { transform: "scale(1) rotate(52deg)", opacity: 1, offset: 1 },
      ], { duration: SPIN_MS, easing: "ease-in-out", fill: "forwards" });

      hub.style.opacity = "1";
      play(hub, [
        { transform: "scale(0.3)", opacity: 0 },
        { transform: "scale(1)", opacity: 0.9 },
      ], { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" });

      await wait(SPIN_MS);
      if (myRun !== runId) return;

      card.dataset.locked = "";
      slots.forEach((_, i) => play(glows[i], [
        { transform: "scale(0.9)", opacity: 0 },
        { transform: "scale(1.18)", opacity: 0.9, offset: 0.4 },
        { transform: "scale(1.4)", opacity: 0 },
      ], { duration: 520, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }));

      await wait(HOLD_MS);
      if (myRun !== runId) return;

      /* 3 — vidalanma: dönüş sürerken merkez göbeğe düz gider = spiral */
      const END_S = 0.24, EXTRA = 150;
      slots.forEach((s, i) => {
        const d = ringDelta(g, i);
        const v0x = g.p[i][0] - g.cx, v0y = g.p[i][1] - g.cy;
        play(s, [
          { transform: `rotate(${total}deg) translate(${d[0]}px, ${d[1]}px) scale(1)` },
          { transform: `rotate(${total + EXTRA}deg) translate(${round(-END_S * v0x)}px, ${round(-END_S * v0y)}px) scale(${END_S})` },
        ], { duration: SCREW_MS, delay: i * SCREW_LAG, easing: "cubic-bezier(0.55, 0, 0.35, 1)", fill: "forwards" });
        play(s, [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: 0.62 },
          { opacity: 0, offset: 1 },
        ], { duration: SCREW_MS, delay: i * SCREW_LAG, easing: "linear", fill: "forwards" });
      });

      slots.forEach((_, i) => play(wins[i], [{ opacity: 1 }, { opacity: 0 }],
        { duration: 260, delay: SCREW_MS * 0.4, easing: "linear", fill: "forwards" }));

      play(track, [
        { transform: "scale(1) rotate(52deg)", opacity: 1 },
        { transform: "scale(0.1) rotate(96deg)", opacity: 0 },
      ], { duration: SCREW_MS, easing: "cubic-bezier(0.6, 0, 0.3, 1)", fill: "forwards" });

      play(hub, [
        { transform: "scale(1)", opacity: 0.9, offset: 0 },
        { transform: "scale(1.8)", opacity: 1, offset: 0.78 },
        { transform: "scale(3.2)", opacity: 0, offset: 1 },
      ], { duration: SCREW_MS + 120, easing: "cubic-bezier(0.5, 0, 0.3, 1)", fill: "forwards" });

      await wait(SCREW_MS + SCREW_LAG * (N - 1) + 40);
    }

    /* Karodan saçılan ışık: az, yuvarlak, hızından yavaş — parti değil onay. */
    const MOTES = 18;
    function throwMotes() {
      for (let i = 0; i < MOTES; i += 1) {
        const mote = document.createElement("span");
        mote.className = "mote";
        if (i % 3 === 0) mote.classList.add("mote--sm");
        if (i % 5 === 0) mote.classList.add("mote--lg");
        if (i % 4 === 1) mote.classList.add("mote--pale");
        burst.appendChild(mote);
        const a = (i / MOTES) * TAU + (Math.random() - 0.5) * 0.55;
        const dist = 70 + Math.random() * 72;
        const anim = mote.animate([
          { transform: "translate(0, 0) scale(0.2)", opacity: 0, offset: 0 },
          { transform: `translate(${Math.cos(a) * dist * 0.36}px, ${Math.sin(a) * dist * 0.36}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${Math.cos(a) * dist * 0.72}px, ${Math.sin(a) * dist * 0.72 + 8}px) scale(0.9)`, opacity: 0.95, offset: 0.58 },
          { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist + 18}px) scale(0.4)`, opacity: 0, offset: 1 },
        ], { duration: 1100 + Math.random() * 420, delay: 60 + Math.random() * 130, easing: "cubic-bezier(0.12, 0.75, 0.28, 1)" });
        anim.finished.then(() => mote.remove(), () => mote.remove());
      }
    }

    /* form gönderimini her koşulda biz üstleniriz (Enter dahil) */
    if (form) {
      on(form, "submit", (e) => {
        e.preventDefault();
        if (isComplete() && state !== "checking" && state !== "ok") submit();
        else focusSlot(firstEmpty());
      });
    }

    /* Başa döndürür: animasyon kalıntılarını (transform/opacity/origin) temizler. */
    function reset() {
      runId += 1;
      running.splice(0).forEach((a) => { try { a.cancel(); } catch { /* bitmiş */ } });
      slots.forEach((s) => { s.style.transformOrigin = ""; });
      [...slots, ...wins, track, hub].forEach((el) => { el.style.transform = ""; el.style.opacity = ""; });
      delete card.dataset.locked;
      delete document.body.dataset.otpOk;
      burst.innerHTML = "";
      errEl.textContent = "";
      inputs.forEach((el, i) => { el.value = ""; el.disabled = false; el.removeAttribute("aria-invalid"); setDigit(i, ""); });
      setState("idle");
      focusSlot(0);
    }

    function destroy() {
      ac.abort();
      running.splice(0).forEach((a) => { try { a.cancel(); } catch { /* bitmiş */ } });
    }

    setState("idle");
    focusSlot(0);

    return {
      get state() { return state; },
      value: valueOf,
      submit,
      reset,
      error: (text) => fail(text || msg.wrong),
      destroy,
      elements: { card, form, wrap, slots, inputs },
    };
  }

  return { mount, VERSION: "1.0.0" };
});
