// js/audio.js
const GameAudio = { // <<< DEĞİŞTİ
    sounds: {},
    bgm: null,
    sfxVolume: 0.7,
    bgmVolume: 0.5,
    isMuted: false, // Genel sessize alma (henüz kullanılmıyor ama eklenebilir)

    init(soundList, bgmSrc) {
        console.log("Initializing GameAudio..."); // <<< Log mesajı güncellendi
        // Ses ayarlarını yükle
        this.sfxVolume = Utils.loadData('sfxVolume', 0.7);
        this.bgmVolume = Utils.loadData('bgmVolume', 0.5);

        // Ses efektlerini yükle
        soundList.forEach(sound => {
            this.loadSound(sound.id, sound.src);
        });

        // Arka plan müziğini yükle
        if (bgmSrc) {
            // Howler.js kütüphanesi KULLANILMIYORSA HTML5 Audio kullanılır.
            // Howler.js KULLANILIYORSA:
            if (typeof Howl !== 'undefined') {
                 try {
                    this.bgm = new Howl({
                        src: [bgmSrc],
                        loop: true,
                        volume: this.bgmVolume,
                        html5: true // Tarayıcı uyumluluğu için
                    });
                } catch (e) {
                    console.error("Error initializing Howler BGM:", e);
                    this.loadHtml5Bgm(bgmSrc); // Fallback to HTML5 Audio
                }
            } else {
                 this.loadHtml5Bgm(bgmSrc); // Howler yoksa direkt HTML5 Audio yükle
            }
            // Tarayıcılar kullanıcı etkileşimi olmadan otomatik çalmayı engelleyebilir.
            // İlk play() genellikle bir buton tıklaması içinde olmalı.
        }
        console.log("GameAudio Initialized."); // <<< Log mesajı güncellendi
    },

    // Howler.js veya HTML5 Audio ile ses yükleme
    loadSound(id, src) {
        if (typeof Howl !== 'undefined') {
            try {
                 this.sounds[id] = new Howl({
                     src: [src],
                     volume: this.sfxVolume
                 });
             } catch (e) {
                console.error(`Error loading sound ${id} with Howler:`, e);
             }
        } else {
             try {
                 // Howler yoksa temel HTML5 Audio kullanılır.
                 console.warn("Howler.js not found. Using basic HTML5 Audio (may have limitations).");
                 this.sounds[id] = new Audio(src); // Temel HTML5 Audio
                 this.sounds[id].volume = this.sfxVolume;
                 this.sounds[id].preload = 'auto'; // Ön yüklemeyi dene
                 // Tarayıcı engellerse yüklenmeyebilir.
                 this.sounds[id].load();
             } catch(e) {
                  console.error(`Error loading sound ${id} with HTML5 Audio:`, e);
             }
        }
    },

    // HTML5 Audio ile BGM yükleme (Fallback)
    loadHtml5Bgm(bgmSrc) {
         try {
            console.warn("Using basic HTML5 Audio for BGM.");
            this.bgm = new Audio(bgmSrc);
            this.bgm.loop = true;
            this.bgm.volume = this.bgmVolume;
            this.bgm.preload = 'auto';
            this.bgm.load();
         } catch (e) {
             console.error("Error initializing HTML5 BGM:", e);
             this.bgm = null;
         }
    },

    playSound(id) {
        const sound = this.sounds[id];
        if (sound) {
            try {
                 // Howler varsa:
                 if (sound instanceof Howl) {
                     sound.volume(this.sfxVolume); // Her çalmadan önce sesi ayarla
                     sound.play();
                 }
                 // HTML5 Audio ise:
                 else if (sound instanceof Audio) {
                     sound.currentTime = 0; // Başa sar
                     sound.volume = this.sfxVolume;
                     sound.play().catch(e => console.warn(`HTML5 Audio play blocked for ${id}:`, e)); // Otomatik çalma engeli olabilir
                 }
            } catch(e) {
                 console.error(`Error playing sound ${id}:`, e);
            }
        } else {
            console.warn(`Sound not found: ${id}`);
        }
    },

    playBGM() {
        if (!this.bgm) {
             console.warn("BGM not loaded or failed to initialize.");
             return;
        }
         try {
            // Howler varsa:
             if (this.bgm instanceof Howl) {
                 if (!this.bgm.playing()) {
                    this.bgm.volume(this.bgmVolume);
                    this.bgm.play();
                    console.log("BGM Playing (Howler)");
                 }
             }
             // HTML5 Audio ise:
             else if (this.bgm instanceof Audio) {
                  // HTML5 Audio'da playing durumu daha az güvenilir, doğrudan play dene
                  this.bgm.volume = this.bgmVolume;
                   this.bgm.play().then(() => {
                       console.log("BGM Playing (HTML5)");
                   }).catch(e => console.warn("HTML5 BGM play blocked:", e));
             }
         } catch (e) {
              console.error("Error playing BGM:", e);
         }
    },

    stopBGM() {
        if (this.bgm) {
             try {
                if (this.bgm instanceof Howl) {
                     this.bgm.stop();
                     console.log("BGM Stopped (Howler)");
                 } else if (this.bgm instanceof Audio) {
                      this.bgm.pause();
                      this.bgm.currentTime = 0; // Başa sar
                      console.log("BGM Stopped (HTML5)");
                 }
            } catch (e) {
                 console.error("Error stopping BGM:", e);
            }
        }
    },

    setSfxVolume(volume) {
        volume = Math.max(0, Math.min(1, parseFloat(volume))); // 0-1 aralığında tut
        this.sfxVolume = volume;
         Utils.saveData('sfxVolume', volume);
        // Howler kullanılıyorsa mevcut seslerin sesini global olarak ayarlamak daha zor olabilir.
        // HTML5 Audio için mevcut seslerin sesini değiştirebiliriz ama en basiti playSound'da ayarlamak.
        console.log("SFX Volume set to:", volume);
         // Test sesi çalabiliriz
         this.playSound('click'); // Ayar değişince örnek ses
    },

    setBgmVolume(volume) {
        volume = Math.max(0, Math.min(1, parseFloat(volume)));
        this.bgmVolume = volume;
        if (this.bgm) {
             try {
                 if (this.bgm instanceof Howl) {
                    this.bgm.volume(volume);
                 } else if (this.bgm instanceof Audio) {
                     this.bgm.volume = volume;
                 }
            } catch (e) {
                 console.error("Error setting BGM volume:", e);
            }
        }
         Utils.saveData('bgmVolume', volume);
         console.log("BGM Volume set to:", volume);
    }
};