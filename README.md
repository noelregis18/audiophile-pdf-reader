
# Audiophile PDF Reader

## Description

Audiophile PDF Reader is a web application that allows users to upload PDF files and have them read aloud using text-to-speech technology. This application provides an accessible way to consume PDF content for people with visual impairments, reading difficulties, or for those who prefer to listen to documents while multitasking.

## Features

- **PDF Viewer**: Upload and view PDF documents with page navigation
- **Text-to-Speech**: Convert PDF text to speech with adjustable controls
- **Speed Control**: Customize reading speed from 0.5x to 2x
- **Volume Control**: Adjust the volume level of the speech
- **Voice Selection**: Choose from multiple voices (based on browser availability)
- **Dark/Light Mode**: Switch between theme modes for comfortable viewing
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **React**: Frontend framework for building the user interface
- **TypeScript**: Type-safe programming language
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn/ui**: High-quality UI components
- **react-pdf**: PDF rendering library
- **Web Speech API**: Browser API for text-to-speech functionality

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Access the application at `http://localhost:5173`

## Usage

1. Upload a PDF file using the file input at the top of the page
2. The PDF will load and display the first page
3. Click the Play button to start reading the current page
4. Use the navigation controls to move between pages
5. Adjust speed and volume using the sliders
6. Click the "Change Voice" button to cycle through available voices
7. Use the "Test Audio" button to verify that audio is working correctly

## Browser Compatibility

This application works best in modern browsers that support the Web Speech API, including:
- Google Chrome
- Microsoft Edge
- Safari
- Firefox

Note that voice selection and quality may vary depending on the browser and operating system.

---

Designed and Developed by Noel Regis
