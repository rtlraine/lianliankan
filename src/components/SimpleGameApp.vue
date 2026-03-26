<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const containerRef = ref(null)
const canvasRef = ref(null)
const levelModalVisible = ref(false)
const gameOverModalVisible = ref(false)
const gameOverTitle = ref('')
const finalScore = ref(0)
const finalLevel = ref(0)

const board = ref([])
const score = ref(0)
const level = ref(1)
const timeLeft = ref(0)
const remaining = ref(0)
const isPlaying = ref(false)
const isPaused = ref(false)
const timer = ref(null)
const animationFrameId = ref(null)
const selectedBlocks = ref([])
const lines = ref([])

const blockSize = 40
const blockGap = 5
const boardX = ref(0)
const boardY = ref(0)
const canvasWidth = ref(0)
const canvasHeight = ref(0)

const blockTypes = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥦', '🍄']
const LEVEL_CONFIGS = [
    { level: 1, rows: 6, cols: 6, types: 6, time: 60 },
    { level: 2, rows: 8, cols: 8, types: 8, time: 90 },
    { level: 3, rows: 10, cols: 10, types: 10, time: 120 },
    { level: 4, rows: 12, cols: 12, types: 12, time: 150 },
    { level: 5, rows: 14, cols: 14, types: 14, time: 180 }
]

const formattedTime = computed(() => {
    const minutes = Math.floor(timeLeft.value / 60)
    const seconds = timeLeft.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const stats = computed(() => ({
    score: score.value,
    level: level.value,
    timeLeft: timeLeft.value,
    remaining: remaining.value,
    isPlaying: isPlaying.value,
    isPaused: isPaused.value
}))

function getLevelConfig(lvl) {
    return LEVEL_CONFIGS[lvl - 1] || LEVEL_CONFIGS[0]
}

function shuffleArray(array) {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1))
        const temp = result[i]
        result[i] = result[randomIndex]
        result[randomIndex] = temp
    }
    return result
}

function createBoardData(config) {
    const totalBlocks = config.rows * config.cols
    const blockCountPerType = Math.floor(totalBlocks / config.types)
    
    let blocks = []
    for (let i = 0; i < config.types; i++) {
        for (let j = 0; j < blockCountPerType; j++) {
            blocks.push(i)
        }
    }
    
    while (blocks.length < totalBlocks) {
        blocks.push(Math.floor(Math.random() * config.types))
    }
    
    blocks = shuffleArray(blocks)
    
    const boardData = []
    for (let row = 0; row < config.rows; row++) {
        boardData[row] = []
        for (let col = 0; col < config.cols; col++) {
            boardData[row][col] = {
                type: blocks[row * config.cols + col],
                x: col,
                y: row,
                selected: false,
                removed: false,
                animating: false,
                scale: 1
            }
        }
    }
    
    return boardData
}

function startGame(lvl = 1) {
    level.value = lvl
    const config = getLevelConfig(lvl)
    
    score.value = 0
    timeLeft.value = config.time
    board.value = createBoardData(config)
    selectedBlocks.value = []
    lines.value = []
    isPlaying.value = true
    isPaused.value = false
    
    updateRemainingBlocks()
    startTimer()
    handleResize()
    gameLoop()
}

function stopGame() {
    isPlaying.value = false
    isPaused.value = false
    if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
    }
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
        animationFrameId.value = null
    }
}

function startTimer() {
    if (timer.value) {
        clearInterval(timer.value)
    }
    
    timer.value = setInterval(() => {
        if (!isPaused.value && isPlaying.value) {
            timeLeft.value--
            updateRemainingBlocks()
            
            if (timeLeft.value <= 0) {
                gameOver(false)
            }
        }
    }, 1000)
}

function togglePause() {
    if (!isPlaying.value) return
    isPaused.value = !isPaused.value
}

function restartGame() {
    stopGame()
    startGame(level.value)
}

function selectLevel(lvl) {
    stopGame()
    startGame(lvl)
}

function updateRemainingBlocks() {
    const config = getLevelConfig(level.value)
    let count = 0
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
            if (!board.value[row][col].removed) {
                count++
            }
        }
    }
    
    remaining.value = count
    
    if (count === 0 && isPlaying.value) {
        gameWin()
    }
}

function gameWin() {
    isPlaying.value = false
    score.value += timeLeft.value * 2
    gameOverTitle.value = '恭喜通关！'
    finalScore.value = score.value
    finalLevel.value = level.value
    gameOverModalVisible.value = true
    
    if (level.value < 5) {
        setTimeout(() => {
            level.value++
            startGame(level.value)
        }, 1000)
    }
}

function gameOver(win) {
    isPlaying.value = false
    gameOverTitle.value = win ? '恭喜通关！' : '游戏结束'
    finalScore.value = score.value
    finalLevel.value = level.value
    gameOverModalVisible.value = true
}

function handleBlockClick(row, col) {
    if (!isPlaying.value || isPaused.value) return
    
    const block = board.value[row][col]
    
    if (block.removed || block.animating) return
    
    if (selectedBlocks.value.length === 0) {
        block.selected = true
        selectedBlocks.value.push(block)
    } else if (selectedBlocks.value.length === 1) {
        const firstBlock = selectedBlocks.value[0]
        
        if (firstBlock === block) {
            block.selected = false
            selectedBlocks.value = []
        } else if (firstBlock.type === block.type) {
            block.selected = false
            firstBlock.selected = false
            block.removed = true
            firstBlock.removed = true
            selectedBlocks.value = []
            score.value += 10
            updateRemainingBlocks()
        }
    }
}

function handleCanvasClick(e) {
    if (!canvasRef.value || !isPlaying.value || isPaused.value) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const blockWidth = blockSize + blockGap
    const blockHeight = blockSize + blockGap
    
    const col = Math.floor((x - boardX.value) / blockWidth)
    const row = Math.floor((y - boardY.value) / blockHeight)
    
    if (board.value.length > 0 && row >= 0 && row < board.value.length && col >= 0 && col < board.value[0].length) {
        handleBlockClick(row, col)
    }
}

function handleLevelSelect(lvl) {
    levelModalVisible.value = false
    selectLevel(lvl)
}

function handleRestart() {
    gameOverModalVisible.value = false
    restartGame()
}

function handleMenu() {
    gameOverModalVisible.value = false
    stopGame()
    startGame(1)
}

function handleResize() {
    if (containerRef.value && canvasRef.value) {
        const width = containerRef.value.clientWidth - 40
        const height = containerRef.value.clientHeight - 40
        canvasRef.value.width = width
        canvasRef.value.height = height
        canvasWidth.value = width
        canvasHeight.value = height
        
        const config = getLevelConfig(level.value)
        const boardWidth = config.cols * (blockSize + blockGap)
        const boardHeight = config.rows * (blockSize + blockGap)
        
        boardX.value = (width - boardWidth) / 2
        boardY.value = (height - boardHeight) / 2
    }
}

function draw() {
    if (!canvasRef.value || !board.value.length) return
    
    const ctx = canvasRef.value.getContext('2d')
    if (!ctx) return
    
    ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
    
    for (let row = 0; row < board.value.length; row++) {
        for (let col = 0; col < board.value[row].length; col++) {
            const block = board.value[row][col]
            if (!block.removed) {
                const x = boardX.value + block.x * (blockSize + blockGap)
                const y = boardY.value + block.y * (blockSize + blockGap)
                
                ctx.save()
                
                const gradient = ctx.createLinearGradient(x, y, x + blockSize, y + blockSize)
                if (block.selected) {
                    gradient.addColorStop(0, '#667eea')
                    gradient.addColorStop(1, '#764ba2')
                } else {
                    gradient.addColorStop(0, '#f8f9fa')
                    gradient.addColorStop(1, '#e9ecef')
                }
                
                ctx.fillStyle = gradient
                ctx.strokeStyle = block.selected ? '#764ba2' : '#dee2e6'
                ctx.lineWidth = 2
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
                ctx.shadowBlur = 4
                ctx.shadowOffsetX = 2
                ctx.shadowOffsetY = 2
                
                ctx.beginPath()
                ctx.moveTo(x + 8, y)
                ctx.lineTo(x + blockSize - 8, y)
                ctx.quadraticCurveTo(x + blockSize, y, x + blockSize, y + 8)
                ctx.lineTo(x + blockSize, y + blockSize - 8)
                ctx.quadraticCurveTo(x + blockSize, y + blockSize, x + blockSize - 8, y + blockSize)
                ctx.lineTo(x + 8, y + blockSize)
                ctx.quadraticCurveTo(x, y + blockSize, x, y + blockSize - 8)
                ctx.lineTo(x, y + 8)
                ctx.quadraticCurveTo(x, y, x + 8, y)
                ctx.closePath()
                ctx.fill()
                
                ctx.shadowColor = 'transparent'
                ctx.stroke()
                
                ctx.fillStyle = '#333'
                ctx.font = `bold ${blockSize * 0.6}px Arial, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                
                const emoji = blockTypes[block.type]
                ctx.fillText(emoji, x + blockSize / 2, y + blockSize / 2 + 2)
                
                ctx.restore()
            }
        }
    }
}

function gameLoop() {
    draw()
    if (isPlaying.value) {
        animationFrameId.value = requestAnimationFrame(gameLoop)
    }
}

onMounted(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    startGame(1)
    gameLoop()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
    }
    stopGame()
})
</script>

<template>
    <div class="game-container">
        <header class="header">
            <h1>连连看</h1>
        </header>
        
        <div class="game-info">
            <div class="info-item">
                <span class="label">分数</span>
                <span class="value">{{ score }}</span>
            </div>
            <div class="info-item">
                <span class="label">时间</span>
                <span class="value">{{ formattedTime }}</span>
            </div>
            <div class="info-item">
                <span class="label">关卡</span>
                <span class="value">{{ level }}</span>
            </div>
            <div class="info-item">
                <span class="label">剩余</span>
                <span class="value">{{ remaining }}</span>
            </div>
        </div>
        
        <div class="game-board" ref="containerRef" @click="handleCanvasClick">
            <canvas ref="canvasRef"></canvas>
            
            <div v-if="isPaused && isPlaying" class="pause-overlay">
                ⏸️ 暂停
            </div>
        </div>
        
        <div class="game-controls">
            <button class="btn btn-primary" @click="restartGame">重新开始</button>
            <button class="btn btn-secondary" @click="togglePause">
                {{ isPaused ? '继续' : '暂停' }}
            </button>
            <button class="btn btn-secondary" @click="levelModalVisible = true">关卡选择</button>
        </div>
        
        <div v-if="levelModalVisible" class="level-modal" @click.self="levelModalVisible = false">
            <div class="modal-content">
                <h2>选择关卡</h2>
                <div class="level-grid">
                    <button
                        v-for="lvl in 5"
                        :key="lvl"
                        class="level-btn"
                        @click="handleLevelSelect(lvl)"
                    >
                        {{ lvl }}
                    </button>
                </div>
                <button class="btn btn-secondary" @click="levelModalVisible = false">关闭</button>
            </div>
        </div>
        
        <div v-if="gameOverModalVisible" class="level-modal" @click.self="gameOverModalVisible = false">
            <div class="modal-content">
                <h2>{{ gameOverTitle }}</h2>
                <div class="game-over-stats">
                    <p>最终分数: {{ finalScore }}</p>
                    <p>达到关卡: {{ finalLevel }}</p>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-primary" @click="handleRestart">重新开始</button>
                    <button class="btn btn-secondary" @click="handleMenu">返回菜单</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.game-container {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    padding: 30px;
    max-width: 900px;
    width: 100%;
}

.header {
    text-align: center;
    margin-bottom: 30px;
}

.header h1 {
    font-size: 3em;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.game-info {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
}

.info-item {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    min-width: 120px;
    text-align: center;
}

.info-item .label {
    display: block;
    font-size: 0.9em;
    margin-bottom: 5px;
    opacity: 0.9;
}

.info-item .value {
    display: block;
    font-size: 1.8em;
    font-weight: bold;
}

.game-board {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 15px;
    padding: 20px;
    min-height: 500px;
}

.game-board canvas {
    border: 3px solid #667eea;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.game-board canvas:hover {
    transform: scale(1.02);
}

.pause-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 3em;
    font-weight: bold;
    color: #667eea;
    border-radius: 15px;
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.game-controls {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 20px;
}

.btn {
    padding: 12px 30px;
    border: none;
    border-radius: 25px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-secondary {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.level-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    width: 90%;
}

.level-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin: 30px 0;
}

.level-btn {
    padding: 20px;
    font-size: 1.5em;
    border: 2px solid #667eea;
    background: white;
    color: #667eea;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
}

.level-btn:hover {
    background: #667eea;
    color: white;
    transform: scale(1.1);
}

.game-over-stats {
    margin: 30px 0;
    font-size: 1.2em;
}

.modal-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

@media (max-width: 768px) {
    .game-container {
        padding: 15px;
    }
    
    .header h1 {
        font-size: 2em;
    }
    
    .game-board {
        min-height: 400px;
    }
    
    .game-controls {
        flex-direction: column;
        align-items: center;
    }
    
    .btn {
        width: 100%;
        max-width: 200px;
    }
}
</style>