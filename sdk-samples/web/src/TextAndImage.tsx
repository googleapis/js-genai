import {
  ContentListUnion,
  File,
  GenerateContentResponse,
  GoogleGenAI,
  createPartFromUri,
} from '@google/genai';
import {ChangeEvent, useState} from 'react';
import './App.css';
import {ImageUpload} from './ImageUpload';

export default function TextAndImage({apiKey}: {apiKey: string}) {
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [modelResponse, setModelResponse] =
    useState<GenerateContentResponse | null>(null);

  const ai = new GoogleGenAI({vertexai: false, apiKey: apiKey});

  const handleUploadSuccess = (response: any) => {
    setUploadStatus('Image uploaded successfully!');
    setInputImage(response);
  };

  const handlePromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleSend = async () => {
    if (
      inputImage == null ||
      inputImage.uri == null ||
      inputImage.mimeType == null
    ) {
      console.log('Missing input image');
      return;
    }
    const contents: ContentListUnion = [prompt];
    contents.push(createPartFromUri(inputImage.uri, inputImage.mimeType));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: contents,
        config: {
          responseModalities: ['image', 'text'],
          responseMimeType: 'text/plain',
        },
      });
      setModelResponse(response);
    } catch (error) {
      console.error('Error generating content:', error);
      setModelResponse(null);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error.message);
    setUploadStatus(`Upload failed: ${error.message}`);
  };

  return (
    <div className="container">
      <h1>Image Upload Example</h1>
      <ImageUpload
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        ai={ai}
      />
      <label htmlFor="prompt" className="form-label">
        Prompt:
      </label>
      <textarea
        className="form-control"
        id="prompt"
        onChange={handlePromptChange}
      />
      {uploadStatus && <p className="mt-3">{uploadStatus}</p>}
      <button type="button" className="btn btn-primary" onClick={handleSend}>
        Send
      </button>

      {modelResponse && modelResponse.candidates && (
        <div className="mt-4">
          <h2>Response:</h2>
          {modelResponse.candidates.map((candidate, candidateIndex) => (
            <div key={`candidate-${candidateIndex}`}>
              {candidate.content &&
                candidate.content.parts &&
                candidate.content.parts.map((part, partIndex) => (
                  <div key={`part-${partIndex}`}>
                    {part.text && <p>{part.text}</p>}
                    {part.inlineData &&
                      part.inlineData.data &&
                      part.inlineData.mimeType && (
                        <img
                          src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                          alt="Generated Image"
                          className="img-fluid"
                        />
                      )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
