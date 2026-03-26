<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'

const props = defineProps<{
    show: boolean
    title: string
    finalScore: number
    finalLevel: number
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'restart'): void
    (e: 'menu'): void
}>()

const { stopGame } = useGameLogic()

function handleClose() {
    emit('close')
}

function handleRestart() {
    stopGame()
    emit('restart')
}

function handleMenu() {
    stopGame()
    emit('menu')
}
</script>

<template>
    <transition name="modal">
        <div v-if="show" class="game-over-modal" @click.self="handleClose">
            <div class="modal-content">
                <h2>{{ title }}</h2>
                <p>最终分数: <span>{{ finalScore }}</span></p>
                <p>关卡: <span>{{ finalLevel }}</span></p>
                <div class="modal-actions">
                    <button class="btn btn-primary" @click="handleRestart">
                        重新开始
                    </button>
                    <button class="btn btn-secondary" @click="handleMenu">
                        返回菜单
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.game-over-modal {
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

h2 {
    color: #667eea;
    margin-bottom: 20px;
}

p {
    font-size: 1.2em;
    margin: 10px 0;
    color: #333;
}

span {
    color: #667eea;
    font-weight: bold;
}

.modal-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 20px;
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

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>
