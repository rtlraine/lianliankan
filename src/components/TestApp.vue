<script setup lang="ts">
import { ref, onMounted } from 'vue'

const message = ref('连连看游戏')
const isLoaded = ref(false)

onMounted(() => {
    console.log('Vue app mounted successfully!')
    isLoaded.value = true
})
</script>

<template>
    <div class="game-container">
        <header class="header">
            <h1>{{ message }}</h1>
            <p v-if="isLoaded">游戏加载成功！</p>
            <p v-else>加载中...</p>
        </header>
        
        <div class="test-content">
            <p>这是一个测试页面</p>
            <button @click="message = '测试按钮点击'">点击测试</button>
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
}

.test-content {
    text-align: center;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 10px;
}

button {
    padding: 10px 20px;
    font-size: 1em;
    border: none;
    border-radius: 5px;
    background: #667eea;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #764ba2;
}
</style>