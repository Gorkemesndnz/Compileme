import React, { useEffect, useRef } from 'react'

export const LivingVineBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    interface VineBranch {
      x: number
      y: number
      vx: number
      vy: number
      angle: number
      life: number
      maxLife: number
      width: number
      color: string
    }

    const branches: VineBranch[] = []
    const maxBranches = 15

    const mouse = { x: width / 2, y: height / 2, moved: false }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.moved = true

      if (Math.random() < 0.12 && branches.length < maxBranches) {
        spawnBranch(mouse.x, mouse.y)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const spawnBranch = (startX: number, startY: number) => {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 1.2 + 0.4
      branches.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        life: 0,
        maxLife: Math.random() * 150 + 80,
        width: Math.random() * 1.8 + 0.6,
        color: `hsla(${175 + Math.random() * 25}, 100%, 40%, ${Math.random() * 0.2 + 0.08})`
      })
    }

    for (let i = 0; i < 4; i++) {
      spawnBranch(Math.random() * width, height)
    }

    const draw = () => {
      if (!ctx || !canvas) return

      ctx.fillStyle = 'rgba(11, 15, 25, 0.035)'
      ctx.fillRect(0, 0, width, height)

      for (let i = branches.length - 1; i >= 0; i--) {
        const b = branches[i]
        
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)

        b.angle += (Math.random() - 0.5) * 0.35
        
        if (mouse.moved) {
          const dx = mouse.x - b.x
          const dy = mouse.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 250) {
            const targetAngle = Math.atan2(dy, dx)
            b.angle += (targetAngle - b.angle) * 0.04
          }
        }

        b.vx = Math.cos(b.angle) * 1.1
        b.vy = Math.sin(b.angle) * 1.1

        b.x += b.vx
        b.y += b.vy
        b.life++

        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = b.color
        ctx.lineWidth = b.width
        ctx.stroke()

        if (Math.random() < 0.04 && b.life < b.maxLife - 15) {
          ctx.beginPath()
          const leafSize = Math.random() * 3 + 1.5
          const leafAngle = b.angle + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2)
          const leafX = b.x + Math.cos(leafAngle) * 4
          const leafY = b.y + Math.sin(leafAngle) * 4
          ctx.ellipse(leafX, leafY, leafSize, leafSize / 2, leafAngle, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(180, 100%, 35%, 0.08)`
          ctx.fill()
        }

        if (Math.random() < 0.008 && branches.length < maxBranches && b.life < b.maxLife / 2) {
          spawnBranch(b.x, b.y)
        }

        if (b.life >= b.maxLife) {
          branches.splice(i, 1)
          if (Math.random() < 0.5) {
            spawnBranch(Math.random() * width, height)
          } else {
            spawnBranch(mouse.x, mouse.y)
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-20 pointer-events-none w-full h-full block bg-[#0b0f19]"
    />
  )
}
export default LivingVineBackground
