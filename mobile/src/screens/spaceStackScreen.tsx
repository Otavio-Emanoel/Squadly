"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View, Modal, Vibration } from "react-native"
import { BlurView } from "expo-blur"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "../theme/ThemeContext"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

const TILE = "#7B6FEA"
const TILE_HL = "rgba(255,255,255,0.16)"

const PALETTE = [
  "#7B6FEA", // lilás
  "#4CC9F0", // ciano
  "#F72585", // magenta
  "#FFD166", // amarelo
  "#06D6A0", // verde
  "#EF476F", // rosa avermelhado
  "#8338EC", // roxo
  "#3A86FF", // azul
  "#FB5607", // laranja
  "#FF006E", // rosa neon
  "#8ECAE6", // azul claro
  "#219EBC", // azul oceano
  "#023047", // azul escuro
  "#FFB3C6", // rosa pastel
  "#FB8500", // laranja vibrante
]

function getColorByIndex(idx: number) {
  if (!idx || idx <= 0) return TILE
  const i = (idx - 1) % PALETTE.length
  return PALETTE[i]
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "")
  const r = Number.parseInt(clean.substring(0, 2), 16)
  const g = Number.parseInt(clean.substring(2, 4), 16)
  const b = Number.parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Starfield de fundo simples com parallax
function Starfield({ colorA, colorB }: { colorA: string; colorB: string }) {
  const stars = useMemo(() => {
    const total = 80
    return Array.from({ length: total }).map(() => {
      const layer = Math.random()
      const size = layer < 0.5 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.2 + 0.8
      const speed = layer < 0.4 ? 8 : layer < 0.75 ? 16 : 28
      const color = Math.random() > 0.8 ? colorB : colorA
      const startX = Math.random() * SCREEN_W
      const y = Math.random() * SCREEN_H
      return {
        x: new Animated.Value(startX),
        y,
        size,
        color,
        speed,
        opacity: layer < 0.3 ? 0.4 : layer < 0.7 ? 0.7 : 1,
      }
    }) as Array<{ x: Animated.Value; y: number; size: number; color: string; speed: number; opacity: number }>
  }, [colorA, colorB])

  useEffect(() => {
    const timers = stars.map((s) => {
      const run = () => {
        const current = (s.x as any)._value ?? 0
        const distance = current + s.size + 20
        const duration = (distance / s.speed) * 1000
        Animated.timing(s.x, {
          toValue: -20,
          duration: Math.max(800, duration),
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return
          s.x.setValue(SCREEN_W + Math.random() * 60)
          s.y = Math.random() * SCREEN_H
          run()
        })
      }
      const t = setTimeout(run, Math.random() * 1200)
      return () => clearTimeout(t)
    })
    return () => timers.forEach((fn) => fn())
  }, [stars])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject as any}>
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: s.y,
            transform: [{ translateX: s.x }],
            width: s.size,
            height: s.size,
            borderRadius: 8,
            backgroundColor: s.color,
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  )
}

// Tipos e peças
export type SpaceStackScreenProps = {
  onBack?: () => void
}

type Piece = number[][] // matriz 1/0

const SHAPES: Piece[] = [
  // Básicas (1x1 até 1x5)
  [[1]],
  [[1, 1]],
  [[1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1, 1, 1, 1, 1]],

  // Verticais (2x1 até 5x1)
  [[1], [1]],
  [[1], [1], [1]],
  [[1], [1], [1], [1]],
  [[1], [1], [1], [1], [1]],

  // Quadrados
  [
    [1, 1],
    [1, 1],
  ], // 2x2
  [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ], // 3x3

  // Retângulos
  [
    [1, 1, 1],
    [1, 1, 1],
  ], // 2x3
  [
    [1, 1],
    [1, 1],
    [1, 1],
  ], // 3x2

  // L shapes
  [
    [1, 0],
    [1, 1],
  ], // L pequeno
  [
    [0, 1],
    [1, 1],
  ], // L invertido
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // L grande
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // L grande invertido
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ], // L alto
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ], // L alto invertido

  // T shapes
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T normal
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T invertido
  [
    [1, 0],
    [1, 1],
    [1, 0],
  ], // T lateral
  [
    [0, 1],
    [1, 1],
    [0, 1],
  ], // T lateral invertido

  // Z e S shapes
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [0, 1],
    [1, 1],
    [1, 0],
  ], // Z vertical
  [
    [1, 0],
    [1, 1],
    [0, 1],
  ], // S vertical

  // Especiais
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ], // Cruz
  [
    [1, 0, 1],
    [1, 1, 1],
  ], // U
  [
    [1, 1],
    [1, 0],
  ], // Canto
  [
    [1, 1],
    [0, 1],
  ], // Canto invertido
]

function smartPieceGeneration(board: number[][], size: number): Piece[] {
  const emptyCells = board.flat().filter((cell) => cell === 0).length
  const totalCells = size * size
  const fillRatio = (totalCells - emptyCells) / totalCells

  // Adapta dificuldade baseada no preenchimento do tabuleiro
  let availableShapes = [...SHAPES]

  if (fillRatio > 0.7) {
    // Tabuleiro cheio: prioriza peças pequenas
    availableShapes = SHAPES.filter((shape) => shape.length <= 2 && shape[0].length <= 2)
  } else if (fillRatio > 0.4) {
    // Meio cheio: mix de peças médias e pequenas
    availableShapes = SHAPES.filter((shape) => shape.length <= 3 && shape[0].length <= 3)
  }

  // Garante pelo menos uma peça que cabe
  const pieces: Piece[] = []
  let attempts = 0

  while (pieces.length < 3 && attempts < 50) {
    const randomShape = availableShapes[Math.floor(Math.random() * availableShapes.length)]

    // Verifica se a peça cabe em algum lugar
    let fits = false
    for (let r = 0; r < size && !fits; r++) {
      for (let c = 0; c < size && !fits; c++) {
        if (canPlacePiece(randomShape, board, r, c, size)) {
          fits = true
        }
      }
    }

    if (fits || pieces.length === 0) {
      pieces.push(randomShape)
    }
    attempts++
  }

  // Se não conseguiu 3 peças, completa com peças pequenas
  while (pieces.length < 3) {
    pieces.push([[1]])
  }

  return pieces
}

function canPlacePiece(piece: Piece, board: number[][], r: number, c: number, size: number): boolean {
  for (let i = 0; i < piece.length; i++) {
    for (let j = 0; j < piece[i].length; j++) {
      if (piece[i][j] === 1) {
        const rr = r + i
        const cc = c + j
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) return false
        if (board[rr][cc] !== 0) return false
      }
    }
  }
  return true
}

function cloneBoard(b: number[][]) {
  return b.map((row) => row.slice())
}

export default function SpaceStackScreen({ onBack }: SpaceStackScreenProps) {
  const { colors: THEME } = useTheme()
  const styles = useMemo(() => StyleSheet.create(makeStyles(THEME)), [THEME])

  const rootRef = useRef<View | null>(null)
  const [rootPos, setRootPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const size = 8 // 8x8
  const [board, setBoard] = useState<number[][]>(() => Array.from({ length: size }, () => Array(size).fill(0)))

  const [pieces, setPieces] = useState<Piece[]>(() => smartPieceGeneration(board, size))

  const randomColorIndexes = (n: number) =>
    Array.from({ length: n }, () => 1 + Math.floor(Math.random() * PALETTE.length))
  const [pieceColors, setPieceColors] = useState<number[]>(() => randomColorIndexes(3))
  const [used, setUsed] = useState<boolean[]>(() => Array(3).fill(false))
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const [combo, setCombo] = useState(0)
  const [floatingScores, setFloatingScores] = useState<
    Array<{ id: number; score: number; x: number; y: number; anim: Animated.Value }>
  >([])

  const animHeader = useRef(new Animated.Value(0)).current
  const BOARD_PAD = 12 // padding interno do boardCard
  const cellSize = Math.floor((SCREEN_W - 40 - BOARD_PAD * 2) / size) // largura útil: tela - padding root(20*2) - pad board(12*2)
  const gridWidth = cellSize * size

  // Layout local do tabuleiro (relativo ao root) via onLayout
  const [boardLocal, setBoardLocal] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const handleBoardLayout = (e: any) => {
    const { x, y } = e?.nativeEvent?.layout || { x: 0, y: 0 }
    setBoardLocal({ x, y })
  }

  // Drag and drop states
  const [dragging, setDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  // Posição do ghost usando Animated para evitar re-render a cada movimento
  const dragPos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const ghostLeft = useRef(new Animated.Value(0)).current
  const ghostTop = useRef(new Animated.Value(0)).current
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const didDrag = useRef(false)
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null)
  const lastHoverRef = useRef<{ r: number; c: number } | null>(null)
  // efeitos de limpeza
  const [clearingCells, setClearingCells] = useState<Array<{ r: number; c: number }>>([])
  const explodeAnim = useRef(new Animated.Value(0)).current
  const [clearingRows, setClearingRows] = useState<number[]>([])
  const [clearingCols, setClearingCols] = useState<number[]>([])

  useEffect(() => {
    Animated.timing(animHeader, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [animHeader])

  const canPlace = useCallback(
    (p: Piece, r: number, c: number) => {
      return canPlacePiece(p, board, r, c, size)
    },
    [board, size],
  )

  const addFloatingScore = useCallback((points: number, x: number, y: number) => {
    const id = Date.now() + Math.random()
    const anim = new Animated.Value(0)
    setFloatingScores((prev) => [...prev, { id, score: points, x, y, anim }])
    Animated.timing(anim, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setFloatingScores((prev) => prev.filter((fs) => fs.id !== id))
    })
  }, [])

  const tryPlace = (r: number, c: number) => {
    if (selected == null) return
    const p = pieces[selected]
    if (!p) return
    if (!canPlace(p, r, c)) return

    const next = cloneBoard(board)
    let add = 0
    const colorIndex = pieceColors[selected] || 1

    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < p[i].length; j++) {
        if (p[i][j] === 1) {
          next[r + i][c + j] = colorIndex
          add += 1 // ponto por bloco colocado
        }
      }
    }

    // Detecta linhas/colunas completas
    const fullRows: number[] = []
    const fullCols: number[] = []
    for (let i = 0; i < size; i++) {
      if (next[i].every((v) => v !== 0)) fullRows.push(i)
      let colFull = true
      for (let j = 0; j < size; j++)
        if (next[j][i] === 0) {
          colFull = false
          break
        }
      if (colFull) fullCols.push(i)
    }

    // calcula posições a limpar (sem zerar já)
    const toClearSet = new Set<string>()
    fullRows.forEach((ri) => {
      for (let j = 0; j < size; j++) toClearSet.add(`${ri}-${j}`)
    })
    fullCols.forEach((ci) => {
      for (let i = 0; i < size; i++) toClearSet.add(`${i}-${ci}`)
    })
    const toClear: Array<{ r: number; c: number }> = Array.from(toClearSet).map((k) => {
      const [rr, cc] = k.split("-").map((n) => Number.parseInt(n, 10))
      return { r: rr, c: cc }
    })

    const linesCleared = fullRows.length + fullCols.length
    let clearBonus = linesCleared * 10
    let comboBonus = 0

    if (linesCleared > 0) {
      setCombo((prev) => prev + 1)
      comboBonus = combo * 5 // Bonus crescente por combo
      clearBonus += comboBonus

      // Pontuação flutuante
      const centerX = (c + p[0].length / 2) * cellSize
      const centerY = (r + p.length / 2) * cellSize
      addFloatingScore(clearBonus, centerX, centerY)
    } else {
      // Vibração curta ao colocar sem limpar
      try {
        Vibration.vibrate(20)
      } catch {}
      setCombo(0)
    }

    setBoard(next)
    setScore((s) => s + add + clearBonus)
    setUsed((u) => {
      const nu = u.slice()
      nu[selected] = true
      return nu
    })
    setSelected(null)

    // animação de explosão
    if (toClear.length > 0) {
      setClearingCells(toClear)
      setClearingRows(fullRows)
      setClearingCols(fullCols)

      // feedback tátil curto (pop)
      try {
        Vibration.vibrate([50, 100, 50])
      } catch {}

      explodeAnim.setValue(0)
      Animated.timing(explodeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        const cleared = cloneBoard(next)
        toClear.forEach(({ r: rr, c: cc }) => {
          cleared[rr][cc] = 0
        })
        setBoard(cleared)
        setClearingCells([])
        setClearingRows([])
        setClearingCols([])
      })
    }
  }

  // Atualiza recorde em memória
  useEffect(() => {
    if (score > best) setBest(score)
  }, [score, best])

  // Persistir recorde com AsyncStorage
  useEffect(() => {
    ;(async () => {
      try {
        const v = await AsyncStorage.getItem("spaceStackBest")
        if (v != null) {
          const n = Number.parseInt(v, 10)
          if (!Number.isNaN(n)) setBest(n)
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        await AsyncStorage.setItem("spaceStackBest", String(best))
      } catch {}
    })()
  }, [best])

  // helpers para drag
  const pageToCell = useCallback(
    (px: number, py: number) => {
      // canto superior esquerdo da grade em coordenadas da janela
      const boardAbsX = rootPos.x + boardLocal.x
      const boardAbsY = rootPos.y + boardLocal.y
      const gx = boardAbsX + BOARD_PAD
      const gy = boardAbsY + BOARD_PAD
      const c = Math.floor((px - gx) / cellSize)
      const r = Math.floor((py - gy) / cellSize)
      if (r < 0 || c < 0 || r >= size || c >= size) return null
      return { r, c }
    },
    [boardLocal.x, boardLocal.y, rootPos.x, rootPos.y, cellSize, size],
  )

  const endDrag = useCallback(
    (px: number, py: number) => {
      const idx = dragIndex
      setDragging(false)
      setDragIndex(null)
      setHoverCell(null)
      if (idx == null) return

      // Se realmente arrastou, tenta posicionar
      if (didDrag.current) {
        // ancora pelo canto superior esquerdo da peça, baseado no dedo
        const p = pieces[idx]
        const w = (p?.[0]?.length || 1) * cellSize
        const h = (p?.length || 1) * cellSize
        const cell = pageToCell(px - Math.floor(w / 2), py - Math.floor(h / 2))
        if (cell && !used[idx]) {
          setSelected(idx)
          tryPlace(cell.r, cell.c)
        }
        didDrag.current = false
        return
      }
      // Toque rápido: alterna seleção
      if (!used[idx]) {
        setSelected((s) => (s === idx ? null : idx))
      }
    },
    [dragIndex, pageToCell, used, pieces, cellSize],
  )

  useEffect(() => {
    if (used.every(Boolean)) {
      setPieces(smartPieceGeneration(board, size))
      setPieceColors(randomColorIndexes(3))
      setUsed([false, false, false])
    }
  }, [used, board, size])

  // checar game over (nenhuma peça cabe)
  useEffect(() => {
    const anyFits = pieces.some((p, idx) => {
      if (used[idx]) return false
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (canPlace(p, r, c)) return true
        }
      }
      return false
    })
    setGameOver(!anyFits)
  }, [pieces, used, board, canPlace, size])

  const reset = () => {
    const newBoard = Array.from({ length: size }, () => Array(size).fill(0))
    setBoard(newBoard)
    setPieces(smartPieceGeneration(newBoard, size))
    setPieceColors(randomColorIndexes(3))
    setUsed([false, false, false])
    setSelected(null)
    setScore(0)
    setCombo(0)
    setFloatingScores([])
    setGameOver(false)
  }

  const renderPiece = (p: Piece, active: boolean, colorIndex?: number) => (
    <View style={[styles.pieceBox, active && styles.pieceActive]}>
      {p.map((row, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 6 }}>
          {row.map((v, j) =>
            v ? (
              <View key={j} style={{ width: 16, height: 16 }}>
                <View style={[styles.tileOuter, { width: 16, height: 16, borderRadius: 4 }]}>
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 4,
                      backgroundColor: getColorByIndex(colorIndex || 1),
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: 3,
                        backgroundColor: TILE_HL,
                        opacity: 0.7,
                      }}
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View key={j} style={{ width: 16, height: 16 }} />
            ),
          )}
        </View>
      ))}
    </View>
  )

  return (
    <View
      ref={rootRef}
      onLayout={() => {
        requestAnimationFrame(() => {
          rootRef.current?.measureInWindow((x, y) => setRootPos({ x, y }))
        })
      }}
      style={styles.root}
    >
      {/* Starfield de fundo */}
      <View style={styles.starfieldWrap}>
        <Starfield colorA={THEME.white} colorB={THEME.lilac} />
      </View>

      {/* HUD */}
      <Animated.View
        style={{
          opacity: animHeader,
          transform: [{ translateY: animHeader.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }}
      >
        <BlurView intensity={80} tint="dark" style={styles.hud}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={styles.hudTitle}>
              Recorde: <Text style={{ color: THEME.white }}>{best}</Text>
            </Text>
            {combo > 0 && <Text style={styles.comboText}>Combo x{combo}</Text>}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <Pressable onPress={reset} style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.9 }]}>
              <Text style={styles.hudBtnText}>Resetar</Text>
            </Pressable>
            {onBack ? (
              <Pressable onPress={onBack} style={({ pressed }) => [styles.hudBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.hudBtnText}>Voltar</Text>
              </Pressable>
            ) : null}
          </View>
        </BlurView>
      </Animated.View>

      {/* Score central grande */}
      <Text style={styles.bigScore}>{score}</Text>

      {/* Tabuleiro */}
      <BlurView onLayout={handleBoardLayout} intensity={80} tint="dark" style={styles.boardCard}>
        <View style={{ padding: BOARD_PAD }}>
          {/* Grade (células encostadas com bordas internas) */}
          {board.map((row, r) => (
            <View key={r} style={styles.boardRow}>
              {row.map((cell, c) => (
                <Pressable
                  key={c}
                  onPress={() => {
                    if (selected != null) tryPlace(r, c)
                  }}
                  style={({ pressed }) => [
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: hexToRgba(THEME.white, 0.03),
                      borderRadius: 2,
                      borderRightWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(THEME.white, 0.07),
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  {cell ? (
                    <View style={{ width: cellSize - 2, height: cellSize - 2 }}>
                      <View style={[styles.tileOuter, { width: cellSize - 2, height: cellSize - 2, borderRadius: 6 }]}>
                        <View style={[styles.tile, { backgroundColor: getColorByIndex(cell), flex: 1 }]}>
                          <View style={styles.tileHighlight} />
                        </View>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}

          {/* Overlay de preview durante o drag */}
          {dragging &&
            dragIndex != null &&
            hoverCell &&
            (() => {
              const p = pieces[dragIndex]
              if (!p) return null
              const pColor = getColorByIndex(pieceColors[dragIndex] || 1)
              const fits = canPlace(p, hoverCell.r, hoverCell.c)
              return (
                <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0 }}>
                  {p.map((row, i) => (
                    <View
                      key={i}
                      style={{ position: "absolute", left: hoverCell.c * cellSize, top: (hoverCell.r + i) * cellSize }}
                    >
                      {row.map((v, j) =>
                        v ? (
                          <View
                            key={j}
                            style={{
                              position: "absolute",
                              left: j * cellSize,
                              top: 0,
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: fits ? hexToRgba(pColor, 0.35) : "rgba(221,64,64,0.35)",
                              borderRadius: 2,
                              borderRightWidth: 1,
                              borderBottomWidth: 1,
                              borderColor: hexToRgba(THEME.white, 0.07),
                            }}
                          />
                        ) : null,
                      )}
                    </View>
                  ))}
                </View>
              )
            })()}

          {/* Explosões ao limpar: faíscas, anel e brilho varrendo linhas/colunas */}
          {(clearingCells.length > 0 || clearingRows.length > 0 || clearingCols.length > 0) && (
            <View
              pointerEvents="none"
              style={{ position: "absolute", left: 0, top: 0, width: gridWidth, height: gridWidth }}
            >
              {/* brilho varrendo linhas */}
              {clearingRows.map((row) => (
                <Animated.View
                  key={`row-sweep-${row}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: row * cellSize + cellSize / 2 - 6,
                    width: gridWidth,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    opacity: explodeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      {
                        translateX: explodeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-gridWidth * 0.25, gridWidth * 0.25],
                        }),
                      },
                    ],
                  }}
                />
              ))}
              {/* brilho varrendo colunas */}
              {clearingCols.map((col) => (
                <Animated.View
                  key={`col-sweep-${col}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: col * cellSize + cellSize / 2 - 6,
                    width: 12,
                    height: gridWidth,
                    borderRadius: 6,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    opacity: explodeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      {
                        translateY: explodeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-gridWidth * 0.25, gridWidth * 0.25],
                        }),
                      },
                    ],
                  }}
                />
              ))}

              {/* elementos por célula: flash, anel e faíscas */}
              {clearingCells.map(({ r, c }, idx) => (
                <View
                  key={`${r}-${c}-${idx}`}
                  style={{
                    position: "absolute",
                    left: c * cellSize,
                    top: r * cellSize,
                    width: cellSize,
                    height: cellSize,
                  }}
                >
                  {/* Flash central */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      left: cellSize / 2 - 14,
                      top: cellSize / 2 - 14,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(255,255,255,0.85)",
                      shadowColor: "rgba(123,111,234,0.8)",
                      shadowOpacity: 0.9,
                      shadowRadius: 10,
                      transform: [{ scale: explodeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] }) }],
                      opacity: explodeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] }),
                    }}
                  />
                  {/* Anel expandindo */}
                  <Animated.View
                    style={{
                      position: "absolute",
                      left: cellSize / 2 - 16,
                      top: cellSize / 2 - 16,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: "rgba(168,164,255,0.9)",
                      backgroundColor: "transparent",
                      transform: [{ scale: explodeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }],
                      opacity: explodeAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 0.7, 0] }),
                    }}
                  />
                  {/* Faíscas radiais */}
                  {Array.from({ length: 6 }).map((_, k) => {
                    const angle = (Math.PI * 2 * k) / 6
                    const dx = Math.cos(angle)
                    const dy = Math.sin(angle)
                    return (
                      <Animated.View
                        key={`sp-${k}`}
                        style={{
                          position: "absolute",
                          left: cellSize / 2 - 2,
                          top: cellSize / 2 - 2,
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "rgba(237,231,255,0.95)",
                          shadowColor: "rgba(123,111,234,0.9)",
                          shadowOpacity: 0.9,
                          shadowRadius: 4,
                          transform: [
                            {
                              translateX: explodeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, dx * (cellSize * 0.7)],
                              }),
                            },
                            {
                              translateY: explodeAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, dy * (cellSize * 0.7)],
                              }),
                            },
                            { scale: explodeAnim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1, 0.6] }) },
                          ],
                          opacity: explodeAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
                        }}
                      />
                    )
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      </BlurView>

      {floatingScores.map((fs) => (
        <Animated.View
          key={fs.id}
          style={{
            position: "absolute",
            left: fs.x,
            top: fs.y,
            transform: [{ translateY: fs.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }],
            opacity: fs.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }}
          pointerEvents="none"
        >
          <Text style={styles.floatingScore}>+{fs.score}</Text>
        </Animated.View>
      ))}

      {/* Peças disponíveis */}
      <BlurView intensity={80} tint="dark" style={styles.piecesBar}>
        {pieces.map((p, i) => (
          <View
            key={i}
            style={styles.pieceWrap}
            onStartShouldSetResponder={() => !used[i]}
            onResponderGrant={(e) => {
              const { pageX, pageY } = e.nativeEvent
              dragStart.current = { x: pageX, y: pageY }
              didDrag.current = false
              setDragging(true)
              setDragIndex(i)
              setSelected(i)
              // posiciona ghost inicialmente
              const w = (p?.[0]?.length || 1) * cellSize
              const h = (p?.length || 1) * cellSize
              const initLeft = pageX - rootPos.x - Math.floor(w / 2)
              const initTop = pageY - rootPos.y - Math.floor(h / 2)
              ghostLeft.setValue(initLeft)
              ghostTop.setValue(initTop)
              // define célula inicial (se aplicável)
              const anchorX = pageX - Math.floor(w / 2)
              const anchorY = pageY - Math.floor(h / 2)
              const cell = pageToCell(anchorX, anchorY)
              if (cell && (!lastHoverRef.current || cell.r !== lastHoverRef.current.r || cell.c !== lastHoverRef.current.c)) {
                lastHoverRef.current = cell
                setHoverCell(cell)
              }
            }}
            onResponderMove={(e) => {
              const { pageX, pageY } = e.nativeEvent
              if (dragStart.current) {
                const dx = Math.abs(pageX - dragStart.current.x)
                const dy = Math.abs(pageY - dragStart.current.y)
                if (dx > 6 || dy > 6) didDrag.current = true
              }
              // tenta alinhar o preview pelo centro do dedo ao canto superior esquerdo da peça
              const w = (p?.[0]?.length || 1) * cellSize
              const h = (p?.length || 1) * cellSize
              const anchorX = pageX - Math.floor(w / 2)
              const anchorY = pageY - Math.floor(h / 2)
              // posição absoluta do tabuleiro
              const boardAbsX = rootPos.x + boardLocal.x + BOARD_PAD
              const boardAbsY = rootPos.y + boardLocal.y + BOARD_PAD
              const withinX = pageX >= boardAbsX && pageX <= boardAbsX + gridWidth
              const withinY = pageY >= boardAbsY && pageY <= boardAbsY + gridWidth
              let left = pageX - rootPos.x - Math.floor(w / 2)
              let top = pageY - rootPos.y - Math.floor(h / 2)
              if (withinX && withinY) {
                const c = Math.max(0, Math.min(size - 1, Math.floor((anchorX - boardAbsX) / cellSize)))
                const r = Math.max(0, Math.min(size - 1, Math.floor((anchorY - boardAbsY) / cellSize)))
                left = boardAbsX - rootPos.x + c * cellSize
                top = boardAbsY - rootPos.y + r * cellSize
              }
              ghostLeft.setValue(left)
              ghostTop.setValue(top)
              const cell = pageToCell(anchorX, anchorY)
              if (
                (cell && (!lastHoverRef.current || cell.r !== lastHoverRef.current.r || cell.c !== lastHoverRef.current.c)) ||
                (!cell && lastHoverRef.current)
              ) {
                lastHoverRef.current = cell
                setHoverCell(cell)
              }
            }}
            onResponderRelease={(e) => {
              const { pageX, pageY } = e.nativeEvent
              endDrag(pageX, pageY)
            }}
          >
            {used[i] ? (
              <View style={styles.pieceUsed}>
                <Text style={styles.pieceUsedText}>Usado</Text>
              </View>
            ) : (
              renderPiece(p, selected === i)
            )}
          </View>
        ))}
      </BlurView>

      {/* Ghost do drag (segue o dedo) */}
      {dragging && dragIndex != null && pieces[dragIndex] && (
        <Animated.View
          pointerEvents="none"
          style={{ position: "absolute", transform: [{ translateX: ghostLeft }, { translateY: ghostTop }], opacity: 0.92 }}
        >
          {pieces[dragIndex]!.map((row, i) => (
            <View key={i} style={{ flexDirection: "row" }}>
              {row.map((v, j) =>
                v ? (
                  <View
                    key={j}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: hexToRgba(getColorByIndex(pieceColors[dragIndex] || 1), 0.85),
                      borderRightWidth: 1,
                      borderBottomWidth: 1,
                      borderColor: hexToRgba(THEME.white, 0.07),
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <View key={j} style={{ width: cellSize, height: cellSize }} />
                ),
              )}
            </View>
          ))}
        </Animated.View>
      )}

      {/* Game Over Modal melhorado */}
      <Modal transparent visible={gameOver} animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚀 Fim de Jogo</Text>
            <Text style={styles.modalDesc}>
              Sem movimentos possíveis.{"\n"}
              Score: {score} | Recorde: {best}
              {combo > 0 && `\nMelhor combo: x${combo}`}
            </Text>
            <View style={styles.modalRow}>
              <Pressable onPress={reset} style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                <Text style={styles.modalBtnText}>🔄 Tentar de novo</Text>
              </Pressable>
              {onBack ? (
                <Pressable onPress={onBack} style={({ pressed }) => [styles.modalBtn, pressed && { opacity: 0.9 }]}>
                  <Text style={styles.modalBtnText}>🏠 Sair</Text>
                </Pressable>
              ) : null}
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  )
}

function makeStyles(THEME: any) {
  return {
    comboText: {
      color: "#FFD166",
      fontWeight: "800",
      fontSize: 14,
      textShadowColor: "rgba(255, 209, 102, 0.5)",
      textShadowRadius: 8,
      textShadowOffset: { width: 0, height: 1 },
    },

    floatingScore: {
      color: "#4CC9F0",
      fontWeight: "800",
      fontSize: 18,
      textShadowColor: "rgba(76, 201, 240, 0.8)",
      textShadowRadius: 10,
      textShadowOffset: { width: 0, height: 2 },
    },

    root: {
      flex: 1,
      backgroundColor: THEME.bg,
      padding: 20,
      gap: 16,
      paddingTop: 60,
      paddingBottom: 140,
    },
    starfieldWrap: {
      ...StyleSheet.absoluteFillObject as any,
      zIndex: 0,
    },
    bigScore: {
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 8,
      color: THEME.white,
      fontWeight: "800",
      fontSize: 54,
      letterSpacing: 1.5,
      textShadowColor: "rgba(123,111,234,0.45)",
      textShadowRadius: 16,
      textShadowOffset: { width: 0, height: 2 },
    },
    hud: {
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    hudTitle: { color: THEME.white, fontWeight: "800", fontSize: 18 },
    hudScore: { color: THEME.white, fontWeight: "800" },
    hudBtn: {
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    hudBtnText: { color: THEME.white, fontWeight: "700" },

    boardCard: {
      borderRadius: 16,
      padding: 0,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      alignItems: "center",
    },
    boardRow: {
      flexDirection: "row",
    },
    cell: {},
    // wrapper para sombra correta (fora do conteúdo, não clipa)
    tileOuter: {
      borderRadius: 6,
      backgroundColor: "transparent",
      shadowColor: "rgba(0,0,0,0.35)",
      shadowOpacity: 0.6,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 3,
      elevation: 4,
    },
    // conteúdo do bloco (clip do highlight)
    tile: {
      backgroundColor: TILE,
      borderRadius: 6,
      overflow: "hidden",
    },
    tileHighlight: {
      position: "absolute",
      left: 0,
      top: 0,
      right: 0,
      height: 10,
      backgroundColor: TILE_HL,
      opacity: 0.7,
    },

    piecesBar: {
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      alignItems: "center",
    },
    pieceWrap: {
      padding: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
    pieceBox: {
      padding: 6,
      backgroundColor: "rgba(255,255,255,0.04)",
      borderRadius: 10,
    },
    pieceActive: {
      backgroundColor: "rgba(123,111,234,0.12)",
      borderWidth: 1,
      borderColor: "rgba(123,111,234,0.25)",
    },
    pieceUsed: {
      width: 74,
      height: 40,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.04)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
    },
    pieceUsedText: { color: "rgba(241,250,238,0.6)", fontSize: 12, fontWeight: "700" },

    modalOverlay: {
      ...StyleSheet.absoluteFillObject as any,
      backgroundColor: "rgba(0,0,0,0.4)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      gap: 10,
    },
    modalTitle: { color: THEME.white, fontWeight: "800", fontSize: 18 },
    modalDesc: { color: "rgba(241,250,238,0.85)", fontSize: 13 },
    modalRow: { flexDirection: "row", gap: 10, marginTop: 8 },
    modalBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    modalBtnText: { color: THEME.white, fontWeight: "700" },
  } as const
}
