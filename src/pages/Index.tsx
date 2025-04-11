
import Navigation from '@/components/Navigation';
import PDFViewer from '@/components/PDFViewer';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function Index() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Audiophile PDF Reader</h1>
              <p className="text-xl text-muted-foreground">
                Upload any PDF and listen to it being read aloud to you.
              </p>
            </div>
            
            <PDFViewer />
            
            <div className="text-center text-muted-foreground">
              <p>Upload a PDF file using the button above, then click Play to have the content read to you.</p>
              <p>You can adjust the reading speed and volume using the sliders.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
