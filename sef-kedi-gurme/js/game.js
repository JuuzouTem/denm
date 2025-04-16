// js/game.js
const Game = {
    state: {
        currentScreen: 'loading', // 'loading', 'main_menu', 'game', 'paused', 'recipe_complete'
        currentRecipeId: null,
        currentStepIndex: 0,
        currentScore: 0,
        currentRecipeScore: 0, // Sadece mevcut tariften kazanılan skor
        currentRecipeStartTime: 0, // Zaman takibi için
        maxPossibleRecipeScore: 1, // 0'a bölme hatasını önle
        unlockedRecipes: [], // Kilidi açılmış tarif ID'leri
        playerAchievements: {}, // Achievements.js'den yüklenecek
        catAccessories: {}, // ChefKedi.js'den yüklenecek
        gamePaused: false,
        finalChallengeUnlocked: false, // Özel bayrak
        isLoading: true, // Başlangıçta yükleniyor
        stepTimeout: null, // Adım zaman aşımı için
        currentSelectionSequence: [], // Sıralı seçim için geçici dizi
    },
    currentRecipeData: null, // O an oynanan tarifin verisi (Recipes'den)
    currentStepData: null, // O anki adımın verisi

    // --- Oyun Başlatma ve Yönetimi ---
    init() {
         console.log("Initializing Game...");
         this.state.isLoading = true;
         UI.init(); // Önce UI'ı başlat (elementleri alsın)

         // GameAudio.init'i çağırırken try-catch kullanmak iyi olabilir
         try {
            GameAudio.init([ // <<< DEĞİŞTİ
                 { id: 'click', src: 'audio/click.wav' },
                 { id: 'chop', src: 'audio/chop.wav' },
                 { id: 'mix', src: 'audio/mix.wav' },
                 { id: 'squish', src: 'audio/squish.wav' },
                 { id: 'drop', src: 'audio/drop.wav' },
                 { id: 'sizzle', src: 'audio/sizzle.wav' },
                 { id: 'success', src: 'audio/success.wav' },
                 { id: 'failure', src: 'audio/failure.wav' },
                 { id: 'achievement_unlocked', src: 'audio/achievement_unlocked.wav' },
                 { id: 'meow_happy', src: 'audio/meow_happy.wav' },
                 { id: 'meow_neutral', src: 'audio/meow_neutral.wav' },
                 { id: 'success_ping', src: 'audio/success_ping.wav' },
                 { id: 'failure_buzz', src: 'audio/failure_buzz.wav' },
                 { id: 'pause', src: 'audio/pause.wav' }, // Eksik sesler eklendi
                 { id: 'resume', src: 'audio/resume.wav' },
                 { id: 'recipe_complete_fanfare', src: 'audio/recipe_complete_fanfare.wav'},
                 { id: 'reset', src: 'audio/reset.wav'}
             ], 'audio/bgm.mp3');
         } catch (error) {
             console.error("Critical error initializing GameAudio:", error);
             // Gerekirse kullanıcıya hata mesajı göster
             alert("Ses sistemi başlatılırken bir hata oluştu. Sesler çalışmayabilir.");
         }

         Achievements.init();
         this.state.playerAchievements = Achievements.playerProgress; // Güncel ilerlemeyi al

         ChefKedi.init(); // Kediyi başlat (aksesuarları yükler)
         this.state.catAccessories = ChefKedi.accessories;

         // Oyuncu ilerlemesini yükle
         this.state.currentScore = Utils.loadData('playerScore', 0);
         this.state.unlockedRecipes = Utils.loadData('unlockedRecipes', ['menemen']); // Başlangıçta menemen açık
         this.state.finalChallengeUnlocked = Utils.loadData('finalChallengeUnlocked', false);

         // Tariflerin kilidini kontrol et (skora göre)
          this.checkRecipeUnlocks();

         // Başlangıç UI ayarları
         UI.updateScore(this.state.currentScore);
         // Yükleme ekranı zaten aktif, window.onload sonrası kaldırılacak.
         this.state.isLoading = false;
         this.state.currentScreen = 'main_menu'; // Yükleme bitince bu ekrana geçilecek
          console.log("Game Initialized. State:", this.state);
    },

    // Ana menüden oyuna başla
    startGame() {
        console.log("Starting game...");
        GameAudio.playSound('click'); // <<< DEĞİŞTİ
        this.state.currentScreen = 'game';
        UI.hideScreen('main-menu');
        UI.showScreen('game-container');
         ChefKedi.speak("Harika! Hangi tarifle başlayalım Ceyda?", 'happy', 0); // Süresiz

         const firstUnlockedRecipe = this.state.unlockedRecipes.find(id => Recipes[id] && !Recipes[id].isChallenge);
         this.loadRecipe(firstUnlockedRecipe || 'menemen');
         GameAudio.stopBGM(); // <<< DEĞİŞTİ
         // GameAudio.playGameBGM(); // Eğer varsa
    },

     // Belirli bir tarifi başlat (Tarif Kitabından)
     startSpecificRecipe(recipeId) {
         if (!Recipes[recipeId]) {
             console.error(`Recipe not found: ${recipeId}`);
             return;
         }
          if (!this.state.unlockedRecipes.includes(recipeId) && Recipes[recipeId].unlockScore !== 0) {
              console.warn(`Trying to start a locked recipe: ${recipeId}`);
              ChefKedi.speak("Bu tarifin kilidini açmak için biraz daha puan kazanmalısın!", 'thinking');
              return;
          }
         console.log(`Starting specific recipe: ${recipeId}`);
         GameAudio.playSound('click'); // <<< DEĞİŞTİ
         this.state.currentScreen = 'game';
         UI.hideScreen('main-menu');
         UI.hideScreen('recipe-book-screen');
         UI.showScreen('game-container');
         this.loadRecipe(recipeId);
          GameAudio.stopBGM(); // <<< DEĞİŞTİ
     },

    // Oyunu Duraklat
    pauseGame() {
         if (this.state.currentScreen !== 'game' || this.state.gamePaused) return;
         this.state.gamePaused = true;
         this.state.currentScreen = 'paused';
         UI.showScreen('pause-menu');
         GameAudio.playSound('pause'); // <<< DEĞİŞTİ
         MiniGames.pause?.(); // Eğer varsa
         ChefKedi.speak("Biraz dinlenelim mi?", 'waiting', 0);
    },

    // Oyuna Devam Et
    resumeGame() {
         if (!this.state.gamePaused) return;
         this.state.gamePaused = false;
         this.state.currentScreen = 'game';
         UI.hideScreen('pause-menu');
         GameAudio.playSound('resume'); // <<< DEĞİŞTİ
         MiniGames.resume?.(); // Eğer varsa
         // Kedinin önceki mesajını veya ruh halini geri yükle? Şimdilik basit devam.
         ChefKedi.speak("Hadi devam edelim!", ChefKedi.currentMood || 'idle', 4000);
    },

    // Oyundan Ana Menüye Dön
    quitToMenu() {
         GameAudio.playSound('click'); // <<< DEĞİŞTİ
         this.state.gamePaused = false;
         this.state.currentRecipeId = null;
         this.state.currentStepIndex = 0;
         this.state.currentScreen = 'main_menu';
         clearTimeout(this.state.stepTimeout); // Zamanlayıcıyı temizle
         UI.hideTimer(); // Timer'ı gizle
         UI.hideScreen('game-container');
         UI.hideScreen('pause-menu');
         UI.hideScreen('recipe-complete-screen');
         UI.showScreen('main-menu');
         GameAudio.stopBGM(); // <<< DEĞİŞTİ
         GameAudio.playBGM(); // <<< DEĞİŞTİ
    },

    // --- Tarif ve Adım Yönetimi ---
    loadRecipe(recipeId) {
         console.log(`Loading recipe: ${recipeId}`);
         if (!Recipes[recipeId]) {
             console.error(`Recipe data not found for ID: ${recipeId}`);
             this.quitToMenu();
             return;
         }
         this.currentRecipeData = Recipes[recipeId];
         this.state.currentRecipeId = recipeId;
         this.state.currentStepIndex = 0;
         this.state.currentRecipeScore = 0;
         this.state.currentRecipeStartTime = Date.now();
         this.state.maxPossibleRecipeScore = this.currentRecipeData.maxPossibleScore || 1000;

         UI.setRecipeTitle(this.currentRecipeData.name);
         UI.updateScore(this.state.currentScore);
         this.loadStep(this.state.currentStepIndex);
    },

    loadStep(stepIndex) {
        if (!this.currentRecipeData || stepIndex < 0 || stepIndex >= this.currentRecipeData.steps.length) {
            console.log("Recipe ended or invalid step index.");
            this.completeRecipe();
            return;
        }

        this.state.currentStepIndex = stepIndex;
        this.currentStepData = this.currentRecipeData.steps[stepIndex];
        const step = this.currentStepData;
        console.log(`Loading step ${stepIndex + 1}/${this.currentRecipeData.steps.length}: ${step.type}`);

        // UI'ı temizle ve hazırla
         clearTimeout(this.state.stepTimeout); // Önceki zamanlayıcıyı temizle
         this.state.stepTimeout = null;
         this.state.currentSelectionSequence = []; // Sıralı seçimi sıfırla
         UI.clearFeedback();
         UI.disableItemClicks(false);
         UI.updateNextButton("İleri", null, false);
         UI.hideTimer();

         // Adım türüne göre UI'ı ve Kedi'yi güncelle
         ChefKedi.speak(step.text || step.instruction || "...", step.catMood || 'thinking', step.type === 'message' ? 0 : 5000);

         switch (step.type) {
             case 'message':
                 UI.displayStepInfo(this.currentRecipeData.name, step.text);
                 UI.updateNextButton("Anladım!", null, true);
                  UI.elements.ingredientsToolsContainer.innerHTML = '';
                  UI.elements.ingredientsToolsContainer.classList.add('hidden'); // Boşsa gizle
                 break;

             case 'select':
             case 'timed_choice':
             case 'multi_select':
             case 'sequence_selection':
                  UI.displayStepInfo(this.currentRecipeData.name, step.instruction);
                 UI.displayItems(step.items, step.type, step.correct || step.correctSequence || step.required, this.handleItemClick.bind(this));
                  if (step.type === 'timed_choice' && step.timeLimit) {
                       UI.showTimer(step.timeLimit);
                       this.state.stepTimeout = setTimeout(() => this.handleStepTimeout(), step.timeLimit * 1000);
                   }
                 break;

             case 'click_tool':
                 UI.displayStepInfo(this.currentRecipeData.name, step.instruction);
                 UI.displayItems(step.items, 'click_tool', step.correct, this.handleItemClick.bind(this));
                 break;

             case 'minigame':
             case 'timed_action':
             case 'drag_drop':
                 UI.displayStepInfo(this.currentRecipeData.name, ""); // Mini oyun için ana talimatı gizleyebiliriz
                 MiniGames.init(step.minigame_type || step.type, step, this.handleMinigameComplete.bind(this));
                 break;

             case 'complete':
                 UI.displayStepInfo(this.currentRecipeData.name, step.text);
                 UI.updateNextButton("Harika!", null, true);
                  UI.elements.ingredientsToolsContainer.innerHTML = '';
                  UI.elements.ingredientsToolsContainer.classList.add('hidden');
                  ChefKedi.changeMood(step.catMood || 'celebrate');
                 break;

             default:
                 console.error(`Unknown step type: ${step.type}`);
                 this.nextStep();
         }
    },

     // Adımı zaman aşımına uğrat (timed_choice için)
     handleStepTimeout() {
         if (this.state.currentScreen !== 'game' || this.state.gamePaused || !this.state.stepTimeout) return;
         if (this.currentStepData && (this.currentStepData.type === 'timed_choice')) {
             console.log("Step timed out:", this.currentStepData.instruction);
             this.state.stepTimeout = null; // Zamanlayıcıyı temizle
             GameAudio.playSound('failure_buzz'); // <<< DEĞİŞTİ
             UI.showFeedback("Süre doldu! Hızlı olmalısın.", "error");
             ChefKedi.speak("Ah, süre yetmedi! Bir dahaki sefere daha hızlı olalım.", 'sad', 4000);
             this.state.currentRecipeScore += 0;
             UI.disableItemClicks(true);
             UI.updateNextButton("Devam Et", null, true);
             UI.hideTimer(); // Timer'ı gizle
         }
     },

    // Sonraki adıma geç
    nextStep() {
         clearTimeout(this.state.stepTimeout); // Varsa zamanlayıcıyı temizle
         this.state.stepTimeout = null;
         GameAudio.playSound('click'); // <<< DEĞİŞTİ
         this.loadStep(this.state.currentStepIndex + 1);
    },

    // Tarifi Tamamla
    completeRecipe() {
        console.log(`Recipe ${this.state.currentRecipeId} completed!`);
        if (!this.currentRecipeData) { // Eğer tarif verisi yoksa (hata durumu)
             console.error("Cannot complete recipe without data.");
             this.quitToMenu();
             return;
         }
        const recipeTime = Math.floor((Date.now() - this.state.currentRecipeStartTime) / 1000);
        const scorePercent = Math.min(100, Math.floor((this.state.currentRecipeScore / (this.state.maxPossibleRecipeScore || 1)) * 100));

         console.log(`Recipe Score: ${this.state.currentRecipeScore}, Time: ${recipeTime}s, Success: ${scorePercent}%`);

        this.state.currentScore += this.state.currentRecipeScore;
         Utils.saveData('playerScore', this.state.currentScore);
         UI.updateScore(this.state.currentScore);

        this.checkRecipeUnlocks();
         this.checkFinalChallengeUnlock();

        Achievements.checkAchievements({
             type: 'recipe_complete',
             id: this.state.currentRecipeId,
             score: this.state.currentRecipeScore,
             time: recipeTime,
             scorePercent: scorePercent,
             category: this.currentRecipeData.category,
             cuisine: this.currentRecipeData.cuisine,
             isDessert: this.currentRecipeData.isDessert
         });

        this.state.currentScreen = 'recipe_complete';
        UI.showCompletionScreen(this.currentRecipeData, this.state.currentRecipeScore, this.state.currentScore);
         ChefKedi.changeMood('celebrate');
         GameAudio.playSound('recipe_complete_fanfare'); // <<< DEĞİŞTİ
         // GameAudio.playBGM(); // <<< DEĞİŞTİ
    },

    // Mevcut tarifi tekrar oyna
    replayCurrentRecipe() {
         if (this.state.currentRecipeId) {
             GameAudio.playSound('click'); // <<< DEĞİŞTİ
             UI.hideScreen('recipe-complete-screen');
             this.loadRecipe(this.state.currentRecipeId);
             this.state.currentScreen = 'game';
             GameAudio.stopBGM(); // <<< DEĞİŞTİ (Oyun içi müzik farklıysa)
         }
    },

    // Sıradaki (açık olan) tarife geç
    startNextRecipe() {
         const nextRecipe = this.getNextRecipe();
         if (nextRecipe) {
              GameAudio.playSound('click'); // <<< DEĞİŞTİ
              UI.hideScreen('recipe-complete-screen');
              this.loadRecipe(nextRecipe.id);
              this.state.currentScreen = 'game';
              GameAudio.stopBGM(); // <<< DEĞİŞTİ (Oyun içi müzik farklıysa)
         } else {
              console.log("No more unlocked recipes available.");
              ChefKedi.speak("Görünüşe göre şimdilik tüm tarifleri tamamladık!", 'proud');
              this.quitToMenu();
         }
    },

     // Sıradaki açılmış ve tamamlanmamış tarifi bulur
     getNextRecipe() {
         const currentDifficulty = this.currentRecipeData?.difficulty || 0;
         const currentName = this.currentRecipeData?.name || '';

         const availableRecipes = Object.entries(Recipes)
             .filter(([id, data]) =>
                 this.state.unlockedRecipes.includes(id) &&
                 id !== this.state.currentRecipeId &&
                 !data.isChallenge
             )
             .map(([id, data]) => ({ id, ...data })) // ID'yi nesneye ekle
             .sort((a, b) => { // Önce zorluk, sonra isme göre sırala
                  const diffCompare = (a.difficulty || 0) - (b.difficulty || 0);
                  if (diffCompare !== 0) return diffCompare;
                  return (a.name || '').localeCompare(b.name || '');
              });

          // Mevcuttan sonraki ilk tarifi bul
          const currentIndex = availableRecipes.findIndex(r => {
              const diffCompare = (r.difficulty || 0) - currentDifficulty;
              if (diffCompare > 0) return true; // Daha zor ilk tarif
              if (diffCompare === 0 && (r.name || '').localeCompare(currentName) > 0) return true; // Aynı zorlukta sonraki isim
              return false;
          });

          if (currentIndex !== -1) {
              return availableRecipes[currentIndex]; // Bulunduysa onu döndür
          } else if (availableRecipes.length > 0) {
              // Bulunamadıysa (ya da son tarif oynandıysa), listenin başındaki ilk tarifi döndür (aynı zorluk veya düşük)
              return availableRecipes[0];
          }

         return null; // Hiç uygun tarif yoksa
     },


    // --- Olay İşleyicileri (UI'dan çağrılır) ---
    handleItemClick(event) {
         if (this.state.gamePaused || !this.currentStepData) return;

         const clickedItem = event.currentTarget;
         const itemId = clickedItem.dataset.id;
         const step = this.currentStepData;

         if (clickedItem.classList.contains('disabled')) return;

         let isCorrect = false;
         let isSelectionComplete = false;
         let scoreToAdd = 0;
          // Zaman aşımı kontrolü (eğer varsa ve tıklama olduysa temizle)
         if(this.state.stepTimeout) {
              clearTimeout(this.state.stepTimeout);
              this.state.stepTimeout = null;
              // UI.hideTimer(); // Zamanlayıcıyı sadece başarılıysa gizle?
         }


         switch (step.type) {
             case 'select':
             case 'timed_choice':
             case 'click_tool':
                 isCorrect = (itemId === step.correct);
                 if (isCorrect) {
                      scoreToAdd = step.scoreBase || step.score || 50;
                       if (step.type === 'timed_choice' && MiniGames.timeLeft !== undefined) { // timeLeft MiniGames'den gelebilir
                            scoreToAdd += Math.floor(MiniGames.timeLeft * 2); // Bu kısım MiniGames'e taşınabilir
                            UI.hideTimer(); // Başarılı olunca timer'ı gizle
                       }
                     isSelectionComplete = true;
                 } else {
                     GameAudio.playSound('failure'); // <<< DEĞİŞTİ
                     ChefKedi.speak("Hmm, emin misin? Tekrar bakalım.", 'thinking');
                     scoreToAdd = -5; // Yanlış seçim için küçük ceza
                 }
                 break;

             case 'multi_select':
                  UI.setItemSelected(itemId, !clickedItem.classList.contains('selected')); // Toggle selected class
                   GameAudio.playSound('click'); // <<< DEĞİŞTİ
                  const selectedItems = Array.from(UI.elements.ingredientsToolsContainer.querySelectorAll('.selected')).map(el => el.dataset.id);
                  const requiredItems = step.required || [];
                  const optionalItems = step.optional || [];
                  const allRequiredSelected = requiredItems.every(reqId => selectedItems.includes(reqId));
                  const incorrectSelected = selectedItems.some(selId => !requiredItems.includes(selId) && !optionalItems.includes(selId));

                  if (incorrectSelected) {
                       UI.showFeedback("Aradığımız bu değildi sanki?", "warning");
                       UI.setItemSelected(itemId, false); // Yanlışı geri al
                       ChefKedi.speak("Bu listede yoktu galiba?", 'thinking');
                       isSelectionComplete = false;
                       isCorrect = false;
                  } else if (allRequiredSelected) {
                       const correctOptionalCount = selectedItems.filter(selId => optionalItems.includes(selId)).length;
                       scoreToAdd = (requiredItems.length * (step.scorePerRequired || 20)) + (correctOptionalCount * (step.scorePerOptional || 10));
                       isSelectionComplete = true;
                       isCorrect = true;
                  } else {
                       isSelectionComplete = false;
                       isCorrect = false; // Henüz doğru değil
                       UI.clearFeedback(); // Seçim devam ederken feedback'i temizle
                  }
                  break;

             case 'sequence_selection':
                   if (this.state.currentSelectionSequence.includes(itemId)) return; // Zaten seçilmişse atla

                   const correctSequence = step.correctSequence || [];
                   const nextCorrectIndex = this.state.currentSelectionSequence.length;

                   if (itemId === correctSequence[nextCorrectIndex]) {
                       this.state.currentSelectionSequence.push(itemId);
                       UI.setItemSelected(itemId, true); // Seçili olarak işaretle
                       // Butonu pasif yapabiliriz (tekrar tıklanamaz)
                       clickedItem.disabled = true;
                       clickedItem.classList.add('disabled');
                        GameAudio.playSound('success_ping'); // <<< DEĞİŞTİ
                       scoreToAdd = step.scorePerCorrect || 30;
                       if (this.state.currentSelectionSequence.length === correctSequence.length) {
                           scoreToAdd += step.bonusForOrder || 50;
                           isSelectionComplete = true;
                           isCorrect = true;
                       }
                   } else {
                        GameAudio.playSound('failure_buzz'); // <<< DEĞİŞTİ
                        UI.showFeedback("Sıralama yanlış oldu! Baştan başlayalım.", "error");
                        ChefKedi.speak("Eyvah! Sırayı karıştırdık. Hadi tekrar deneyelim.", 'sad');
                        // Tüm seçimi sıfırla
                         this.state.currentSelectionSequence = [];
                         UI.elements.ingredientsToolsContainer.querySelectorAll('.selected, .disabled').forEach(el => {
                              el.classList.remove('selected', 'disabled');
                              el.disabled = false;
                         });
                         UI.setItemFeedback(itemId, false); // Yanlış tıklananı işaretle
                        isSelectionComplete = false;
                         isCorrect = false;
                         scoreToAdd = -20;
                   }
                   break;
         }

         // Görsel geri bildirim ver (multi/sequence hariç)
         if (step.type !== 'multi_select' && step.type !== 'sequence_selection') {
            UI.setItemFeedback(itemId, isCorrect);
         }

         // Adım tamamlandıysa veya hata varsa puanı işle
         if (isSelectionComplete || !isCorrect) {
              this.state.currentRecipeScore += scoreToAdd;
         }

         // Eğer adım tamamlandıysa
         if (isSelectionComplete) {
             UI.showFeedback(step.feedbackGood || "Doğru seçim!", "success");
             if (isCorrect) ChefKedi.speak(step.feedbackGood || "Harika!", step.catMood || 'happy');
             UI.disableItemClicks(true);
             UI.updateNextButton("Devam Et", null, true);
         }
         // Multi-select'te ilerleme butonunu sadece başarılı olunca gösteriyoruz.
         else if (step.type === 'multi_select' && !isCorrect && incorrectSelected) {
              // Yanlış seçildiğinde buton gösterilmiyor, kullanıcı düzeltmeli.
              UI.updateNextButton("Devam Et", null, false);
         }
    },

    // Mini Oyun Tamamlandığında Çağrılır
    handleMinigameComplete(success, score, gameType) {
         console.log(`Minigame ${gameType} completed. Success: ${success}, Score: ${score}`);
         // Puanı ekle (başarısız olsa bile kısmi puan gelebilir)
         this.state.currentRecipeScore += score;
         // Geri bildirim ve kedi mesajı MiniGames.end() içinde zaten yapıldı.
         UI.updateNextButton("Devam Et", null, true); // Her durumda devam etmeye izin ver
    },

     // --- Yardımcı Fonksiyonlar ---
     checkRecipeUnlocks() {
         let changed = false;
         let newlyUnlocked = [];
         for (const id in Recipes) {
             const recipe = Recipes[id];
              // Zaten kilitli değilse veya puan yeterliyse ve challenge değilse (ya da challenge kilidi açıksa)
             if (!this.state.unlockedRecipes.includes(id) &&
                  recipe.unlockScore <= this.state.currentScore)
              {
                 // Challenge özel kontrolü
                 if (id === 'final_challenge' && !this.shouldUnlockFinalChallenge()) {
                     continue; // Henüz final challenge koşulları sağlanmadı
                 }

                 this.state.unlockedRecipes.push(id);
                 changed = true;
                  console.log(`Recipe Unlocked: ${recipe.name}`);
                  newlyUnlocked.push(recipe.name);
             }
         }
         if (changed) {
             Utils.saveData('unlockedRecipes', this.state.unlockedRecipes);
             if (newlyUnlocked.length > 0) {
                UI.showToastNotification(`Yeni Tarif${newlyUnlocked.length > 1 ? 'ler' : ''} Açıldı: ${newlyUnlocked.join(', ')}!`, 'unlock');
             }
         }
     },

     // Final challenge'ı açma koşullarını kontrol eden ayrı fonksiyon
     shouldUnlockFinalChallenge() {
         if (this.state.finalChallengeUnlocked) return true; // Zaten açıksa

         const challengeData = Recipes['final_challenge'];
         if (!challengeData) return false; // Tarif yoksa açılamaz

         const requiredScore = challengeData.unlockScore || 5000;
         const requiredRecipesCompleted = challengeData.requiredRecipes || 5; // Recipes.js'de tanımlanabilir
         // Başlangıç ve challenge hariç tamamlanan tarif sayısı
         const completedCount = this.state.unlockedRecipes.filter(id => id !== 'menemen' && id !== 'final_challenge').length;

         return (this.state.currentScore >= requiredScore && completedCount >= requiredRecipesCompleted);
     },


     checkFinalChallengeUnlock() {
         if (!this.state.finalChallengeUnlocked && this.shouldUnlockFinalChallenge())
         {
             this.state.finalChallengeUnlocked = true;
              // Eğer unlockRecipes listesinde yoksa ekle (checkRecipeUnlocks'da da eklenebilir)
              if (!this.state.unlockedRecipes.includes('final_challenge')) {
                   this.state.unlockedRecipes.push('final_challenge');
              }
             Utils.saveData('finalChallengeUnlocked', true);
             Utils.saveData('unlockedRecipes', this.state.unlockedRecipes);
             console.log("FINAL CHALLENGE UNLOCKED!");
             ChefKedi.speak("Vay Ceyda! Tüm hünerlerini göstermeye hazırsın! Sana özel bir meydan okumam var!", 'excited', 8000);
              UI.showToastNotification("🏆 Şef Kedi'nin Gurme Sınavı Açıldı! 🏆", 'achievement');
         }
     },

     // İlerlemeyi Sıfırla
     resetProgress() {
         console.log("Resetting game progress...");
         GameAudio.playSound('reset'); // <<< DEĞİŞTİ
         Achievements.resetProgress();
         Utils.removeData('playerScore');
         Utils.removeData('unlockedRecipes');
         Utils.removeData('finalChallengeUnlocked');
         Utils.removeData('catAccessories');

         this.state.currentScore = 0;
         this.state.unlockedRecipes = ['menemen']; // Sadece başlangıç tarifi
         this.state.finalChallengeUnlocked = false;
          ChefKedi.accessories = { hat: false, apron: false };
          ChefKedi.updateAccessoriesVisual();

         alert("Oyun ilerlemesi sıfırlandı. Ana menüye dönülüyor.");
         this.quitToMenu();
          UI.updateScore(0);
          // Gerekirse tarif kitabı ve başarılar ekranlarını da güncelle
          if (UI.elements.recipeBookScreen.classList.contains('active')) UI.showRecipeBook();
          if (UI.elements.achievementsScreen.classList.contains('active')) UI.showAchievements();
     }

};