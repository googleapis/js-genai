import {ChangeEvent, useState} from 'react';
import './App.css';
import GenerateContentText from './GenerateContentText';
import TextAndImage from './TextAndImage';
import UploadFile from './UploadFile';
import {VideoGeneration} from './Video';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [vertexai, setVertexai] = useState<boolean>(false);

  const handleKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const handleVertexaiChange = (value: boolean) => {
    setVertexai(value);
  };

  return (
    <>
      <h1>Google GenAI TypeScript SDK demo</h1>
      <div className="card">
        <form>
          <label htmlFor="apikey">API key:</label>
          <input
            className="form-control"
            id="apikey"
            type="password"
            onChange={handleKeyChange}
            value={apiKey}
          />
        </form>
        <br />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <label htmlFor="backend">Backend:</label>

          <div style={{flexDirection: 'column'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <input
                type="radio"
                value="false"
                checked={vertexai === false}
                onChange={() => handleVertexaiChange(false)}
              />
              <label style={{marginLeft: '5px'}}>Gemini Developer API</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <input
                type="radio"
                value="true"
                checked={vertexai === true}
                onChange={() => handleVertexaiChange(true)}
              />
              <label style={{marginLeft: '5px'}}>Vertex AI API</label>
            </div>
          </div>
        </div>
      </div>
      {apiKey && (
        <>
          <GenerateContentText apiKey={apiKey} vertexai={vertexai} />
          <UploadFile apiKey={apiKey} vertexai={vertexai} />
          <TextAndImage apiKey={apiKey} vertexai={vertexai} />
          <VideoGeneration apiKey={apiKey} vertexai={vertexai} />
        </>
      )}
    </>
  );
}

export default App;
