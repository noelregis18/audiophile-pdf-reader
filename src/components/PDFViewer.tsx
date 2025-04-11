
import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PDFViewer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [text, setText] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [voiceIndex, setVoiceIndex] = useState<number>(0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    // Make sure speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Error",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
      return;
    }
    
    // Initialize available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("Available voices:", voices);
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    // Chrome needs this special handling
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
    
    // Check if speech synthesis is already active
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Clean up speech synthesis when component unmounts
    return () => {
      stopSpeech();
    };
  }, []);

  // Effect to update the speech rate when it changes
  useEffect(() => {
    if (currentUtteranceRef.current && window.speechSynthesis.speaking) {
      // We need to restart speech with new rate
      const currentText = currentUtteranceRef.current.text;
      const currentPosition = window.speechSynthesis.speaking ? getCurrentSpeechPosition() : 0;
      
      // Cancel current speech
      window.speechSynthesis.cancel();
      
      // Create new utterance with updated rate
      const newUtterance = new SpeechSynthesisUtterance(currentText);
      newUtterance.rate = rate;
      newUtterance.volume = volume;
      
      if (availableVoices.length > 0) {
        newUtterance.voice = availableVoices[voiceIndex];
      }
      
      // Setup event handlers
      setupUtteranceEvents(newUtterance);
      
      // Store reference to current utterance
      currentUtteranceRef.current = newUtterance;
      
      // Speak from approximately where we left off
      if (currentPosition > 0 && currentText.length > currentPosition) {
        const remainingText = currentText.substring(currentPosition);
        newUtterance.text = remainingText;
      }
      
      // Speak with new settings
      window.speechSynthesis.speak(newUtterance);
      console.log(`Speech rate updated to ${rate}`);
    }
  }, [rate]);

  // Effect to update the speech volume when it changes
  useEffect(() => {
    if (currentUtteranceRef.current && window.speechSynthesis.speaking) {
      // For volume, we can update it on the fly without restarting
      currentUtteranceRef.current.volume = volume;
      console.log(`Speech volume updated to ${volume}`);
    }
  }, [volume]);

  // Helper function to estimate current speech position
  const getCurrentSpeechPosition = () => {
    if (!currentUtteranceRef.current) return 0;
    
    // This is an approximation since SpeechSynthesis API doesn't provide position
    const fullText = currentUtteranceRef.current.text;
    const elapsedTime = Date.now() - (speechStartTimeRef.current || Date.now());
    const estimatedCharsPerMs = 0.05; // Approximation
    const estimatedPosition = Math.floor(elapsedTime * estimatedCharsPerMs);
    
    return Math.min(estimatedPosition, fullText.length);
  };

  // Reference to track when speech started
  const speechStartTimeRef = useRef<number | null>(null);

  // Helper function to set up utterance events
  const setupUtteranceEvents = (utterance: SpeechSynthesisUtterance) => {
    utterance.onstart = () => {
      speechStartTimeRef.current = Date.now();
      console.log("Speech started");
    };
    
    utterance.onend = () => {
      console.log("Speech ended");
      speechStartTimeRef.current = null;
      if (pageNumber < (numPages || 1)) {
        goToNextPage();
      } else {
        setIsPlaying(false);
        toast({
          title: "Reading Complete",
          description: "Reached the end of the document",
        });
      }
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      speechStartTimeRef.current = null;
      toast({
        title: "Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
    };
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    toast({
      title: "PDF Loaded Successfully",
      description: `${numPages} pages found in document`,
    });
    // Automatically extract text from the first page when PDF is loaded
    extractTextFromPage(1);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      // Stop any current speech when a new file is loaded
      stopSpeech();
    }
  };

  const extractTextFromPage = async (pageNum: number) => {
    if (!file) return;
    
    setIsLoading(true);
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdf = await pdfjs.getDocument(typedArray).promise;
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        setText(pageText);
        setIsLoading(false);
        
        if (isPlaying) {
          speakText(pageText);
        }
      };
      
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Error",
        description: "Failed to extract text from PDF",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const speakText = (textToSpeak: string) => {
    if (!textToSpeak || textToSpeak.trim() === '') {
      toast({
        title: "No Text Found",
        description: "No readable text was found on this page",
        variant: "destructive",
      });
      setIsPlaying(false);
      return;
    }
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.volume = volume;
    
    // Set the voice if available
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    // Set up utterance events
    setupUtteranceEvents(utterance);
    
    // Store references
    speechSynthesisRef.current = utterance;
    currentUtteranceRef.current = utterance;
    
    // Debug
    console.log("Speaking text:", textToSpeak.substring(0, 100) + "...");
    console.log("Speech rate:", rate);
    console.log("Speech volume:", volume);
    console.log("Selected voice:", utterance.voice ? utterance.voice.name : "Default voice");
    
    // Force audio context creation by playing a brief silence
    // This can help overcome browser autoplay restrictions
    const forceAudioContext = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(0);
      oscillator.stop(0.001);
    };
    
    try {
      forceAudioContext();
    } catch (e) {
      console.log("Audio context setup error (non-critical):", e);
    }
    
    // Ensure speech synthesis is available and ready
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.speak(utterance);
        console.log("Speech synthesis started");
      } catch (error) {
        console.error("Speech synthesis failed:", error);
        toast({
          title: "Error",
          description: "Failed to start speech synthesis. Please try again.",
          variant: "destructive",
        });
        setIsPlaying(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Text-to-speech is not supported in your browser",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!file) {
      toast({
        title: "No PDF Loaded",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }
    
    if (isPlaying) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        toast({
          title: "Paused",
          description: "Reading paused",
        });
      }
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        toast({
          title: "Resumed",
          description: "Reading resumed",
        });
      } else {
        // Extract text if we haven't already
        if (!text || text.trim() === '') {
          extractTextFromPage(pageNumber);
        } else {
          speakText(text);
        }
        toast({
          title: "Started Reading",
          description: `Reading page ${pageNumber} of ${numPages}`,
        });
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        console.log("Speech canceled");
      }
    }
    setIsPlaying(false);
  };

  const goToNextPage = () => {
    if (pageNumber < (numPages || 1)) {
      stopSpeech();
      const nextPage = pageNumber + 1;
      setPageNumber(nextPage);
      extractTextFromPage(nextPage);
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      stopSpeech();
      const prevPage = pageNumber - 1;
      setPageNumber(prevPage);
      extractTextFromPage(prevPage);
    }
  };

  const changeVoice = () => {
    if (availableVoices.length > 0) {
      const newIndex = (voiceIndex + 1) % availableVoices.length;
      setVoiceIndex(newIndex);
      toast({
        title: "Voice Changed",
        description: `Now using: ${availableVoices[newIndex].name}`,
      });
    } else {
      toast({
        title: "No Voices Available",
        description: "Your browser doesn't provide multiple voices",
        variant: "destructive",
      });
    }
  };

  // Function to test audio playback
  const testAudio = () => {
    const testText = "This is a test of the audio system. If you can hear this, the text-to-speech functionality is working correctly.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.rate = rate;
    utterance.volume = volume;
    
    if (availableVoices.length > 0) {
      utterance.voice = availableVoices[voiceIndex];
    }
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Set up event handlers for debugging
    utterance.onstart = () => console.log("Test audio started");
    utterance.onend = () => console.log("Test audio ended");
    utterance.onerror = (e) => console.error("Test audio error:", e);
    
    window.speechSynthesis.speak(utterance);
    toast({
      title: "Testing Audio",
      description: "Playing test audio message",
    });
  };

  // Handle rate change with immediate feedback
  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    
    // Provide feedback to user
    toast({
      title: "Speed Updated",
      description: `Reading speed set to ${newRate.toFixed(1)}x`,
    });
  };

  // Handle volume change with immediate feedback
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    // Provide feedback to user
    toast({
      title: "Volume Updated",
      description: `Volume set to ${Math.round(newVolume * 100)}%`,
    });
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          className="max-w-md"
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm">Speed:</span>
          <Slider
            value={[rate]}
            min={0.5}
            max={2}
            step={0.1}
            onValueChange={handleRateChange}
            className="w-24"
          />
          <span className="text-xs">{rate.toFixed(1)}x</span>
        </div>
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4" />
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={changeVoice}
          disabled={availableVoices.length <= 1}
          title="Switch to a different voice"
          className="hidden sm:inline-flex"
        >
          Change Voice
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testAudio}
          className="ml-auto"
        >
          Test Audio
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {file && (
          <Card className="p-4 w-full overflow-hidden">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
              error={<div className="text-center p-8 text-red-500">Failed to load PDF. Please try another file.</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                width={Math.min(window.innerWidth - 40, 800)}
              />
            </Document>
            
            <div className="flex justify-between mt-4">
              <div>
                <p className="text-sm">
                  Page {pageNumber} of {numPages}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToPrevPage} 
                  disabled={pageNumber <= 1}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={togglePlayPause}
                  variant="default"
                  className="w-24"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Play</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToNextPage} 
                  disabled={pageNumber >= (numPages || 1)}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
