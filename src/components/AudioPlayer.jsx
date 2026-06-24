import { useEffect, useRef, useState } from 'react'
import { Upload, Play, Pause, Square, Volume2, Music, X, Download } from 'lucide-react'
import { downloadFile } from '../utils/pdfExport.js'

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave']
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav']

function isAcceptedAudio(file) {
  if (!file) return false
  const name = file.name?.toLowerCase() || ''
  const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
  // Some browsers/OSes leave file.type empty for wav/mp3 — fall back to the
  // extension check alone in that case instead of rejecting a valid file.
  const hasValidType = !file.type || ACCEPTED_TYPES.includes(file.type)
  return hasValidExt && hasValidType
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Reusable audio player + uploader, built on the native <audio> element.
 * `audio` is `{ name, url, path }` or null/undefined when nothing is loaded.
 * `onUpload(file)` and `onRemove()` are omitted in read-only contexts.
 */
export default function AudioPlayer({ audio, onUpload, onRemove, readOnly = false }) {
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError('')
  }, [audio?.url])

  function handlePickFile(fileList) {
    const file = fileList?.[0]
    if (!file) return
    if (!isAcceptedAudio(file)) {
      setError('Format non supporté — seuls les fichiers MP3 ou WAV sont acceptés.')
      return
    }
    setError('')
    setUploading(true)
    Promise.resolve(onUpload(file))
      .catch((err) => setError(err.message || "Échec de l'envoi du fichier audio"))
      .finally(() => setUploading(false))
  }

  async function handleDownload() {
    setError('')
    setDownloading(true)
    try {
      await downloadFile(audio.url, audio.name)
    } catch (err) {
      setError(err.message || 'Échec du téléchargement du fichier audio')
    } finally {
      setDownloading(false)
    }
  }

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => setError('Impossible de lire ce fichier audio.'))
    }
  }

  function stop() {
    const el = audioRef.current
    if (!el) return
    el.pause()
    el.currentTime = 0
    setCurrentTime(0)
  }

  function handleSeek(e) {
    const el = audioRef.current
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (el) el.currentTime = t
  }

  function handleVolume(e) {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }

  if (!audio) {
    return (
      <div>
        {readOnly ? (
          <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Aucun fichier audio pour le moment.</div>
        ) : (
          <div
            className="client-upload-zone"
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handlePickFile(e.dataTransfer.files)
            }}
          >
            <Upload size={14} style={{ flexShrink: 0 }} />
            <span>{uploading ? 'Envoi en cours...' : 'Importer un fichier audio (MP3, WAV)'}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              style={{ display: 'none' }}
              onChange={(e) => handlePickFile(e.target.files)}
            />
          </div>
        )}
        {error && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 6 }}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audio.url}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError('Impossible de lire ce fichier audio.')}
      />

      <div className="audio-player-row">
        <Music size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
        <span className="audio-player-filename" title={audio.name}>
          {audio.name}
        </span>
        <button
          type="button"
          className="btn-icon"
          title="Télécharger le fichier audio"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download size={14} />
        </button>
        {!readOnly && (
          <button type="button" className="btn-icon danger" title="Supprimer le fichier audio" onClick={onRemove}>
            <X size={14} />
          </button>
        )}
      </div>

      <div className="audio-player-controls">
        <div className="audio-player-buttons">
          <button type="button" className="btn-icon" onClick={togglePlay} title={playing ? 'Pause' : 'Lecture'}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" className="btn-icon" onClick={stop} title="Stop">
            <Square size={13} />
          </button>
        </div>

        <div className="audio-player-seek-row">
          <span className="audio-player-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="audio-player-seek"
            min={0}
            max={duration || 0}
            step={0.01}
            value={Math.min(currentTime, duration || 0)}
            onChange={handleSeek}
            aria-label="Progression"
          />
          <span className="audio-player-time">{formatTime(duration)}</span>
        </div>

        <div className="audio-player-volume-group">
          <Volume2 size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
          <input
            type="range"
            className="audio-player-volume"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            aria-label="Volume"
          />
        </div>
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  )
}
