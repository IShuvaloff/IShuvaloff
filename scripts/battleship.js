import { isInRange, random, alertMessage } from "./utils.js";

// типизация
const Gamer = {
    USER: 1,
    AI: 2,
};
const CellStatus = {
    EMPTY: 1, // пустая
    BLOCKED: 2, // пустая, но недоступная для установки корабля
    SHIP: 3, // установлен корабль
};
const CellState = {
    CLEAR: 1, // свободна для обстрела
    SHOT: 2, // был произведен выстрел
};
const ShipType = {
    BOAT: 1,
    DESTROYER: 2,
    CRUISER: 3,
    BATTLESHIP: 4,
};
const ShipName = {
    [ShipType.BOAT]: "Катер",
    [ShipType.DESTROYER]: "Эсминец",
    [ShipType.CRUISER]: "Крейсер",
    [ShipType.BATTLESHIP]: "Линкор",
};
const ShipSize = {
    [ShipType.BOAT]: 1,
    [ShipType.DESTROYER]: 2,
    [ShipType.CRUISER]: 3,
    [ShipType.BATTLESHIP]: 4,
};
const ShipStatus = {
    INTACT: 1, // цел
    DAMAGED: 2, // ранен
    SUNK: 3, // потоплен
};
const ShipOrientation = {
    HORIZONTAL: 1,
    VERTICAL: 2,
};

class Ship {
    #id;
    #type;
    #orientation;
    constructor(type) {
        this.#id = ++Sea.counter;
        this.#type = type;
        this.#orientation = ShipOrientation.VERTICAL;
        this.cells = []; // заполнить при установке корабля на поле
        this.hits = new Set(); // для отслеживания попаданий
    }
    get id() {
        return this.#id;
    }
    get type() {
        return this.#type;
    }
    get name() {
        return ShipName[this.#type];
    }
    get size() {
        return ShipSize[this.#type];
    }
    get orientation() {
        return this.#orientation;
    }
    set orientation(value) {
        if (!Object.values(ShipOrientation).includes(value))
            throw new Error("Неизвестная ориентация корабля");
        this.#orientation = value;
    }
    get status() {
        return this.hits.size === this.size
            ? ShipStatus.SUNK
            : this.hits.size === 0
            ? ShipStatus.INTACT
            : ShipStatus.DAMAGED;
    }
    hit(positionIndex) {
        !this.hits.has(positionIndex) && this.hits.add(positionIndex);
        return this.status;
    }
}

class Sea {
    static counter = 0;

    cells = [];
    ships = [];
    constructor() {
        this.initCells();
        this.initShips();
    }

    get grid() {
        return Array.from({ length: 10 }, (_, x) =>
            Array.from({ length: 10 }, (_, y) => this.cells[x * 10 + y])
        );
    }

    get clearCells() {
        return this.cells.filter((el) => el.state === CellState.CLEAR);
    }

    // инициализация объектов ячеек и кораблей
    initCells() {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                this.cells.push({
                    coords: [x, y],
                    status: CellStatus.EMPTY,
                    state: CellState.CLEAR,
                    shipId: null,
                });
            }
        }
    }
    initShips() {
        [
            ShipType.BATTLESHIP,
            ...Array(2).fill(ShipType.CRUISER),
            ...Array(3).fill(ShipType.DESTROYER),
            ...Array(4).fill(ShipType.BOAT),
        ].forEach((type) => this.ships.push(new Ship(type)));
    }

    // размещение кораблей
    canPlaceShip(ship, startX, startY, orientation) {
        const dx = orientation === ShipOrientation.HORIZONTAL ? 1 : 0;
        const dy = orientation === ShipOrientation.HORIZONTAL ? 0 : 1;
        if (
            startX + (ship.size - 1) * dx > 9 ||
            startY + (ship.size - 1) * dy > 9
        )
            return false; // вылезли за пределы поля
        for (let i = 0; i < ship.size; i++) {
            const cell = this.grid[startX + i * dx][startY + i * dy];
            if (cell.status !== CellStatus.EMPTY) return false;
        }
        return true;
    }

    placeShip(ship, startX, startY, orientation) {
        const dx = orientation === ShipOrientation.HORIZONTAL ? 1 : 0;
        const dy = orientation === ShipOrientation.HORIZONTAL ? 0 : 1;
        ship.orientation = orientation;

        // расстановка кораблей
        for (let i = 0; i < ship.size; i++) {
            const x = startX + i * dx;
            const y = startY + i * dy;
            const cell = this.grid[x][y];
            cell.status = CellStatus.SHIP;
            cell.shipId = ship.id;
            ship.cells.push([x, y]);
        }

        // блокировка клеток вокруг
        for (let i = -1; i <= (dx ? ship.size : 1); i++) {
            for (let j = -1; j <= (dy ? ship.size : 1); j++) {
                const cell = this.grid.at(startX + i)?.at(startY + j);
                if (!cell) continue;
                if (cell.status !== CellStatus.SHIP)
                    cell.status = CellStatus.BLOCKED;
            }
        }
    }

    placeShips() {
        if (!this.cells?.length) throw new Error("Поле боя не создано");
        if (!this.ships?.length) throw new Error("Корабли не созданы");

        for (const ship of this.ships) {
            let attempts = 0;
            const maxAttempts = 1000; // чтобы залупа не повисла
            while (attempts < maxAttempts) {
                attempts++;
                const x = random(0, 10, false);
                const y = random(0, 10, false);
                const orientation =
                    Math.random() < 0.5
                        ? ShipOrientation.HORIZONTAL
                        : ShipOrientation.VERTICAL;
                if (this.canPlaceShip(ship, x, y, orientation)) {
                    this.placeShip(ship, x, y, orientation);
                    break;
                }
            }
            if (attempts === maxAttempts)
                throw new Error(`Не удалось разместить корабль ${ship.name}`);
        }
    }

    hit(x, y) {
        // результат удара по клетке
        const cell = this.grid[x][y];
        if (cell.state === CellState.SHOT) return 0; // ? уже стреляли

        cell.state = CellState.SHOT;

        const ship = this.ships.find((el) => el.id === cell.shipId);
        if (!ship) {
            game.toggleGamer();
            return ShipStatus.INTACT; // ? промазал
        }

        const position = ship.cells.findIndex(
            (el) => el[0] === x && el[1] === y
        );
        if (position < 0) {
            throw new Error(
                "Ошибка: к клетке приписан корабль, а в клетках, приписанных к кораблю, нет текущей клетки"
            );
            // return ShipStatus.INTACT;
        }

        const shipStatus = ship.hit(position); // ? подбит или потоплен (обвести точками)

        if (shipStatus === ShipStatus.SUNK) {
            const dx = ship.orientation === ShipOrientation.HORIZONTAL ? 1 : 0;
            const dy = ship.orientation === ShipOrientation.HORIZONTAL ? 0 : 1;
            const [x, y] = ship.cells[0]; // первая ячейка корабля

            for (let i = -1; i <= ship.size; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newX = x + (dx ? i : j);
                    const newY = y + (dy ? i : j);
                    if (newX >= 0 && newX < 10 && newY >= 0 && newY < 10) {
                        const surroundingCell = this.grid[newX][newY];
                        if (
                            surroundingCell &&
                            surroundingCell.state !== CellState.SHOT
                        ) {
                            surroundingCell.state = CellState.SHOT;
                        }
                    }
                }
            }

            game.appendShipSunk(ship);
        }
        return shipStatus;
    }
}

class Game {
    userShipsSunk = []; // потопленные корабли пользователя
    aiShipsSunk = []; // потопленноые корабли ИИ
    constructor() {
        this.gamer = Math.random() < 0.5 ? Gamer.USER : Gamer.AI; // игрок, чей ход ожидается
        Drawer.toggleAISea(this.gamer === Gamer.AI);
    }
    get isOver() {
        return (
            this.aiShipsSunk.length === 10 || this.userShipsSunk.length === 10
        );
    }
    get winnerMessage() {
        return this.userShipsSunk.length === 10
            ? "Я ВЫИГРАЛ! Машины vs. Людей, первый раунд за нами!"
            : this.aiShipsSunk.length
            ? "Поздравляю, человек. Ты одолел меня. :("
            : null;
    }
    toggleGamer() {
        this.gamer = this.gamer === Gamer.AI ? Gamer.USER : Gamer.AI;
        Drawer.toggleAISea(this.gamer === Gamer.AI);
    }
    appendShipSunk(ship) {
        this.gamer === Gamer.AI
            ? this.userShipsSunk.push(ship)
            : this.aiShipsSunk.push(ship);

        console.log(
            `СЧЕТ (вы/машина): ${this.aiShipsSunk.length}, ${this.userShipsSunk.length}`
        );

        if (this.isOver) {
            setTimeout(() => alertMessage(this.winnerMessage), 100);
            Drawer.finishDisable();
        }
    }
}

// DOM-конструктор -------------------
const userSeaDiv = document.getElementById("user-sea");
const aiSeaDiv = document.getElementById("enemy-sea");
class Drawer {
    static drawEmptySea(container, sea, untouchable) {
        // псевдострока с шапкой
        const header = document.createElement("div");
        header.className = "sea__header";
        for (let n = 1; n <= 10; n++) {
            const headerCell = document.createElement("div");
            headerCell.className = "sea__header-cell";
            headerCell.dataset.num = n;
            header.appendChild(headerCell);
        }
        container.appendChild(header);

        // боевое поле
        for (let i = 0; i < 10; i++) {
            const row = document.createElement("div");
            row.className = "sea__row";
            row.dataset.row = String.fromCharCode(1072 + (i === 9 ? i + 1 : i)); // а, б, ..., к
            for (let j = 0; j < 10; j++) {
                const cell = document.createElement("div");
                cell.className = "sea__cell";
                [cell.dataset.x, cell.dataset.y] = [j, i];
                row.appendChild(cell);

                cell.addEventListener("click", (e) => {
                    if (!sea) throw new Error("Неизвестное поле");
                    if (!e.target?.dataset)
                        throw new Error("Координаты ячейки недоступны");

                    const [x, y] = [+e.target.dataset.x, +e.target.dataset.y];

                    // результат удара по ячейке (0 - уже били, иначе статус ShipStatus)
                    const status = sea.hit(x, y);

                    e.target.classList.add("sea__cell--shot");

                    if (!status) return; // уже стреляли
                    if (status === ShipStatus.INTACT) return; // промазали
                    Drawer.drawShip(e.target, status); // попали

                    // обвести точками потопленный корабль
                    if (status === ShipStatus.SUNK) {
                        const ship = sea.ships.find((el) =>
                            el.cells.some((c) => c[0] === x && c[1] === y)
                        );
                        ship && Drawer.frameSunkShip(container, ship);
                    }
                });
            }
            container.appendChild(row);
        }

        // заблокировать поле для ручного изменения (например, свое поле)
        untouchable && (container.style = "pointer-events: none;");
    }
    static drawShips(container, ships) {
        const cells = container.querySelectorAll(".sea__cell");
        cells.forEach((cell) => {
            if (ships[cell.dataset.x][cell.dataset.y].shipId) {
                Drawer.drawShip(cell, ShipStatus.INTACT);
            }
        });
    }
    static drawShip(cell, status) {
        if (status === ShipStatus.INTACT) {
            cell.classList.add("sea__cell--ship"); // целый корабль
        } else {
            cell.classList.add("sea__cell--damaged");
        }
    }
    static frameSunkShip(container, ship) {
        const startCoords = ship.cells[0];
        const dx = ship.orientation === ShipOrientation.HORIZONTAL ? 1 : 0;
        const dy = ship.orientation === ShipOrientation.HORIZONTAL ? 0 : 1;
        for (let i = -1; i <= (dx ? ship.size : 1); i++) {
            for (let j = -1; j <= (dy ? ship.size : 1); j++) {
                const cellDiv = container.querySelector(
                    `.sea__cell[data-x="${startCoords[0] + i}"][data-y="${
                        startCoords[1] + j
                    }"]`
                );
                cellDiv?.classList.add("sea__cell--shot");
            }
        }
    }
    static toggleAISea(on) {
        if (on) {
            aiSeaDiv.classList.add("pointer-events-none");
            aiSeaDiv.classList.add("opacity-50");
        } else {
            aiSeaDiv.classList.remove("pointer-events-none");
            aiSeaDiv.classList.remove("opacity-50");
        }
    }
    static finishDisable() {
        aiSeaDiv.classList.add(["pointer-events-none", "opacity-50"]);
        userSeaDiv.classList.add(["pointer-events-none", "opacity-50"]);
    }
}

// ---------------- ИИ ----------------
class AI {
    #game; // текущая игра
    #sea; // море со своими кораблями
    #battle; // информация о бое
    #interval; // мониторинг ходов
    loading = false;

    constructor(game, goalSea) {
        this.#game = game;
        this.#sea = new Sea();
        this.#sea.placeShips();
        Drawer.drawEmptySea(aiSeaDiv, this.#sea);
        // Drawer.drawShips(enemySeaDiv, this.#sea.grid);

        this.#battle = {
            sea: goalSea, // вражеское поле
            lastPoint: null, // координаты последнего удара
            ship: null, // атакуемый корабль (если задет)
            goals: goalSea.clearCells, // ячейки для следующей атаки (по умолчанию все свободные)
            setShip(id) {
                this.ship = this.sea?.ships.find((el) => el.id === id) || null;
            },
            getClearNeighborCells(goal) {
                return [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1],
                ]
                    .map((el) => {
                        const [x, y] = [
                            goal.coords[0] + el[0],
                            goal.coords[1] + el[1],
                        ];
                        return isInRange(x, 0, 9) && isInRange(y, 0, 9)
                            ? this.sea.grid.at(x)?.at(y)
                            : null;
                    })
                    .filter((el) => el?.state === CellState.CLEAR);
            },
        };

        this.#interval = setInterval(
            async () =>
                !this.loading &&
                this.#game.gamer === Gamer.AI &&
                !this.#game.isOver &&
                (await this.go()),
            100
        );
    }

    async go() {
        // проверка на полный финиш
        if (this.#battle.sea.clearCells.length === 0) {
            clearInterval(this.#interval);
            this.loading = false;
            return;
        }

        this.loading = true;

        // имитация размышлялки
        await new Promise((resolve) =>
            setTimeout(() => resolve(), random(0, 500) + 0)
        );

        if (!this.#battle.goals?.length) {
            clearInterval(this.#interval);
            this.loading = false;
            return;
        }

        // поиск новой цели из числа доступных и удар по ней
        const goal = this.#battle.goals.at(
            random(0, this.#battle.goals.length, false)
        );
        if (!goal) {
            clearInterval(this.#interval);
            this.loading = false;
            return;
        }

        const goalDiv = userSeaDiv.querySelector(
            `.sea__cell[data-x="${goal?.coords?.at(
                0
            )}"][data-y="${goal?.coords?.at(1)}"]`
        );
        if (!goalDiv) return;

        // console.log("Выбрана цель:", goal.coords);
        goalDiv.dispatchEvent(new Event("click"));
        this.#battle.goals = this.#battle.goals.filter((el) => el !== goal);

        // анализ результата удара
        const attackResult = {
            NO_QUEUE_OUT: !this.#battle.ship && !goal.shipId, // * мимо, очередь попаданий еще не открыта
            NO_QUEUE_IN: !this.#battle.ship && goal.shipId, // * попадание, очередь еще не открыта
            QUEUE_OUT: this.#battle.ship && !goal.shipId, // * мимо, очередь попаданий открыта
            QUEUE_IN: this.#battle.ship && goal.shipId, // * попадание, очередь открыта
        };
        const attackResultAction = {
            NO_QUEUE_OUT: () => {
                // console.log("NO_QUEUE_OUT");
                this.#battle.goals = this.#battle.sea.clearCells;
            },
            NO_QUEUE_IN: () => {
                // console.log("NO_QUEUE_IN");
                this.#battle.setShip(goal.shipId);
                if (this.#battle.ship?.status === ShipStatus.DAMAGED) {
                    this.#battle.goals =
                        this.#battle.getClearNeighborCells(goal);
                } else {
                    this.#battle.ship = null;
                    this.#battle.goals = this.#battle.sea.clearCells;
                }
            },
            QUEUE_OUT: () => {
                // console.log("QUEUE_OUT");
                // очистить от ставшей лишней точки
                this.#battle.goals = this.#battle.goals.filter(
                    (el) => el?.state === CellState.CLEAR
                );
            },
            QUEUE_IN: () => {
                // console.log("QUEUE_IN");
                if (this.#battle.ship?.status === ShipStatus.DAMAGED) {
                    // добавить соседние точки и отфильтровать по ориентации корабля
                    this.#battle.goals = [
                        ...this.#battle.goals,
                        ...this.#battle.getClearNeighborCells(goal),
                    ].filter((el) => {
                        const idx =
                            this.#battle.ship.orientation ===
                            ShipOrientation.HORIZONTAL
                                ? 1
                                : 0;
                        return el.coords[idx] === goal.coords[idx];
                    });
                } else {
                    this.#battle.ship = null;
                    this.#battle.goals = this.#battle.sea.clearCells;
                }
            },
        };

        // Поиск и выполнение действия
        for (const [key, value] of Object.entries(attackResult)) {
            if (value) {
                attackResultAction[key]();
                break; // Выполняем только первое истинное действие
            }
        }

        this.loading = false;
    }
}

// инициализация ----------------------
// ИГРА
const game = new Game();

// игрок
const sea = new Sea();
sea.placeShips();
Drawer.drawEmptySea(userSeaDiv, sea, true); // заблокировано для ручного изменения поле
Drawer.drawShips(userSeaDiv, sea.grid);

// компьютер
new AI(game, sea);
