"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Track } from '@/lib/audioEngine'
import { getAngleFromCenter, getNearestTrackIndex, createRadialPosition } from '@/lib/audioEngine'

interface RadialMusicWheelProps {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  onSelectTrack: (track: Track) => void
  onClose: () => void
}

export function RadialMusicWheel({
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onClose,
}: RadialMusicWheelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [wheelSize, setWheelSize] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef({ x: 0, y: 0 })

  // Calculate wheel radius only on client side to avoid SSR issues
  const wheelRadius = useRef(0)
  useEffect(() => {
    wheelRadius.current = Math.min(
      wheelSize * 0.42,
      typeof window !== 'undefined' ? window.innerWidth * 0.35 : 0,
      typeof window !== 'undefined' ? window.innerHeight * 0.35 : 0
    )
  }, [wheelSize])

  const center = centerRef.current

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    setSelectedIndex(null)
    setHoveredIndex(null)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setHoveredIndex(null)
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose()
      }
    },
    [handleClose]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - wheelSize / 2
      const y = e.clientY - rect.top - wheelSize / 2

      const angle = getAngleFromCenter({ x: e.clientX, y: e.clientY }, center)
      const index = getNearestTrackIndex(angle, tracks.length)

      if (index !== hoveredIndex) {
        setHoveredIndex(index)
        setSelectedIndex(index)
      }
    },
    [isOpen, tracks.length, hoveredIndex, center]
  )

  const handleMouseLeave = useCallback(() => {
    if (isOpen) {
      setHoveredIndex(null)
    }
  }, [isOpen])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isOpen) return

      const angle = getAngleFromCenter({ x: e.clientX, y: e.clientY }, center)
      const distance = Math.sqrt(
        Math.pow(e.clientX - center.x, 2) + Math.pow(e.clientY - center.y, 2)
      )

      // Only trigger if click is within the wheel items area
      if (distance > wheelRadius.current * 0.4 && distance < wheelRadius.current * 1.1) {
        const index = getNearestTrackIndex(angle, tracks.length)
        const track = tracks[index]
        onSelectTrack(track)
        handleClose()
      }
    },
    [isOpen, tracks, wheelRadius, center, onSelectTrack, handleClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    },
    [isOpen, handleClose]
  )

  // Set up center position and wheel size
  useEffect(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
    setWheelSize(Math.min(rect.width, rect.height))
  }, [isOpen])

  // Update wheel size on resize
  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setWheelSize(Math.min(rect.width, rect.height))
        centerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  // Keyboard handler on document when open
  useEffect(() => {
    if (!isOpen) return

    const handleDocKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleDocKeyDown)
    return () => document.removeEventListener('keydown', handleDocKeyDown)
  }, [isOpen, handleClose])

  const selectedTrack = selectedIndex !== null ? tracks[selectedIndex] : currentTrack

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="music-btn fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(87, 230, 255, 0.9), rgba(87, 230, 255, 0.6))',
          boxShadow: '0 8px 32px rgba(87, 230, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(87, 230, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(87, 230, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
        aria-label="Open music wheel"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: '#fff', filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4))' }}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    )
  }

  return (
    <div
      ref={containerRef}
      className="music-wheel-overlay fixed inset-0 z-50"
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Music selection wheel"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.85))',
        animation: 'wheelOpen 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes wheelOpen {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        @keyframes wheelExpand {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(87, 230, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(87, 230, 255, 0.6);
          }
        }
      `}</style>

      {/* Wheel container */}
      <div
        className="music-wheel-container absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: wheelSize,
          height: wheelSize,
          animation: 'wheelExpand 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative',
        }}
      >
        {/* Outer decorative ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: wheelSize,
            height: wheelSize,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 0 60px rgba(0, 0, 0, 0.8), inset 0 0 60px rgba(0, 0, 0, 0.4)',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />

        {/* Wheel segments */}
        {tracks.map((track, index) => {
          const pos = createRadialPosition(index, tracks.length, wheelRadius.current, {
            x: wheelSize / 2,
            y: wheelSize / 2,
          })
          const isSelected = hoveredIndex === index || selectedIndex === index
          const angle = (index / tracks.length) * Math.PI * 2 - Math.PI / 2
          const nextAngle = ((index + 1) / tracks.length) * Math.PI * 2 - Math.PI / 2

          return (
            <div
              key={track.id}
              className="wheel-segment absolute"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                top: '0',
                left: '0',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onClick={() => {
                onSelectTrack(track)
                handleClose()
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${wheelSize} ${wheelSize}`}
                style={{ overflow: 'visible' }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id={`grad-${track.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={track.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={track.color} stopOpacity={0.5} />
                  </linearGradient>
                  <filter id={`glow-${track.id}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Segment wedge */}
                <path
                  d={`M ${wheelSize / 2} ${wheelSize / 2} L ${
                    wheelSize / 2 + Math.cos(angle) * wheelRadius.current
                  } ${
                    wheelSize / 2 + Math.sin(angle) * wheelRadius.current
                  } A ${wheelRadius.current} ${wheelRadius.current} 0 0 1 ${
                    wheelSize / 2 + Math.cos(nextAngle) * wheelRadius.current
                  } ${
                    wheelSize / 2 + Math.sin(nextAngle) * wheelRadius.current
                  } Z`}
                  fill={`url(#grad-${track.id})`}
                  opacity={isSelected ? 0.9 : 0.4}
                  style={{
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: `${wheelSize / 2}px ${wheelSize / 2}px`,
                    transition: 'opacity 0.2s ease, transform 0.2s ease',
                  }}
                  filter={isSelected ? `url(#glow-${track.id})` : 'none'}
                />

                {/* Track item marker */}
                <g
                  transform={`translate(${pos.x}, ${pos.y})`}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {/* Album artwork placeholder - circular */}
                  <circle
                    r={wheelSize * 0.06}
                    fill={track.color}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth={isSelected ? 2 : 1}
                    style={{
                      filter: isSelected
                        ? 'drop-shadow(0 0 12px rgba(87, 230, 255, 0.6))'
                        : 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.3))',
                      transition: 'all 0.2s ease',
                    }}
                  />

                  {/* Inner artwork detail */}
                  <circle
                    r={wheelSize * 0.04}
                    fill="rgba(255, 255, 255, 0.2)"
                    style={{ transition: 'all 0.2s ease' }}
                  />

                  {/* Selection indicator ring */}
                  {isSelected && (
                    <circle
                      r={wheelSize * 0.07}
                      fill="none"
                      stroke="#57e6ff"
                      strokeWidth={1.5}
                      opacity={0.8}
                      style={{
                        animation: 'pulseGlow 2s ease-in-out infinite',
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center',
                      }}
                    />
                  )}
                </g>
              </svg>
            </div>
          )
        })}

        {/* Center display */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: wheelSize * 0.28,
            height: wheelSize * 0.28,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, rgba(87, 230, 255, 0.3), rgba(0, 0, 0, 0.8))',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 0 40px rgba(87, 230, 255, 0.2), inset 0 0 40px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${wheelSize * 0.02}px`,
            animation: 'fadeIn 0.4s ease forwards',
            animationDelay: '0.1s',
            opacity: 0,
          }}
        >
          {/* Album artwork in center */}
          <div
            className="album-artwork absolute rounded-full"
            style={{
              width: '80%',
              aspectRatio: '1',
              background: selectedTrack
                ? `linear-gradient(135deg, ${selectedTrack.color}, ${selectedTrack.color}88)`
                : 'linear-gradient(135deg, #333, #111)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Album art placeholder text */}
            <span
              style={{
                fontSize: `${wheelSize * 0.06}px`,
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: 300,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {selectedTrack ? selectedTrack.title.charAt(0) : '?'}
            </span>
          </div>

          {/* Track info overlay */}
          <div
            className="center-info relative z-10 text-center"
            style={{
              marginTop: `${wheelSize * 0.06}px`,
              padding: `${wheelSize * 0.01}px`,
            }}
          >
            <div
              className="track-title"
              style={{
                fontSize: `${wheelSize * 0.045}px`,
                fontWeight: 500,
                color: '#fff',
                letterSpacing: '-0.01em',
                marginBottom: `${wheelSize * 0.015}px`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '90%',
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
                transition: 'all 0.2s ease',
              }}
            >
              {selectedTrack?.title || 'Select a Track'}
            </div>
            <div
              className="track-artist"
              style={{
                fontSize: `${wheelSize * 0.028}px`,
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 300,
                letterSpacing: '0.05em',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              {selectedTrack?.artist || 'Move cursor to select'}
            </div>
            {selectedTrack && (
              <div
                className="play-state"
                style={{
                  marginTop: `${wheelSize * 0.02}px`,
                  fontSize: `${wheelSize * 0.022}px`,
                  color: isPlaying ? '#57e6ff' : 'rgba(255, 255, 255, 0.4)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: `${wheelSize * 0.01}px`,
                }}
              >
                <svg
                  width={wheelSize * 0.04}
                  height={wheelSize * 0.04}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {isPlaying ? (
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
                <span>{isPlaying ? 'Playing' : 'Paused'}</span>
              </div>
            )}
          </div>
        </div>

        {/* AURA effect - ambient glow around selected item */}
        {hoveredIndex !== null && (
          <div
            className="aura-glow absolute"
            style={{
              width: wheelSize * 0.15,
              height: wheelSize * 0.15,
              top: `${wheelSize / 2 + createRadialPosition(hoveredIndex, tracks.length, wheelRadius.current, { x: wheelSize / 2, y: wheelSize / 2 }).y - wheelSize * 0.075}px`,
              left: `${wheelSize / 2 + createRadialPosition(hoveredIndex, tracks.length, wheelRadius.current, { x: wheelSize / 2, y: wheelSize / 2 }).x - wheelSize * 0.075}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${tracks[hoveredIndex].color}44, transparent 70%)`,
              filter: 'blur(20px)',
              pointerEvents: 'none',
              transition: 'all 0.2s ease',
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Ambient particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="particle absolute"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              borderRadius: '50%',
              background: `rgba(87, 230, 255, ${Math.random() * 0.3 + 0.1})`,
              boxShadow: '0 0 6px rgba(87, 230, 255, 0.4)',
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite alternate`,
              animationDelay: `${Math.random() * 2}s`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}
