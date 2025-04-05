import {GoogleGenAI, Video} from '@google/genai';
import React, {useState} from 'react';

interface VideoProps {
  apiKey: string;
  vertexai: boolean;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const VideoGeneration: React.FC<VideoProps> = ({apiKey, vertexai}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [video, setVideo] = useState<Video | null | undefined>(null);
  const [videoPrompt, setPrompt] = useState('');
  const [error, setError] = useState<Error | null>(null);

  const handlePromptChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setPrompt(event.target.value);
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    const ai = new GoogleGenAI({vertexai: vertexai, apiKey: apiKey});
    try {
      var operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
        },
      });

      while (!operation.done) {
        console.log('Waiting for completion');
        await delay(1000);
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }
      setIsGenerating(false);
      setVideo(operation.response?.generatedVideos?.[0].video);
    } catch (error) {
      setIsGenerating(false);
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error('An unknown error occurred during upload.'));
      }
    }
  };
  return (
    <div className="card">
      <h2 className="card-title">Veo</h2>
      <br />
      <div
        style={{
          border: '2px dashed #ccc',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
        }}>
        <form>
          <label htmlFor="videoPrompt" className="form-label">
            Prompt:
          </label>
          <textarea
            className="form-control"
            id="videoPrompt"
            onChange={handlePromptChange}
          />
          <button
            type="button"
            style={{marginTop: '10px', marginBottom: '10px'}}
            className="btn btn-primary"
            onClick={handleGenerate}>
            Generate
          </button>
        </form>
        {video ? (
          <div>
            <video
              controls
              controlsList="nodownload"
              src={`${video.uri}&key=${apiKey}`}
              style={{maxWidth: '300px', maxHeight: '300px'}}
            />
          </div>
        ) : null}
        {isGenerating ? (
          <div>
            <p>Generating video...</p>
          </div>
        ) : null}
        {error ? (
          <div>
            <p>Error: {`${error}`}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
