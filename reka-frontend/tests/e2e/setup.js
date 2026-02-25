import { download } from 'geckodriver';
import { platform } from 'os';

// Download and set up geckodriver
try {
  const geckoDriverPath = await download();
  process.env.GECKODRIVER_PATH = geckoDriverPath;
  console.log('Geckodriver downloaded to:', geckoDriverPath);
  
  // Also add the directory to PATH
  const { dirname } = await import('path');
  const geckoDriverDir = dirname(geckoDriverPath);
  const pathSeparator = platform() === 'win32' ? ';' : ':';
  process.env.PATH = `${geckoDriverDir}${pathSeparator}${process.env.PATH}`;
  
  console.log('Test environment setup complete');
} catch (error) {
  console.error('Failed to download geckodriver:', error);
  throw error;
}
