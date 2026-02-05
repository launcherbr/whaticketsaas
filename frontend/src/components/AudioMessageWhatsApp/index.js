import React, { useRef, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { PlayArrow, Pause, Mic } from "@material-ui/icons";
import Avatar from "@material-ui/core/Avatar";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";

const useStyles = makeStyles((theme) => ({
  audioContainer: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: theme.mode === 'light' ? '#dcf8c6' : '#2a2a2a',
    borderRadius: "8px",
    minWidth: "200px",
    maxWidth: "300px",
    position: "relative",
  },
  audioContainerReceived: {
    backgroundColor: theme.mode === 'light' ? '#ffffff' : '#2a2a2a',
  },
  playButton: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: "50%",
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginRight: 12,
    "&:hover": {
      backgroundColor: theme.mode === 'light' ? '#20ba5a' : '#008069',
    },
  },
  progressContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  progressBar: {
    display: "flex",
    alignItems: "center",
    marginBottom: 4,
    overflow: "hidden",
    width: "100%",
    minWidth: 0,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
    marginRight: 4,
    flexShrink: 0,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: theme.mode === 'light' ? '#d4d4d4' : '#555',
    marginRight: 4,
    position: "relative",
    overflow: "hidden",
  },
  progressLineFilled: {
    height: "100%",
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
    transition: "width 0.1s linear",
  },
  waveform: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    height: 20,
    marginBottom: 2,
    marginLeft: 4,
    flex: 1,
    minWidth: 0,
    maxWidth: 150,
    overflow: "hidden",
    flexShrink: 1,
  },
  waveformBar: {
    width: 2.5,
    minWidth: 2.5,
    backgroundColor: theme.mode === 'light' ? '#999' : '#777',
    borderRadius: 1.25,
    transition: "background-color 0.2s ease",
  },
  waveformBarActive: {
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
  },
  timeContainer: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: theme.mode === 'light' ? '#666' : '#999',
  },
  currentTime: {
    marginRight: 8,
  },
  totalTime: {
    fontWeight: 500,
  },
  profileContainer: {
    position: "relative",
    marginLeft: 8,
    flexShrink: 0,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    fontSize: "12px",
  },
  micIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
    "& svg": {
      fontSize: 8,
      color: "white",
    },
  },
  speedButton: {
    minWidth: 40,
    height: 24,
    padding: "4px 8px",
    fontSize: "11px",
    fontWeight: 500,
    backgroundColor: theme.mode === 'light' ? '#25d366' : '#00a884',
    color: "white",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    flexShrink: 0,
    "&:hover": {
      backgroundColor: theme.mode === 'light' ? '#20ba5a' : '#008069',
    },
  },
}));

const AudioMessageWhatsApp = ({ url, contact, fromMe }) => {
  const classes = useStyles();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Aplicar playbackRate sempre que mudar
    audio.playbackRate = playbackRate;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
      // Gerar waveform aleatório se não houver dados reais
      if (waveform.length === 0) {
        generateWaveform(audio.duration || 10);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      audio.playbackRate = playbackRate;
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [waveform.length, playbackRate]);

  const generateWaveform = (duration) => {
    // Limitar número de barras baseado no espaço disponível
    // Cada barra tem ~4px (2.5px width + 1.5px gap)
    // Para maxWidth de 150px, máximo ~37 barras (150/4)
    // Para áudios muito longos, manter número fixo e proporcional
    let bars;
    if (duration <= 10) {
      bars = Math.floor(duration * 2) || 10; // 2 barras por segundo para áudios curtos
    } else if (duration <= 60) {
      bars = 20 + Math.floor((duration - 10) / 3); // Escala para áudios médios
    } else {
      bars = 37; // Fixo para áudios longos (máximo que cabe no espaço)
    }
    
    const newWaveform = Array.from({ length: Math.min(bars, 37) }, () => 
      Math.random() * 25 + 15 // Altura aleatória entre 15 e 40
    );
    setWaveform(newWaveform);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      audio.play();
    }
  };

  const togglePlaybackRate = () => {
    let newRate;
    switch (playbackRate) {
      case 1:
        newRate = 1.5;
        break;
      case 1.5:
        newRate = 2;
        break;
      case 2:
        newRate = 1;
        break;
      default:
        newRate = 1;
    }
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeBars = Math.floor((waveform.length * progress) / 100);

  const getAudioSource = () => {
    let sourceUrl = url;
    if (isIOS) {
      sourceUrl = sourceUrl.replace(".ogg", ".mp3");
    }
    return (
      <source src={sourceUrl} type={isIOS ? "audio/mp3" : "audio/ogg"} />
    );
  };

  return (
    <div className={`${classes.audioContainer} ${!fromMe ? classes.audioContainerReceived : ''}`}>
      <audio ref={audioRef} style={{ display: "none" }}>
        {getAudioSource()}
      </audio>
      
      <div className={classes.playButton} onClick={togglePlay}>
        {isPlaying ? (
          <Pause style={{ fontSize: 18 }} />
        ) : (
          <PlayArrow style={{ fontSize: 18, marginLeft: 2 }} />
        )}
      </div>

      <div className={classes.progressContainer}>
        <div className={classes.progressBar}>
          <div className={classes.progressDot} />
          <div className={classes.progressLine}>
            <div
              className={classes.progressLineFilled}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={classes.waveform}>
            {waveform.map((height, index) => (
              <div
                key={index}
                className={`${classes.waveformBar} ${index < activeBars ? classes.waveformBarActive : ''}`}
                style={{
                  height: `${height}%`,
                }}
              />
            ))}
          </div>
        </div>
        <div className={classes.timeContainer}>
          <span className={classes.currentTime}>{formatTime(currentTime)}</span>
          <span className={classes.totalTime}>{formatTime(duration)}</span>
        </div>
      </div>

      {isPlaying ? (
        <button
          className={classes.speedButton}
          onClick={togglePlaybackRate}
        >
          {playbackRate}x
        </button>
      ) : contact && (
        <div className={classes.profileContainer}>
          <Avatar
            src={contact.profilePicUrl}
            className={classes.profileAvatar}
            style={{
              backgroundColor: generateColor(contact?.number),
              color: "white",
            }}
          >
            {!contact.profilePicUrl && getInitials(contact?.name)}
          </Avatar>
          <div className={classes.micIcon}>
            <Mic />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioMessageWhatsApp;

