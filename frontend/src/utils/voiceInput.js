// Voice input utility with comprehensive mobile safety
// V2: Added try/catch wrappers for constructor and method calls

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  } catch (e) {
    return null;
  }
};

export const voiceInput = {
  isSupported() {
    try {
      const SpeechRecognition = getSpeechRecognition();
      return !!SpeechRecognition;
    } catch (e) {
      return false;
    }
  },

  createRecognition(onResult, onError, onEnd) {
    try {
      const SpeechRecognition = getSpeechRecognition();
      if (!SpeechRecognition) {
        onError?.('Voice input not supported on this device');
        return null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        onResult?.(finalTranscript.trim(), interimTranscript);
      };

      recognition.onerror = (event) => {
        let errorMsg = 'Voice recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected. Try again.';
            break;
          case 'audio-capture':
            errorMsg = 'No microphone found.';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone access denied.';
            break;
          default:
            errorMsg = `Error: ${event.error}`;
        }
        onError?.(errorMsg);
      };

      recognition.onend = () => {
        onEnd?.(finalTranscript.trim());
      };

      return recognition;
    } catch (e) {
      console.error('Voice recognition initialization failed:', e);
      onError?.('Voice input failed to initialize');
      return null;
    }
  },

  start(onResult, onError, onEnd) {
    try {
      const recognition = this.createRecognition(onResult, onError, onEnd);
      if (recognition) {
        recognition.start();
      }
      return recognition;
    } catch (e) {
      console.error('Voice recognition start failed:', e);
      onError?.('Voice input failed to start');
      return null;
    }
  }
};
