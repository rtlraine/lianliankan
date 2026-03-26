import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameLogic } from '../composables/useGameLogic'

export function useGameCanvas() {
    const canvasRef = ref<HTMLCanvasElement | null>(null)
    const ctx = ref<CanvasRenderingContext2D | null>(null)
    const { board, lines, blockSize, blockGap, boardX, boardY, canvasWidth, canvasHeight, animateLines } = useGameLogic()
    
    const blockTypes = [
        '🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥦', '🍄'
    ]
    
    function initCanvas() {
        if (canvasRef.value) {
            ctx.value = canvasRef.value.getContext('2d')
        }
    }
    
    function drawBlock(block: any, x: number, y: number) {
        if (!ctx.value) return
        
        ctx.value.save()
        
        if (block.animating) {
            ctx.value.translate(x + blockSize / 2, y + blockSize / 2)
            ctx.value.scale(block.scale, block.scale)
            ctx.value.translate(-(x + blockSize / 2), -(y + blockSize / 2))
        }
        
        ctx.value.fillStyle = block.selected ? '#667eea' : '#f0f0f0'
        ctx.value.strokeStyle = block.selected ? '#764ba2' : '#ddd'
        ctx.value.lineWidth = 2
        
        roundRect(ctx.value, x, y, blockSize, blockSize, 8)
        ctx.value.fill()
        ctx.value.stroke()
        
        ctx.value.fillStyle = '#333'
        ctx.value.font = `${blockSize * 0.6}px Arial`
        ctx.value.textAlign = 'center'
        ctx.value.textBaseline = 'middle'
        ctx.value.fillText(blockTypes[block.type], x + blockSize / 2, y + blockSize / 2 + 2)
        
        ctx.value.restore()
    }
    
    function drawLine(line: any) {
        if (!ctx.value || line.points.length < 2) return
        
        ctx.value.save()
        ctx.value.strokeStyle = '#667eea'
        ctx.value.lineWidth = 4
        ctx.value.lineCap = 'round'
        ctx.value.lineJoin = 'round'
        ctx.value.globalAlpha = line.opacity
        
        ctx.value.beginPath()
        ctx.value.moveTo(line.points[0].x, line.points[0].y)
        
        for (let i = 1; i < line.points.length; i++) {
            ctx.value.lineTo(line.points[i].x, line.points[i].y)
        }
        
        ctx.value.stroke()
        ctx.value.restore()
    }
    
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
    }
    
    function draw() {
        if (!ctx.value || !canvasRef.value) return
        
        ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
        
        if (board.value.length > 0) {
            for (let row = 0; row < board.value.length; row++) {
                for (let col = 0; col < board.value[row].length; col++) {
                    const block = board.value[row][col]
                    if (!block.removed) {
                        const x = boardX.value + block.x * (blockSize + blockGap)
                        const y = boardY.value + block.y * (blockSize + blockGap)
                        drawBlock(block, x, y)
                    }
                }
            }
        }
        
        lines.value.forEach(line => drawLine(line))
    }
    
    function startAnimation() {
        animateLines()
    }
    
    onMounted(() => {
        initCanvas()
    })
    
    onUnmounted(() => {
        if (canvasRef.value) {
            canvasRef.value.removeEventListener('click', handleCanvasClick)
        }
    })
    
    return {
        canvasRef,
        ctx,
        draw,
        startAnimation
    }
}
