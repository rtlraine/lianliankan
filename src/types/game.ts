export interface Block {
    type: number
    x: number
    y: number
    selected: boolean
    removed: boolean
    animating: boolean
    scale: number
}

export interface LinePoint {
    x: number
    y: number
}

export interface Line {
    points: LinePoint[]
    opacity: number
}

export interface LevelConfig {
    level: number
    rows: number
    cols: number
    types: number
    time: number
}

export interface GameStats {
    score: number
    level: number
    timeLeft: number
    remaining: number
    isPlaying: boolean
    isPaused: boolean
}

export type PathPoint = { x: number; y: number }
