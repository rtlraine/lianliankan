import { ref, computed, reactive, readonly } from 'vue'
import type { Block, GameStats, LevelConfig, PathPoint, Line } from '../types/game'
import { getLevelConfig, createBoardData, isBlockEmpty, calculatePathPoints } from '../utils/gameUtils'

export function useGameLogic() {
    const board = ref<Block[][]>([])
    const selectedBlocks = ref<Block[]>([])
    const lines = ref<Line[]>([])
    const score = ref(0)
    const level = ref(1)
    const timeLeft = ref(0)
    const remaining = ref(0)
    const isPlaying = ref(false)
    const isPaused = ref(false)
    const timer = ref<number | null>(null)
    const animationFrame = ref<number | null>(null)
    
    const config = computed(() => getLevelConfig(level.value))
    const stats = computed<GameStats>(() => ({
        score: score.value,
        level: level.value,
        timeLeft: timeLeft.value,
        remaining: remaining.value,
        isPlaying: isPlaying.value,
        isPaused: isPaused.value
    }))
    
    const blockSize = 40
    const blockGap = 5
    const boardX = ref(0)
    const boardY = ref(0)
    const canvasWidth = ref(0)
    const canvasHeight = ref(0)
    
    function startGame(lvl: number = 1) {
        level.value = lvl
        const configData = getLevelConfig(lvl)
        
        score.value = 0
        timeLeft.value = configData.time
        board.value = createBoardData(configData)
        selectedBlocks.value = []
        lines.value = []
        isPlaying.value = true
        isPaused.value = false
        
        updateRemainingBlocks()
        startTimer()
    }
    
    function stopGame() {
        isPlaying.value = false
        isPaused.value = false
        if (timer.value) {
            clearInterval(timer.value)
            timer.value = null
        }
        if (animationFrame.value) {
            cancelAnimationFrame(animationFrame.value)
            animationFrame.value = null
        }
    }
    
    function startTimer() {
        if (timer.value) {
            clearInterval(timer.value)
        }
        
        timer.value = window.setInterval(() => {
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
    
    function selectLevel(lvl: number) {
        stopGame()
        startGame(lvl)
    }
    
    function updateRemainingBlocks() {
        const configData = getLevelConfig(level.value)
        let count = 0
        
        for (let row = 0; row < configData.rows; row++) {
            for (let col = 0; col < configData.cols; col++) {
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
        
        if (level.value < 5) {
            setTimeout(() => {
                level.value++
                startGame(level.value)
            }, 1000)
        }
    }
    
    function gameOver(win: boolean) {
        isPlaying.value = false
    }
    
    function handleBlockClick(row: number, col: number) {
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
                const path = findPath(firstBlock, block)
                if (path) {
                    matchBlocks(firstBlock, block, path)
                }
            }
        }
    }
    
    function findPath(block1: Block, block2: Block): Block[] | null {
        if (canConnectDirectly(block1, block2)) {
            return getDirectPath(block1, block2)
        }
        
        const path = findPathWithOneTurn(block1, block2)
        if (path) return path
        
        return findPathWithTwoTurns(block1, block2)
    }
    
    function canConnectDirectly(block1: Block, block2: Block): boolean {
        const configData = getLevelConfig(level.value)
        
        if (block1.x === block2.x) {
            const minY = Math.min(block1.y, block2.y)
            const maxY = Math.max(block1.y, block2.y)
            for (let y = minY + 1; y < maxY; y++) {
                if (!isBlockEmpty(board.value, block1.x, y, configData)) return false
            }
            return true
        }
        
        if (block1.y === block2.y) {
            const minX = Math.min(block1.x, block2.x)
            const maxX = Math.max(block1.x, block2.x)
            for (let x = minX + 1; x < maxX; x++) {
                if (!isBlockEmpty(board.value, x, block1.y, configData)) return false
            }
            return true
        }
        
        return false
    }
    
    function getDirectPath(block1: Block, block2: Block): Block[] {
        const path: Block[] = []
        const configData = getLevelConfig(level.value)
        
        if (block1.x === block2.x) {
            const minY = Math.min(block1.y, block2.y)
            const maxY = Math.max(block1.y, block2.y)
            for (let y = minY; y <= maxY; y++) {
                path.push(board.value[y][block1.x])
            }
        } else {
            const minX = Math.min(block1.x, block2.x)
            const maxX = Math.max(block1.x, block2.x)
            for (let x = minX; x <= maxX; x++) {
                path.push(board.value[block1.y][x])
            }
        }
        
        return path
    }
    
    function findPathWithOneTurn(block1: Block, block2: Block): Block[] | null {
        const configData = getLevelConfig(level.value)
        const corner1 = { x: block2.x, y: block1.y }
        const corner2 = { x: block1.x, y: block2.y }
        
        if (isBlockEmpty(board.value, corner1.x, corner1.y, configData) &&
            canConnectDirectly(block1, corner1 as Block) &&
            canConnectDirectly(corner1 as Block, block2)) {
            return getOneTurnPath(block1, corner1, block2)
        }
        
        if (isBlockEmpty(board.value, corner2.x, corner2.y, configData) &&
            canConnectDirectly(block1, corner2 as Block) &&
            canConnectDirectly(corner2 as Block, block2)) {
            return getOneTurnPath(block1, corner2, block2)
        }
        
        return null
    }
    
    function getOneTurnPath(block1: Block, corner: { x: number, y: number }, block2: Block): Block[] {
        const path: Block[] = []
        const configData = getLevelConfig(level.value)
        
        if (block1.x === corner.x) {
            const minY = Math.min(block1.y, corner.y)
            const maxY = Math.max(block1.y, corner.y)
            for (let y = minY; y <= maxY; y++) {
                path.push(board.value[y][block1.x])
            }
        } else {
            const minX = Math.min(block1.x, corner.x)
            const maxX = Math.max(block1.x, corner.x)
            for (let x = minX; x <= maxX; x++) {
                path.push(board.value[block1.y][x])
            }
        }
        
        if (corner.x === block2.x) {
            const minY = Math.min(corner.y, block2.y)
            const maxY = Math.max(corner.y, block2.y)
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(board.value[y][corner.x])
            }
        } else {
            const minX = Math.min(corner.x, block2.x)
            const maxX = Math.max(corner.x, block2.x)
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(board.value[corner.y][x])
            }
        }
        
        return path
    }
    
    function findPathWithTwoTurns(block1: Block, block2: Block): Block[] | null {
        const configData = getLevelConfig(level.value)
        
        for (let i = 0; i < configData.rows; i++) {
            if (i === block1.y) continue
            
            const corner1 = { x: block1.x, y: i }
            const corner2 = { x: block2.x, y: i }
            
            if (isBlockEmpty(board.value, corner1.x, corner1.y, configData) &&
                isBlockEmpty(board.value, corner2.x, corner2.y, configData) &&
                canConnectDirectly(block1, corner1 as Block) &&
                canConnectDirectly(corner1 as Block, corner2 as Block) &&
                canConnectDirectly(corner2 as Block, block2)) {
                return getTwoTurnsPath(block1, corner1, corner2, block2)
            }
        }
        
        for (let j = 0; j < configData.cols; j++) {
            if (j === block1.x) continue
            
            const corner1 = { x: j, y: block1.y }
            const corner2 = { x: j, y: block2.y }
            
            if (isBlockEmpty(board.value, corner1.x, corner1.y, configData) &&
                isBlockEmpty(board.value, corner2.x, corner2.y, configData) &&
                canConnectDirectly(block1, corner1 as Block) &&
                canConnectDirectly(corner1 as Block, corner2 as Block) &&
                canConnectDirectly(corner2 as Block, block2)) {
                return getTwoTurnsPath(block1, corner1, corner2, block2)
            }
        }
        
        return null
    }
    
    function getTwoTurnsPath(block1: Block, corner1: { x: number, y: number }, corner2: { x: number, y: number }, block2: Block): Block[] {
        const path: Block[] = []
        const configData = getLevelConfig(level.value)
        
        if (block1.x === corner1.x) {
            const minY = Math.min(block1.y, corner1.y)
            const maxY = Math.max(block1.y, corner1.y)
            for (let y = minY; y <= maxY; y++) {
                path.push(board.value[y][block1.x])
            }
        } else {
            const minX = Math.min(block1.x, corner1.x)
            const maxX = Math.max(block1.x, corner1.x)
            for (let x = minX; x <= maxX; x++) {
                path.push(board.value[block1.y][x])
            }
        }
        
        if (corner1.x === corner2.x) {
            const minY = Math.min(corner1.y, corner2.y)
            const maxY = Math.max(corner1.y, corner2.y)
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(board.value[y][corner1.x])
            }
        } else {
            const minX = Math.min(corner1.x, corner2.x)
            const maxX = Math.max(corner1.x, corner2.x)
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(board.value[corner1.y][x])
            }
        }
        
        if (corner2.x === block2.x) {
            const minY = Math.min(corner2.y, block2.y)
            const maxY = Math.max(corner2.y, block2.y)
            for (let y = minY + 1; y <= maxY; y++) {
                path.push(board.value[y][corner2.x])
            }
        } else {
            const minX = Math.min(corner2.x, block2.x)
            const maxX = Math.max(corner2.x, block2.x)
            for (let x = minX + 1; x <= maxX; x++) {
                path.push(board.value[corner2.y][x])
            }
        }
        
        return path
    }
    
    function matchBlocks(block1: Block, block2: Block, path: Block[]) {
        block1.selected = false
        block2.selected = false
        selectedBlocks.value = []
        
        createLineAnimation(path)
        animateBlocksRemoval([block1, block2])
        
        score.value += 10 + path.length
        
        setTimeout(() => {
            block1.removed = true
            block2.removed = true
            lines.value = []
            updateRemainingBlocks()
            
            if (remaining.value === 0) {
                gameWin()
            }
        }, 300)
    }
    
    function createLineAnimation(path: Block[]) {
        const points = calculatePathPoints(
            board.value,
            path,
            boardX.value,
            boardY.value,
            blockSize,
            blockGap
        )
        
        lines.value.push({
            points,
            opacity: 1
        })
    }
    
    function animateBlocksRemoval(blocks: Block[]) {
        blocks.forEach(block => {
            block.animating = true
            block.scale = 1
        })
        
        let frame = 0
        const animate = () => {
            frame++
            blocks.forEach(block => {
                block.scale = 1 - frame / 10
            })
            
            if (frame < 10) {
                animationFrame.value = requestAnimationFrame(animate)
            } else {
                blocks.forEach(block => {
                    block.animating = false
                })
            }
        }
        
        animate()
    }
    
    function updateCanvasSize(width: number, height: number) {
        canvasWidth.value = width
        canvasHeight.value = height
        
        const configData = getLevelConfig(level.value)
        const boardWidth = configData.cols * (blockSize + blockGap)
        const boardHeight = configData.rows * (blockSize + blockGap)
        
        boardX.value = (width - boardWidth) / 2
        boardY.value = (height - boardHeight) / 2
    }
    
    function animateLines() {
        if (!isPlaying.value) return
        
        let needsRedraw = false
        
        lines.value.forEach(line => {
            if (line.opacity > 0) {
                line.opacity -= 0.02
                needsRedraw = true
            }
        })
        
        lines.value = lines.value.filter(line => line.opacity > 0)
        
        if (needsRedraw) {
            animationFrame.value = requestAnimationFrame(animateLines)
        }
    }
    
    return {
        board,
        selectedBlocks,
        lines,
        score,
        level,
        timeLeft,
        remaining,
        isPlaying,
        isPaused,
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
        handleBlockClick,
        updateCanvasSize,
        animateLines
    }
}
