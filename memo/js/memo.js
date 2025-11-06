(() => {
  const MAX_CARDS_COUNT = 32;

  function nvl(num, numIfNo) { return (!num && num !== 0) ? numIfNo : num; }
  function nvlArr(arr, arrIfNo) { return (!arr || !Array.isArray(arr) || arr.length < 1 || arr.length > 3) ? arrIfNo : arr; }

  function checkCardsCount(count) {
    let value = Math.max(Math.min(MAX_CARDS_COUNT, nvl(count, 0)), 4);
    if (value % 2 > 0) value = value - 1;
    return value;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function getTimeStr(seconds) {
    if (!seconds || !isFinite(seconds) || seconds <= 0) return '';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds - hours * 3600) / 60);
    const secs = seconds - hours * 3600 - mins * 60;
    return (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function createUniqueID() {
    return Date.now();
  }

  // ------------------------------------------------------------

  // ! создание базы карточек
  // создать пару карточек
  function createCardsPair(pairNum) {
    const pair = [];
    for (let cardNum of [pairNum * 2, pairNum * 2 + 1]) {
      pair.push({
        num: cardNum,
        bgNum: pairNum,
      });
    }
    [pair[0].pairNum, pair[1].pairNum] = [pair[1].num, pair[0].num]

    return pair;
  }

  // создать массив карточек
  function createCardsArray(count) {
    for (let i = 0; i < (count / 2); i++) {
      for (let item of createCardsPair(i)) {
        game.cards.push(item);
      }
    }

    shuffle(game.cards);

    return game.cards;
  }

  // ! управление карточками на странице
  // создать сетку из карточек на странице
  function createCardsGrid() {
    const gameCards = document.querySelector('.game__cards');

    let gameCardWrapper, gameCard, gameCardFront, gameCardBack;
    for (let i = 0; i < game.cards.length; i++) {
      gameCardWrapper = document.createElement('div');
      gameCardWrapper.classList.add('col-auto', 'game__card--wrapper');
      gameCardWrapper.id = game.cards[i].num + '-card-wrapper';
      gameCardWrapper.tabIndex = 0;

      gameCard = document.createElement('div');
      gameCard.classList.add('game__card', 'is-flipped');
      gameCard.id = game.cards[i].num + '-card';

      gameCardFront = document.createElement('div');
      gameCardFront.classList.add('game__card--front', 'bg-' + game.cards[i].bgNum);

      gameCardBack = document.createElement('div');
      gameCardBack.classList.add('d-flex', 'justify-content-center', 'align-items-center', 'game__card--back');
      gameCardBack.textContent = i + 1;

      gameCards.append(gameCardWrapper);
      gameCardWrapper.append(gameCard);
      gameCard.append(gameCardFront);
      gameCard.append(gameCardBack);

      const cardElement = document.getElementById(gameCard.id);
      const cardWrapperElement = document.getElementById(gameCardWrapper.id);
      cardElement.addEventListener('click', (e) => {
        e.preventDefault();
        takeCard(cardElement);
      });
      cardWrapperElement.addEventListener('keyup', (e) => {
        if (['Enter'].includes(e.key) || ['Space'].includes(e.code)) {
          e.preventDefault();
          cardElement.click();
        }
      });
    }
  }

  // удалить карточки со страницы
  function removeCardsGrid() {
    const cardsElements = document.querySelectorAll('.game__card--wrapper');
    for (let element of cardsElements) {
      element.remove();
    };
  }

  // ! апдейт информации на странице в информационных полях
  // игроки и результаты
  function updatePlayersBlock() {
    const playerElement = document.querySelector('.game__player--active');
    let content;

    if (!game.started) {
      // ? игра не начата
      content = '';
    } else if (!game.stopped) {
      // ? процесс игры
      content = `Ход игрока: <b>${game.activePlayer()}</b> (счет - ${game.players[game.activePlayerIndex].success})`;
    } else {
      // ? конец игры
      content = '<b>Результаты</b>:<br>';
      content += ' - ходов: ' + String(game.attempts) + ';<br>';

      let counts = ' - очков: ';
      let accuracy = ' - точность: ';
      game.players.forEach(player => {
        if (game.players.indexOf(player) > 0) {
          counts += ', ';
          accuracy += ', ';
        }
        counts += player.name + ' - ' + String(player.success);
        accuracy += player.name + ' - ' + Number(player.success * 100 / player.attempts).toFixed(2) + '%'; //! надо убрать NaN!
      });
      content += counts + ';<br>';
      content += accuracy + ';<br>';
    }

    playerElement.innerHTML = content;
  }

  // статус игры и таймер
  function updateGameStatusBlock() {
    const statusElement = document.querySelector('.game__time--left');

    let content;
    const gameLengthContent = '<br>Длительность: ' + getTimeStr(game.getGameTime());

    if (!game.started) {
      // ? игра не начата
      statusElement.classList.remove('text-success');
      statusElement.classList.remove('text-error');
      content = '';
    } else if (!game.stopped) {
      // ? процесс игры
      if (!game.isTimerOut()) {
        content = 'Осталось времени: ' + getTimeStr(game.gameLeftSeconds)
      }
    } else {
      // ? конец игры
      if (!game.isTimerSet()) {
        statusElement.classList.add('text-success');
        content = '<b>Игра завершена!</b>';
      } else if (!game.isTimerOut()) {
        statusElement.classList.add('text-success');
        content = '<b>Игра завершена!</b>';
      } else {
        statusElement.classList.add('text-error');
        content = '<b>Время закончилось!</b>';
      }
      content += gameLengthContent;
    }

    statusElement.innerHTML = content;
  }

  // ! УПРАВЛЕНИЕ ИГРОЙ
  const game = {
    cards: [], // карточки, используемые в игре
    createCardsArray(count) { createCardsArray(count); },
    getCardsInfo() { return JSON.stringify(this.cards); },
    pairCounter: { // механизм расчета хода (из 2х открывваемых карточек)
      card: null, // первая из открываемых карточек
      started: false, // ход начат (1 шаг сделан)
      openedNum: 0, // кол-во открытых в данный момент карт (увеличивается с каждым нажатием на карточку)
      start(card) { // начать ход (открыть 1 карту)
        this.card = card;
        this.started = true;
      },
      reset() { // завершение хода
        this.card = null;
        this.started = false;
        this.openedNum = 0;
      },
    },
    attempts: 0, // попыток открытия пары карточек
    cardsOpened: 0, // всего открытых карточек
    started: false, // игра начата
    startTime: 0, // время начала игры
    start() {
      this.started = true;
      this.startTime = Date.now();
    },
    stopped: false, // игра остановлена
    stopTime: 0, // время остановки игры
    stop() {
      this.stopped = true;
      this.stopTime = Date.now();
    },
    getGameTime() { return Math.floor((this.stopTime - this.startTime) / 1000) },
    // ----------------------------------------
    gameLengthSeconds: 0, // заданная длительность игры
    gameLeftSeconds: 0, // осталось секунд до окончания
    setGameLength(seconds) {
      this.gameLengthSeconds = seconds;
      this.gameLeftSeconds = seconds;
    },
    tickSecond() { this.gameLeftSeconds = Math.max(0, this.gameLeftSeconds - 1); }, // вычесть одну секунду (без снижения ниже 0)
    timer: null, // таймер
    startTimer(handler) { this.timer = setInterval(handler, 1000); },
    stopTimer() { clearInterval(this.timer); },
    isTimerSet() { return this.gameLengthSeconds > 0; }, // игра на время
    isTimerOut() { return this.isTimerSet() && this.gameLeftSeconds === 0; }, // время вышло!
    // ----------------------------------------
    players: [], // список игроков (объекты)
    createPlayers(playersNames) {
      playersNames.forEach(playerName => {
        this.players.push({
          name: playerName,
          attempts: 0,
          success: 0,
        });
      });
    },
    firstPlayerIndex: 0, // индекс игрока с правом первого хода в игре
    nextFirstPlayer() { // выбрать следующего игрока из списка для передачи права первого хода
      if (this.lastFirstPlayerIndex - this.players.length + 1 >= 0) {
        this.firstPlayerIndex = 0;
      } else {
        this.firstPlayerIndex = this.lastFirstPlayerIndex + 1;
      }
      this.activePlayerIndex = this.firstPlayerIndex;
    },
    activePlayerIndex: 0, // индекс игрока с правом текущего хода
    activePlayer() { return this.players[this.activePlayerIndex].name; }, // имя игрока с правом текущего хода
    nextPlayer() { // переход хода следующему игроку (по умолчанию к первому)
      if (this.activePlayerIndex - this.players.length + 1 >= 0) {
        this.activePlayerIndex = 0;
      } else {
        this.activePlayerIndex++;
      }
    },
    // ----------------------------------------
    lastPlayersNames: [], // имена игроков в предыдущей игре
    lastFirstPlayerIndex: -1, // индекс первого игрока в предыдущей игре
    lastCardsCount: 0, // число карточек в предыдущей игре
    lastGameLengthSeconds: 0, // максимальная длительность предыдущей игры
    // ----------------------------------------
    reset() { // сохранение основных параметров текущей игры + сброс
      this.lastPlayersNames = this.players.map(item => item.name);
      this.lastFirstPlayerIndex = this.firstPlayerIndex;
      this.lastCardsCount = this.cards.length;
      this.lastGameLengthSeconds = this.gameLengthSeconds;
      this.cards = [],
        this.pairCounter.reset();
      this.attempts = 0;
      this.cardsOpened = 0;
      this.started = false;
      this.stopped = false;
      this.gameLengthSeconds = 0;
      this.gameLeftSeconds = 0;
      this.stopTimer();
      this.players = [];
      this.activePlayerIndex = 0;
      this.firstPlayerIndex = 0;
    }
  };

  // ! УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ
  const interface = {
    createCardsGrid() { createCardsGrid(); },
    removeCardsGrid() { removeCardsGrid(); },
    // управление карточками
    openCard(cardElement) { cardElement.classList.remove('is-flipped'); },
    closeCard(cardElement) { cardElement.classList.add('is-flipped'); },
    isCardOpened(cardElement) { return !cardElement.classList.contains('is-flipped'); },
    //
    lockCard(card) { this.getElement(card).classList.add('is-blocked'); },
    lockCards() { game.cards.forEach(card => this.lockCard(card)); },
    isCardBlocked(cardElement) { return cardElement.classList.contains('is-blocked'); },
    //
    getCard(cardElement) { return game.cards.find(item => item.num === parseInt(cardElement.id)); },
    getElement(card) { return document.getElementById(card.num + '-card'); },
    //
    handleRestartButton(handler) { document.getElementById('restart').addEventListener('click', handler); },
    hideRestartButton() { document.getElementById('restart').classList.add('display-hidden'); },
    showRestartButton() { document.getElementById('restart').classList.remove('display-hidden'); },
    //
    updatePlayersBlock() { updatePlayersBlock(); },
    updateGameStatusBlock() { updateGameStatusBlock(); },
    //
    reset() {
      this.updatePlayersBlock();
      this.updateGameStatusBlock();
      this.removeCardsGrid();
    }
  }

  // ! НАЧАЛО ИГРЫ
  function startGame(cardsCount = 16, gamePlayers = ['Игрок 1'], gameLengthSeconds = null) {
    interface.handleRestartButton(restartGame);

    game.start();
    game.createCardsArray(checkCardsCount(cardsCount));
    game.createPlayers(nvlArr(gamePlayers, ['Игрок 1']));
    game.nextFirstPlayer();

    interface.createCardsGrid();
    interface.updatePlayersBlock();
    interface.hideRestartButton();

    // запуск таймера
    let seconds = parseInt(gameLengthSeconds);
    if (!seconds) {
      return;
    } else if (seconds >= 5) {
      game.setGameLength(seconds);
      interface.updateGameStatusBlock();
      game.startTimer(tickSecond);
    } else {
      interface.updateGameStatusBlock();
      game.setGameLength(0);
    }

    function tickSecond() {
      game.tickSecond();
      interface.updateGameStatusBlock();
      if (game.isTimerOut()) {
        stopGame();
      }
    }
  }

  // ! СДЕЛАТЬ ХОД
  function takeCard(cardElement) {
    if (interface.isCardBlocked(cardElement)) return;
    if (interface.isCardOpened(cardElement)) return;

    // запретить открывать более 2 карточек одновременно
    game.pairCounter.openedNum++;
    if (game.pairCounter.openedNum > 2) return;

    const card = interface.getCard(cardElement);

    interface.openCard(cardElement);

    // первую карточку пары - просто открыть
    if (!game.pairCounter.started) {
      game.pairCounter.start(card);
      return;
    }

    // произвести сравнение с задержкой, т.к. на карточках стоит transition
    setTimeout(compare, 600);

    function compare() {
      game.attempts++;
      game.players[game.activePlayerIndex].attempts++;

      if (card.pairNum === game.pairCounter.card.num) {
        game.players[game.activePlayerIndex].success++;
        game.cardsOpened += 2;
        if (game.cardsOpened === game.cards.length) stopGame();
      } else {
        interface.closeCard(cardElement);
        interface.closeCard(interface.getElement(game.pairCounter.card));
        game.nextPlayer();
      }

      game.pairCounter.reset();
      interface.updatePlayersBlock();
    }
  }

  // ! ОСТАНОВИТЬ ИГРУ
  function stopGame() {
    game.stop();
    game.stopTimer();

    interface.updatePlayersBlock();
    interface.lockCards();
    interface.updateGameStatusBlock();

    interface.showRestartButton();
  }

  // ! ПЕРЕЗАПУСК ИГРЫ
  function restartGame() {
    game.reset();
    interface.reset();
    startGame(game.lastCardsCount, game.lastPlayersNames, game.lastGameLengthSeconds);
  }

  //
  window.onkeydown = (e) => e.code !== 'Space';
  window.startGame = startGame;
})();
