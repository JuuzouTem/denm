// js/ui.js
const UI = {
    elements: {
        loadingScreen: null, mainMenu: null, gameContainer: null, pauseMenu: null,
        recipeCompleteScreen: null, recipeBookScreen: null, achievementsScreen: null, optionsScreen: null,
        score: null, currentRecipeName: null, timer: null, timerArea: null, pauseButton: null,
        startGameBtn: null, recipeBookBtn: null, achievementsBtn: null, optionsBtn: null,
        resumeGameBtn: null, optionsPauseBtn: null, quitToMenuBtn: null,
        nextRecipeBtn: null, replayRecipeBtn: null, backToMenuBtnComplete: null,
        resetProgressBtn: null, chefCat: null, speechBubble: null, catMessage: null,
        stepArea: null, stepTitle: null, stepDescription: null, ingredientsToolsContainer: null,
        feedbackArea: null, minigameArea: null, minigameTitle: null, minigameCanvas: null,
        minigameInstructions: null, nextStepButton: null, finalDishImage: null,
        completionTitle: null, completionMessage: null, finalScore: null, recipeList: null,
        achievementList: null, bgmVolumeSlider: null, sfxVolumeSlider: null,
    },

    init() {
         console.log("Initializing UI...");
         this.elements.loadingScreen = document.getElementById('loading-screen');
         this.elements.mainMenu = document.getElementById('main-menu');
         this.elements.gameContainer = document.getElementById('game-container');
         this.elements.pauseMenu = document.getElementById('pause-menu');
         this.elements.recipeCompleteScreen = document.getElementById('recipe-complete-screen');
         this.elements.recipeBookScreen = document.getElementById('recipe-book-screen');
         this.elements.achievementsScreen = document.getElementById('achievements-screen');
         this.elements.optionsScreen = document.getElementById('options-screen');
         this.elements.score = document.getElementById('score');
         this.elements.currentRecipeName = document.getElementById('current-recipe-name');
         this.elements.timer = document.getElementById('timer');
         this.elements.timerArea = document.getElementById('timer-area');
         this.elements.pauseButton = document.getElementById('pause-button');
         this.elements.startGameBtn = document.getElementById('start-game-btn');
         this.elements.recipeBookBtn = document.getElementById('recipe-book-btn');
         this.elements.achievementsBtn = document.getElementById('achievements-btn');
         this.elements.optionsBtn = document.getElementById('options-btn');
         this.elements.resumeGameBtn = document.getElementById('resume-game-btn');
         this.elements.optionsPauseBtn = document.getElementById('options-pause-btn');
         this.elements.quitToMenuBtn = document.getElementById('quit-to-menu-btn');
         this.elements.nextRecipeBtn = document.getElementById('next-recipe-btn');
         this.elements.replayRecipeBtn = document.getElementById('replay-recipe-btn');
         this.elements.backToMenuBtnComplete = document.getElementById('back-to-menu-btn-complete');
         this.elements.resetProgressBtn = document.getElementById('reset-progress-btn');
         this.elements.chefCat = document.getElementById('chef-cat');
         this.elements.speechBubble = document.getElementById('speech-bubble');
         this.elements.catMessage = document.getElementById('cat-message');
         this.elements.stepArea = document.getElementById('step-area');
         this.elements.stepTitle = document.getElementById('step-title');
         this.elements.stepDescription = document.getElementById('step-description');
         this.elements.ingredientsToolsContainer = document.getElementById('ingredients-tools-container');
         this.elements.feedbackArea = document.getElementById('feedback-area');
         this.elements.minigameArea = document.getElementById('minigame-area');
         this.elements.minigameTitle = document.getElementById('minigame-title');
         this.elements.minigameCanvas = document.getElementById('minigame-canvas');
         this.elements.minigameInstructions = document.getElementById('minigame-instructions');
         this.elements.nextStepButton = document.getElementById('next-step-button');
         this.elements.finalDishImage = document.getElementById('final-dish-image');
         this.elements.completionTitle = document.getElementById('completion-title');
         this.elements.completionMessage = document.getElementById('completion-message');
         this.elements.finalScore = document.getElementById('final-score');
         this.elements.recipeList = document.getElementById('recipe-list');
         this.elements.achievementList = document.getElementById('achievement-list');
         this.elements.bgmVolumeSlider = document.getElementById('bgm-volume');
         this.elements.sfxVolumeSlider = document.getElementById('sfx-volume');

         for (const key in this.elements) {
             if (!this.elements[key]) {
                 console.warn(`UI Element not found: ID expected based on key '${key}'`);
             }
         }
         this.addEventListeners();
         console.log("UI Initialized.");
    },

    addEventListeners() {
        this.elements.startGameBtn?.addEventListener('click', () => Game.startGame());
        this.elements.recipeBookBtn?.addEventListener('click', () => this.showRecipeBook());
        this.elements.achievementsBtn?.addEventListener('click', () => this.showAchievements());
        this.elements.optionsBtn?.addEventListener('click', () => this.showScreen('options-screen'));
        this.elements.pauseButton?.addEventListener('click', () => Game.pauseGame());
        this.elements.nextStepButton?.addEventListener('click', () => Game.nextStep());
        this.elements.resumeGameBtn?.addEventListener('click', () => Game.resumeGame());
        this.elements.optionsPauseBtn?.addEventListener('click', () => this.showScreen('options-screen'));
        this.elements.quitToMenuBtn?.addEventListener('click', () => Game.quitToMenu());
        this.elements.nextRecipeBtn?.addEventListener('click', () => Game.startNextRecipe());
        this.elements.replayRecipeBtn?.addEventListener('click', () => Game.replayCurrentRecipe());
        this.elements.backToMenuBtnComplete?.addEventListener('click', () => Game.quitToMenu());

        document.querySelectorAll('.close-overlay-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const targetOverlayId = e.target.dataset.target;
                if (targetOverlayId) {
                    this.hideScreen(targetOverlayId);
                } else {
                    console.warn("Close button missing data-target attribute:", e.target);
                }
            });
        });

        this.elements.bgmVolumeSlider?.addEventListener('input', (e) => {
            if (e.target && typeof GameAudio !== 'undefined') GameAudio.setBgmVolume(e.target.value); // <<< DEĞİŞTİ
        });
        this.elements.sfxVolumeSlider?.addEventListener('input', (e) => {
            if (e.target && typeof GameAudio !== 'undefined') GameAudio.setSfxVolume(e.target.value); // <<< DEĞİŞTİ
        });

        // Slider başlangıç değerlerini ayarla (GameAudio yüklendikten SONRA çalışmalı, bu yüzden init'ten sonra buraya taşıdık)
        // Bu hala tam garanti değil, en iyisi Game.init sonunda bu değerleri ayarlamak olabilir.
        // Şimdilik burada bırakalım ama uyarılar devam edebilir.
        if (this.elements.bgmVolumeSlider) {
             if (typeof GameAudio !== 'undefined' && typeof GameAudio.bgmVolume !== 'undefined') { // <<< DEĞİŞTİ
                 this.elements.bgmVolumeSlider.value = GameAudio.bgmVolume; // <<< DEĞİŞTİ
             } else {
                 console.warn("GameAudio object or bgmVolume not ready when setting slider value in addEventListeners."); // <<< DEĞİŞTİ
             }
         }
         if (this.elements.sfxVolumeSlider) {
              if (typeof GameAudio !== 'undefined' && typeof GameAudio.sfxVolume !== 'undefined') { // <<< DEĞİŞTİ
                  this.elements.sfxVolumeSlider.value = GameAudio.sfxVolume; // <<< DEĞİŞTİ
              } else {
                  console.warn("GameAudio object or sfxVolume not ready when setting slider value in addEventListeners."); // <<< DEĞİŞTİ
              }
         }

        this.elements.resetProgressBtn?.addEventListener('click', () => {
            if (confirm("Tüm ilerlemen (puanlar, açılan tarifler, başarılar) silinecek! Emin misin Ceyda?")) {
                Game.resetProgress();
            }
        });

        this.elements.chefCat?.addEventListener('click', () => ChefKedi.handleCatClick());
    },

    showScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
             if (screen.classList.contains('overlay') && screenId !== 'pause-menu' && screenId !== 'loading-screen') {
                 document.querySelectorAll('.overlay.active').forEach(activeOverlay => {
                     if (activeOverlay.id !== screenId && activeOverlay.id !== 'loading-screen') {
                         activeOverlay.classList.remove('active');
                     }
                 });
             }
             else if (screen.classList.contains('screen') && !screen.classList.contains('overlay')) {
                  document.querySelectorAll('.overlay.active').forEach(activeOverlay => {
                     if (activeOverlay.id !== 'loading-screen') {
                         activeOverlay.classList.remove('active');
                     }
                  });
             }
            screen.classList.remove('hidden');
            requestAnimationFrame(() => {
                 requestAnimationFrame(() => {
                    screen.classList.add('active');
                    console.log(`Screen shown: ${screenId}`);
                 });
             });
        } else {
            console.error(`Screen not found: ${screenId}`);
        }
    },

    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('active');
            console.log(`Screen hidden: ${screenId}`);
        } else {
            console.error(`Screen not found during hide: ${screenId}`);
        }
    },

    updateScore(score) {
        if (this.elements.score) {
             const oldScore = parseInt(this.elements.score.textContent) || 0;
             this.elements.score.textContent = score;
             if (score > oldScore && this.elements.score.parentElement) {
                 this.elements.score.parentElement.classList.add('score-increase');
                 setTimeout(() => this.elements.score.parentElement.classList.remove('score-increase'), 500);
             }
        }
    },

    setRecipeTitle(title) {
        if (this.elements.currentRecipeName) this.elements.currentRecipeName.textContent = title;
    },

    showTimer(time) {
         if (this.elements.timerArea) {
             this.elements.timerArea.classList.remove('hidden');
             this.updateTimer(time);
         }
    },
    updateTimer(time) {
         if (this.elements.timer) this.elements.timer.textContent = `${time}s`;
         if (this.elements.timerArea) {
            this.elements.timerArea.classList.toggle('timer-warning', time <= 5 && time > 0);
         }
    },
    hideTimer() {
         if (this.elements.timerArea) {
             this.elements.timerArea.classList.add('hidden');
             this.elements.timerArea.classList.remove('timer-warning');
         }
    },

     displayStepInfo(title, description) {
         if (this.elements.stepTitle) this.elements.stepTitle.textContent = title || '';
         if (this.elements.stepDescription) this.elements.stepDescription.innerHTML = description || '';
         this.elements.minigameArea?.classList.add('hidden');
         this.elements.stepArea?.classList.remove('hidden');
     },

     displayItems(items, stepType, correctIdOrSequence, clickHandler) {
         const container = this.elements.ingredientsToolsContainer;
         if (!container) return;
         container.innerHTML = '';
         container.classList.remove('hidden');

         items.forEach((item) => {
             const div = document.createElement('button');
             div.type = 'button';
             const isTool = stepType === 'click_tool' || item.isTool;
             div.classList.add(isTool ? 'tool' : 'ingredient');
             div.dataset.id = item.id;
             div.innerHTML = `
                 <img src="${item.img || 'images/ui/placeholder.png'}" alt="${item.name}" loading="lazy">
                 <span>${item.name}</span>
             `;
             div.addEventListener('click', clickHandler);
             container.appendChild(div);
         });
     },

     setItemFeedback(itemId, isCorrect) {
          const itemElement = this.elements.ingredientsToolsContainer?.querySelector(`[data-id="${itemId}"]`);
          if (itemElement) {
              itemElement.classList.remove('correct-choice', 'incorrect-choice', 'selected');
              itemElement.classList.add(isCorrect ? 'correct-choice' : 'incorrect-choice');
              if (!isCorrect) {
                  setTimeout(() => itemElement.classList.remove('incorrect-choice'), 600);
              }
          }
     },
      setItemSelected(itemId, isSelected) {
          const itemElement = this.elements.ingredientsToolsContainer?.querySelector(`[data-id="${itemId}"]`);
          if (itemElement) {
              itemElement.classList.toggle('selected', isSelected);
          }
      },

     disableItemClicks(disable = true) {
         this.elements.ingredientsToolsContainer?.querySelectorAll('.ingredient, .tool').forEach(item => {
             item.classList.toggle('disabled', disable);
             item.disabled = disable;
             if(disable) {
                 item.classList.remove('selected', 'correct-choice', 'incorrect-choice');
             }
         });
     },

     showFeedback(message, type = 'info') {
         if (this.elements.feedbackArea) {
             this.elements.feedbackArea.innerHTML = message;
             this.elements.feedbackArea.className = 'feedback';
             if (type !== 'info') {
                 this.elements.feedbackArea.classList.add(type);
             }
         }
     },
     clearFeedback() {
         if (this.elements.feedbackArea) {
             this.elements.feedbackArea.textContent = '';
             this.elements.feedbackArea.className = 'feedback';
         }
     },

     updateNextButton(text, action = null, visible = true) {
         if (this.elements.nextStepButton) {
             this.elements.nextStepButton.textContent = text;
             this.elements.nextStepButton.classList.toggle('hidden', !visible);
             this.elements.nextStepButton.disabled = false;
         }
     },
      disableNextButton(disable = true) {
         if(this.elements.nextStepButton) this.elements.nextStepButton.disabled = disable;
     },

    showCompletionScreen(recipe, finalScore, totalScore) {
         if (this.elements.completionTitle) this.elements.completionTitle.textContent = recipe.completionTitle || "Harika İş!";
         if (this.elements.finalDishImage) {
             this.elements.finalDishImage.src = recipe.completionImage || 'images/ui/placeholder_dish.png';
             this.elements.finalDishImage.alt = recipe.name;
         }
         if (this.elements.completionMessage) this.elements.completionMessage.innerHTML = `${recipe.completionMessageBase}<br>Bu tariften <strong>${finalScore}</strong> puan kazandın!<br>Toplam puanın: <strong>${totalScore}</strong>.`;
         if (this.elements.finalScore) this.elements.finalScore.textContent = finalScore;

         const nextRecipe = Game.getNextRecipe();
         const nextRecipeAvailable = nextRecipe !== null;
          if(this.elements.nextRecipeBtn) {
            this.elements.nextRecipeBtn.classList.toggle('hidden', !nextRecipeAvailable);
            this.elements.nextRecipeBtn.disabled = !nextRecipeAvailable;
          }
          if (recipe.isChallenge && this.elements.nextRecipeBtn) {
               this.elements.nextRecipeBtn.classList.add('hidden');
          }
          if(this.elements.replayRecipeBtn) {
              this.elements.replayRecipeBtn.classList.remove('hidden');
          }

         this.showScreen('recipe-complete-screen');
     },

    showRecipeBook() {
         const container = this.elements.recipeList;
         if (!container) return;
         container.innerHTML = '';

         const allRecipes = Recipes;
         const unlockedRecipes = Game.state.unlockedRecipes || [];

         const sortedRecipeIds = Object.keys(allRecipes).sort((a, b) => {
             const diffA = allRecipes[a].difficulty || 0;
             const diffB = allRecipes[b].difficulty || 0;
             if (diffA !== diffB) return diffA - diffB;
             return (allRecipes[a].name || '').localeCompare(allRecipes[b].name || '');
         });

         sortedRecipeIds.forEach(id => {
            const recipe = allRecipes[id];
            if (id === 'final_challenge' && !Game.state.finalChallengeUnlocked) return;

             const isUnlocked = unlockedRecipes.includes(id) || recipe.unlockScore === 0;
             const card = document.createElement('div');
             card.className = `recipe-card ${isUnlocked ? '' : 'locked'}`;
             card.dataset.recipeId = id;
             const difficultyStars = recipe.difficulty ? '★'.repeat(recipe.difficulty) + '☆'.repeat(5 - recipe.difficulty) : '☆☆☆☆☆';
             const statusText = isUnlocked
                 ? '<span class="recipe-status unlocked">Başla!</span>'
                 : `<span class="recipe-status locked">Kilitli<br><small>(Gerekli Puan: ${recipe.unlockScore})</small></span>`;

             card.innerHTML = `
                 <img src="${recipe.completionImage || 'images/ui/placeholder_dish.png'}" alt="${recipe.name}" loading="lazy">
                 <h3>${recipe.name}</h3>
                 <p>Zorluk: <span class="difficulty-stars">${difficultyStars}</span></p>
                 ${statusText}
             `;

             if (isUnlocked) {
                  card.onclick = () => {
                      Game.startSpecificRecipe(id);
                      this.hideScreen('recipe-book-screen');
                  };
             }
             container.appendChild(card);
         });

         this.showScreen('recipe-book-screen');
    },

     showAchievements() {
         const container = this.elements.achievementList;
         if (!container) return;
         container.innerHTML = '';

         const allAchievements = Achievements.getAllAchievements();

         allAchievements.forEach(ach => {
             const item = document.createElement('div');
             item.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
             let progressText = '';
             if (ach.requiredCount && !ach.unlocked) {
                 const progress = Achievements.playerProgress[ach.id] || 0;
                 progressText = ` <small>(${progress}/${ach.requiredCount})</small>`;
             }
             item.innerHTML = `
                 <img src="${ach.icon || 'images/ui/placeholder_achievement.png'}" alt="${ach.name}" loading="lazy">
                 <div class="achievement-details">
                     <h4>${ach.name}</h4>
                     <p>${ach.description}${progressText}</p>
                 </div>
             `;
             container.appendChild(item);
         });

         this.showScreen('achievements-screen');
     },

    showToastNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        let iconHtml = '';
         if (type === 'success' || type === 'achievement') iconHtml = '<img src="images/ui/achievement_icon.png" alt="Başarı" style="width: 24px; height: 24px; margin-right: 8px;">';
         else if (type === 'unlock') iconHtml = '🔑 ';
         else if (type === 'error') iconHtml = '⚠️ ';
        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        document.body.appendChild(toast);

         if (typeof GameAudio !== 'undefined') { // <<< Check added
            if (type === 'achievement') GameAudio.playSound('achievement_unlocked'); // <<< DEĞİŞTİ
            else if (type === 'unlock') GameAudio.playSound('success_ping'); // <<< DEĞİŞTİ
            else if (type === 'error') GameAudio.playSound('failure_buzz'); // <<< DEĞİŞTİ
         }

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }
};