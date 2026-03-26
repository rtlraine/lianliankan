import type { Block, LevelConfig, PathPoint, LinePoint } from '../types/game'

export const LEVEL_CONFIGS: LevelConfig[] = [
    { level: 1, rows: 6, cols: 6, types: 6, time: 60 },
    { level: 2, rows: 8, cols: 8, types: 8, time: 90 },
    { level: 3, rows: 10, cols: 10, types: 10, time: 120 },
    { level: 4, rows: 12, cols: 12, types: 12, time: 150 },
    { level: 5, rows: 14, cols: 14, types: 14, time: 180 }
]

export const BLOCK_EMOJIS = [
    '🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍍', '🥝', '🥑', '🍆', '🥕', '🌽', '🥦', '🍄'
]

export function getLevelConfig(level: number): LevelConfig {
    return LEVEL_CONFIGS[level - 1] || LEVEL_CONFIGS[0]
}

export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1))
        const temp = result[i]
        result[i] = result[randomIndex]
        result[randomIndex] = temp
    }
    return result
}

export function createBoardData(config: LevelConfig): Block[][] {
    const totalBlocks = config.rows * config.cols
    const blockCountPerType = Math.floor(totalBlocks / config.types)
    
    let blocks: number[] = []
    for (let i = 0; i < config.types; i++) {
        for (let j = 0; j < blockCountPerType; j++) {
            blocks.push(i)
        }
    }
    
    while (blocks.length < totalBlocks) {
        blocks.push(Math.floor(Math.random() * config.types))
    }
    
    blocks = shuffleArray(blocks)
    
    const board: Block[][] = []
    for (let row = 0; row < config.rows; row++) {
        board[row] = []
        for (let col = 0; col < config.cols; col++) {
            board[row][col] = {
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
    
    return board
}

export function isBlockEmpty(board: Block[][], x: number, y: number, config: LevelConfig): boolean {
    if (y < 0 || y >= config.rows || x < 0 || x >= config.cols) {
        return true
    }
    
    const block = board[y][x]
    return block.removed || block.animating
}

export function calculatePathPoints(
    board: Block[][],
    path: Block[],
    boardX: number,
    boardY: number,
    blockSize: number,
    blockGap: number
): LinePoint[] {
    const points: LinePoint[] = []
    
    path.forEach((block, index) => {
        if (!block) return
        
        const x = boardX + block.x * (blockSize + blockGap) + blockSize / 2
        const y = boardY + block.y * (blockSize + blockGap) + blockSize / 2
        
        if (index === 0) {
            points.push({ x, y })
        } else {
            const prevBlock = path[index - 1]
            if (!prevBlock) return
            
            const prevX = boardX + prevBlock.x * (blockSize + blockGap) + blockSize / 2
            const prevY = boardY + prevBlock.y * (blockSize + blockGap) + blockSize / 2
            
            if (points.length > 0) {
                const lastPoint = points[points.length - 1]
                if (lastPoint.x !== x || lastPoint.y !== y) {
                    points.push({ x, y })
                }
            } else {
                points.push({ x, y })
            }
        }
    })
    
    return points
}
