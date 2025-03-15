import {ChangeEvent, useState} from 'react';
import './App.css';
import GenerateContentText from './GenerateContentText';
import TextAndImage from './TextAndImage';
import UploadFile from './UploadFile';

function App() {
  const [apiKey, setApiKey] = useState('');

  const handleKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
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
      </div>
      <GenerateContentText apiKey={apiKey} />
      <UploadFile apiKey={apiKey} />
      <TextAndImage apiKey={apiKey} />
    </>
  );
}

export default App;
