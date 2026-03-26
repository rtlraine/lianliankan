<script setup lang="ts">
import { computed } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'

const {
    score,
    level,
    timeLeft,
    remaining,
    isPlaying,
    isPaused,
    startGame,
    togglePause,
    restartGame,
    selectLevel,
    stopGame
} = useGameLogic()

const formattedTime = computed(() => {
    const minutes = Math.floor(timeLeft.value / 60)
    const seconds = timeLeft.value % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

function handleLevelSelect(lvl: number) {
    stopGame()
    selectLevel(lvl)
}

function handleRestart() {
    restartGame()
}

function handlePause() {
    togglePause()
}

defineExpose({
    startGame,
    togglePause,
    restartGame,
    selectLevel
})
</script>

<template>
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
    <div class="game-controls">
        <button class="btn btn-primary" @click="handleRestart">
            重新开始
        </button>
        <button class="btn btn-secondary" @click="handlePause">
            {{ isPaused ? '继续' : '暂停' }}
        </button>
        <button class="btn btn-secondary" @click="startGame(1)">
            关卡选择
        </button>
    </div>
</template>

<style scoped>
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
    font-size: 1.5em;
    font-weight: bold;
}

.game-controls {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.btn {
    padding: 12px 24px;
    font-size: 1em;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #f0f0f0;
    color: #333;
}

.btn-secondary:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
}

.btn:active {
    transform: translateY(0);
}
</style>
