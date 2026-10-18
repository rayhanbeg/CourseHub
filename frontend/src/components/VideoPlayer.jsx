import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from 'lucide-react';

const VideoPlayer = ({ videoUrl, title, resources = [], onProgress, onComplete, onPlaybackError, initialPosition = 0, watermark }) => {
  const playerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [watermarkPosition, setWatermarkPosition] = useState(0);
  const refreshPositionRef = useRef(initialPosition);
  const completedRef = useRef(false);

  useEffect(() => {
    const position = playerRef.current?.getCurrentTime?.() || initialPosition;
    refreshPositionRef.current = position;
    setPlayed(duration > 0 ? position / duration : 0);
    completedRef.current = false;
  }, [videoUrl, duration, initialPosition]);

  useEffect(() => {
    if (!watermark) return undefined;
    const timer = window.setInterval(() => setWatermarkPosition((position) => (position + 1) % 4), 30000);
    return () => window.clearInterval(timer);
  }, [watermark]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName))) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setPlaying((value) => !value);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const current = playerRef.current?.getCurrentTime?.() || played * duration;
        const next = Math.max(0, Math.min(duration || current + 10, current + (event.key === 'ArrowRight' ? 10 : -10)));
        playerRef.current?.seekTo(next, 'seconds');
        setPlayed(duration ? next / duration : 0);
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen?.(); else wrapperRef.current?.requestFullscreen?.();
      } else if (event.key.toLowerCase() === 'm') {
        event.preventDefault();
        setMuted((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [duration, played]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleProgress = (state) => {
    setPlayed(state.played);
    if (onProgress) {
      onProgress(state.playedSeconds, duration);
    }
    if (duration > 0 && state.playedSeconds / duration >= 0.9 && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const handleDuration = (dur) => {
    setDuration(dur);
  };

  const handleReady = () => {
    const position = refreshPositionRef.current || initialPosition;
    if (position > 0) playerRef.current?.seekTo(position, 'seconds');
  };

  const handleEnded = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleFullscreen = () => {
    if (wrapperRef.current?.requestFullscreen) {
      wrapperRef.current.requestFullscreen();
    }
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ('0' + date.getUTCSeconds()).slice(-2);
    if (hh) {
      return `${hh}:${('0' + mm).slice(-2)}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  return (
    <div className="w-full bg-dark rounded-lg overflow-hidden">
      {/* Video Container */}
      <div ref={wrapperRef} className={`relative bg-black aspect-video lesson-video-wrapper lesson-video-wrapper--wm-${watermarkPosition}`} draggable={false} onContextMenu={(event) => event.preventDefault()}>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onReady={handleReady}
          onEnded={handleEnded}
          onError={onPlaybackError}
          playbackRate={playbackRate}
          config={{ file: { attributes: { controlsList: 'nodownload noremoteplayback', disablePictureInPicture: true, playsInline: true, preload: 'metadata', draggable: false, onContextMenu: (event) => event.preventDefault() } } }}
          width="100%"
          height="100%"
          controls={false}
          progressInterval={1000}
        />
        {watermark && <span className="lesson-video-watermark" aria-hidden="true">{watermark}</span>}

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white text-xs">{formatTime(played * duration)}</span>
              <input
                aria-label="Video position"
              type="range"
              min={0}
              max={0.999999}
              step="any"
              value={played}
              onChange={(e) => {
                setPlayed(parseFloat(e.target.value));
                playerRef.current?.seekTo(parseFloat(e.target.value), 'fraction');
              }}
              className="flex-1 h-1 bg-gray-600 rounded cursor-pointer accent-primary"
            />
            <span className="text-white text-xs">{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="lesson-video-speed-label">Speed<select aria-label="Playback speed" value={playbackRate} onChange={(event) => setPlaybackRate(Number(event.target.value))} className="lesson-video-speed"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></label>
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                aria-label={playing ? 'Pause video' : 'Play video'}
                className="p-2 hover:bg-white/20 rounded transition text-white"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={() => setMuted(!muted)}
                  aria-label={muted ? 'Unmute video' : 'Mute video'}
                  className="p-2 hover:bg-white/20 rounded transition text-white"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              <input
                aria-label="Volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover:w-24 transition-all h-1 bg-gray-600 rounded cursor-pointer accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                aria-label="Enter fullscreen"
                className="p-2 hover:bg-white/20 rounded transition text-white"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Resources */}
      <div className="bg-white p-4">
        <h3 className="font-semibold text-lg text-dark mb-4">{title}</h3>

        {/* Resources Section */}
        {resources.length > 0 && (
          <div className="bg-light rounded-lg p-4">
            <h4 className="font-semibold text-dark mb-3">Resources</h4>
            <div className="space-y-2">
              {resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 hover:bg-white rounded transition text-primary hover:underline"
                >
                  <Download className="w-4 h-4" />
                  {resource.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
