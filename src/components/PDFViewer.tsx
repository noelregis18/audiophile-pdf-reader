
import React, { useState, useRef } from 'react';
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
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    toast({
      title: "PDF Loaded Successfully",
      description: `${numPages} pages found in document`,
    });
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
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = rate;
    utterance.volume = volume;
    speechSynthesisRef.current = utterance;
    
    utterance.onend = () => {
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
    
    speechSynthesis.speak(utterance);
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
      speechSynthesis.pause();
    } else {
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
      } else {
        extractTextFromPage(pageNumber);
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  const stopSpeech = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  const goToNextPage = () => {
    if (pageNumber < (numPages || 1)) {
      stopSpeech();
      setPageNumber(prevPageNumber => prevPageNumber + 1);
      extractTextFromPage(pageNumber + 1);
    }
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      stopSpeech();
      setPageNumber(prevPageNumber => prevPageNumber - 1);
      extractTextFromPage(pageNumber - 1);
    }
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
            onValueChange={([value]) => setRate(value)}
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
            onValueChange={([value]) => setVolume(value)}
            className="w-24"
          />
        </div>
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
