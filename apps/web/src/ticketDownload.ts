import type { Ticket } from './types'

function hash(value: string) {
  let result = 2166136261
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619)
  return result >>> 0
}

function drawPseudoQr(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number) {
  const cells = 21
  const cell = size / cells
  let seed = hash(value)
  context.fillStyle = '#fff'
  context.fillRect(x, y, size, size)
  context.fillStyle = '#1A1A1A'
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      if ((seed & 3) !== 0) context.fillRect(x + column * cell, y + row * cell, Math.ceil(cell), Math.ceil(cell))
    }
  }
  for (const [offsetX, offsetY] of [[0, 0], [14, 0], [0, 14]]) {
    context.fillStyle = '#fff'
    context.fillRect(x + offsetX * cell, y + offsetY * cell, cell * 7, cell * 7)
    context.fillStyle = '#1A1A1A'
    context.fillRect(x + offsetX * cell, y + offsetY * cell, cell * 7, cell * 7)
    context.fillStyle = '#fff'
    context.fillRect(x + (offsetX + 1) * cell, y + (offsetY + 1) * cell, cell * 5, cell * 5)
    context.fillStyle = '#1A1A1A'
    context.fillRect(x + (offsetX + 2) * cell, y + (offsetY + 2) * cell, cell * 3, cell * 3)
  }
}

export function downloadTicketPng(ticket: Ticket) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 680
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no puede generar la imagen del ticket.')

  context.fillStyle = '#F5F3EE'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#1B2A4A'
  context.fillRect(0, 0, canvas.width, 120)
  context.fillStyle = '#F5F3EE'
  context.font = '700 44px Georgia, serif'
  context.fillText('EventHub', 64, 76)
  context.fillStyle = '#E86A2C'
  context.font = '600 18px monospace'
  context.fillText('ENTRADA DIGITAL', 300, 72)

  context.fillStyle = '#1B2A4A'
  context.font = '700 42px Georgia, serif'
  context.fillText(ticket.eventTitle.slice(0, 45), 64, 200)
  context.fillStyle = '#1A1A1A'
  context.font = '500 24px Arial, sans-serif'
  const details = [
    new Date(ticket.eventDate).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' }),
    `${ticket.venueName} · ${ticket.address}`,
    `${ticket.ticketTypeName}${ticket.seatLabel ? ` · ${ticket.seatLabel}` : ''}`,
    `Titular: ${ticket.holderName}`,
  ]
  details.forEach((line, index) => context.fillText(line.slice(0, 78), 64, 270 + index * 52))

  drawPseudoQr(context, ticket.qrCode, 870, 205, 240)
  context.fillStyle = '#1B2A4A'
  context.font = '600 18px monospace'
  context.textAlign = 'center'
  context.fillText(ticket.id, 990, 480)
  context.textAlign = 'left'
  context.strokeStyle = '#D8D5CE'
  context.beginPath()
  context.moveTo(64, 535)
  context.lineTo(1136, 535)
  context.stroke()
  context.fillStyle = '#6B6B6B'
  context.font = '18px Arial, sans-serif'
  context.fillText('Presenta este código en el acceso. No contiene datos de pago.', 64, 590)

  const link = document.createElement('a')
  link.download = `EventHub-${ticket.id}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}
