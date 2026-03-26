<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'

const props = defineProps<{
    level?: number
}>()

const emit = defineEmits<{
    (e: 'select-level', level: number): void
    (e: 'close'): void
}>()

const { startGame, stopGame } = useGameLogic()

const levels = [1, 2, 3, 4, 5]

function handleLevelSelect(lvl: number) {
    stopGame()
    startGame(lvl)
    emit('close')
}

function handleClose() {
    emit('close')
}
</script>

<template>
    <div class="level-modal" @click.self="handleClose">
        <div class="modal-content">
            <h2>选择关卡</h2>
            <div class="level-grid">
                <button
                    v-for="lvl in levels"
                    :key="lvl"
                    class="level-btn"
                    @click="handleLevelSelect(lvl)"
                >
                    {{ lvl }}
                </button>
            </div>
            <button class="btn close-btn" @click="handleClose">
                关闭
            </button>
        </div>
    </div>
</template>

<style scoped>
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
    animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.8);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
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

.close-btn {
    margin-top: 20px;
    padding: 12px 24px;
    font-size: 1em;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #f0f0f0;
    color: #333;
}

.close-btn:hover {
    background: #e0e0e0;
}
</style>
