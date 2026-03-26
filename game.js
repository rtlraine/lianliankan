class Block {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.selected = false;
        this.removed = false;
        this.animating = false;
        this.scale = 1;
    }
}

class Line {
    constructor(points) {
        this.points = points;
        this.opacity = 1;
        this.animating = false;
    }
}

class LevelConfig {
    constructor(level) {
        this.level = level;
        
        const configs = [
            { rows: 6, cols: 6, types: 6, time: 60 },
            { rows: 8, cols: 8, types: 8, time: 90 },
            { rows: 10, cols: 10, types: 10, time: 120 },
            { rows: 12, cols: 12, types: 12, time: 150 },
            { rows: 14, cols: 14, types: 14, time: 180 }
        ];
        
        const config = configs[level - 1] || configs[0];
        this.rows = config.rows;
        this.cols = config.cols;
        this.types = config.types;
        this.time = config.time;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.board = [];
        this.selectedBlocks = [];
        this.lines = [];
        this.score = 0;
        this.level = 1;
        this.timeLeft = 0;
        this.timer = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.blockSize = 40;
        this.padding = 20;
        this.blockGap = 5;
        this.blockTypes = [];
        this.animationFrame = null;
        this.lastTime = 0;
        
        this.initBlockTypes();
        this.setupEventListeners();
        this.resizeCanvas();
    }
    
    initBlockTypes() {
        const emojis = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥦', '🍄'];
        this.blockTypes = emojis;
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('btn-restart-over').addEventListener('click', () => {
            this.closeGameOverModal();
            this.restartGame();
        });
        document.getElementById('btn-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('btn-level').addEventListener('click', () => this.openLevelModal());
        document.getElementById('btn-close-level').addEventListener('click', () => this.closeLevelModal());
        document.getElementById('btn-menu').addEventListener('click', () => {
            this.closeGameOverModal();
            this.showMainMenu();
        });
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = parseInt(e.target.dataset.level);
                this.selectLevel(level);
            });
        });
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-board');
        const maxWidth = container.clientWidth - 40;
        const maxHeight = container.clientHeight - 40;
        
        const levelConfig = new LevelConfig(this.level);
        const boardWidth = levelConfig.cols * (this.blockSize + this.blockGap);
        const boardHeight = levelConfig.rows * (this.blockSize + this.blockGap);
        
        this.canvas.width = Math.min(boardWidth + 40, maxWidth);
        this.canvas.height = Math.min(boardHeight + 40, maxHeight);
        
        this.boardX = (this.canvas.width - boardWidth) / 2;
        this.boardY = (this.canvas.height - boardHeight) / 2;
    }
    
    startGame(level = 1) {
        this.level = level;
        const config = new LevelConfig(level);
        
        this.score = 0;
        this.timeLeft = config.time;
        this.board = [];
        this.selectedBlocks = [];
        this.lines = [];
        this.isPlaying = true;
        this.isPaused = false;
        
        this.createBoard(config);
        this.updateUI();
        this.startTimer();
        this.resizeCanvas();
        this.draw();
        
        document.getElementById('level-modal').style.display = 'none';
        document.getElementById('game-over-modal').style.display = 'none';
    }
    
    createBoard(config) {
        const totalBlocks = config.rows * config.cols;
        const blockCountPerType = Math.floor(totalBlocks / config.types);
        
        let blocks = [];
        for (let i = 0; i < config.types; i++) {
            for (let j = 0; j < blockCountPerType; j++) {
                blocks.push(i);
            }
        }
        
        while (blocks.length < totalBlocks) {
            blocks.push(Math.floor(Math.random() * config.types));
        }
        
        blocks = this.shuffleArray(blocks);
        
        for (let row = 0; row < config.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < config.cols; col++) {
                this.board[row][col] = new Block(blocks[row * config.cols + col], col, row);
            }
        }
        
        this.updateRemainingBlocks();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    handleCanvasClick(e) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const levelConfig = new LevelConfig(this.level);
        const blockWidth = this.blockSize + this.blockGap;
        const blockHeight = this.blockSize + this.blockGap;
        
        const col = Math.floor((x - this.boardX) / blockWidth);
        const row = Math.floor((y - this.boardY) / blockHeight);
        
        if (row >= 0 && row < levelConfig.rows && col >= 0 && col < levelConfig.cols) {
            this.selectBlock(row, col);
        }
    }
    
    selectBlock(row, col) {
        const block = this.board[row][col];
        
        if (block.removed || block.animating) return;
        
        if (this.selectedBlocks.length === 0) {
            block.selected = true;
            this.selectedBlocks.push(block);
            this.draw();
        } else if (this.selectedBlocks.length === 1) {
            const firstBlock = this.selectedBlocks[0];
            
            if (firstBlock === block) {
                block.selected = false;
                this.selectedBlocks = [];
                this.draw();
                return;
            }
            
            if (firstBlock.type === block.type) {
                const path = this.findPath(firstBlock, block);
                if (path) {
                    this.matchBlocks(firstBlock, block, path);
                }
            }
        }
    }
    
    findPath(block1, block2) {
        if (this.canConnectDirectly(block1, block2)) {
            return this.getDirectPath(block1, block2);
        }
        
        const path = this.findPathWithOneTurn(block1, block2);
        if (path) return path;
        
        return this.findPathWithTwoTurns(block1, block2);
    }
    
    canConnectDirectly(block1, block2) {
        if (block1.x === block2.x) {
            const minY = Math.min(block1.y, block2.y);
            const maxY = Math.max(block1.y, block2.y);
            for (let y = minY + 1; y < maxY; y++) {
                if (!this.isBlockEmpty(block1.x, y)) return false;
            }
            return true;
        }
        
        if (block1.y === block2.y) {
            const minX = Math.min(block1.x, block2.x);
            const maxX = Math.max(block1.x, block2.x);
            for (let x = minX + 1; x < maxX; x++) {
                if (!this.isBlockEmpty(x, block1.y)) return false;
            }
            return true;
        }
        
        return false;
    }
    
    getDirectPath(block1, block2) {
        const path = [block1];
        
        if (block1.x === block2.x) {
            const minY = Math.min(block1.y, block2.y);
            const maxY = Math.max(block1.y, block2.y);
            for (let y = minY + 1; y < maxY; y++) {
                path.push(this.board[y][block1.x]);
            }
        } else {
            const minX = Math.min(block1.x, block2.x);
            const maxX = Math.max(block1.x, block2.x);
            for (let x = minX + 1; x < maxX; x++) {
                path.push(this.board[block1.y][x]);
            }
        }
        
        path.push(block2);
        return path;
    }
    
    findPathWithOneTurn(block1, block2) {
        const corner1 = { x: block2.x, y: block1.y };
        const corner2 = { x: block1.x, y: block2.y };
        
        if (this.isBlockEmpty(corner1.x, corner1.y) && 
            this.canConnectDirectly(block1, corner1) && 
            this.canConnectDirectly(corner1, block2)) {
            return this.getOneTurnPath(block1, corner1, block2);
        }
        
        if (this.isBlockEmpty(corner2.x, corner2.y) && 
            this.canConnectDirectly(block1, corner2) && 
            this.canConnectDirectly(corner2, block2)) {
            return this.getOneTurnPath(block1, corner2, block2);
        }
        
        return null;
    }
    
    getOneTurnPath(block1, corner, block2) {
        const path = [];
        
        if (block1.x === corner.x) {
            const minY = Math.min(block1.y, corner.y);
            const maxY = Math.max(block1.y, corner.y);
            for (let y = minY; y <= maxY; y++) {
                path.push(this.board[y][block1.x]);
            }
        } else {
            const minX = Math.min(block1.x, corner.x);
            const maxX = Math.max(block1.x, corner.x);
            for (let x = minX; x <= maxX; x++) {
                path.push(this.board[block1.y][x]);
            }
        }
        
        if (corner.x === block2.x) {
            const minY = Math.min(corner.y, block2.y);
            const maxY = Math.max(corner.y, block2.y);
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(this.board[y][corner.x]);
            }
        } else {
            const minX = Math.min(corner.x, block2.x);
            const maxX = Math.max(corner.x, block2.x);
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(this.board[corner.y][x]);
            }
        }
        
        return path;
    }
    
    findPathWithTwoTurns(block1, block2) {
        const levelConfig = new LevelConfig(this.level);
        
        for (let i = 0; i < levelConfig.rows; i++) {
            if (i === block1.y) continue;
            
            const corner1 = { x: block1.x, y: i };
            const corner2 = { x: block2.x, y: i };
            
            if (this.isBlockEmpty(corner1.x, corner1.y) &&
                this.isBlockEmpty(corner2.x, corner2.y) &&
                this.canConnectDirectly(block1, corner1) &&
                this.canConnectDirectly(corner1, corner2) &&
                this.canConnectDirectly(corner2, block2)) {
                return this.getTwoTurnsPath(block1, corner1, corner2, block2);
            }
        }
        
        for (let j = 0; j < levelConfig.cols; j++) {
            if (j === block1.x) continue;
            
            const corner1 = { x: j, y: block1.y };
            const corner2 = { x: j, y: block2.y };
            
            if (this.isBlockEmpty(corner1.x, corner1.y) &&
                this.isBlockEmpty(corner2.x, corner2.y) &&
                this.canConnectDirectly(block1, corner1) &&
                this.canConnectDirectly(corner1, corner2) &&
                this.canConnectDirectly(corner2, block2)) {
                return this.getTwoTurnsPath(block1, corner1, corner2, block2);
            }
        }
        
        return null;
    }
    
    getTwoTurnsPath(block1, corner1, corner2, block2) {
        const path = [];
        
        if (block1.x === corner1.x) {
            const minY = Math.min(block1.y, corner1.y);
            const maxY = Math.max(block1.y, corner1.y);
            for (let y = minY; y <= maxY; y++) {
                path.push(this.board[y][block1.x]);
            }
        } else {
            const minX = Math.min(block1.x, corner1.x);
            const maxX = Math.max(block1.x, corner1.x);
            for (let x = minX; x <= maxX; x++) {
                path.push(this.board[block1.y][x]);
            }
        }
        
        if (corner1.x === corner2.x) {
            const minY = Math.min(corner1.y, corner2.y);
            const maxY = Math.max(corner1.y, corner2.y);
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(this.board[y][corner1.x]);
            }
        } else {
            const minX = Math.min(corner1.x, corner2.x);
            const maxX = Math.max(corner1.x, corner2.x);
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(this.board[corner1.y][x]);
            }
        }
        
        if (corner2.x === block2.x) {
            const minY = Math.min(corner2.y, block2.y);
            const maxY = Math.max(corner2.y, block2.y);
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(this.board[y][corner2.x]);
            }
        } else {
            const minX = Math.min(corner2.x, block2.x);
            const maxX = Math.max(corner2.x, block2.x);
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(this.board[corner2.y][x]);
            }
        }
        
        return path;
    }
    
    isBlockEmpty(x, y) {
        const levelConfig = new LevelConfig(this.level);
        
        if (y < 0 || y >= levelConfig.rows || x < 0 || x >= levelConfig.cols) {
            return true;
        }
        
        const block = this.board[y][x];
        return block.removed || block.animating;
    }
    
    matchBlocks(block1, block2, path) {
        block1.selected = false;
        block2.selected = false;
        this.selectedBlocks = [];
        
        this.createLineAnimation(path);
        this.animateBlocksRemoval([block1, block2]);
        
        this.score += 10 + path.length;
        this.updateUI();
        
        setTimeout(() => {
            block1.removed = true;
            block2.removed = true;
            this.lines = [];
            this.draw();
            this.updateRemainingBlocks();
            
            if (this.checkWin()) {
                this.gameWin();
            }
        }, 300);
    }
    
    createLineAnimation(path) {
        const points = [];
        const levelConfig = new LevelConfig(this.level);
        
        path.forEach((block, index) => {
            const x = this.boardX + block.x * (this.blockSize + this.blockGap) + this.blockSize / 2;
            const y = this.boardY + block.y * (this.blockSize + this.blockGap) + this.blockSize / 2;
            
            if (index === 0) {
                points.push({ x, y });
            } else {
                const prevBlock = path[index - 1];
                const prevX = this.boardX + prevBlock.x * (this.blockSize + this.blockGap) + this.blockSize / 2;
                const prevY = this.boardY + prevBlock.y * (this.blockSize + this.blockGap) + this.blockSize / 2;
                
                if (points.length > 0) {
                    const lastPoint = points[points.length - 1];
                    if (lastPoint.x !== x || lastPoint.y !== y) {
                        points.push({ x, y });
                    }
                } else {
                    points.push({ x, y });
                }
            }
        });
        
        this.lines.push(new Line(points));
    }
    
    animateBlocksRemoval(blocks) {
        blocks.forEach(block => {
            block.animating = true;
            block.scale = 1;
        });
        
        let frame = 0;
        const animate = () => {
            frame++;
            blocks.forEach(block => {
                block.scale = 1 - frame / 10;
            });
            this.draw();
            
            if (frame < 10) {
                requestAnimationFrame(animate);
            } else {
                blocks.forEach(block => {
                    block.animating = false;
                });
            }
        };
        
        animate();
    }
    
    updateRemainingBlocks() {
        const levelConfig = new LevelConfig(this.level);
        let remaining = 0;
        
        for (let row = 0; row < levelConfig.rows; row++) {
            for (let col = 0; col < levelConfig.cols; col++) {
                if (!this.board[row][col].removed) {
                    remaining++;
                }
            }
        }
        
        document.getElementById('remaining').textContent = remaining;
        
        if (remaining === 0) {
            this.gameWin();
        }
    }
    
    checkWin() {
        const levelConfig = new LevelConfig(this.level);
        for (let row = 0; row < levelConfig.rows; row++) {
            for (let col = 0; col < levelConfig.cols; col++) {
                if (!this.board[row][col].removed) {
                    return false;
                }
            }
        }
        return true;
    }
    
    gameWin() {
        this.isPlaying = false;
        this.score += this.timeLeft * 2;
        this.updateUI();
        
        if (this.level < 5) {
            setTimeout(() => {
                this.level++;
                this.startGame(this.level);
            }, 1000);
        } else {
            this.showGameOverModal('恭喜通关！', true);
        }
    }
    
    gameLose() {
        this.isPlaying = false;
        this.showGameOverModal('游戏结束', false);
    }
    
    showGameOverModal(title, isWin) {
        document.getElementById('game-over-title').textContent = title;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-level').textContent = this.level;
        document.getElementById('game-over-modal').style.display = 'flex';
    }
    
    closeGameOverModal() {
        document.getElementById('game-over-modal').style.display = 'none';
    }
    
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            if (!this.isPaused && this.isPlaying) {
                this.timeLeft--;
                this.updateUI();
                
                if (this.timeLeft <= 0) {
                    this.gameLose();
                }
            }
        }, 1000);
    }
    
    togglePause() {
        if (!this.isPlaying) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('btn-pause').textContent = this.isPaused ? '继续' : '暂停';
    }
    
    restartGame() {
        this.startGame(this.level);
    }
    
    selectLevel(level) {
        this.startGame(level);
    }
    
    openLevelModal() {
        this.closeGameOverModal();
        document.getElementById('level-modal').style.display = 'flex';
    }
    
    closeLevelModal() {
        document.getElementById('level-modal').style.display = 'none';
    }
    
    showMainMenu() {
        this.closeLevelModal();
        this.closeGameOverModal();
        this.score = 0;
        this.level = 1;
        this.timeLeft = 0;
        this.board = [];
        this.selectedBlocks = [];
        this.lines = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.updateUI();
        this.draw();
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('time').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const levelConfig = new LevelConfig(this.level);
        
        for (let row = 0; row < levelConfig.rows; row++) {
            for (let col = 0; col < levelConfig.cols; col++) {
                const block = this.board[row][col];
                if (!block.removed) {
                    this.drawBlock(block);
                }
            }
        }
        
        this.lines.forEach(line => this.drawLine(line));
    }
    
    drawBlock(block) {
        const x = this.boardX + block.x * (this.blockSize + this.blockGap);
        const y = this.boardY + block.y * (this.blockSize + this.blockGap);
        
        this.ctx.save();
        
        if (block.animating) {
            this.ctx.translate(x + this.blockSize / 2, y + this.blockSize / 2);
            this.ctx.scale(block.scale, block.scale);
            this.ctx.translate(-(x + this.blockSize / 2), -(y + this.blockSize / 2));
        }
        
        this.ctx.fillStyle = block.selected ? '#667eea' : '#f0f0f0';
        this.ctx.strokeStyle = block.selected ? '#764ba2' : '#ddd';
        this.ctx.lineWidth = 2;
        
        this.roundRect(this.ctx, x, y, this.blockSize, this.blockSize, 8);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = `${this.blockSize * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.blockTypes[block.type], x + this.blockSize / 2, y + this.blockSize / 2 + 2);
        
        this.ctx.restore();
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    drawLine(line) {
        if (line.points.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = line.opacity;
        
        this.ctx.beginPath();
        this.ctx.moveTo(line.points[0].x, line.points[0].y);
        
        for (let i = 1; i < line.points.length; i++) {
            this.ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        let needsRedraw = false;
        
        this.lines.forEach(line => {
            if (line.opacity > 0) {
                line.opacity -= 0.02;
                needsRedraw = true;
            }
        });
        
        this.lines = this.lines.filter(line => line.opacity > 0);
        
        if (needsRedraw) {
            this.draw();
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

let game;

window.addEventListener('load', () => {
    game = new Game();
    game.draw();
});
