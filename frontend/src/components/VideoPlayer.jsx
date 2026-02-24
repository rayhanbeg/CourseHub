import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, FileText } from 'lucide-react';

const VideoPlayer = ({ videoUrl, title, resources = [], onProgress, onComplete }) => {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [showResources, setShowResources] = useState(false);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handleProgress = (state) => {
    setPlayed(state.played);
    if (onProgress) {
      onProgress(state.playedSeconds);
    }
  };

  const handleDuration = (dur) => {
    setDuration(dur);
  };

  const handleEnded = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current?.wrapper?.requestFullscreen) {
      playerRef.current.wrapper.requestFullscreen();
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
      <div ref={playerRef} className="relative bg-black aspect-video">
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          playing={playing}
          volume={volume}
          muted={muted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
          width="100%"
          height="100%"
          controls={false}
          progressInterval={1000}
        />

        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white text-xs">{formatTime(played * duration)}</span>
            <input
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
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="p-2 hover:bg-white/20 rounded transition text-white"
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={() => setMuted(!muted)}
                  className="p-2 hover:bg-white/20 rounded transition text-white"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
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
              {/* Resources Button */}
              {resources.length > 0 && (
                <button
                  onClick={() => setShowResources(!showResources)}
                  className="p-2 hover:bg-white/20 rounded transition text-white"
                  title="Resources"
                >
                  <FileText className="w-5 h-5" />
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={handleFullscreen}
                className="p-2 hover:bg-white/20 rounded transition text-white"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Title and Resources */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-dark mb-4">{title}</h3>

        {/* Resources Section */}
        {resources.length > 0 && (
          <div className={`${showResources ? 'block' : 'hidden'} bg-light rounded-lg p-4`}>
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
