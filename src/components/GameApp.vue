<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'
import GameInfo from './GameInfo.vue'
import LevelModal from './LevelModal.vue'
import GameOverModal from './GameOverModal.vue'

const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const levelModalVisible = ref(false)
const gameOverModalVisible = ref(false)
const gameOverTitle = ref('')
const finalScore = ref(0)
const finalLevel = ref(0)

const {
    board,
    stats,
    blockSize,
    blockGap,
    boardX,
    boardY,
    canvasWidth,
    canvasHeight,
    startGame,
    stopGame,
    togglePause,
    restartGame,
    selectLevel,
    handleBlockClick: gameHandleBlockClick,
    updateCanvasSize
} = useGameLogic()

const formattedTime = computed(() => {
    const minutes = Math.floor(stats.value.timeLeft / 60)
    const seconds = stats.value.timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const blockTypes = [
    '🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥦', '🍄'
]

function handleCanvasClick(e: MouseEvent) {
    if (!canvasRef.value || !stats.value.isPlaying || stats.value.isPaused) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const blockWidth = blockSize + blockGap
    const blockHeight = blockSize + blockGap
    
    const col = Math.floor((x - boardX.value) / blockWidth)
    const row = Math.floor((y - boardY.value) / blockHeight)
    
    if (board.value.length > 0 && row >= 0 && row < board.value.length && col >= 0 && col < board.value[0].length) {
        gameHandleBlockClick(row, col)
    }
}

function handleLevelSelect(lvl: number) {
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
        updateCanvasSize(width, height)
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

let animationFrameId: number | null = null

function gameLoop() {
    draw()
    if (stats.value.isPlaying) {
        animationFrameId = requestAnimationFrame(gameLoop)
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
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
    }
    stopGame()
})
</script>

<template>
    <div class="game-container">
        <header class="header">
            <h1>连连看</h1>
        </header>
        
        <GameInfo />
        
        <div class="game-board" ref="containerRef" @click="handleCanvasClick">
            <canvas ref="canvasRef"></canvas>
            
            <div v-if="stats.isPaused && stats.isPlaying" class="pause-overlay">
                ⏸️ 暂停
            </div>
        </div>
        
        <LevelModal
            v-if="levelModalVisible"
            @select-level="handleLevelSelect"
            @close="levelModalVisible = false"
        />
        
        <GameOverModal
            :show="gameOverModalVisible"
            :title="gameOverTitle"
            :final-score="finalScore"
            :final-level="finalLevel"
            @close="gameOverModalVisible = false"
            @restart="handleRestart"
            @menu="handleMenu"
        />
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
}
</style>
