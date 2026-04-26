import { download } from 'geckodriver';
import { platform } from 'os';

// Download and set up geckodriver
try {
  const geckoDriverPath = await download();
  process.env.GECKODRIVER_PATH = geckoDriverPath;
  console.log('Geckodriver letöltve ide:', geckoDriverPath);
  
  // Also add the directory to PATH
  const { dirname } = await import('path');
  const geckoDriverDir = dirname(geckoDriverPath);
  const pathSeparator = platform() === 'win32' ? ';' : ':';
  process.env.PATH = `${geckoDriverDir}${pathSeparator}${process.env.PATH}`;
  
  console.log('Tesztkörnyezet beállítva');
} catch (error) {
  console.error('Hiba a geckodriver letöltése során:', error);
  throw error;
}
